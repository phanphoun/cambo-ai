"""Prompt Builder & Assembler.

Assembles system instructions, persona constraints, RAG context, and historical
turn data into standardized model prompts.
"""

from typing import Optional, List, Dict, Any
from prompts.mode_prompts import MODE_PROMPTS, RAG_INSTRUCTION


class PromptBuilder:
    @staticmethod
    def get_system_prompt(mode: str = "chat", rag_context: Optional[str] = None) -> str:
        """Retrieves and composes the final system instruction for a given mode and RAG state."""
        base_prompt = MODE_PROMPTS.get(mode, MODE_PROMPTS["chat"])
        if rag_context:
            return base_prompt + RAG_INSTRUCTION + f"\n\n--- DOCUMENT CONTEXT ---\n{rag_context}\n--- END CONTEXT ---"
        return base_prompt

    @staticmethod
    def format_history_parts(history: Optional[List[Dict[str, Any]]]) -> List[Dict[str, Any]]:
        """Formats conversational turns into normalized role/content structures."""
        parts = []
        if history:
            for turn in history[-10:]:
                role = turn.get("role", "user")
                content = turn.get("content", "")
                parts.append({"role": role, "parts": [content]})
        return parts


prompt_builder = PromptBuilder()
