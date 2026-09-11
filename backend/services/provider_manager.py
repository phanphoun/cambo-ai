"""Provider Manager & Chat Gateway.

Provides a unified interface to the provider factory and chat orchestration service.
Maintains full backward compatibility.
"""

from typing import Optional, AsyncGenerator, List, Dict, Any

from providers.factory import provider_factory
from services.chat_service import chat_service


class ProviderManager:
    """Facade for provider management and chat execution."""
    
    def __init__(self):
        self.factory = provider_factory
        self.chat = chat_service

    def _resolve(self, provider: str):
        return self.factory.get(provider)

    async def ask(
        self,
        message: str,
        history: Optional[list[dict]] = None,
        mode: str = "chat",
        provider: str = "gemini",
        model: Optional[str] = None,
        image_data: Optional[List[str]] = None,
        image_urls: Optional[List[str]] = None,
        rag_context: Optional[str] = None,
        use_tools: bool = False,
        response_language: Optional[str] = "km",
    ) -> dict:
        prov = self.factory.get(provider, model=model)
        return await prov.ask(
            message=message,
            history=history,
            mode=mode,
            image_data=image_data,
            image_urls=image_urls,
            rag_context=rag_context,
            use_tools=use_tools,
            response_language=response_language,
        )

    async def ask_stream(
        self,
        message: str,
        history: Optional[list[dict]] = None,
        mode: str = "chat",
        provider: str = "gemini",
        model: Optional[str] = None,
        image_data: Optional[List[str]] = None,
        image_urls: Optional[List[str]] = None,
        rag_context: Optional[str] = None,
        document_ids: Optional[List[str]] = None,
        use_tools: bool = False,
        response_language: Optional[str] = "km",
    ) -> AsyncGenerator[str, None]:
        async for chunk in self.chat.execute_stream(
            message=message,
            history=history,
            mode=mode,
            provider=provider,
            model=model,
            image_data=image_data,
            image_urls=image_urls,
            document_ids=document_ids,
            rag_context=rag_context,
            use_tools=use_tools,
            response_language=response_language,
        ):
            yield chunk


provider_manager = ProviderManager()
