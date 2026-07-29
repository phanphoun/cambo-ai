"""Ollama provider — calls Ollama (local or cloud) via its REST API."""
import json
import httpx
from typing import List, Optional, Generator

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

    def _build_messages(
        self, message: str, history: Optional[List[dict]] = None, mode: str = "chat"
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
        msgs.append({"role": "user", "content": message})
        return msgs

    async def ask(
        self, message: str, history: Optional[List[dict]] = None, mode: str = "chat"
    ) -> dict:
        msgs = self._build_messages(message, history, mode)
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
        }

    def ask_stream(
        self, message: str, history: Optional[List[dict]] = None, mode: str = "chat"
    ) -> Generator[str, None, None]:
        import httpx as sync_httpx

        msgs = self._build_messages(message, history, mode)
        headers = {}
        if self._api_key:
            headers["Authorization"] = f"Bearer {self._api_key}"

        with sync_httpx.Client(
            base_url=self._base_url, headers=headers, timeout=sync_httpx.Timeout(300.0, read=180.0)
        ) as sync_client:
            with sync_client.stream(
                "POST",
                "/api/chat",
                json={
                    "model": self._default_model,
                    "messages": msgs,
                    "stream": True,
                },
            ) as resp:
                for line in resp.iter_lines():
                    if not line.strip():
                        continue
                    try:
                        chunk = json.loads(line)
                        content = chunk.get("message", {}).get("content", "")
                        if content:
                            yield content
                    except json.JSONDecodeError:
                        continue
