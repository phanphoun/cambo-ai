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
        return await svc.ask(
            message, history=history, mode=mode,
            image_data=image_data, image_urls=image_urls,
            rag_context=rag_context, use_tools=use_tools,
        )

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
