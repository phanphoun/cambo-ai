"""Ollama (Local & Cloud) Provider Implementation."""

import json
import logging
import httpx
from typing import List, Optional, AsyncGenerator, Dict, Any

from config import settings
from providers.base import BaseProvider
from prompts.builder import prompt_builder

logger = logging.getLogger("cambo.providers.ollama")


class OllamaProvider(BaseProvider):
    def __init__(
        self,
        base_url: Optional[str] = None,
        default_model: Optional[str] = None,
        api_key: Optional[str] = None,
        provider_name: str = "ollama",
    ):
        self._base_url = (base_url or settings.ollama_base_url).rstrip("/")
        self._default_model = default_model or settings.ollama_model
        self._api_key = api_key
        self._name = provider_name

    @property
    def name(self) -> str:
        return self._name

    @property
    def default_model(self) -> str:
        return self._default_model

    def _headers(self) -> Dict[str, str]:
        h = {"Content-Type": "application/json"}
        if self._api_key:
            h["Authorization"] = f"Bearer {self._api_key}"
        return h

    def _build_messages(
        self,
        message: str,
        history: Optional[List[Dict[str, Any]]] = None,
        mode: str = "chat",
        image_data: Optional[List[str]] = None,
        rag_context: Optional[str] = None,
        response_language: Optional[str] = "km",
    ) -> List[Dict[str, Any]]:
        system_instruction = prompt_builder.get_system_prompt(
            mode=mode, rag_context=rag_context, response_language=response_language
        )
        msgs = [{"role": "system", "content": system_instruction}]

        if history:
            for turn in history[-10:]:
                msgs.append({"role": turn.get("role", "user"), "content": turn.get("content", "")})

        wrapped_msg = prompt_builder.wrap_user_message(message, response_language=response_language)
        user_msg: Dict[str, Any] = {"role": "user", "content": wrapped_msg}
        if image_data:
            clean_b64: List[str] = []
            for d in image_data:
                b64 = d.partition(",")[2] if "," in d else d
                clean_b64.append(b64)
            user_msg["images"] = clean_b64

        msgs.append(user_msg)
        return msgs

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
        msgs = self._build_messages(
            message, history, mode, image_data, rag_context, response_language=response_language
        )
        payload = {
            "model": self._default_model,
            "messages": msgs,
            "stream": False,
            "options": {
                "temperature": settings.gemini_temperature,
                "num_predict": settings.gemini_max_tokens,
            },
        }

        async with httpx.AsyncClient(timeout=120.0) as client:
            resp = await client.post(
                f"{self._base_url}/api/chat",
                json=payload,
                headers=self._headers(),
            )
            if resp.status_code != 200:
                resp.raise_for_status()
            data = resp.json()

        answer = data.get("message", {}).get("content", "")
        tokens = data.get("eval_count")

        return {
            "answer": answer,
            "model": self._default_model,
            "tokens_used": tokens,
            "tool_calls": [],
            "citations": [],
        }

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
        msgs = self._build_messages(
            message, history, mode, image_data, rag_context, response_language=response_language
        )
        payload = {
            "model": self._default_model,
            "messages": msgs,
            "stream": True,
            "options": {
                "temperature": settings.gemini_temperature,
                "num_predict": settings.gemini_max_tokens,
            },
        }

        async with httpx.AsyncClient(timeout=120.0) as client:
            async with client.stream(
                "POST",
                f"{self._base_url}/api/chat",
                json=payload,
                headers=self._headers(),
            ) as stream:
                if stream.status_code != 200:
                    body = await stream.aread()
                    raise RuntimeError(f"Ollama stream error ({stream.status_code}): {body.decode('utf-8', errors='ignore')}")

                async for line in stream.aiter_lines():
                    if not line:
                        continue
                    try:
                        chunk = json.loads(line)
                        text = chunk.get("message", {}).get("content", "")
                        if text:
                            yield text
                    except Exception:
                        continue
