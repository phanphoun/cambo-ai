"""Gemini Service (re-exported from modular providers layer)."""

from providers.gemini_provider import GeminiProvider, _image_part_from_data
from prompts.mode_prompts import MODE_PROMPTS as SYSTEM_PROMPTS, RAG_INSTRUCTION
from prompts.builder import prompt_builder

# Backward-compatible alias
GeminiService = GeminiProvider

__all__ = [
    "GeminiService",
    "GeminiProvider",
    "SYSTEM_PROMPTS",
    "RAG_INSTRUCTION",
    "prompt_builder",
    "_image_part_from_data",
]
