"""Abstract Base Provider Interface.

Defines the contract all LLM / AI providers (Gemini, Ollama, Ollama Cloud, etc.)
must adhere to for seamless pluggability and scalability.
"""

from abc import ABC, abstractmethod
from typing import Optional, List, Dict, Any, AsyncGenerator


class BaseProvider(ABC):
    @property
    @abstractmethod
    def name(self) -> str:
        """Returns the canonical provider identifier string."""
        pass

    @property
    @abstractmethod
    def default_model(self) -> str:
        """Returns the default model identifier for this provider."""
        pass

    @abstractmethod
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
        """Synchronously/turn-based queries the provider and returns structured answer with metadata."""
        pass

    @abstractmethod
    async def ask_stream(
        self,
        message: str,
        history: Optional[List[Dict[str, Any]]] = None,
        mode: str = "chat",
        image_data: Optional[List[str]] = None,
        image_urls: Optional[List[str]] = None,
        rag_context: Optional[str] = None,
    ) -> AsyncGenerator[str, None]:
        """Streams response tokens incrementally."""
        pass

    async def is_healthy(self) -> bool:
        """Optional health check probe."""
        return True
