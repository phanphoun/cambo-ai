"""Ollama provider — calls Ollama (local or cloud) via its REST API.

Supports multimodal input for vision-capable models via the `images`
(base64 PNG, no mime prefix) field that Ollama's /api/chat accepts.
Tool-calling and Gemini-specific features are not supported here; the
provider_manager routes those to Gemini.
"""
import base64
import json
import httpx
from typing import List, Optional, AsyncGenerator


OLLAMA_SYSTEM_PROMPTS = {
    "chat": "You are CAMBO AI, a helpful assistant focused on Cambodia's technology ecosystem. Answer concisely and accurately.",
    "translate": "You are a translator between English and Khmer (ភាសាខ្មែរ). Detect the source language and translate accurately. Keep responses to just the translation unless asked for explanation.",
    "search": "Answer concisely and factually. 1-3 sentences when possible. If you don't know, say so. Prioritize accuracy.",
    "code": "You are a technical coding assistant. Provide working code with brief explanations. Follow language best practices.",
}


class OllamaService:
    def __init__(self, base_url: str, api_key: str = "", default_model: str = "llama3.2"):
        self._base_url = base_url
        self._api_key = api_key
        self._default_model = default_model
        self._client: httpx.AsyncClient | None = None

    @property
    def client(self) -> httpx.AsyncClient:
        if self._client is None:
            headers = {}
            if self._api_key:
                headers["Authorization"] = f"Bearer {self._api_key}"
            self._client = httpx.AsyncClient(
                base_url=self._base_url,
                headers=headers,
                timeout=httpx.Timeout(300.0, connect=15.0, read=180.0, write=30.0, pool=30.0),
            )
        return self._client

    @staticmethod
    def _images_from_data(image_data: Optional[List[str]]) -> List[str]:
        out: List[str] = []
        for d in (image_data or []):
            header, _, b64 = d.partition(",")
            if b64:
                out.append(b64)
        return out

    def _build_messages(
        self,
        message: str,
        history: Optional[List[dict]] = None,
        mode: str = "chat",
        image_data: Optional[List[str]] = None,
    ) -> list:
        system = {
            "role": "system",
            "content": OLLAMA_SYSTEM_PROMPTS.get(mode, OLLAMA_SYSTEM_PROMPTS["chat"]),
        }
        msgs = [system]
        if history:
            for turn in history[-10:]:
                msgs.append(
                    {"role": turn.get("role", "user"), "content": turn.get("content", "")}
                )
        user_msg: dict = {"role": "user", "content": message}
        imgs = self._images_from_data(image_data)
        if imgs:
            user_msg["images"] = imgs
        msgs.append(user_msg)
        return msgs

    async def ask(
        self,
        message: str,
        history: Optional[List[dict]] = None,
        mode: str = "chat",
        image_data: Optional[List[str]] = None,
        image_urls: Optional[List[str]] = None,
        rag_context: Optional[str] = None,
        use_tools: bool = False,
    ) -> dict:
        prompt = message
        if rag_context:
            prompt = f"{rag_context}\n\nUser question: {message}"
        msgs = self._build_messages(prompt, history, mode, image_data=image_data)
        resp = await self.client.post(
            "/api/chat",
            json={
                "model": self._default_model,
                "messages": msgs,
                "stream": False,
            },
        )
        resp.raise_for_status()
        data = resp.json()
        return {
            "answer": data.get("message", {}).get("content", ""),
            "model": data.get("model", self._default_model),
            "tokens_used": None,
            "tool_calls": [],
            "citations": [],
        }

    async def ask_stream(
        self,
        message: str,
        history: Optional[List[dict]] = None,
        mode: str = "chat",
        image_data: Optional[List[str]] = None,
        image_urls: Optional[List[str]] = None,
        rag_context: Optional[str] = None,
    ) -> AsyncGenerator[str, None]:
        prompt = message
        if rag_context:
            prompt = f"{rag_context}\n\nUser question: {message}"
        msgs = self._build_messages(prompt, history, mode, image_data=image_data)
        headers = {}
        if self._api_key:
            headers["Authorization"] = f"Bearer {self._api_key}"

        async with httpx.AsyncClient(
            base_url=self._base_url, headers=headers, timeout=httpx.Timeout(300.0, read=180.0)
        ) as async_client:
            async with async_client.stream(
                "POST",
                "/api/chat",
                json={
                    "model": self._default_model,
                    "messages": msgs,
                    "stream": True,
                },
            ) as resp:
                async for line in resp.aiter_lines():
                    if not line.strip():
                        continue
                    try:
                        chunk = json.loads(line)
                        content = chunk.get("message", {}).get("content", "")
                        if content:
                            yield content
                    except json.JSONDecodeError:
                        continue
