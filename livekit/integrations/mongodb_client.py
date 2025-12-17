"""
MongoDB client for LiveKit agent database operations.
"""

import os
import logging
from typing import Optional, Dict, Any
from motor.motor_asyncio import AsyncIOMotorClient
import httpx
from bson import ObjectId

logger = logging.getLogger(__name__)


class MongoDBClient:
    """MongoDB client for LiveKit voice agent database operations."""
    
    def __init__(self):
        self.logger = logging.getLogger(__name__)
        self._client: Optional[AsyncIOMotorClient] = None
        self._db = None
        self._http_client: Optional[httpx.AsyncClient] = None
        self._initialize_client()
    
    def _initialize_client(self):
        """Initialize MongoDB and HTTP clients."""
        # Get MongoDB URI from environment
        mongodb_uri = os.getenv("MONGODB_URI")
        if not mongodb_uri:
            self.logger.warning("MONGODB_URI not configured - database operations will fail")
            return
        
        try:
            # Fix missing scheme in URI if present
            if not mongodb_uri.startswith("mongodb://") and not mongodb_uri.startswith("mongodb+srv://"):
                self.logger.warning("MongoDB URI missing scheme, attempting to auto-fix...")
                if "mongodb.net" in mongodb_uri:
                    mongodb_uri = "mongodb+srv://" + mongodb_uri
                else:
                    mongodb_uri = "mongodb://" + mongodb_uri

            # Initialize MongoDB client
            self._client = AsyncIOMotorClient(mongodb_uri)
            # Get database name from URI or use default
            db_name = os.getenv("MONGODB_DB_NAME", "test")
            self._db = self._client[db_name]
            
            # Initialize HTTP client for backend API calls
            backend_url = os.getenv("BACKEND_URL", "http://localhost:4000")
            service_key = os.getenv("INTERNAL_SERVICE_KEY", "")
            
            self._http_client = httpx.AsyncClient(
                base_url=backend_url,
                headers={
                    "x-service-key": service_key,
                    "Content-Type": "application/json"
                },
                timeout=30.0
            )
            
            # List collection names to verify connection and naming conventions
            # Note: synchronous call in init context
            # collections = self._db.list_collection_names()
            # self.logger.info(f"MongoDB client initialized | db={db_name} | collections={collections}")
            self.logger.info(f"MongoDB client initialized | db={db_name}")
        except Exception as e:
            # Mask URI for safe logging
            uri_preview = "None"
            if mongodb_uri:
                if "@" in mongodb_uri:
                    parts = mongodb_uri.split("@")
                    uri_preview = f"...@{parts[-1]}"
                else:
                    uri_preview = mongodb_uri[:10] + "..."
            
            self.logger.error(f"Failed to initialize MongoDB client: {e} | URI_PREVIEW={uri_preview}")
            self._client = None
            self._db = None
    
    def is_available(self) -> bool:
        """Check if MongoDB client is available."""
        return self._db is not None
    
    async def fetch_assistant(self, assistant_id: str) -> Optional[Dict[str, Any]]:
        """
        Fetch assistant configuration from MongoDB.
        
        Args:
            assistant_id: Assistant ID to fetch
            
        Returns:
            Assistant data dict or None if not found
        """
        if not self.is_available():
            self.logger.warning("MongoDB client not available")
            return None
        
     
        try:
            query = {"id": assistant_id}
            
            # If valid ObjectId, search by _id instead
            if ObjectId.is_valid(assistant_id):
                query = {"_id": ObjectId(assistant_id)}
            
            # Query assistant collection
            assistant = await self._db.assistants.find_one(query)
            
            if not assistant:
                # Fallback: if we searched by _id and failed, try searching by string "id" field
                # (in case some records use string IDs)
                if "_id" in query:
                    assistant = await self._db.assistants.find_one({"id": assistant_id})
            
            if assistant:
                # Convert ObjectId to string and remove it to be JSON serializable
                if "_id" in assistant:
                    assistant["id"] = str(assistant["_id"])
                    del assistant["_id"]
                self.logger.info(f"Assistant fetched from MongoDB: {assistant_id}")
                return assistant
            else:
                self.logger.warning(f"Assistant not found in MongoDB: {assistant_id}")
                return None
                
        except Exception as e:
            self.logger.error(f"Error fetching assistant from MongoDB: {e}")
            return None
    
    async def fetch_assistant_by_phone(self, phone_number: str) -> Optional[Dict[str, Any]]:
        """
        Fetch assistant by phone number (for inbound calls).
        
        Args:
            phone_number: Phone number to look up
            
        Returns:
            Assistant data dict or None if not found
        """
        if not self.is_available():
            self.logger.warning("MongoDB client not available")
            return None
        
        try:
            # First, find the phone number record
            phone_record = await self._db.phonenumbers.find_one({"number": phone_number})
            
            if not phone_record:
                self.logger.warning(f"Phone number not found: {phone_number}")
                return None
            
            # Get the assistant ID from the phone record
            assistant_id = phone_record.get("inbound_assistant_id")
            if not assistant_id:
                self.logger.warning(f"No assistant assigned to phone: {phone_number}")
                return None
            
            # Fetch the assistant
            return await self.fetch_assistant(assistant_id)
                
        except Exception as e:
            self.logger.error(f"Error fetching assistant by phone: {e}")
            return None
    
    async def save_call_history(
        self,
        call_id: str,
        assistant_id: str,
        phone_number: str,
        call_duration: int,
        call_status: str,
        transcription: list,
        participant_identity: Optional[str] = None,
        call_sid: Optional[str] = None,
        start_time: Optional[str] = None,
        end_time: Optional[str] = None,
        call_summary: Optional[str] = None,
        call_success: Optional[bool] = None,
        structured_data: Optional[Dict[str, Any]] = None,
        call_outcome: Optional[str] = None,
        outcome_confidence: Optional[float] = None,
        outcome_reasoning: Optional[str] = None
    ) -> bool:
        """
        Save call history to MongoDB.
        
        Args:
            call_id: Unique call identifier
            assistant_id: Assistant ID
            phone_number: Phone number
            call_duration: Duration in seconds
            call_status: Call status
            transcription: Call transcript
            participant_identity: Participant identity
            call_sid: Twilio call SID
            start_time: Call start time (ISO format)
            end_time: Call end time (ISO format)
            call_summary: AI-generated summary
            call_success: Whether call was successful
            structured_data: Extracted structured data
            call_outcome: Call outcome classification
            outcome_confidence: Confidence score
            outcome_reasoning: Reasoning for outcome
            
        Returns:
            True if saved successfully, False otherwise
        """
        if not self.is_available():
            self.logger.warning("MongoDB client not available")
            return False
        
        try:
            call_data = {
                "call_id": call_id,
                "assistant_id": assistant_id,
                "phone_number": phone_number,
                "call_duration": call_duration,
                "call_status": call_status,
                "transcription": transcription,
                "participant_identity": participant_identity,
                "call_sid": call_sid,
                "start_time": start_time,
                "end_time": end_time,
                "call_summary": call_summary,
                "call_success": call_success,
                "structured_data": structured_data,
                "call_outcome": call_outcome,
                "outcome_confidence": outcome_confidence,
                "outcome_reasoning": outcome_reasoning,
                "created_at": start_time or end_time
            }
            
            # Remove None values
            call_data = {k: v for k, v in call_data.items() if v is not None}
            
            # Insert into call_history collection
            result = await self._db.callhistories.insert_one(call_data)
            
            if result.inserted_id:
                self.logger.info(f"Call history saved to MongoDB: {call_id}")
                return True
            else:
                self.logger.error(f"Failed to save call history: {call_id}")
                return False
                
        except Exception as e:
            self.logger.error(f"Error saving call history to MongoDB: {e}")
            return False

    async def save_n8n_spreadsheet_id(self, assistant_id: str, spreadsheet_id: str) -> bool:
        """
        Save N8N spreadsheet ID for assistant.
        
        Args:
            assistant_id: Assistant ID
            spreadsheet_id: Spreadsheet ID from N8N
            
        Returns:
            True if saved successfully, False otherwise
        """
        if not self.is_available():
            self.logger.warning("MongoDB client not available")
            return False
        
        try:
            # Update assistant record
            result = await self._db.assistant.update_one(
                {"id": assistant_id},
                {"$set": {"n8n_spreadsheet_id": spreadsheet_id}}
            )
            
            if result.modified_count > 0 or result.matched_count > 0:
                self.logger.info(f"N8N spreadsheet ID saved: {assistant_id}")
                return True
            else:
                self.logger.warning(f"Assistant not found for spreadsheet ID update: {assistant_id}")
                return False
                
        except Exception as e:
            self.logger.error(f"Error saving N8N spreadsheet ID: {e}")
            return False
    
    async def check_minutes_available(self, user_id: str) -> Dict[str, Any]:
        """
        Check if user has minutes available via backend API.
        
        Args:
            user_id: User ID to check
            
        Returns:
            Dict with availability status and remaining minutes
        """
        if not self._http_client:
            self.logger.warning("HTTP client not available for minutes check")
            return {"available": True, "error": "HTTP client not available - allowing call"}
        
        try:
            # Call backend API to get user's minutes
            response = await self._http_client.get(
                f"/api/v1/users/{user_id}/minutes"
            )
            
            if response.status_code == 200:
                data = response.json()
                if data.get("success"):
                    minutes_data = data.get("data", {})
                    remaining = minutes_data.get("remainingMinutes", 0)
                    total = minutes_data.get("totalMinutes", 0)
                    
                    # If total is 0, it's unlimited
                    if total == 0:
                        return {
                            "available": True,
                            "remaining_minutes": 0,
                            "unlimited": True
                        }
                    
                    return {
                        "available": remaining > 0,
                        "remaining_minutes": remaining,
                        "minutes_limit": total,
                        "minutes_used": minutes_data.get("usedMinutes", 0),
                        "unlimited": False
                    }
            
            # If API call fails, allow call (fail open)
            self.logger.warning(f"Minutes check API failed: {response.status_code}")
            return {"available": True, "error": f"API returned {response.status_code} - allowing call"}
                
        except Exception as e:
            self.logger.error(f"Error checking minutes: {e}")
            # On error, allow call to proceed (fail open)
            return {"available": True, "error": str(e)}
    
    async def deduct_minutes(self, user_id: str, minutes: float) -> Dict[str, Any]:
        """
        Deduct minutes from user's account via backend API.
        
        Args:
            user_id: User ID
            minutes: Minutes to deduct (will be rounded up)
            
        Returns:
            Dict with success status and remaining minutes info
        """
        if not self._http_client:
            self.logger.warning("HTTP client not available for minutes deduction")
            return {"success": False, "error": "HTTP client not available"}
        
        try:
            # Round up minutes
            minutes_to_deduct = int(minutes) + (1 if minutes % 1 > 0 else 0)
            
            # Call backend API to deduct minutes
            response = await self._http_client.post(
                "/api/v1/minutes/deduct",
                json={
                    "userId": user_id,
                    "minutes": minutes_to_deduct
                }
            )
            
            if response.status_code == 200:
                data = response.json()
                if data.get("success"):
                    result_data = data.get("data", {})
                    self.logger.info(
                        f"Minutes deducted: user={user_id}, "
                        f"deducted={result_data.get('minutesDeducted')}, "
                        f"used={result_data.get('newUsed')}/{result_data.get('minutesLimit')}, "
                        f"remaining={result_data.get('remainingMinutes')}"
                    )
                    
                    return {
                        "success": True,
                        "minutes_deducted": result_data.get("minutesDeducted"),
                        "minutes_used": result_data.get("newUsed"),
                        "minutes_limit": result_data.get("minutesLimit"),
                        "remaining_minutes": result_data.get("remainingMinutes"),
                        "exceeded_limit": result_data.get("exceededLimit", False)
                    }
                else:
                    error_msg = data.get("error", "Unknown error")
                    self.logger.error(f"Minutes deduction failed: {error_msg}")
                    return {"success": False, "error": error_msg}
            else:
                self.logger.error(f"Minutes deduction API failed: {response.status_code}")
                return {"success": False, "error": f"API returned {response.status_code}"}
                
        except Exception as e:
            self.logger.error(f"Error deducting minutes: {e}")
            return {"success": False, "error": str(e)}
    
    async def close(self):
        """Close MongoDB and HTTP clients."""
        if self._client:
            self._client.close()
        if self._http_client:
            await self._http_client.aclose()
