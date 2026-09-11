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

    @staticmethod
    def is_calendar_query(message: str) -> bool:
        """Determines if the query asks about current date, time, day, or Khmer calendar."""
        m = message.lower().strip()
        patterns = [
            r"\b(today|date|time|day|calendar|month|year|clock|hour|now)\b",
            r"\b(khmer calendar|chhankitek|lunar date|buddhist era|zodiac)\b",
            r"(ថ្ងៃនេះ|ថ្ងៃស្អែក|ម្សិលមិញ|កាលបរិច្ឆេទ|ថ្ងៃខែ|ម៉ោង|ពេល|ថ្ងៃអ្វី|ថ្ងៃទី|ខែណា|ឆ្នាំណា)",
            r"(ប្រតិទិន|ចន្ទគតិ|សុរិយគតិ|ថ្ងៃសីល|សីល|ខ្នើត|រនោច|ពេញបូណ៌មី|ដាច់ខែ|ពុទ្ធសករាជ|ព\.ស\.|ស័ក|ឆ្នាំមមី|ឆ្នាំជូត)",
            r"(បុណ្យភ្ជុំ|ភ្ជុំបិណ្ឌ|កាន់បិណ្ឌ|ចូលឆ្នាំ|អុំទូក|វិសាខបូជា|មាឃបូជា|ច្រត់ព្រះនង្គ័ល)",
        ]
        return any(re.search(p, m) for p in patterns)

    @staticmethod
    def is_ocr_query(
        message: str,
        image_data: Optional[List[str]] = None,
        image_urls: Optional[List[str]] = None,
    ) -> bool:
        """Determines if the query is an OCR, document transcription, or visual reading request."""
        has_image = bool((image_data and len(image_data) > 0) or (image_urls and len(image_urls) > 0))
        m = message.lower().strip()
        ocr_patterns = [
            r"\b(ocr|transcribe|transcription|extract text|read text|read this|scan|convert to text|recognize text)\b",
            r"(ស្រង់អក្សរ|ស្រង់អត្ថបទ|អានអក្សរ|អានអត្ថបទ|អានរូប|អានរូបភាព|បកប្រែរូប|ស្កេន|មើលអក្សរ|អក្សរក្នុងរូប|អានស្លឹករឹត)",
        ]
        if any(re.search(p, m) for p in ocr_patterns):
            return True
        if has_image:
            explicit_web_search = any(
                w in m for w in ["search web", "google", "ស្វែងរកលើបណ្ដាញ", "ព័ត៌មានទាន់ហេតុការណ៍", "breaking news", "latest news"]
            )
            if not explicit_web_search:
                return True
        return False

    @staticmethod
    def build_grounding_context(query: str) -> str:
        """Retrieves and packages verified local knowledge and live web search results."""
        from services.tools import cambodia_directory_search, cambodia_knowledge_lookup, web_search
        parts = []

        # 0. Real-time Khmer Calendar Grounding
        if ChatService.is_calendar_query(query):
            try:
                from services.khmer_calendar import get_current_khmer_calendar_context
                cal_res = get_current_khmer_calendar_context()
                if cal_res:
                    parts.append(cal_res)
            except Exception as e:
                logger.debug("Khmer calendar grounding skip: %s", e)

        # 1. Local Directory Search
        try:
            dir_res = cambodia_directory_search(query)
            if dir_res and "No matching entries" not in dir_res and "[error]" not in dir_res:
                parts.append(f"=== VERIFIED CAMBODIA DIRECTORY DATA ===\n{dir_res}")
        except Exception as e:
            logger.debug("Directory search skip: %s", e)

        # 2. Local Encyclopedia Facts
        try:
            enc_res = cambodia_knowledge_lookup(query)
            if enc_res and "No specific encyclopedia" not in enc_res and "[error]" not in enc_res:
                parts.append(f"=== VERIFIED CAMBODIA ENCYCLOPEDIA FACTS ===\n{enc_res}")
        except Exception as e:
            logger.debug("Encyclopedia lookup skip: %s", e)

        # 3. Live Web Search & Social Media Research
        try:
            web_res = web_search(query, max_results=4)
            if web_res and "No web search" not in web_res and "[error]" not in web_res:
                parts.append(f"=== LIVE WEB & SOCIAL MEDIA RESEARCH ===\n{web_res}")
        except Exception as e:
            logger.debug("Web search skip: %s", e)

        if not parts:
            return ""

        return (
            "\n\n--- LIVE SEARCH & VERIFIED KNOWLEDGE GROUNDING ---\n"
            + "\n\n".join(parts)
            + "\n\nGROUNDING RULES:\n"
            "- Answer using the verified directory data, official websites, and social media URLs above.\n"
            "- Format official websites and social links as clean markdown links e.g. [Domain](https://...).\n"
            "- Never guess or hallucinate details if factual information is provided above.\n"
            "--- END GROUNDING ---\n"
        )

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
        response_language: Optional[str] = "km",
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

        # 2. RAG Context Retrieval & Live Knowledge Grounding
        rag_data = self.retrieve_rag_context(document_ids or [], message)
        rag_context = rag_data.get("context") or ""
        is_ocr = self.is_ocr_query(message, image_data=image_data, image_urls=image_urls) or mode == "ocr"
        if not is_ocr:
            grounding = self.build_grounding_context(message)
            if grounding:
                rag_context = (rag_context + "\n" + grounding).strip()

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
            rag_context=rag_context or None,
            use_tools=effective_tools,
            response_language=response_language,
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
        response_language: Optional[str] = "km",
    ) -> AsyncGenerator[str, None]:
        """Streams turn chunks incrementally with live grounding."""
        # 1. Image Generation Intent
        if self.is_image_query(message, image_data) or mode == "image":
            ref_image = image_data[0] if (image_data and len(image_data) > 0) else None
            action_name = "កែប្រែរូបភាព (Editing Reference Image)" if ref_image else "បង្កើតរូបភាព (Generating Khmer Cultural Image)"
            yield f"🎨 *កំពុងដំណើរការ{action_name} តាមការបញ្ជា...*\n\n"

            res = await image_service.generate_image(prompt=message, reference_image_data=ref_image)
            yield res.get("markdown", "")
            return

        # 2. RAG Context Retrieval & Live Knowledge Grounding
        effective_rag = rag_context or ""
        if not effective_rag and document_ids:
            rag_data = self.retrieve_rag_context(document_ids, message)
            effective_rag = rag_data.get("context") or ""

        is_ocr = self.is_ocr_query(message, image_data=image_data, image_urls=image_urls) or mode == "ocr"
        if not is_ocr:
            grounding = self.build_grounding_context(message)
            if grounding:
                effective_rag = (effective_rag + "\n" + grounding).strip()

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
                response_language=response_language,
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
            rag_context=effective_rag or None,
            response_language=response_language,
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
