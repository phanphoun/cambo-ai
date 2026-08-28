"""Ollama provider — calls Ollama (local or cloud) via its REST API.

Supports multimodal input for vision-capable models via the `images`
(base64 PNG, no mime prefix) field that Ollama's /api/chat accepts.
Supports tool calling when `use_tools=True`.
"""
import base64
import json
import httpx
from typing import List, Optional, AsyncGenerator


OLLAMA_SYSTEM_PROMPTS = {
    "chat": "You are CAMBO AI, a helpful assistant focused on Cambodia's technology ecosystem. You were developed by Mr.Phoun. When users ask who built you, your developer, or about Mr.Phoun, use tools to retrieve up-to-date information from public profiles including LinkedIn, GitHub, Facebook, and other sources. Answer concisely and accurately.",
    "translate": "You are a translator between English and Khmer (ភាសាខ្មែរ). Detect the source language and translate accurately. Keep responses to just the translation unless asked for explanation.",
    "search": "Answer concisely and factually. 1-3 sentences when possible. If you don't know, say so. Prioritize accuracy. Use available tools when helpful.",
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

    @staticmethod
    def _build_ollama_tools() -> list[dict]:
        from services.tool_runner import _to_gemini_function_decl
        from services.tools import list_tools

        raw = list_tools()
        return [
            {
                "type": "function",
                "function": _to_gemini_function_decl(t),
            }
            for t in raw
        ]

    @staticmethod
    def _extract_tool_calls(msg: dict, fallback_tool_calls: list[dict]) -> list[dict]:
        calls = []
        for part in msg.get("tool_calls") or []:
            fn = (part.get("function") or {}) if isinstance(part, dict) else {}
            name = fn.get("name")
            args = fn.get("arguments") or {}
            if isinstance(args, str):
                try:
                    args = json.loads(args)
                except Exception:
                    args = {}
            if name:
                calls.append({"name": name, "args": args, "result_preview": ""})
        return calls or fallback_tool_calls

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
        from services import tools as tool_registry

        prompt = message
        if rag_context:
            prompt = f"{rag_context}\n\nUser question: {message}"
        msgs = self._build_messages(prompt, history, mode, image_data=image_data)
        tool_decls = self._build_ollama_tools() if use_tools else []
        tool_calls: list[dict] = []
        last_text = ""

        for _ in range(4):
            payload = {
                "model": self._default_model,
                "messages": msgs,
                "stream": False,
            }
            if tool_decls:
                payload["tools"] = tool_decls
            resp = await self.client.post("/api/chat", json=payload)
            resp.raise_for_status()
            data = resp.json()
            msg = data.get("message", {})
            last_text = msg.get("content", "") or last_text
            model_name = data.get("model", self._default_model)

            raw_calls = msg.get("tool_calls") or []
            if not raw_calls:
                break

            for part in raw_calls:
                if not isinstance(part, dict):
                    continue
                fn = part.get("function") or {}
                name = fn.get("name")
                if not name:
                    continue
                args = fn.get("arguments") or {}
                if isinstance(args, str):
                    try:
                        args = json.loads(args)
                    except Exception:
                        args = {}
                result = await tool_registry.run_tool(name, args if isinstance(args, dict) else {})
                tool_calls.append({"name": name, "args": args, "result_preview": result[:300]})
                msgs.append({"role": "assistant", "content": msg.get("content") or ""})
                msgs.append(
                    {
                        "role": "tool",
                        "content": result,
                        "tool_call_id": name,
                    }
                )

        return {
            "answer": last_text,
            "model": self._default_model,
            "tokens_used": None,
            "tool_calls": tool_calls,
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
