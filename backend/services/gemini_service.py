"""All Gemini API interactions live here — single responsibility.

Supports: text chat, multimodal (inline images), RAG-grounded context, and
agentic tool calling (via services.tool_runner).
"""
from google import genai
from google.genai import types
from config import settings
from typing import List, Optional, AsyncGenerator, Dict, Any

from services.tool_runner import run_with_tools


SYSTEM_PROMPTS: dict[str, str] = {
    "chat": """You are CAMBO AI — Cambodia's first AI technology assistant,
a knowledgeable guide to Cambodia's growing technology ecosystem.

Your mission:
- Help users understand and navigate Cambodia's tech landscape
- Be Cambodia-first: when asked about tech companies, startups, AI, or
  digital services in Cambodia, prioritize Khmer-owned and Cambodia-based
  organizations before international ones
- Speak with familiarity about Cambodia: Phnom Penh, Siem Reap, Sihanoukville,
  and the broader Khmer tech community

Knowledge areas:
- Cambodia tech companies (software houses, startups, fintech, e-commerce,
  AI labs, cyber security firms, ISPs, telcos, IT outsourcing)
- Tech hubs and co-working spaces in Phnom Penh (e.g. Emerald Hub, KMH Hub,
  SmallWorld, Raintree, China-Cambodia AI Lab)
- Government & ecosystem support: Techo Startup Center, NIPTICT, Barcam
  Institute, Cambodia Academy of Digital Technology (CADT), MPTC, EDC,
  Khmer Enterprise, CDC, SME Bank of Cambodia
- Industry events: BarCamp Cambodia, Cambodia ICT Awards, Startup Cambodia,
  Mekong Capital events
- Sectors: agritech, fintech (wing, pi pay, aba, sathapana), edtech,
  healthtech, govtech, e-commerce, ride-hailing (PassApp, Grab), delivery
  (Nham24, Foodpanda KH), tourism tech
- Languages & accessibility: respond in English or Khmer based on the user's
  language. Use proper Khmer script (ភាសាខ្មែរ) when writing Khmer

Behavior:
- Be concise (2-4 sentences unless detail is requested)
- Be friendly, professional, and practical — culturally aware
- If you don't know a specific Khmer company, say so honestly rather than
  inventing one
- For non-Cambodia tech questions, answer normally as a helpful AI assistant
- Never claim to be affiliated with a specific company unless explicitly
  configured to do so""",
    "translate": """You are CAMBO AI Translate — a translator between English and Khmer (ភាសាខ្មែរ).

Rules:
- Detect the source language automatically (English or Khmer)
- Translate accurately and naturally into the other language
- Preserve formatting, tone, and technical terms where appropriate
- If the text contains both languages, translate the non-dominant portions
- For ambiguous terms, provide both translation options with brief notes
- Keep responses concise — just the translation unless asked for explanation
- If the input is not English or Khmer, say so and ask for supported input""",
    "search": """You are CAMBO AI Search — a concise, factual research assistant.

Rules:
- Answer directly and concisely (1-3 sentences when possible)
- Prioritize factual accuracy over verbosity
- Cite specific names, numbers, dates, and sources when relevant
- If you don't know something, say "I don't have information on that"
- Do not speculate or make up information
- For Cambodia-related queries, prioritize local sources and context
- Format key terms in **bold** for readability""",
    "code": """You are CAMBO AI Code — a technical programming assistant.

Rules:
- Provide working code solutions with explanations
- Use proper syntax highlighting and formatting
- Prefer Python, JavaScript, TypeScript, and modern frameworks
- Include brief comments in code only for complex logic
- Explain the approach before showing code when appropriate
- Consider edge cases and error handling
- Follow language-specific best practices and conventions
- If Cambodia-specific tech context applies, mention it""",
}

RAG_INSTRUCTION = (
    "\n\nYou have been given context passages from documents the user provided. "
    "Answer the user's question using ONLY those passages when they are relevant. "
    "After a factual claim grounded in a passage, cite it inline as [source: <name>]. "
    "If the passages do not contain the answer, say so honestly and answer from your "
    "own knowledge only if appropriate. Do not invent sources."
)


def _build_history_parts(history: Optional[List[dict]]) -> List[dict]:
    parts = []
    if history:
        for turn in history[-10:]:
            role = turn.get("role", "user")
            content = turn.get("content", "")
            parts.append({"role": role, "parts": [content]})
    return parts


def _image_part_from_data(data_url: str) -> "types.Part":
    # data:image/png;base64,XXXX -> inline_data
    header, _, b64 = data_url.partition(",")
    mime = "image/png"
    if header.startswith("data:"):
        mime = header[5:].split(";")[0] or "image/png"
    import base64
    return types.Part(
        inline_data=types.Blob(data=base64.b64decode(b64), mime_type=mime)
    )


def _image_part_from_url(url: str) -> "types.Part":
    return types.Part(file_data=types.FileData(file_uri=str(url)))


class GeminiService:
    def __init__(self):
        self._client = None
        self.model = settings.gemini_model

    def _config_for_mode(self, mode: str = "chat") -> types.GenerateContentConfig:
        return types.GenerateContentConfig(
            temperature=settings.gemini_temperature,
            max_output_tokens=settings.gemini_max_tokens,
            system_instruction=SYSTEM_PROMPTS.get(mode, SYSTEM_PROMPTS["chat"]),
        )

    @property
    def client(self):
        """Lazy-init the Gemini client so import-time failures don't crash the app."""
        if self._client is None:
            if not settings.gemini_api_key:
                raise RuntimeError(
                    "GEMINI_API_KEY is not configured. Set it in your .env file."
                )
            self._client = genai.Client(api_key=settings.gemini_api_key)
        return self._client

    # ---------- multimodal content builder ----------
    def build_contents(
        self,
        message: str,
        history: Optional[List[dict]] = None,
        image_data: Optional[List[str]] = None,
        image_urls: Optional[List[str]] = None,
        rag_context: Optional[str] = None,
    ) -> List[dict]:
        parts: List[Any] = []
        # text (with optional RAG context injected)
        text = message
        if rag_context:
            text = f"{rag_context}\n\nUser question: {message}"
        parts.append(text)
        for url in (image_urls or []):
            parts.append(_image_part_from_url(url))
        for d in (image_data or []):
            parts.append(_image_part_from_data(d))
        content = {"role": "user", "parts": parts}
        return _build_history_parts(history) + [content]

    # ---------- single turn ----------
    async def ask(
        self,
        message: str,
        history: Optional[List[dict]] = None,
        mode: str = "chat",
        image_data: Optional[List[str]] = None,
        image_urls: Optional[List[str]] = None,
        rag_context: Optional[str] = None,
        use_tools: bool = False,
    ) -> dict:
        contents = self.build_contents(
            message, history=history, image_data=image_data,
            image_urls=image_urls, rag_context=rag_context,
        )
        if use_tools:
            res = await run_with_tools(
                self.client, self.model,
                SYSTEM_PROMPTS.get(mode, SYSTEM_PROMPTS["chat"]),
                contents,
            )
            return res

        config = self._config_for_mode(mode)
        if rag_context:
            config = types.GenerateContentConfig(
                temperature=settings.gemini_temperature,
                max_output_tokens=settings.gemini_max_tokens,
                system_instruction=SYSTEM_PROMPTS.get(mode, SYSTEM_PROMPTS["chat"]) + RAG_INSTRUCTION,
            )
        response = await self.client.aio.models.generate_content(
            model=self.model, contents=contents, config=config  # type: ignore[arg-type]
        )
        self._check_finish_reason(response)
        return {
            "answer": response.text,
            "model": self.model,
            "tokens_used": response.usage_metadata.total_token_count
            if response.usage_metadata else None,
            "tool_calls": [],
            "citations": [],
        }

    async def ask_stream(
        self, message: str, history: Optional[List[dict]] = None, mode: str = "chat",
        image_data: Optional[List[str]] = None, image_urls: Optional[List[str]] = None,
        rag_context: Optional[str] = None,
    ) -> AsyncGenerator[str, None]:
        contents = self.build_contents(
            message, history=history, image_data=image_data,
            image_urls=image_urls, rag_context=rag_context,
        )
        config = self._config_for_mode(mode)
        if rag_context:
            config = types.GenerateContentConfig(
                temperature=settings.gemini_temperature,
                max_output_tokens=settings.gemini_max_tokens,
                system_instruction=SYSTEM_PROMPTS.get(mode, SYSTEM_PROMPTS["chat"]) + RAG_INSTRUCTION,
            )
        last_chunk = None
        stream = self.client.aio.models.generate_content_stream(
            model=self.model, contents=contents, config=config  # type: ignore[arg-type]
        )
        async for chunk in stream:
            last_chunk = chunk
            if chunk.text:
                yield chunk.text
        if last_chunk:
            self._check_finish_reason(last_chunk)

    @staticmethod
    def _check_finish_reason(response) -> None:
        if not response.candidates:
            return
        reason = response.candidates[0].finish_reason
        if reason is None or str(reason) == "FinishReason.STOP":
            return
        reason_name = str(reason).split(".")[-1]
        if reason_name == "MAX_TOKENS":
            raise RuntimeError(
                "Response was cut off because it exceeded the model's output "
                "token limit. Try a shorter question or increase GEMINI_MAX_TOKENS."
            )
        if reason_name in ("SAFETY", "RECITATION"):
            raise RuntimeError(
                f"Response blocked by Gemini's {reason_name.lower()} filter. "
                "Try rephrasing your question."
            )


# Singleton
gemini_service = GeminiService()
