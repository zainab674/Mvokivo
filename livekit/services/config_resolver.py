"""
Configuration resolver for assistant configurations.
"""

import asyncio
import json
import logging
from typing import Optional, Dict, Any
from livekit.agents import JobContext
from integrations.mongodb_client import MongoDBClient
from utils.data_extractors import extract_did_from_room

logger = logging.getLogger(__name__)


class ConfigResolver:
    """Resolves assistant configurations for different call types."""
    
    def __init__(self, mongodb_client: MongoDBClient):
        self.mongodb = mongodb_client
    
    async def resolve_assistant_config(self, ctx: JobContext, call_type: str) -> Optional[Dict[str, Any]]:
        """Resolve assistant configuration for the call."""
        try:
            # For web calls, check room metadata first
            if call_type == "web":
                assistant_id = None
                
                # Try to get assistant_id from room metadata
                if ctx.room.metadata:
                    try:
                        room_metadata = json.loads(ctx.room.metadata)
                        assistant_id = room_metadata.get("assistantId") or room_metadata.get("assistant_id")
                        logger.info(f"WEB_ASSISTANT_FROM_ROOM | assistant_id={assistant_id}")
                    except (json.JSONDecodeError, KeyError):
                        pass
                
                # If not found in room metadata, try job metadata
                if not assistant_id and ctx.job.metadata:
                    try:
                        job_metadata = json.loads(ctx.job.metadata)
                        assistant_id = job_metadata.get("assistantId") or job_metadata.get("assistant_id")
                        logger.info(f"WEB_ASSISTANT_FROM_JOB | assistant_id={assistant_id}")
                    except (json.JSONDecodeError, KeyError):
                        pass
                
                if assistant_id:
                    return await self._get_assistant_by_id(assistant_id)
                else:
                    logger.error("WEB_NO_ASSISTANT_ID | could not find assistantId in metadata")
                    return None
            
            metadata = ctx.job.metadata
            if not metadata:
                logger.warning("No job metadata available")
                return None
                
            dial_info = json.loads(metadata)
            
            if call_type == "outbound":
                # For outbound calls, get assistant_id from job metadata
                assistant_id = dial_info.get("agentId") or dial_info.get("assistant_id")
                if assistant_id:
                    logger.info(f"OUTBOUND_ASSISTANT | assistant_id={assistant_id}")
                    return await self._get_assistant_by_id(assistant_id)
                else:
                    logger.error("OUTBOUND_NO_ASSISTANT_ID | metadata={metadata}")
                    return None

            elif call_type == "inbound_with_assistant":
                # For inbound calls with pre-configured assistant, use assistantId from metadata
                assistant_id = dial_info.get("assistantId") or dial_info.get("assistant_id")
                if assistant_id:
                    logger.info(f"INBOUND_WITH_ASSISTANT | assistant_id={assistant_id}")
                    return await self._get_assistant_by_id(assistant_id)
                else:
                    logger.error("INBOUND_NO_ASSISTANT_ID | metadata={metadata}")
                    return None

            # For regular inbound calls, get the called number (DID) to look up assistant
            called_did = dial_info.get("called_number") or dial_info.get("to_number") or dial_info.get("phoneNumber")
            logger.info(f"INBOUND_METADATA_CHECK | metadata={metadata} | called_did={called_did}")

            # Fallback to room name extraction if not found in metadata
            if not called_did:
                called_did = extract_did_from_room(ctx.room.name)
                logger.info(f"INBOUND_ROOM_NAME_FALLBACK | room={ctx.room.name} | called_did={called_did}")

            if called_did:
                logger.info(f"INBOUND_LOOKUP | looking up assistant for DID={called_did}")
                return await self._get_assistant_by_phone(called_did)

            logger.error("INBOUND_NO_DID | could not determine called number")
            return None

        except Exception as e:
            logger.error(f"ASSISTANT_RESOLUTION_ERROR | error={str(e)}")
            return None

    async def _get_assistant_by_id(self, assistant_id: str) -> Optional[Dict[str, Any]]:
        """Get assistant configuration by ID."""
        try:
            if not self.mongodb.is_available():
                logger.warning("MongoDB client not available")
                return None
                
            assistant_data = await self.mongodb.fetch_assistant(assistant_id)
            
            if assistant_data:
                logger.info(f"ASSISTANT_FOUND_BY_ID | assistant_id={assistant_id}")
                logger.info(f"ASSISTANT_CONFIG_DEBUG | knowledge_base_id={assistant_data.get('knowledge_base_id')}")
                logger.info(f"ASSISTANT_CALENDAR_DEBUG | cal_api_key present: {bool(assistant_data.get('cal_api_key'))} | cal_event_type_id present: {bool(assistant_data.get('cal_event_type_id'))}")
                cal_api_key = assistant_data.get('cal_api_key') or 'NOT_FOUND'
                cal_event_type_id = assistant_data.get('cal_event_type_id') or 'NOT_FOUND'
                logger.info(f"ASSISTANT_CALENDAR_DEBUG | cal_api_key: {cal_api_key[:10] if cal_api_key != 'NOT_FOUND' else 'NOT_FOUND'}... | cal_event_type_id: {cal_event_type_id}")
                return assistant_data
            
            logger.warning(f"No assistant found for ID: {assistant_id}")
            return None
        except Exception as e:
            logger.error(f"DATABASE_ERROR | assistant_id={assistant_id} | error={str(e)}")
            return None

    async def _get_assistant_by_phone(self, phone_number: str) -> Optional[Dict[str, Any]]:
        """Get assistant configuration by phone number."""
        try:
            if not self.mongodb.is_available():
                logger.warning("MongoDB client not available")
                return None
                
            assistant_data = await self.mongodb.fetch_assistant_by_phone(phone_number)
            
            if assistant_data:
                logger.info(f"ASSISTANT_FOUND_BY_PHONE | phone={phone_number}")
                return assistant_data
            
            logger.warning(f"No assistant found for phone number: {phone_number}")
            return None
        except Exception as e:
            logger.error(f"DATABASE_ERROR | phone={phone_number} | error={str(e)}")
            return None
