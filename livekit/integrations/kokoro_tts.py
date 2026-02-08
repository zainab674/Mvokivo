"""
Production-ready UnrealSpeech (Kokoru) TTS implementation for LiveKit Agents

Provides high-quality text-to-speech synthesis using UnrealSpeech API,
optimized for real-time AI voice interactions with natural human tone.

Features:
- Complete text synthesis (non-streaming to avoid stuttering)
- Automatic text cleaning and preprocessing
- Configurable pitch, speed, and bitrate
- Voice options: Rowan, Ethan, Amelia, Maddie, Ananya, Priya, Arjun, Rohan
"""

import asyncio
import aiohttp
import logging
import re
import os
from dataclasses import dataclass
from typing import Optional

from livekit.agents import tts, utils
from livekit.agents.types import DEFAULT_API_CONNECT_OPTIONS, APIConnectOptions
from services.process_text import preprocess_text

logger = logging.getLogger(__name__)

# UnrealSpeech API Config
UNREAL_API_URL = "https://api.v8.unrealspeech.com/stream"
DEFAULT_TIMEOUT = 15.0
MAX_TEXT_LENGTH = 500


@dataclass
class KokoruVoice:
    """Configuration for Kokoru (UnrealSpeech) voices"""
    name: str
    description: str


SUPPORTED_VOICES = {
    # US English / General
    "Rowan": "Rowan",
    "Ethan": "Ethan",
    "Amelia": "Amelia",
    "Maddie": "Maddie",
    "Oliver": "Oliver",
    "Charlotte": "Charlotte",
    # Hindi
    "Ananya": "Ananya",
    "Priya": "Priya",
    "Arjun": "Arjun",
    "Rohan": "Rohan",
}



class KokoruTTS(tts.TTS):
    """
    Kokoru (UnrealSpeech) TTS for LiveKit Agents
    Provides lifelike Indian-accented voices with configurable tone and playback parameters.
    """

    def __init__(
        self,
        *,
        voice: str = "Rowan",
        speed: float = 1.0,
        pitch: float = 1.0,
        bitrate: str = "192k",
        codec: str = "pcm_s16le",
        api_timeout: float = DEFAULT_TIMEOUT,
        http_session: Optional[aiohttp.ClientSession] = None,
        api_key: Optional[str] = os.environ.get("UNREAL_TTS_API_KEY") or os.environ.get("UNREAL_API_KEY"),
    ):
        """
        Initialize Kokoru TTS

        Args:
            voice: Voice ID ('Rowan', 'Ethan', 'Amelia', 'Ananya', 'Priya', 'Arjun', 'Rohan')
            speed: Speech rate multiplier (0.8 = slower, 1.2 = faster)
            pitch: Pitch multiplier (1.0 = normal)
            bitrate: Audio bitrate (e.g. '128k', '192k')
            codec: Audio codec (e.g. 'pcm_s16le', 'mp3')
        """
        super().__init__(
            capabilities=tts.TTSCapabilities(
                streaming=False,
                aligned_transcript=False,
            ),
            sample_rate=22050,
            num_channels=1,
        )

        if voice not in SUPPORTED_VOICES:
            # Fallback to Rowan if voice not found
            logger.warning(f"Voice {voice} not supported for Kokoru, falling back to Rowan")
            voice = "Rowan"

        self._voice = voice
        self._speed = max(1.0, min(2.0, speed))
        self._pitch = max(1.0, min(2.0, pitch))
        self._bitrate = bitrate
        self._codec = codec
        self._api_timeout = api_timeout
        self._session = http_session
        self._api_key = api_key

    def synthesize(
        self, text: str, *, conn_options: APIConnectOptions = DEFAULT_API_CONNECT_OPTIONS
    ) -> "ChunkedStream":
        """Create a synthesis stream for the given text"""
        return ChunkedStream(
            tts=self,
            input_text=text,
            conn_options=conn_options,
        )

    async def aclose(self) -> None:
        """Clean up resources"""
        if self._session:
            await self._session.close()


class ChunkedStream(tts.ChunkedStream):
    """Handles complete text synthesis with UnrealSpeech (Kokoru) API"""

    def __init__(
        self,
        *,
        tts: KokoruTTS,
        input_text: str,
        conn_options: APIConnectOptions,
    ):
        super().__init__(tts=tts, input_text=input_text, conn_options=conn_options)
        self._tts = tts

    async def _run(self, output_emitter: tts.AudioEmitter) -> None:
        request_id = utils.shortuuid()
        logger.debug(f"[KokoruTTS] Starting synthesis with request_id={request_id}")

        output_emitter.initialize(
            request_id=request_id,
            sample_rate=self._tts.sample_rate,
            num_channels=self._tts.num_channels,
            mime_type="audio/wav",
        )

        cleaned_text = self._prepare_text(self._input_text)
        if cleaned_text:
            await self._synthesize_text(cleaned_text, output_emitter)
        else:
            logger.warning("No valid text to synthesize")

        output_emitter.flush()

    def _prepare_text(self, text: str) -> str:
        """Clean and normalize input text for natural speech"""
        if not text or not text.strip():
            return ""

        text = re.sub(r'```[^`]*```', '', text)
        text = re.sub(r'`[^`]*`', '', text)
        text = re.sub(r'\[.*?\]', '', text)
        text = re.sub(r'\s+', ' ', text).strip()

        if len(text) > MAX_TEXT_LENGTH:
            logger.warning(f"Truncating text ({len(text)} > {MAX_TEXT_LENGTH})")
            text = text[:MAX_TEXT_LENGTH]

        return text

    async def _synthesize_text(self, text: str, output_emitter: tts.AudioEmitter) -> None:
        """Send synthesis request to UnrealSpeech API"""
        if not self._tts._api_key:
            logger.error("UNREAL_TTS_API_KEY/UNREAL_API_KEY not set in environment.")
            return

        text = preprocess_text(text)
        payload = {
            "Text": text,
            "VoiceId": self._tts._voice,
            # "Bitrate": self._tts._bitrate,
            # "Speed": str(self._tts._speed),
            # "Pitch": str(self._tts._pitch),
            "Codec": self._tts._codec,
        }

        headers = {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {self._tts._api_key}",
        }

        session = self._tts._session or aiohttp.ClientSession()
        session_owner = self._tts._session is None

        try:
            async with session.post(
                UNREAL_API_URL,
                json=payload,
                headers=headers,
                timeout=aiohttp.ClientTimeout(total=self._tts._api_timeout),
            ) as response:
                if response.status != 200:
                    err = await response.text()
                    logger.error(f"Kokoru API error {response.status}: {err}")
                    return

                audio_data = await response.read()
                if not audio_data:
                    logger.warning("Empty audio data from Kokoru TTS.")
                    return

                output_emitter.push(audio_data)
                logger.debug(f"Kokoru emitted {len(audio_data)} bytes")

        except asyncio.TimeoutError:
            logger.error(f"Kokoru TTS timed out after {self._tts._api_timeout}s")
        except Exception as e:
            logger.error(f"Kokoru synthesis failed: {e}")
        finally:
            if session_owner:
                await session.close()
