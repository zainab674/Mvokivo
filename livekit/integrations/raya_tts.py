import asyncio
import aiohttp
import logging
import re
import os
from typing import Optional
from dataclasses import dataclass
import numpy as np

from livekit.agents import tts, utils
from livekit.agents.types import DEFAULT_API_CONNECT_OPTIONS, APIConnectOptions
from services.process_text import preprocess_text

logger = logging.getLogger(__name__)

# ============================================================
# API CONFIG
# ============================================================

BAKBAK_API_URL = "https://hub.getraya.app/v1/text-to-speech"
DEFAULT_TIMEOUT = 30
MAX_TEXT_LENGTH = 1000

# ============================================================
# VOICE CONFIG
# ============================================================

@dataclass
class BakBakVoice:
    voice_id: str
    name: str
    language: str

SUPPORTED_VOICES = {
    # Marathi
    "sneha": BakBakVoice("c849b31b-b0ba-488f-b97d-3fd12f2656f4", "Sneha", "mr"),
    "monika": BakBakVoice("daf27132-15fd-481b-ae26-aeba8d256901", "Monika", "mr"),
    "priya_mr": BakBakVoice("bd1a2614-9268-429c-98a4-727a034185c1", "Priya", "mr"),
    "kavya": BakBakVoice("0c48e416-d0d8-4518-a778-384172c987fe", "Kavya", "mr"),

    # Hindi
    "priyanka": BakBakVoice("d6a002d0-230c-49b1-a137-b8a7d564b1ae", "Priyanka", "hi"),
    "ananya": BakBakVoice("5105f0fd-914c-4cfd-a338-c0fd55ae9eef", "Ananya", "hi"),
    "arjun": BakBakVoice("5e3c580f-f42b-41ea-8c8a-c681c72f849d", "Arjun", "hi"),

    # Telugu
    "tanvi": BakBakVoice("25a7c7d9-57b3-488a-a880-33edf6642902", "Tanvi", "te"),
    "karthik": BakBakVoice("18897ed3-e3a8-46e0-ad0e-a176bcb6ceee", "Karthik", "te"),
    "divya": BakBakVoice("e39f7165-85e0-4bd8-b853-cb89c7dbd1b7", "Divya", "te"),

    # Kannada
    "meera": BakBakVoice("6a897d02-83ab-43ea-b17f-a8cc2d96a279", "Meera", "kn"),
    "rohan": BakBakVoice("522e4587-6611-4442-afdb-59f20ad5e420", "Rohan", "kn"),

    # English IN
    "nayra": BakBakVoice("0f24fb66-e495-4781-9e84-1224aa7dacde", "Nayra", "en-in"),
    "aanya": BakBakVoice("4fc34582-f0e0-418d-8d0b-2738637d9229", "Aanya", "en-in"),
    "roger": BakBakVoice("bae3d3fe-64f9-4d2a-80b2-607ddff23528", "Roger", "en-in"),

    # English US
    "sophia": BakBakVoice("6612acb5-988d-4d6e-8a71-5a719f41e2c8", "Sophia", "en-us"),
    "liam": BakBakVoice("97a155d0-8192-410e-a97c-540481182fc7", "Liam", "en-us"),
}

# Helper to find voice by ID or name
VOICE_ID_MAP = {v.voice_id: v for v in SUPPORTED_VOICES.values()}


# ============================================================
# MAIN TTS CLASS
# ============================================================

class RayaTTS(tts.TTS):
    def __init__(
        self,
        *,
        api_key: Optional[str] = None,
        voice_id: str = "ananya",
        language: str = "hi",
        speed: float = 1.0,
        model: str = "standard",
        timeout: float = DEFAULT_TIMEOUT,
        session: Optional[aiohttp.ClientSession] = None,
        sample_rate: int = 24000,
        num_channels: int = 1,
    ):
        super().__init__(
            capabilities=tts.TTSCapabilities(
                streaming=False,
                aligned_transcript=False,
            ),
            sample_rate=sample_rate,
            num_channels=num_channels,
        )

        self._api_key = api_key or os.getenv("BAKBAK_API_KEY")
        if not self._api_key:
            raise ValueError("BakBak API Key required")

        # Handle voice resolution: check key, then UUID, then fallback
        if voice_id in SUPPORTED_VOICES:
            self._voice = SUPPORTED_VOICES[voice_id]
        elif voice_id in VOICE_ID_MAP:
            self._voice = VOICE_ID_MAP[voice_id]
        else:
            logger.warning(f"Unsupported voice_id: {voice_id}, falling back to 'ananya'")
            self._voice = SUPPORTED_VOICES.get("ananya")

        self._speed = speed
        self._model = model
        self._timeout = timeout
        self._session = session

    def synthesize(
        self,
        text: str,
        *,
        conn_options: APIConnectOptions = DEFAULT_API_CONNECT_OPTIONS,
    ) -> tts.ChunkedStream:
        return RayaStream(
            tts=self,
            input_text=text,
            conn_options=conn_options,
        )

    async def aclose(self) -> None:
        if self._session:
            await self._session.close()

# ============================================================
# STREAM HANDLER
# ============================================================

class RayaStream(tts.ChunkedStream):
    def __init__(self, *, tts: 'RayaTTS', input_text: str, conn_options: APIConnectOptions):
        super().__init__(
            tts=tts,
            input_text=input_text,
            conn_options=conn_options,
        )
        self._tts = tts

    async def _run(self, emitter: tts.AudioEmitter):
        request_id = utils.shortuuid()

        emitter.initialize(
            request_id=request_id,
            sample_rate=self._tts.sample_rate,
            num_channels=1,
            mime_type="audio/pcm",
        )

        text = self._prepare(self._input_text)
        if not text:
            emitter.flush()
            return

        # Use split_chunks for robust long-text handling
        chunks = split_chunks(text, 200)

        for chunk in chunks:
            await self._speak(chunk, emitter)

        emitter.flush()

    def _prepare(self, text: str) -> str:
        if not text:
            return ""

        # Remove backticks and extra whitespace
        text = re.sub(r"`.*?`", "", text)
        text = re.sub(r"\s+", " ", text)
        text = text.strip()

        if len(text) > MAX_TEXT_LENGTH:
            text = text[:MAX_TEXT_LENGTH]

        return text

    async def _speak(self, text: str, emitter: tts.AudioEmitter):
        text = preprocess_text(text)

        payload = {
            "text": text,
            "voice_id": self._tts._voice.voice_id,
            "model": self._tts._model,
            "language": self._tts._voice.language,
            "codec": "pcm",
            "sample_rate": self._tts.sample_rate,
            "speed": self._tts._speed,
        }

        headers = {
            "Content-Type": "application/json",
            "X-API-Key": self._tts._api_key,
        }

        session = self._tts._session
        owner = False

        if not session:
            session = aiohttp.ClientSession()
            owner = True

        try:
            async with session.post(
                BAKBAK_API_URL,
                json=payload,
                headers=headers,
                timeout=aiohttp.ClientTimeout(total=self._tts._timeout),
            ) as res:
                if res.status != 200:
                    err = await res.text()
                    logger.error(f"BakBak error {res.status}: {err}")
                    return

                audio = await res.read()
                if not audio:
                    return

                # Convert raw PCM data to chunks of frames
                # Ensure audio is even length for int16
                if len(audio) % 2 != 0:
                    audio = audio[:-1]
                samples = np.frombuffer(audio, dtype=np.int16)

                
                # 10ms frame size
                frame_size = int(self._tts.sample_rate * 0.01)

                for i in range(0, len(samples), frame_size):
                    frame = samples[i:i+frame_size]
                    if len(frame):
                        emitter.push(frame.tobytes())

        except Exception as e:
            logger.error(f"BakBak TTS failed: {e}")
        finally:
            if owner:
                await session.close()

# ============================================================
# CHUNKING UTILS
# ============================================================

END_REGEX = re.compile(r".*[.!?,;:।…]$")

def split_chunks(text: str, size=250):
    out = []
    while text:
        if len(text) <= size:
            out.append(text)
            break

        part = text[:size]
        idx = -1

        for i in range(len(part)-1, -1, -1):
            if END_REGEX.match(part[:i+1]):
                idx = i
                break

        if idx == -1:
            idx = part.rfind(" ")

        if idx == -1:
            idx = size-1

        out.append(text[:idx+1].strip())
        text = text[idx+1:].strip()

    return out
