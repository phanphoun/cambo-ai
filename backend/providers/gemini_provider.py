"""Google Gemini Provider Implementation."""

import asyncio
import base64
import logging
from typing import List, Optional, AsyncGenerator, Dict, Any

from google import genai
from google.genai import types

from config import settings
from providers.base import BaseProvider
from prompts.builder import prompt_builder
from services.tool_runner import run_with_tools

logger = logging.getLogger("cambo.providers.gemini")

# Some models (esp. preview/high-demand ones) can hang indefinitely instead of
# erroring out. Bound every per-model attempt so a stuck model fails over to
# the next candidate rather than blocking the request forever.
MODEL_TIMEOUT_SECONDS = 20.0


async def _iter_with_timeout(stream, timeout: float):
    """Wrap an async iterator so a stalled upstream stream raises TimeoutError
    instead of hanging forever, per item."""
    it = stream.__aiter__()
    while True:
        try:
            chunk = await asyncio.wait_for(it.__anext__(), timeout=timeout)
        except StopAsyncIteration:
            return
        yield chunk


def _image_part_from_data(data_url: str) -> "types.Part":
    if "," in data_url:
        header, _, b64 = data_url.partition(",")
        mime = "image/png"
        if header.startswith("data:"):
            mime = header.split(";")[0].replace("data:", "")
        return types.Part.from_bytes(data=base64.b64decode(b64), mime_type=mime)
    return types.Part.from_bytes(data=base64.b64decode(data_url), mime_type="image/png")


class GeminiProvider(BaseProvider):
    def __init__(self, api_key: Optional[str] = None, model: Optional[str] = None):
        self._api_key = api_key or settings.gemini_api_key
        self._model = model or getattr(settings, "gemini_model", "gemini-3.6-flash") or "gemini-3.6-flash"

    @property
    def name(self) -> str:
        return "gemini"

    @property
    def default_model(self) -> str:
        return self._model

    def _get_client(self) -> genai.Client:
        return genai.Client(api_key=self._api_key)

    async def ask(
        self,
        message: str,
        history: Optional[List[Dict[str, Any]]] = None,
        mode: str = "chat",
        image_data: Optional[List[str]] = None,
        image_urls: Optional[List[str]] = None,
        rag_context: Optional[str] = None,
        use_tools: bool = False,
        response_language: Optional[str] = "km",
    ) -> Dict[str, Any]:
        client = self._get_client()
        system_instruction = prompt_builder.get_system_prompt(
            mode=mode, rag_context=rag_context, response_language=response_language
        )

        contents: List[Any] = []
        if history:
            for turn in history[-10:]:
                role = turn.get("role", "user")
                text = turn.get("content", "")
                contents.append(types.Content(role=role, parts=[types.Part.from_text(text=text)]))

        wrapped_msg = prompt_builder.wrap_user_message(message, response_language=response_language)
        current_parts: List[Any] = [types.Part.from_text(text=wrapped_msg)]
        if image_data:
            for d in image_data:
                try:
                    current_parts.append(_image_part_from_data(d))
                except Exception as e:
                    logger.warning("Could not decode image_data: %s", e)

        contents.append(types.Content(role="user", parts=current_parts))

        if use_tools:
            return await run_with_tools(
                client=client,
                model=self._model,
                system_instruction=system_instruction,
                contents=contents,
            )

        # Non-tool query
        config = types.GenerateContentConfig(
            system_instruction=system_instruction,
            temperature=settings.gemini_temperature,
            max_output_tokens=settings.gemini_max_tokens,
        )

        models_to_try = [self._model, "gemini-3.5-flash-lite", "gemini-3.1-flash-lite", "gemma-4-31b-it", "gemini-3.5-flash", "gemini-3.6-flash", "gemini-3.7-flash"]
        unique_models = list(dict.fromkeys(models_to_try))

        last_err = None
        for m in unique_models:
            try:
                resp = await asyncio.wait_for(
                    client.aio.models.generate_content(
                        model=m,
                        contents=contents,
                        config=config,
                    ),
                    timeout=MODEL_TIMEOUT_SECONDS,
                )

                tokens = None
                if resp.usage_metadata and resp.usage_metadata.total_token_count:
                    tokens = resp.usage_metadata.total_token_count

                return {
                    "answer": resp.text or "",
                    "model": m,
                    "tokens_used": tokens,
                    "tool_calls": [],
                    "citations": [],
                }
            except asyncio.TimeoutError as e:
                last_err = e
                logger.warning("Model %s timed out after %ss, falling back", m, MODEL_TIMEOUT_SECONDS)
                continue
            except Exception as e:
                last_err = e
                err_str = str(e).lower()
                if any(k in err_str for k in ["503", "429", "404", "resource_exhausted", "quota", "unavailable", "high demand", "overloaded", "servererror"]):
                    logger.warning("Model %s hit error/high-demand, falling back: %s", m, e)
                    continue
                raise e
        raise last_err

    async def ask_stream(
        self,
        message: str,
        history: Optional[List[Dict[str, Any]]] = None,
        mode: str = "chat",
        image_data: Optional[List[str]] = None,
        image_urls: Optional[List[str]] = None,
        rag_context: Optional[str] = None,
        response_language: Optional[str] = "km",
    ) -> AsyncGenerator[str, None]:
        client = self._get_client()
        system_instruction = prompt_builder.get_system_prompt(
            mode=mode, rag_context=rag_context, response_language=response_language
        )

        contents: List[Any] = []
        if history:
            for turn in history[-10:]:
                role = turn.get("role", "user")
                text = turn.get("content", "")
                contents.append(types.Content(role=role, parts=[types.Part.from_text(text=text)]))

        wrapped_msg = prompt_builder.wrap_user_message(message, response_language=response_language)
        current_parts: List[Any] = [types.Part.from_text(text=wrapped_msg)]
        if image_data:
            for d in image_data:
                try:
                    current_parts.append(_image_part_from_data(d))
                except Exception as e:
                    logger.warning("Could not decode image_data: %s", e)

        contents.append(types.Content(role="user", parts=current_parts))

        config = types.GenerateContentConfig(
            system_instruction=system_instruction,
            temperature=settings.gemini_temperature,
            max_output_tokens=settings.gemini_max_tokens,
        )

        models_to_try = [self._model, "gemini-3.5-flash-lite", "gemini-3.1-flash-lite", "gemma-4-31b-it", "gemini-3.5-flash", "gemini-3.6-flash", "gemini-3.7-flash"]
        unique_models = list(dict.fromkeys(models_to_try))

        success = False
        last_err = None
        for m in unique_models:
            got_any_chunk = False
            try:
                response_stream = await asyncio.wait_for(
                    client.aio.models.generate_content_stream(
                        model=m,
                        contents=contents,
                        config=config,
                    ),
                    timeout=MODEL_TIMEOUT_SECONDS,
                )

                async for chunk in _iter_with_timeout(response_stream, MODEL_TIMEOUT_SECONDS):
                    if chunk.text:
                        got_any_chunk = True
                        yield chunk.text
                success = True
                break
            except asyncio.TimeoutError as e:
                last_err = e
                if got_any_chunk:
                    # Already streamed partial content to the client; treat as done
                    # rather than retrying (which would duplicate/confuse output).
                    success = True
                    break
                logger.warning("Stream model %s timed out after %ss with no output, falling back", m, MODEL_TIMEOUT_SECONDS)
                continue
            except Exception as e:
                last_err = e
                err_str = str(e).lower()
                if any(k in err_str for k in ["503", "429", "404", "resource_exhausted", "quota", "unavailable", "high demand", "overloaded", "servererror"]):
                    logger.warning("Stream model %s unavailable/overloaded, falling back: %s", m, e)
                    continue
                raise e

        if not success and last_err:
            raise last_err
