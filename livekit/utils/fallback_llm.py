from __future__ import annotations

import logging
from typing import List, Optional, Any, AsyncIterable

from livekit.agents import (
    llm,
    APIConnectOptions,
    DEFAULT_API_CONNECT_OPTIONS,
    NotGivenOr,
    NOT_GIVEN,
)

logger = logging.getLogger(__name__)

class FallbackLLM(llm.LLM):
    """
    LLM that wraps multiple LLMs and falls back to the next one if the current one fails.
    """
    def __init__(self, llms: List[llm.LLM]):
        super().__init__()
        if not llms:
            raise ValueError("At least one LLM must be provided")
        self._llms = llms
        self._locked_index: int | None = None

    def chat(
        self,
        *,
        chat_ctx: llm.ChatContext,
        tools: list[llm.Tool] | None = None,
        conn_options: APIConnectOptions = DEFAULT_API_CONNECT_OPTIONS,
        parallel_tool_calls: NotGivenOr[bool] = NOT_GIVEN,
        tool_choice: NotGivenOr[llm.ToolChoice] = NOT_GIVEN,
        extra_kwargs: NotGivenOr[dict[str, Any]] = NOT_GIVEN,
    ) -> FallbackLLMStream:


        return FallbackLLMStream(
            self,
            self._llms,
            locked_index=self._locked_index,
            chat_ctx=chat_ctx,
            tools=tools or [],
            conn_options=conn_options,
            parallel_tool_calls=parallel_tool_calls,
            tool_choice=tool_choice,
            extra_kwargs=extra_kwargs,
        )

class FallbackLLMStream(llm.LLMStream):
    def __init__(
        self,
        llm: FallbackLLM,
        llms: List[llm.LLM],
        *,
        locked_index: int | None,
        chat_ctx: llm.ChatContext,
        tools: list[llm.Tool],
        conn_options: APIConnectOptions,
        parallel_tool_calls: NotGivenOr[bool],
        tool_choice: NotGivenOr[llm.ToolChoice],
        extra_kwargs: NotGivenOr[dict[str, Any]],
    ):

        super().__init__(llm, chat_ctx=chat_ctx, tools=tools, conn_options=conn_options)
        self._parent = llm
        self._llms = llms
        self._parallel_tool_calls = parallel_tool_calls
        self._tool_choice = tool_choice
        self._extra_kwargs = extra_kwargs
        self._current_index = locked_index if locked_index is not None else 0

    async def _run(self) -> None:
        while self._current_index < len(self._llms):
            try:
                llm_instance = self._llms[self._current_index]
                logger.info(f"FALLBACK_LLM | attempting chat with provider index {self._current_index}: {type(llm_instance).__name__}")
                
                stream = llm_instance.chat(
                    chat_ctx=self._chat_ctx,
                    tools=self._tools,
                    conn_options=self._conn_options,
                    parallel_tool_calls=self._parallel_tool_calls,
                    tool_choice=self._tool_choice,
                    extra_kwargs=self._extra_kwargs,
                )
                
                async for chunk in stream:
                    self._event_ch.send_nowait(chunk)
                
                return # Success, we are done
                
            except Exception as e:
                logger.error(f"FALLBACK_LLM_ERROR | provider index {self._current_index} failed: {str(e)}")
                self._current_index += 1
                
                # 🔒 LOCK FALLBACK FOR ENTIRE CALL session
                self._parent._locked_index = self._current_index

                if self._current_index >= len(self._llms):
                    logger.critical("FALLBACK_LLM_FATAL | all LLM providers failed")
                    raise e
                logger.warning(f"FALLBACK_LLM_TRIGGERED | switching to provider index {self._current_index}")

