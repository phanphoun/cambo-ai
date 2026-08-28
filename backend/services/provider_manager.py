"""Routes AI requests to the configured provider (Gemini, Ollama local, or Ollama Cloud)."""
from typing import Optional, AsyncGenerator, List
from config import settings
from services.gemini_service import GeminiService
from services.ollama_service import OllamaService


class ProviderManager:
    def __init__(self):
        self._gemini = GeminiService()
        self._ollama_local = OllamaService(
            base_url=settings.ollama_base_url,
            default_model=settings.ollama_model,
        )
        self._ollama_cloud = OllamaService(
            base_url=settings.ollama_cloud_base_url,
            api_key=settings.ollama_api_key,
            default_model=settings.ollama_cloud_model,
        )

    def _resolve(self, provider: str):
        if provider == "ollama":
            return self._ollama_local
        if provider == "ollama-cloud":
            return self._ollama_cloud
        return self._gemini

    async def ask(
        self,
        message: str,
        history: Optional[list[dict]] = None,
        mode: str = "chat",
        provider: str = "gemini",
        image_data: Optional[List[str]] = None,
        image_urls: Optional[List[str]] = None,
        rag_context: Optional[str] = None,
        use_tools: bool = False,
    ) -> dict:
        svc = self._resolve(provider)
        effective_use_tools = use_tools or mode == "search" or self._is_phoun_query(message)
        if effective_use_tools and provider != "gemini":
            tool_result = await self._auto_search(message)
            grounded = (rag_context or "") + "\n\nWeb research results:\n" + tool_result
            return await svc.ask(
                message, history=history, mode=mode,
                image_data=image_data, image_urls=image_urls,
                rag_context=grounded, use_tools=False,
            )
        return await svc.ask(
            message, history=history, mode=mode,
            image_data=image_data, image_urls=image_urls,
            rag_context=rag_context, use_tools=effective_use_tools,
        )

    @staticmethod
    def _is_phoun_query(message: str) -> bool:
        m = message.lower()
        return any(
            token in m
            for token in [
                "mr.phoun",
                "mr phoun",
                "phoun",
                "developer",
                "developed by",
                "who built you",
                "who build you",
                "who created you",
                "who made you",
                "your developer",
                "your creator",
            ]
        )

    @staticmethod
    async def _auto_search(message: str) -> str:
        from services import tools as tool_registry
        try:
            return await tool_registry.run_tool("web_search", {"query": message, "max_results": 5})
        except Exception as e:
            return f"[research unavailable] {e}"

    async def ask_stream(
        self,
        message: str,
        history: Optional[list[dict]] = None,
        mode: str = "chat",
        provider: str = "gemini",
        image_data: Optional[List[str]] = None,
        image_urls: Optional[List[str]] = None,
        rag_context: Optional[str] = None,
    ) -> AsyncGenerator[str, None]:
        svc = self._resolve(provider)
        async for chunk in svc.ask_stream(
            message, history=history, mode=mode,
            image_data=image_data, image_urls=image_urls, rag_context=rag_context,
        ):
            yield chunk


provider_manager = ProviderManager()
