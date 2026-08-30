"""Google Gemini Provider Implementation."""

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
    ) -> Dict[str, Any]:
        client = self._get_client()
        system_instruction = prompt_builder.get_system_prompt(mode=mode, rag_context=rag_context)

        if use_tools:
            return await run_with_tools(
                client=client,
                model=self._model,
                user_message=message,
                system_instruction=system_instruction,
                history=history,
            )

        # Non-tool query
        contents: List[Any] = []
        if history:
            for turn in history[-10:]:
                role = turn.get("role", "user")
                text = turn.get("content", "")
                contents.append(types.Content(role=role, parts=[types.Part.from_text(text=text)]))

        current_parts: List[Any] = [types.Part.from_text(text=message)]
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

        models_to_try = [self._model, "gemini-3.5-flash", "gemini-3.5-flash-lite", "gemini-3.1-flash-lite", "gemma-4-31b-it"]
        unique_models = list(dict.fromkeys(models_to_try))

        last_err = None
        for m in unique_models:
            try:
                resp = await client.aio.models.generate_content(
                    model=m,
                    contents=contents,
                    config=config,
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
            except Exception as e:
                last_err = e
                if "429" in str(e) or "RESOURCE_EXHAUSTED" in str(e) or "quota" in str(e).lower() or "404" in str(e):
                    logger.warning("Model %s hit rate limit/unavailable, falling back: %s", m, e)
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
    ) -> AsyncGenerator[str, None]:
        client = self._get_client()
        system_instruction = prompt_builder.get_system_prompt(mode=mode, rag_context=rag_context)

        contents: List[Any] = []
        if history:
            for turn in history[-10:]:
                role = turn.get("role", "user")
                text = turn.get("content", "")
                contents.append(types.Content(role=role, parts=[types.Part.from_text(text=text)]))

        current_parts: List[Any] = [types.Part.from_text(text=message)]
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

        models_to_try = [self._model, "gemini-3.5-flash", "gemini-3.5-flash-lite", "gemini-3.1-flash-lite", "gemma-4-31b-it"]
        unique_models = list(dict.fromkeys(models_to_try))

        success = False
        last_err = None
        for m in unique_models:
            try:
                response_stream = await client.aio.models.generate_content_stream(
                    model=m,
                    contents=contents,
                    config=config,
                )

                async for chunk in response_stream:
                    if chunk.text:
                        yield chunk.text
                success = True
                break
            except Exception as e:
                last_err = e
                if "429" in str(e) or "RESOURCE_EXHAUSTED" in str(e) or "quota" in str(e).lower() or "404" in str(e):
                    logger.warning("Stream model %s unavailable, falling back: %s", m, e)
                    continue
                raise e

        if not success and last_err:
            raise last_err
