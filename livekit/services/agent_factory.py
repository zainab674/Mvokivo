from __future__ import annotations

"""
Agent factory for creating and configuring LiveKit agents.
"""

import os
import json
import asyncio
import datetime
import logging
from typing import Dict, Any, Optional
from zoneinfo import ZoneInfo

from livekit.agents import Agent
from services.unified_agent import UnifiedAgent
from integrations.calendar_api import CalComCalendar
from config.settings import validate_model_names
from utils.instruction_builder import build_analysis_instructions, build_call_management_instructions, build_workflow_instructions
from utils.fallback_llm import FallbackLLM
from utils.sticky_tts import StickyFallbackTTS
from livekit.plugins import openai, groq as lk_groq
from livekit.agents.tts import FallbackAdapter
from integrations.raya_tts import RayaTTS
from integrations.kokoro_tts import KokoruTTS

logger = logging.getLogger(__name__)

# Global OpenAI client for field classification
_OPENAI_CLIENT: Optional['AsyncOpenAI'] = None

def get_openai_client():
    """Get or create OpenAI client for field classification."""
    global _OPENAI_CLIENT
    if _OPENAI_CLIENT is None:
        from openai import AsyncOpenAI
        _OPENAI_CLIENT = AsyncOpenAI(api_key=os.getenv("OPENAI_API_KEY"))
    return _OPENAI_CLIENT


class AgentFactory:
    """Factory for creating and configuring agents."""
    
    def __init__(self, mongodb_client, prewarmed_llms=None, prewarmed_tts=None, prewarmed_vad=None):
        self.mongodb = mongodb_client
        self._prewarmed_llms = prewarmed_llms or {}
        self._prewarmed_tts = prewarmed_tts or {}
        self._prewarmed_vad = prewarmed_vad
    
    async def create_agent(self, config: Dict[str, Any]) -> Agent:
        """Create appropriate agent based on configuration."""
        # Validate model names first
        config = validate_model_names(config)
        
        # 0. Fetch global provider configuration for fallbacks
        tenant = config.get("tenant", "main")
        provider_config = await self.mongodb.fetch_provider_config(tenant)
        logger.info(f"PROVIDER_CONFIG_FETCHED | tenant={tenant} | has_config={bool(provider_config)}")

        instructions = config.get("prompt", "You are a helpful assistant.")
        
        # GLOBAL LANGUAGE RULE: Enforce English globally
        instructions += (
            "\n\nGLOBAL LANGUAGE RULE:\n"
            "- You MUST always communicate in English.\n"
            "- Regardless of the language used by the user, you must respond ONLY in English.\n"
            "- If the user speaks in a language other than English, acknowledge it if necessary but provide your full response in English.\n"
        )

        # Add date context only if calendar is configured
        cal_api_key = config.get('cal_api_key')
        cal_event_type_id = config.get('cal_event_type_id')
        if cal_api_key and cal_event_type_id:
            tz_name = (config.get("cal_timezone") or "Asia/Karachi")
            try:
                now_local = datetime.datetime.now(ZoneInfo(tz_name))
            except Exception as e:
                logger.warning(f"Invalid timezone '{tz_name}': {str(e)}, falling back to UTC")
                tz_name = "UTC"
                now_local = datetime.datetime.now(ZoneInfo(tz_name))
            instructions += (
                f"\n\nCONTEXT:\n"
                f"- Current local time: {now_local.isoformat()}\n"
                f"- Timezone: {tz_name}\n"
                f"- When the user says a date like '7th October', always interpret it as the next FUTURE occurrence in {tz_name}. "
                f"Never call tools with past dates; if a parsed date is in the past year, bump it to the next year."
            )

        # Add call management settings to instructions
        call_management_config = build_call_management_instructions(config)
        if call_management_config:
            instructions += "\n\n" + call_management_config

        # Add analysis instructions for structured data collection
        analysis_instructions = await build_analysis_instructions(config, self._classify_data_fields_with_llm)
        if analysis_instructions:
            instructions += "\n\n" + analysis_instructions
            logger.info(f"ANALYSIS_INSTRUCTIONS_ADDED | length={len(analysis_instructions)}")

        # Add workflow (node-based) instructions if available
        workflow_instructions = build_workflow_instructions(config)
        if workflow_instructions:
            instructions += "\n\n" + workflow_instructions
            logger.info(f"WORKFLOW_INSTRUCTIONS_ADDED | length={len(workflow_instructions)}")

        # Add first message handling
        first_message = config.get("first_message", "")
        force_first = os.getenv("FORCE_FIRST_MESSAGE", "true").lower() != "false"
        if force_first and first_message:
            instructions += f' IMPORTANT: Start the conversation by saying exactly: "{first_message}" Do not repeat or modify this greeting.'
            logger.info(f"FIRST_MESSAGE_SET | first_message={first_message}")

        # Create unified agent that combines RAG and booking capabilities
        knowledge_base_id = config.get("knowledge_base_id")
        
        # Initialize calendar if credentials are available
        calendar = await self._initialize_calendar(config)

        # Add RAG tools to instructions if knowledge base is available
        if knowledge_base_id:
            instructions += "\n\nKNOWLEDGE BASE ACCESS:\nYou have access to a knowledge base with information about the company. You can use the following tools when needed:\n- query_knowledge_base: Search for specific information\n- get_detailed_information: Get comprehensive details about a topic\n\nIMPORTANT: Only use the knowledge base tools when explicitly instructed to do so in your system prompt or when the user specifically requests information that requires knowledge base lookup. Do not automatically search the knowledge base unless instructed.\n\nWhen you do use the knowledge base, provide complete, well-formatted responses with proper context and source information when available."

        # Add booking instructions only if calendar is available
        if calendar:
            instructions += (
                "\n\nBOOKING CAPABILITIES:\n"
                "You can help users book appointments. You have access to the following booking tools:\n"
                "- set_user_timezone: MUST call this first if the user's timezone is not yet resolved.\n"
                "- list_slots_on_day: Show available slots. Always ask for morning/afternoon/evening preference FIRST.\n"
                "- choose_slot: Select a time slot (supports '8am', '3:30pm', or index like '1').\n"
                "- set_name: Set the customer's name.\n"
                "- set_email: Set the customer's email.\n"
                "- set_phone: Set the customer's phone number.\n"
                "- finalize_booking: Complete the booking when ALL info is collected.\n\n"
                "CRITICAL BOOKING RULES:\n"
                "1. TIMEZONE FIRST: If the user wants to book, first check if their timezone is known. If not, use set_user_timezone to resolve it. Do NOT list slots until timezone is confirmed as a valid IANA string (e.g. America/New_York).\n"
                "2. PREFERENCE FIRST: Before listing slots, ask if they prefer morning, afternoon, or evening. Only list 3-4 slots unless they ask for more.\n"
                "3. NO AUTO-BOOK: When a slot is chosen, confirm it with the user before finalizing.\n"
                "4. CONFIRMATION: Only call finalize_booking when you have slot, name, email, and phone.\n"
                "5. NATURAL FLOW: If the user provides info like 'I'm in New York', call set_user_timezone('America/New_York') immediately."
            )

        # Add graceful exit instructions
        instructions += (
            "\n\nGRACEFUL EXIT:\n"
            "Once a task is complete (like booking), give a warm summary: 'You're all set for [Day] at [Time] [Timezone]. A confirmation is on its way to [Email].' "
            "Always ask 'Is there anything else I can help you with today?' before ending. "
            "If the user says 'no' or 'that's it', say goodbye politely."
        )
           
        # Create LLM based on provider
        llm_provider = config.get("llm_provider_setting", "OpenAI")
        llm_model = config.get("llm_model_setting", "gpt-4o-mini")
        temperature = config.get("temperature_setting", 0.1)
        max_tokens = config.get("max_token_setting", 200)
        
        # Create LLM fallback chain
        prewarmed_llm = self._create_llm(llm_provider, llm_model, temperature, max_tokens, config, provider_config)

        tts_provider = config.get("voice_provider_setting", "auto")
        tts_model = config.get("voice_model_setting", "")
        tts_voice = config.get("voice_name_setting", "nova")

        prewarmed_tts = self._create_tts(tts_provider, tts_model, tts_voice, config, provider_config)
        prewarmed_vad = self._prewarmed_vad
        
        agent = UnifiedAgent(
            instructions=instructions,
            calendar=calendar,
            knowledge_base_id=knowledge_base_id,
            company_id=config.get("company_id"),
            mongodb=self.mongodb,
            prewarmed_llm=prewarmed_llm,
            prewarmed_tts=prewarmed_tts,
            prewarmed_vad=prewarmed_vad
        )
        
        # Set analysis fields if configured
        analysis_fields = config.get("structured_data_fields", []) or []
        if analysis_fields:
            agent.set_analysis_fields(analysis_fields)
        
        # Set transfer configuration if enabled
        transfer_enabled = config.get("transfer_enabled", False)
        if transfer_enabled:
            transfer_config = {
                "transfer_enabled": transfer_enabled,
                "transfer_phone_number": config.get("transfer_phone_number"),
                "transfer_country_code": config.get("transfer_country_code", "+1"),
                "transfer_sentence": config.get("transfer_sentence"),
                "transfer_condition": config.get("transfer_condition")
            }
            agent.set_transfer_config(transfer_config)

        return agent

    async def _initialize_calendar(self, config: Dict[str, Any]) -> Optional[CalComCalendar]:
        """Initialize calendar if credentials are available."""
        # Debug logging for calendar configuration
        cal_api_key = config.get('cal_api_key')
        cal_event_type_id = config.get('cal_event_type_id')
        
        if config.get("cal_api_key") and config.get("cal_event_type_id"):
            # Validate and convert event_type_id to proper format
            event_type_id = config.get("cal_event_type_id")
            try:
                # Convert to string first, then validate it's a valid number
                if isinstance(event_type_id, str):
                    cleaned_id = event_type_id.strip()
                    if cleaned_id.startswith("cal_"):
                        parts = cleaned_id.split("_")
                        if len(parts) >= 2:
                            numeric_part = parts[1]
                            if numeric_part.isdigit():
                                event_type_id = int(numeric_part)
                            else:
                                event_type_id = None
                        else:
                            event_type_id = None
                    elif cleaned_id.isdigit():
                        event_type_id = int(cleaned_id)
                    else:
                        event_type_id = None
                elif isinstance(event_type_id, (int, float)):
                    event_type_id = int(event_type_id)
                else:
                    event_type_id = None
            except (ValueError, TypeError):
                event_type_id = None
            
            if event_type_id:
                cal_timezone = config.get("cal_timezone") or "Asia/Karachi"
                calendar = CalComCalendar(
                    api_key=config.get("cal_api_key"),
                    event_type_id=event_type_id,
                    timezone=cal_timezone
                )
                try:
                    await calendar.initialize()
                    return calendar
                except Exception as e:
                    logger.error(f"CALENDAR_INIT_FAILED | error={str(e)}")
                    return None
            else:
                return None
        else:
            return None

    async def _classify_data_fields_with_llm(self, structured_data: list) -> Dict[str, list]:
        """Use LLM to classify which fields should be asked vs extracted."""
        try:
            openai_api_key = os.getenv("OPENAI_API_KEY")
            if not openai_api_key:
                return {"ask_user": [], "extract_from_conversation": []}

            client = get_openai_client()
            
            fields_json = json.dumps([
                {
                    "name": field.get("name", ""),
                    "description": field.get("description", ""),
                    "type": field.get("type", "string")
                }
                for field in structured_data
            ], indent=2)
            
            classification_prompt = f"""You are analyzing data fields for a voice conversation system. For each field, decide whether it should be:
1. "ask_user" - Information that should be directly asked from the user during the conversation
2. "extract_from_conversation" - Information that should be extracted/inferred from the conversation after it ends

Fields to classify:
{fields_json}

Guidelines:
- Ask user for: contact details, preferences, specific choices, personal information, scheduling details
- Extract from conversation: summaries, outcomes, sentiment, quality metrics, call analysis, key points discussed

Return a JSON object with two arrays. You must respond with valid JSON format only:
{{
  "ask_user": ["field_name1", "field_name2"],
  "extract_from_conversation": ["field_name3", "field_name4"]
}}"""

            response = await asyncio.wait_for(
                client.chat.completions.create(
                    model="gpt-4o-mini",
                    messages=[{"role": "user", "content": classification_prompt}],
                    temperature=0.1,
                    max_tokens=1000
                ),
                timeout=10.0
            )
            
            content = response.choices[0].message.content.strip()
            logger.info(f"FIELD_CLASSIFICATION_RESPONSE | response={content}")
            
            # Parse JSON response
            try:
                classification = json.loads(content)
                logger.info(f"FIELD_CLASSIFICATION_SUCCESS | ask_user={len(classification.get('ask_user', []))} | extract={len(classification.get('extract_from_conversation', []))}")
                return classification
            except json.JSONDecodeError as e:
                logger.error(f"FIELD_CLASSIFICATION_JSON_ERROR | error={str(e)} | content={content}")
                # Fallback to asking user for all fields
                return {
                    "ask_user": [field.get("name", "") for field in structured_data],
                    "extract_from_conversation": []
                }
                
        except Exception as e:
            logger.error(f"FIELD_CLASSIFICATION_ERROR | error={str(e)}")
            # Fallback to asking user for all fields
            return {
                "ask_user": [field.get("name", "") for field in structured_data],
                "extract_from_conversation": []
            }

    def _create_stt(self, language: str, provider_config: Optional[Dict[str, Any]] = None, assistant_config: Optional[Dict[str, Any]] = None):
        """Create STT using dynamic fallback search."""
        stt_chain = []
        
        # Get model from assistant config or provider config
        stt_model = (assistant_config or {}).get("stt_model_setting") or (provider_config or {}).get("stt_model") or "nova-2"
        
        # Fallback list from DB or default
        fallbacks = provider_config.get("stt_fallbacks") if provider_config else None
        if not fallbacks:
            fallbacks = ['deepgram', 'openai']
            
        deepgram_api_key = os.getenv("DEEPGRAM_API_KEY")
        openai_api_key = os.getenv("OPENAI_API_KEY")
        groq_api_key = os.getenv("GROQ_API_KEY")
        soniox_api_key = os.getenv("SONIOX_API_KEY")
        
        # Language mapping for STT - Forced to English
        stt_lang = "en"

        from main import DEEPGRAM_AVAILABLE, SONIOX_AVAILABLE, GROQ_AVAILABLE
        from livekit.plugins import deepgram as lk_deepgram, soniox as lk_soniox, groq as lk_groq, openai as lk_openai
        from livekit.agents import stt as lk_stt_module

        for fb in fallbacks:
            if fb == 'deepgram' and DEEPGRAM_AVAILABLE and deepgram_api_key:
                try:
                    if "flux" in stt_model.lower():
                        stt_chain.append(lk_deepgram.STTv2(model="flux-general-en"))
                        logger.info("STT_CHAIN | Added Deepgram Flux (STTv2)")
                    else:
                        stt_chain.append(lk_deepgram.STT(model="nova-2", language=stt_lang))
                        logger.info("STT_CHAIN | Added Deepgram")
                except Exception as e:
                    logger.error(f"STT_CHAIN_ERROR | Deepgram: {e}")
            
            elif fb == 'soniox' and SONIOX_AVAILABLE and soniox_api_key:
                try:
                    stt_chain.append(lk_soniox.STT(api_key=soniox_api_key))
                    logger.info("STT_CHAIN | Added Soniox")
                except Exception as e:
                    logger.error(f"STT_CHAIN_ERROR | Soniox: {e}")
            
            elif fb == 'groq' and GROQ_AVAILABLE and groq_api_key:
                try:
                    stt_chain.append(lk_groq.STT(model="whisper-large-v3-turbo", api_key=groq_api_key, language=stt_lang))
                    logger.info("STT_CHAIN | Added Groq Whisper")
                except Exception as e:
                    logger.error(f"STT_CHAIN_ERROR | Groq: {e}")
            
            elif fb == 'openai' and openai_api_key:
                try:
                    stt_chain.append(openai.STT(model="whisper-1", language=stt_lang))
                    logger.info("STT_CHAIN | Added OpenAI Whisper")
                except Exception as e:
                    logger.error(f"STT_CHAIN_ERROR | OpenAI: {e}")

        if not stt_chain:
            return openai.STT(model="whisper-1", language=stt_lang)
            
        if len(stt_chain) == 1:
            return stt_chain[0]
            
        from livekit.plugins import silero
        return lk_stt_module.FallbackAdapter(stt_chain, vad=silero.VAD.load())

    def _create_tts(self, provider: str, model: str, voice_name: str, config: Dict[str, Any], provider_config: Optional[Dict[str, Any]] = None):
        """Create TTS using assistant config + environment API keys with dynamic fallback support."""
        tts_chain = []
        
        # Fallback list from DB or default
        fallbacks = provider_config.get("tts_fallbacks") if provider_config else None
        if not fallbacks:
            fallbacks = ['raya_tts', 'kokoru_tts', 'cartesia', 'openai']
            
        unreal_api_key = os.getenv("UNREAL_API_KEY")
        raya_api_key = os.getenv("BAKBAK_API_KEY")
        cartesia_api_key = os.getenv("CARTESIA_API_KEY")
        openai_api_key = os.getenv("OPENAI_API_KEY")
        rime_api_key = os.getenv("RIME_API_KEY")
        elevenlabs_api_key = os.getenv("ELEVENLABS_API_KEY")
        hume_api_key = os.getenv("HUME_API_KEY")
        
        from main import (
            RIME_AVAILABLE, ELEVENLABS_AVAILABLE, HUME_AVAILABLE, 
            CARTESIA_AVAILABLE, lk_cartesia, lk_rime, lk_elevenlabs, lk_hume
        )

        # Normalize provider name
        if provider == "UnrealSpeech":
            provider = "kokoru_tts"

        # If a specific provider is requested, put it at the front of the fallbacks
        if provider != "auto" and provider in fallbacks:
            fallbacks.remove(provider)
            fallbacks.insert(0, provider)
        elif provider != "auto":
            # If not in fallbacks but specifically requested, put it at the start anyway
            fallbacks.insert(0, provider)

        for fb in fallbacks:
            # Check if this fallback matches the requested provider (if not 'auto')
            if provider != "auto" and provider.lower() == fb.lower():
                logger.info(f"TTS_PROVIDER_MATCH | Using requested provider: {provider}")

            if fb == 'raya_tts' and raya_api_key:
                try:
                    # Forced to English voice regardless of setting to satisfy "all languages to speak english"
                    raya_voice = "sophia"
                    raya_lang = "en"
                    tts_chain.append(RayaTTS(api_key=raya_api_key, voice_id=raya_voice, language=raya_lang))
                    logger.info(f"TTS_CHAIN | Added Raya")
                except Exception as e:
                    logger.error(f"TTS_CHAIN_ERROR | Raya: {e}")
            
            elif fb == 'kokoru_tts' and unreal_api_key:
                try:
                    # Use the configured voice if it's supported by Kokoro, otherwise fallback to Rowan
                    from integrations.kokoro_tts import SUPPORTED_VOICES
                    kokoru_voice = voice_name if voice_name in SUPPORTED_VOICES else "Rowan"
                    
                    tts_chain.append(KokoruTTS(api_key=unreal_api_key, voice=kokoru_voice))
                    logger.info(f"TTS_CHAIN | Added Kokoru with voice: {kokoru_voice}")
                except Exception as e:
                    logger.error(f"TTS_CHAIN_ERROR | Kokoru: {e}")
            
            elif fb == 'cartesia' and cartesia_api_key and CARTESIA_AVAILABLE:
                try:
                    cartesia_model = config.get("cartesia_model_setting", "sonic-3")
                    cartesia_voice = config.get("cartesia_voice_setting", "41468051-3a85-4b68-92ad-64add250d369")
                    tts_chain.append(lk_cartesia.TTS(model=cartesia_model, voice=cartesia_voice, api_key=cartesia_api_key))
                    logger.info(f"TTS_CHAIN | Added Cartesia")
                except Exception as e:
                    logger.error(f"TTS_CHAIN_ERROR | Cartesia: {e}")

            elif fb == 'rime' and rime_api_key and RIME_AVAILABLE:
                try:
                    rime_model = config.get("voice_model_setting", "mistv2")
                    rime_speaker = config.get("voice_name_setting", "rainforest")
                    tts_chain.append(lk_rime.TTS(model=rime_model, speaker=rime_speaker, api_key=rime_api_key))
                    logger.info(f"TTS_CHAIN | Added Rime")
                except Exception as e:
                    logger.error(f"TTS_CHAIN_ERROR | Rime: {e}")

            elif fb == 'elevenlabs' and elevenlabs_api_key and ELEVENLABS_AVAILABLE:
                try:
                    el_voice = config.get("voice_name_setting", "rachel")
                    tts_chain.append(lk_elevenlabs.TTS(voice_id=el_voice, api_key=elevenlabs_api_key))
                    logger.info(f"TTS_CHAIN | Added ElevenLabs")
                except Exception as e:
                    logger.error(f"TTS_CHAIN_ERROR | ElevenLabs: {e}")

            elif fb == 'openai' and openai_api_key:
                try:
                    voice_mapping = {
                        "rachel": "nova", "domi": "shimmer", "bella": "nova", "antoni": "echo",
                        "elli": "nova", "josh": "echo", "arnold": "fable", "alloy": "alloy",
                        "nova": "nova", "shimmer": "shimmer", "echo": "echo", "fable": "fable", "onyx": "onyx"
                    }
                    mapped_voice = voice_mapping.get(voice_name.lower(), "alloy")
                    tts_chain.append(openai.TTS(model="tts-1", voice=mapped_voice, api_key=openai_api_key))
                    logger.info(f"TTS_CHAIN | Added OpenAI")
                except Exception as e:
                    logger.error(f"TTS_CHAIN_ERROR | OpenAI: {e}")

            elif fb == 'hume' and hume_api_key and HUME_AVAILABLE:
                try:
                    tts_chain.append(lk_hume.TTS(api_key=hume_api_key))
                    logger.info(f"TTS_CHAIN | Added Hume")
                except Exception as e:
                    logger.error(f"TTS_CHAIN_ERROR | Hume: {e}")

        if not tts_chain:
            if openai_api_key:
                 return openai.TTS(model="tts-1", voice="alloy", api_key=openai_api_key)
            raise RuntimeError("No TTS providers available")

        return tts_chain[0] if len(tts_chain) == 1 else StickyFallbackTTS(tts_chain)

    def _create_llm(self, provider: str, model: str, temperature: float, max_tokens: int, config: Dict[str, Any], provider_config: Optional[Dict[str, Any]] = None):
        """Create a fallback chain of LLMs as requested."""
        llm_chain = []
        
        # Fallback list from DB or default
        fallbacks = provider_config.get("llm_fallbacks") if provider_config else None
        if not fallbacks:
            fallbacks = ['groq', 'openai', 'cerebras']
            
        groq_api_key = os.getenv("GROQ_API_KEY")
        openai_api_key = os.getenv("OPENAI_API_KEY")
        cerebras_api_key = os.getenv("CEREBRAS_API_KEY")
        
        for fb in fallbacks:
            if fb == 'groq' and groq_api_key and lk_groq:
                try:
                    llm_chain.append(lk_groq.LLM(
                        model="meta-llama/llama-4-maverick-17b-128e-instruct",
                        api_key=groq_api_key,
                        temperature=temperature,
                        parallel_tool_calls=False,
                        tool_choice="auto",
                    ))
                    logger.info("LLM_CHAIN | Added Groq")
                except Exception as e:
                    logger.error(f"LLM_CHAIN_ERROR | Groq: {e}")
            
            elif fb == 'openai' and openai_api_key:
                try:
                    llm_chain.append(openai.LLM(
                        model="gpt-4o",
                        api_key=openai_api_key,
                        temperature=temperature,
                        parallel_tool_calls=False,
                        tool_choice="auto",
                    ))
                    logger.info("LLM_CHAIN | Added OpenAI")
                except Exception as e:
                    logger.error(f"LLM_CHAIN_ERROR | OpenAI: {e}")
            
            elif fb == 'cerebras' and cerebras_api_key:
                try:
                    llm_chain.append(openai.LLM(
                        model="llama-3.1-70b-versatile",
                        api_key=cerebras_api_key,
                        base_url="https://api.cerebras.ai/v1",
                        temperature=temperature,
                        parallel_tool_calls=False,
                        tool_choice="auto",
                    ))
                    logger.info("LLM_CHAIN | Added Cerebras")
                except Exception as e:
                    logger.error(f"LLM_CHAIN_ERROR | Cerebras: {e}")

        if not llm_chain:
            if openai_api_key:
                 return openai.LLM(model="gpt-4o-mini", api_key=openai_api_key)
            raise RuntimeError("No LLM providers available")

        return llm_chain[0] if len(llm_chain) == 1 else FallbackLLM(llm_chain)

