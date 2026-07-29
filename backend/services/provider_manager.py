"""Routes AI requests to the configured provider (Gemini, Ollama local, or Ollama Cloud)."""
from typing import Optional, Generator
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
    ) -> dict:
        svc = self._resolve(provider)
        return await svc.ask(message, history=history, mode=mode)

    def ask_stream(
        self,
        message: str,
        history: Optional[list[dict]] = None,
        mode: str = "chat",
        provider: str = "gemini",
    ) -> Generator[str, None, None]:
        svc = self._resolve(provider)
        return svc.ask_stream(message, history=history, mode=mode)


provider_manager = ProviderManager()
