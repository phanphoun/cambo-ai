"""Prompt Builder & Assembler.

Assembles system instructions, persona constraints, RAG context, and historical
turn data into standardized model prompts.
"""

from typing import Optional, List, Dict, Any
from prompts.mode_prompts import MODE_PROMPTS, RAG_INSTRUCTION
from prompts.khmer_linguistics import KHMER_LINGUISTIC_CORE


class PromptBuilder:
    @staticmethod
    def get_system_prompt(
        mode: str = "chat",
        rag_context: Optional[str] = None,
        response_language: Optional[str] = "km",
    ) -> str:
        """Retrieves and composes the final system instruction for a given mode, RAG state, and target response language."""
        from services.khmer_calendar import get_current_khmer_calendar_context

        base_prompt = MODE_PROMPTS.get(mode, MODE_PROMPTS["chat"])
        calendar_info = get_current_khmer_calendar_context()

        temporal_instructions = (
            f"\n\n{calendar_info}\n"
            "TEMPORAL & KHMER CALENDAR OPERATIONAL RULES:\n"
            "1. You have complete, real-time native awareness of the Cambodian local time (ICT UTC+7, Phnom Penh), "
            "the Gregorian/Solar calendar (សុរិយគតិ), and the authentic Royal Khmer Lunisolar Calendar (Chhankitek ចន្ទគតិ).\n"
            "2. When asked about current date, time, day of week, Khmer calendar, holy day (ថ្ងៃសីល), moon phase (ខ្នើត/រនោច), "
            "Buddhist Era (ពុទ្ធសករាជ / ព.ស.), 12-year animal zodiac (ឆ្នាំសត្វទាំង១២), 10 Sak eras (ស័កទាំង១០), or traditional festivals, "
            "NEVER claim that you do not possess a clock or cannot determine real-time dates.\n"
            "3. ALWAYS provide precise Cambodian calendar answers using the real-time temporal grounding above.\n"
            "4. Provide both the solar date (e.g. ថ្ងៃច័ន្ទ ទី០៧ ខែកញ្ញា ឆ្នាំ២០២៦) and the lunar Chhankitek date "
            "(e.g. ថ្ងៃច័ន្ទ ១១រោច ខែស្រាពណ៍ ឆ្នាំមមី អដ្ឋស័ក ព.ស. ២៥៧០) with holy day status.\n"
        )

        lang = (response_language or "km").lower().strip()
        if lang in ["en", "english"]:
            lang_directive = (
                "========================================================================\n"
                "CRITICAL MANDATORY INSTRUCTION - RESPONSE LANGUAGE IS STRICTLY ENGLISH:\n"
                "The user has explicitly set their response language preference to ENGLISH.\n"
                "1. You MUST formulate your ENTIRE response in clear, articulate, and natural ENGLISH.\n"
                "2. Even if the user's query is written in Khmer (ភាសាខ្មែរ), Chinese, French, or any other language,\n"
                "   and even if previous conversation history is in Khmer, translate the intent and answer completely in ENGLISH.\n"
                "3. DO NOT answer in Khmer. The user explicitly chose English for this response.\n"
                "========================================================================"
            )
        elif lang in ["fr", "french", "france", "francais", "français"]:
            lang_directive = (
                "========================================================================\n"
                "DIRECTIVE CRITIQUE OBLIGATOIRE - LA LANGUE DE RÉPONSE EST LE FRANÇAIS:\n"
                "L'utilisateur a explicitement sélectionné le FRANÇAIS comme langue de réponse.\n"
                "1. Vous DEVEZ formuler l'INTÉGRALITÉ de votre réponse en français soigné, naturel et professionnel.\n"
                "2. Même si la question de l'utilisateur est rédigée en khmer, en anglais ou dans une autre langue,\n"
                "   et même si l'historique précédent est en khmer, répondez entièrement en FRANÇAIS.\n"
                "3. NE répondez PAS en khmer.\n"
                "========================================================================"
            )
        elif lang in ["zh", "chinese", "china", "中文", "汉语", "普通话"]:
            lang_directive = (
                "========================================================================\n"
                "最高优先级强制指令 - 回复语言严格指定为中文（简体中文）：\n"
                "用户已明确选择以中文作为回复语言。\n"
                "1. 你必须使用流畅、自然、严谨且专业的中文（简体中文）进行完整回答。\n"
                "2. 即使用户的提问是用高棉语（柬埔寨语）、英语或其他语言撰写的，并且即使之前的对话历史是用高棉语进行的，你也必须完全用中文回答。\n"
                "3. 严禁用高棉语作答。\n"
                "========================================================================"
            )
        else:
            lang_directive = (
                "========================================================================\n"
                "CRITICAL MANDATORY INSTRUCTION - RESPONSE LANGUAGE IS KHMER (ភាសាខ្មែរ):\n"
                "The user has selected KHMER (ភាសាខ្មែរ) as the output language.\n"
                "1. You MUST formulate your entire response in 100% fluent, authentic, and grammatically accurate Khmer.\n"
                "2. Strictly adhere to the Chuon Nath Khmer Dictionary (វចនានុក្រម ជួន ណាត) and standard Khmer typography («...», ។, ៕).\n"
                "3. Never use or mix Thai language or script under any circumstances.\n"
                "========================================================================"
            )

        thai_prohibition = (
            "\n\nSTRICT REQUIREMENT ON LANGUAGE PURITY (ហាមដាច់ខាតមិនឱ្យលាយភាសាថៃ):\n"
            "- You must NEVER generate Thai script or Thai vocabulary (e.g., 'ด้วยความเคារព', 'สวัสดี', 'ขอบคุณ', 'ครับ/ค่ะ', or characters from U+0E00-U+0E7F) "
            "when writing in Khmer, unless the user explicitly and expressly requests a response in Thai.\n"
            "- Do NOT confuse Khmer with Thai. Always write 100% authentic Khmer. "
            "For polite closings, use «ដោយសេចក្តីគោរពដ៏ខ្ពង់ខ្ពស់», «ដោយក្តីគោរពពីខ្ញុំ», «សូមអរគុណ» (never Thai).\n"
        )

        parts = [lang_directive, base_prompt, temporal_instructions]
        if lang == "km":
            parts.append(thai_prohibition)
            parts.append(KHMER_LINGUISTIC_CORE)

        full_system_prompt = "\n\n".join(parts)
        if rag_context:
            return full_system_prompt + RAG_INSTRUCTION + f"\n\n--- DOCUMENT CONTEXT ---\n{rag_context}\n--- END CONTEXT ---"
        return full_system_prompt

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


    @staticmethod
    def wrap_user_message(message: str, response_language: Optional[str] = "km") -> str:
        """Wraps the current user message with clear output language guidance if an alternative language was chosen."""
        lang = (response_language or "km").lower().strip()
        if lang in ["en", "english"]:
            return f"[Output Language Requirement: English - Answer completely in English]\n{message}"
        elif lang in ["fr", "french", "france", "francais", "français"]:
            return f"[Exigence de langue de réponse: Français - Répondez entièrement en français]\n{message}"
        elif lang in ["zh", "chinese", "china", "中文", "汉语", "普通话"]:
            return f"[MANDATORY OUTPUT LANGUAGE: SIMPLIFIED CHINESE (中文) - Answer completely and exclusively in Chinese characters]\n{message}"
        return message


prompt_builder = PromptBuilder()
