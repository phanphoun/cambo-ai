"""Ollama Service (re-exported from modular providers layer)."""

from providers.ollama_provider import OllamaProvider

# Backward-compatible alias
OllamaService = OllamaProvider

__all__ = [
    "OllamaService",
    "OllamaProvider",
]
