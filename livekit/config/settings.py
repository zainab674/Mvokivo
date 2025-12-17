"""
Settings configuration for the application.
"""
import os
from dataclasses import dataclass
from typing import Dict, Any, Optional

@dataclass
class Settings:
    """Application settings."""
    openai_api_key: Optional[str] = None
    deepgram_api_key: Optional[str] = None
    elevenlabs_api_key: Optional[str] = None
    cartesia_api_key: Optional[str] = None
    livekit_api_key: Optional[str] = None
    livekit_api_secret: Optional[str] = None
    livekit_url: Optional[str] = None
    
    @classmethod
    def from_env(cls) -> "Settings":
        """Load settings from environment variables."""
        return cls(
            openai_api_key=os.getenv("OPENAI_API_KEY"),
            deepgram_api_key=os.getenv("DEEPGRAM_API_KEY"),
            elevenlabs_api_key=os.getenv("ELEVENLABS_API_KEY"),
            cartesia_api_key=os.getenv("CARTESIA_API_KEY"),
            livekit_api_key=os.getenv("LIVEKIT_API_KEY"),
            livekit_api_secret=os.getenv("LIVEKIT_API_SECRET"),
            livekit_url=os.getenv("LIVEKIT_URL"),
        )

_settings: Optional[Settings] = None

def get_settings() -> Settings:
    """Get the global settings instance."""
    global _settings
    if _settings is None:
        _settings = Settings.from_env()
    return _settings

def validate_model_names(config: Dict[str, Any]) -> Dict[str, Any]:
    """
    Validate and return model names from configuration.
    Ensures that LLM, STT, and TTS models are specified or defaults are used.
    """
    if not isinstance(config, dict):
        # logging.warning(f"Invalid config type for validation: {type(config)}")
        return config or {}
    
    # Clone to avoid mutating original if needed, typically ok to mutate
    validated = config.copy()
    
    # Ensure keys exist with sensible defaults if missing
    # LLM Settings
    if "llm_model" not in validated:
        validated["llm_model"] = "gpt-4o-mini"
        
    if "llm_provider" not in validated:
         # Infer from model name or default
         if "gpt" in validated["llm_model"]:
             validated["llm_provider"] = "openai"
         else:
             validated["llm_provider"] = "openai"

    # TTS Settings
    if "tts_model" not in validated:
        validated["tts_model"] = "openai-tts-1" # or similar default
        
    if "tts_voice" not in validated:
        validated["tts_voice"] = "alloy"

    # STT Settings 
    if "stt_provider" not in validated:
        validated["stt_provider"] = "deepgram"
        
    if "stt_model" not in validated:
        validated["stt_model"] = "nova-2"

    return validated
