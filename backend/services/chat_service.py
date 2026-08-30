"""Sastra AI Core Chat Orchestration Service.

Orchestrates multi-modal reasoning, intent classification, RAG retrieval grounding,
provider execution, tool dispatching, and streaming responses.
"""

import re
import logging
from typing import Optional, List, Dict, Any, AsyncGenerator

from config import settings
from providers.factory import provider_factory
from services.rag_store import rag_store
from services.rag_context import build_context
from services.doc_generator import doc_generator
from services.image_service import image_service

logger = logging.getLogger("cambo.services.chat")


class ChatService:
    def __init__(self):
        self.providers = provider_factory

    @staticmethod
    def is_image_query(message: str, image_data: Optional[List[str]] = None) -> bool:
        """Determines if the turn is an image generation or image editing request."""
        m = message.lower().strip()
        image_patterns = [
            r"\b(generate|create|make|draw|paint|render|edit|modify|transform|produce)\b.*\b(image|picture|photo|illustration|drawing|artwork|portrait|wallpaper)\b",
            r"\b(image|picture|photo|illustration|drawing|artwork|portrait)\b.*\b(generation|generator|editor|editing|of|about)\b",
            r"(បង្កើត|គូរ|កែ|កែប្រែ|ធ្វើ|រចនា|ថត).*(រូប|រូបភាព|រូបថត|ផ្ទាំងគំនូរ|គំនូរ)",
            r"(ចង់បាន|សូម).*(រូប|រូបភាព|រូបថត)",
        ]
        if any(re.search(p, m) for p in image_patterns):
            return True
        if image_data and any(w in m for w in ["edit", "change", "modify", "transform", "កែ", "ប្តូរ", "បន្ថែម", "ស្លៀក", "ដាក់"]):
            return True
        return False

    @staticmethod
    def is_doc_query(message: str) -> bool:
        """Determines if the query requests formal document synthesis."""
        m = message.lower()
        patterns = [
            r"\b(generate|create|make|export|download|write)\b.*\b(document|doc|pdf|docx|word doc|spreadsheet|csv|file)\b",
            r"\b(document|doc|pdf|docx|word doc|spreadsheet|csv)\b.*\b(generation|download|export)\b",
            r"(បង្កើត|ទាញយក|ធ្វើ|សរសេរ).*(ឯកសារ|សេចក្តីរាយការណ៍|របាយការណ៍|pdf|docx|word)",
        ]
        return any(re.search(p, m) for p in patterns)

    @staticmethod
    def is_creator_query(message: str) -> bool:
        """Identifies queries asking about creator / developer."""
        m = message.lower()
        tokens = [
            "mr.phoun", "mr phoun", "phoun", "developer", "developed by",
            "who built you", "who build you", "who created you", "who made you",
            "your developer", "your creator"
        ]
        return any(t in m for t in tokens)

    def retrieve_rag_context(self, document_ids: List[str], query: str) -> Dict[str, Any]:
        """Retrieves and packages RAG knowledge context."""
        if not document_ids:
            return {"context": "", "citations": []}
        try:
            hits = rag_store.search(document_ids, query)
            return build_context(hits)
        except Exception as e:
            logger.warning("RAG retrieval error: %s", e)
            return {"context": "", "citations": []}

    async def execute_turn(
        self,
        message: str,
        history: Optional[List[Dict[str, Any]]] = None,
        mode: str = "chat",
        provider: str = "gemini",
        model: Optional[str] = None,
        image_data: Optional[List[str]] = None,
        image_urls: Optional[List[str]] = None,
        document_ids: Optional[List[str]] = None,
        use_tools: bool = False,
    ) -> Dict[str, Any]:
        """Processes a single conversational turn."""
        # 1. Image Generation Intent
        if self.is_image_query(message, image_data) or mode == "image":
            ref_image = image_data[0] if (image_data and len(image_data) > 0) else None
            res = await image_service.generate_image(prompt=message, reference_image_data=ref_image)
            return {
                "answer": res.get("markdown", ""),
                "model": "flux-sastra-v1",
                "tokens_used": 0,
                "tool_calls": [],
                "citations": [],
            }

        # 2. RAG Context Retrieval
        rag_data = self.retrieve_rag_context(document_ids or [], message)
        rag_context = rag_data.get("context")

        # 3. Tool Calling & Document Intent
        is_doc = self.is_doc_query(message)
        effective_tools = use_tools or mode == "search" or is_doc or self.is_creator_query(message)

        prov = self.providers.get(provider, model=model)
        res = await prov.ask(
            message=message,
            history=history,
            mode=mode,
            image_data=image_data,
            image_urls=image_urls,
            rag_context=rag_context,
            use_tools=effective_tools,
        )

        # 4. Attach Citations & Document Cards if applicable
        res["citations"] = rag_data.get("citations", [])
        if is_doc and "[DOCUMENT_GENERATED]" not in res.get("answer", ""):
            res["answer"] = self._append_auto_doc(message, res.get("answer", ""))

        return res

    async def execute_stream(
        self,
        message: str,
        history: Optional[List[Dict[str, Any]]] = None,
        mode: str = "chat",
        provider: str = "gemini",
        model: Optional[str] = None,
        image_data: Optional[List[str]] = None,
        image_urls: Optional[List[str]] = None,
        document_ids: Optional[List[str]] = None,
        rag_context: Optional[str] = None,
        use_tools: bool = False,
    ) -> AsyncGenerator[str, None]:
        """Streams turn chunks incrementally."""
        # 1. Image Generation Intent
        if self.is_image_query(message, image_data) or mode == "image":
            ref_image = image_data[0] if (image_data and len(image_data) > 0) else None
            action_name = "កែប្រែរូបភាព (Editing Reference Image)" if ref_image else "បង្កើតរូបភាព (Generating Khmer Cultural Image)"
            yield f"🎨 *កំពុងដំណើរការ{action_name} តាមការបញ្ជា...*\n\n"

            res = await image_service.generate_image(prompt=message, reference_image_data=ref_image)
            yield res.get("markdown", "")
            return

        # 2. RAG Context Retrieval
        effective_rag = rag_context
        if not effective_rag and document_ids:
            rag_data = self.retrieve_rag_context(document_ids, message)
            effective_rag = rag_data.get("context")

        # 3. Document or Search Intent
        if self.is_doc_query(message) or mode == "search":
            turn_res = await self.execute_turn(
                message=message,
                history=history,
                mode=mode,
                provider=provider,
                model=model,
                image_data=image_data,
                image_urls=image_urls,
                document_ids=document_ids,
                use_tools=True,
            )
            yield turn_res.get("answer", "")
            return

        # 4. Standard Provider Streaming
        prov = self.providers.get(provider, model=model)
        async for chunk in prov.ask_stream(
            message=message,
            history=history,
            mode=mode,
            image_data=image_data,
            image_urls=image_urls,
            rag_context=effective_rag,
        ):
            yield chunk

    def _append_auto_doc(self, query: str, answer_text: str) -> str:
        """Helper to generate and append structured document download card."""
        title_match = re.search(r"^[#\s]*(.+)$", answer_text.strip(), re.MULTILINE)
        title = title_match.group(1).strip("#* ") if title_match else "Sastra_AI_Publication"
        title = title[:60]

        q_lower = query.lower()
        fmt = "docx" if ("word" in q_lower or "docx" in q_lower) else ("csv" if ("csv" in q_lower or "spreadsheet" in q_lower) else "pdf")

        if fmt == "docx":
            meta = doc_generator.generate_docx(title=title, content=answer_text)
        elif fmt == "csv":
            meta = doc_generator.generate_csv(title=title, content=answer_text)
        else:
            meta = doc_generator.generate_pdf(title=title, content=answer_text, subtitle="Generated by Sastra AI Sovereign Assistant")

        doc_block = (
            f"\n\n[DOCUMENT_GENERATED]\n"
            f"Title: {meta['title']}\n"
            f"Format: {meta['format'].upper()}\n"
            f"Filename: {meta['filename']}\n"
            f"Size: {meta['size_formatted']}\n"
            f"Download URL: {meta['download_url']}\n"
            f"Document ID: {meta['id']}\n"
            f"[/DOCUMENT_GENERATED]\n"
        )
        return answer_text + doc_block


chat_service = ChatService()
