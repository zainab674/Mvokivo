from __future__ import annotations

import logging
from typing import List, Optional
from livekit.agents import tts

logger = logging.getLogger(__name__)

class StickyFallbackTTS(tts.TTS):
    def __init__(self, providers: List[tts.TTS]):
        if not providers:
            raise ValueError("StickyFallbackTTS requires at least one provider")
            
        super().__init__(
            streaming_supported=all(p.streaming_supported for p in providers),
            sample_rate=providers[0].sample_rate,
            num_channels=providers[0].num_channels,
        )
        self._providers = providers
        self._locked_index: int | None = None

    def synthesize(self, text: str, **kwargs) -> tts.ChunkedStream:
        start_index = self._locked_index if self._locked_index is not None else 0

        for i in range(start_index, len(self._providers)):
            try:
                logger.info(
                    f"TTS_STICKY | attempting synthesis with provider index {i}: {type(self._providers[i]).__name__}"
                )

                # Attempt to get the stream from the provider
                stream = self._providers[i].synthesize(text, **kwargs)

                # If it succeeds, we stick to this provider for future turns
                if self._locked_index is None:
                    self._locked_index = i
                    logger.info(f"TTS_STICKY | locked to provider index {i}")

                return stream

            except Exception as e:
                logger.error(
                    f"TTS_STICKY_FAIL | provider index {i} failed: {e}"
                )
                # On failure, we move to the next one
                self._locked_index = i + 1

        raise RuntimeError("All TTS providers failed")
