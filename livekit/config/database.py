"""
Database configuration and connection utilities.
"""

import os
import logging
from typing import Optional, Dict, Any
from dataclasses import dataclass

from integrations.mongodb_client import MongoDBClient


@dataclass
class DatabaseConfig:
    """Database configuration settings."""
    mongodb_uri: str
    backend_url: str
    service_key: str
    enabled: bool = True
    
    @classmethod
    def from_env(cls) -> "DatabaseConfig":
        return cls(
            mongodb_uri=os.getenv("MONGODB_URI", ""),
            backend_url=os.getenv("BACKEND_URL", "http://localhost:4000"),
            service_key=os.getenv("INTERNAL_SERVICE_KEY", ""),
            enabled=bool(os.getenv("MONGODB_URI"))
        )


class DatabaseClient:
    """MongoDB database client wrapper."""
    
    def __init__(self, config: DatabaseConfig):
        self.config = config
        self._client: Optional[MongoDBClient] = None
        self._initialize_client()
    
    def _initialize_client(self):
        """Initialize the MongoDB client."""
        if not self.config.enabled:
            logging.warning("Database client disabled - no MongoDB configuration")
            return
        
        if not self.config.mongodb_uri:
            logging.warning("MongoDB URI not configured")
            return
        
        try:
            self._client = MongoDBClient()
            logging.info("Database client initialized successfully")
        except Exception as e:
            logging.error(f"Failed to initialize database client: {e}")
            self._client = None
    
    @property
    def client(self) -> Optional[MongoDBClient]:
        """Get the MongoDB client instance."""
        return self._client
    
    def is_available(self) -> bool:
        """Check if database client is available."""
        return self._client is not None and self._client.is_available()
    
    async def fetch_assistant(self, assistant_id: str) -> Optional[Dict[str, Any]]:
        """Fetch assistant configuration from database."""
        if not self.is_available():
            logging.warning("Database client not available")
            return None
        
        return await self._client.fetch_assistant(assistant_id)
    
    async def save_call_history(
        self,
        call_id: str,
        assistant_id: str,
        called_did: str,
        call_duration: int,
        call_status: str,
        transcription: list,
        participant_identity: Optional[str] = None,
        recording_sid: Optional[str] = None,
        call_sid: Optional[str] = None,
        start_time: Optional[str] = None,
        end_time: Optional[str] = None
    ) -> bool:
        """Save call history to database."""
        if not self.is_available():
            logging.warning("Database client not available")
            return False
        
        return await self._client.save_call_history(
            call_id=call_id,
            assistant_id=assistant_id,
            phone_number=called_did,
            call_duration=call_duration,
            call_status=call_status,
            transcription=transcription,
            participant_identity=participant_identity,
            call_sid=call_sid,
            end_time=end_time
        )
    
    async def save_n8n_spreadsheet_id(self, assistant_id: str, spreadsheet_id: str) -> bool:
        """Save N8N spreadsheet ID for assistant."""
        if not self.is_available():
            logging.warning("Database client not available")
            return False
            
        return await self._client.save_n8n_spreadsheet_id(assistant_id, spreadsheet_id)
    
    async def deduct_minutes(self, user_id: str, minutes: float) -> Dict[str, Any]:
        """
        Deduct minutes from user's account after a call.
        Returns dict with success status and remaining minutes info.
        """
        if not self.is_available():
            logging.warning("Database client not available for minutes deduction")
            return {"success": False, "error": "Database not available"}
        
        return await self._client.deduct_minutes(user_id, minutes)
    
    async def check_minutes_available(self, user_id: str) -> Dict[str, Any]:
        """
        Check if user has minutes available before starting a call.
        Returns dict with availability status and remaining minutes.
        """
        if not self.is_available():
            logging.warning("Database client not available for minutes check")
            return {"available": True, "error": "Database not available - allowing call"}
        
        return await self._client.check_minutes_available(user_id)


# Global database client instance
_db_client: Optional[DatabaseClient] = None


def get_database_client() -> Optional[DatabaseClient]:
    """Get the global database client instance."""
    global _db_client
    if _db_client is None:
        config = DatabaseConfig.from_env()
        _db_client = DatabaseClient(config)
    return _db_client


def get_database_config() -> DatabaseConfig:
    """Get database configuration."""
    return DatabaseConfig.from_env()
