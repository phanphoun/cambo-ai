import time
import logging
import httpx
from typing import Optional
from fastapi import APIRouter, HTTPException, Header
from fastapi.responses import StreamingResponse
from models.schemas import Question, Answer, ChatRequest, ChatResponse, ToolCallRecord
from services.chat_history import chat_history
from services.provider_manager import provider_manager
from services.rag_store import rag_store
from services.rag_context import build_context
from config import settings
from prompts.khmer_linguistics import sanitize_unwanted_thai

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api", tags=["chat"])


def _ai_error(e: Exception) -> HTTPException:
    msg = str(e)
    if "weekly usage limit" in msg.lower() or "ollama.com/upgrade" in msg.lower():
        return HTTPException(
            status_code=429,
            detail="Ollama Cloud weekly usage limit reached for this account. Please switch to Gemini 3.7 Flash or a local Ollama model in AI Providers."
        )
    if "429" in msg or "RESOURCE_EXHAUSTED" in msg or "quota" in msg.lower():
        return HTTPException(status_code=429, detail="API rate limit or quota exceeded. Please switch provider or try again later.")
    if "401" in msg or "API key" in msg or "PERMISSION_DENIED" in msg:
        return HTTPException(status_code=401, detail="Invalid API key or unauthorized. Check your settings.")
    if "Connection refused" in msg or "ConnectError" in msg:
        return HTTPException(status_code=503, detail="Provider unreachable. Make sure Ollama is running (`ollama serve` on localhost:11434).")
    if "Embedding model unavailable" in msg:
        return HTTPException(status_code=503, detail="RAG embeddings unavailable — embedding model is not loaded.")
    # Handle Google API 503 errors (model experiencing high demand)
    if "503" in msg or "UNAVAILABLE" in msg or "high demand" in msg.lower():
        return HTTPException(
            status_code=503,
            detail="The AI model is currently experiencing high demand. This is usually temporary — please try again in a moment or switch to another provider."
        )
    if isinstance(e, httpx.ReadTimeout):
        return HTTPException(status_code=504, detail="Model response timed out. The cloud model may still be loading — try again.")
    if isinstance(e, RuntimeError):
        return HTTPException(status_code=500, detail=str(e))
    logger.exception("Unhandled chat error")
    return HTTPException(status_code=500, detail=f"Chat error: {str(e)}")


def _retrieve_rag(req: ChatRequest) -> dict:
    doc_ids = req.get_document_ids()
    if not doc_ids:
        return {"context": "", "citations": []}
    try:
        hits = rag_store.search(doc_ids, req.message)
    except Exception as e:
        logger.warning("RAG retrieval failed: %s", e)
        return {"context": "", "citations": []}
    return build_context(hits)


@router.get("/models")
async def get_available_models():
    """Retrieve all discovered AI models (Gemini, local Ollama models, and cloud models)."""
    from providers.factory import provider_factory
    return await provider_factory.discover_all_models()


@router.post("/ask", response_model=Answer)
async def ask(q: Question):
    try:
        result = await provider_manager.ask(q.question)
        if "answer" in result:
            result["answer"] = sanitize_unwanted_thai(result["answer"], user_prompt=q.question)
        return Answer(**result)
    except Exception as e:
        raise _ai_error(e) from e


@router.post("/chat/stream")
async def chat_stream(req: ChatRequest, authorization: str = Header(None)):
    import json
    from services.auth_service import decode_access_token, user_repo
    from services.user_chat_store import user_chat_store
    from services.telemetry_service import telemetry_service

    user_email = req.user_email or "guest@sastra.ai"
    if authorization and authorization.startswith("Bearer "):
        token = authorization.split(" ", 1)[1].strip()
        payload = decode_access_token(token)
        if payload and "email" in payload:
            user_email = payload["email"]
            
    u = user_repo.find_by_email(user_email)
    if u and u.get("status") == "locked":
        raise HTTPException(status_code=403, detail="Account is locked by administrator.")

    async def generate():
        try:
            session_id = req.session_id or chat_history.create_session()
            history = chat_history.get_history(session_id)
            chat_history.add_message(session_id, "user", req.message)

            rag = _retrieve_rag(req)
            provider = req.provider or settings.default_provider

            # Emit initial metadata frame with session_id
            yield f"data: {json.dumps({'session_id': session_id})}\n\n"

            start_t = time.perf_counter()
            full_answer = []
            async for chunk in provider_manager.ask_stream(
                req.message,
                history=history,
                mode=req.mode,
                provider=provider,
                model=req.model,
                image_data=req.get_image_data(),
                image_urls=[str(u) for u in req.image_urls],
                document_ids=req.get_document_ids(),
                rag_context=rag["context"] or None,
                use_tools=req.use_tools,
                response_language=req.response_language,
            ):
                cleaned_chunk = sanitize_unwanted_thai(chunk, user_prompt=req.message)
                full_answer.append(cleaned_chunk)
                yield f"data: {json.dumps({'content': cleaned_chunk})}\n\n"

            elapsed_ms = (time.perf_counter() - start_t) * 1000
            answer = sanitize_unwanted_thai("".join(full_answer), user_prompt=req.message)
            chat_history.add_message(session_id, "assistant", answer)

            # Record turn in persistent user chat store for Admin
            user_chat_store.record_turn(
                user_email=user_email,
                user_message=req.message,
                ai_response=answer,
                session_id=session_id,
                provider=provider,
            )
            telemetry_service.record_activity(
                action="chat.stream",
                user_email=user_email,
                provider=provider,
                latency_ms=elapsed_ms,
            )

            yield f"data: {json.dumps({'done': True, 'citations': rag.get('citations', [])})}\n\n"
        except Exception as e:
            logger.error("Stream generation failed: %s", e, exc_info=True)
            exc = _ai_error(e)
            yield f"data: {json.dumps({'error': exc.detail})}\n\n"

    return StreamingResponse(generate(), media_type="text/event-stream")


@router.post("/chat", response_model=ChatResponse)
async def chat(req: ChatRequest, authorization: str = Header(None)):
    from services.auth_service import decode_access_token, user_repo
    from services.user_chat_store import user_chat_store
    from services.telemetry_service import telemetry_service

    user_email = req.user_email or "guest@sastra.ai"
    if authorization and authorization.startswith("Bearer "):
        token = authorization.split(" ", 1)[1].strip()
        payload = decode_access_token(token)
        if payload and "email" in payload:
            user_email = payload["email"]
            
    u = user_repo.find_by_email(user_email)
    if u and u.get("status") == "locked":
        raise HTTPException(status_code=403, detail="Account is locked by administrator.")

    try:
        session_id = req.session_id or chat_history.create_session()
        history = chat_history.get_history(session_id)
        chat_history.add_message(session_id, "user", req.message)

        # RAG grounding
        rag = _retrieve_rag(req)
        provider = req.provider or settings.default_provider

        start_t = time.perf_counter()
        result = await provider_manager.ask(
            req.message, history=history, mode=req.mode, provider=provider,
            image_data=req.image_data, image_urls=[str(u) for u in req.image_urls],
            rag_context=rag["context"] or None, use_tools=req.use_tools,
            response_language=req.response_language,
        )
        elapsed_ms = (time.perf_counter() - start_t) * 1000
        result["answer"] = sanitize_unwanted_thai(result.get("answer", ""), user_prompt=req.message)

        chat_history.add_message(session_id, "assistant", result["answer"])

        # Record turn in persistent user chat store for Admin
        user_chat_store.record_turn(
            user_email=user_email,
            user_message=req.message,
            ai_response=result["answer"],
            session_id=session_id,
            provider=provider,
            model=result.get("model", "gemini-3.7-flash"),
            tokens_used=result.get("tokens_used"),
            tool_calls=result.get("tool_calls"),
        )
        telemetry_service.record_activity(
            action="chat.query",
            user_email=user_email,
            provider=provider,
            latency_ms=elapsed_ms,
        )

        return ChatResponse(
            reply=result["answer"],
            model=result["model"],
            session_id=session_id,
            tokens_used=result.get("tokens_used"),
            tool_calls=[ToolCallRecord(**t) for t in result.get("tool_calls", [])],
            citations=rag["citations"],
        )
    except Exception as e:
        raise _ai_error(e) from e


@router.delete("/chat/{session_id}")
async def clear_chat(session_id: str):
    chat_history.clear(session_id)
    return {"message": "Session cleared", "session_id": session_id}


@router.get("/providers")
async def list_providers():
    return {
        "providers": ["gemini", "ollama", "ollama-cloud"],
        "default": settings.default_provider,
    }


# Letter-by-letter Khmer phonetic pronunciation map for uppercase English letters
KHMER_LETTER_SOUNDS = {
    "A": "អេ", "B": "ប៊ី", "C": "ស៊ី", "D": "ឌី", "E": "អ៊ី",
    "F": "អែហ្វ", "G": "ជី", "H": "អេច", "I": "អាយ", "J": "ជេ",
    "K": "ខេ", "L": "អែល", "M": "អឹម", "N": "អិន", "O": "អូ",
    "P": "ភី", "Q": "គ្យូ", "R": "អ័រ", "S": "អេស", "T": "ធី",
    "U": "យូ", "V": "វី", "W": "ដាប់ប៊លយូ", "X": "អិច", "Y": "វ៉ាយ",
    "Z": "ហ្ស៊ិត",
}

# Well-known Cambodian & tech institutional acronyms
CUSTOM_ACRONYMS = {
    r"\bSastra\s+AI\b": "សាស្ត្រា អេអាយ",
    r"\bPNC\b": "ភី អិន ស៊ី",
    r"\bSKAI\b": "អេស ខេ អេ អាយ",
    r"\bABA\b": "អេ ប៊ី អេ",
    r"\bAI\b": "អេអាយ",
    r"\bKHQR\b": "ខេអេក្យូអ័រ",
    r"\bUSD\b": "ដុល្លារ",
    r"\bKHR\b": "រៀល",
    r"\bUNESCO\b": "យូណេស្កូ",
    r"\bNBC\b": "ធនាគារជាតិ",
    r"\bCADT\b": "ស៊ី អេ ឌី ធី",
    r"\bRUPP\b": "អ័រ យូ ភី ភី",
    r"\bITC\b": "អាយ ធី ស៊ី",
    r"\bEDC\b": "អ៊ី ឌី ស៊ី",
    r"\bMoEYS\b": "ក្រសួងអប់រំ",
    r"\bMOEYS\b": "ក្រសួងអប់រំ",
    r"\bMLVT\b": "ក្រសួងការងារ",
    r"\bMPTC\b": "ក្រសួងប្រៃសណីយ៍",
    r"\bMEF\b": "ក្រសួងសេដ្ឋកិច្ច",
    r"\bMISTI\b": "ក្រសួងឧស្សាហកម្ម",
    r"\bPDF\b": "ភី ឌី អែហ្វ",
    r"\bHTML\b": "អេច ធី អឹម អែល",
    r"\bCSS\b": "ស៊ី អេស អេស",
    r"\bJS\b": "ជេ អេស",
    r"\bAPI\b": "អេ ភី អាយ",
    r"\bSDK\b": "អេស ឌី ខេ",
    r"\bUI\b": "យូ អាយ",
    r"\bUX\b": "យូ អិច",
    r"\bIT\b": "អាយ ធី",
    r"\bCPU\b": "ស៊ី ភី យូ",
    r"\bRAM\b": "រ៉េម",
    r"\bROM\b": "រ៉ូម",
    r"\bURL\b": "យូ អ័រ អែល",
    r"\bID\b": "អាយ ឌី",
    r"\bSMS\b": "អេស អឹម អេស",
    r"\bSOS\b": "អេស អូ អេស",
    r"\bWiFi\b": "វ៉ាយហ្វាយ",
    r"\bWIFI\b": "វ៉ាយហ្វាយ",
    r"\bUSB\b": "យូ អេស ប៊ី",
}


def _normalize_speech_text(text: str) -> str:
    import re
    # 1. Strip markdown code blocks and inline code
    t = re.sub(r"```[\s\S]*?```", " ", text)
    t = re.sub(r"`([^`]+)`", r"\1", t)
    # 2. Strip images and links
    t = re.sub(r"!\[(.*?)\]\(.*?\)", r"\1", t)
    t = re.sub(r"\[(.*?)\]\(.*?\)", r"\1", t)
    # 3. Strip URLs
    t = re.sub(r"https?://\S+", " ", t)
    # 4. Strip markdown headers, blockquotes, horizontal rules
    t = re.sub(r"#{1,6}\s*", "", t)
    t = re.sub(r"^\s*>\s*", "", t, flags=re.MULTILINE)
    t = re.sub(r"^\s*[-*_]{3,}\s*$", "", t, flags=re.MULTILINE)
    # 5. Strip table pipes and markdown list bullets
    t = re.sub(r"\|", " ", t)
    t = re.sub(r"^\s*[-*+]\s+", "", t, flags=re.MULTILINE)
    t = re.sub(r"^\s*\d+\.\s+", "", t, flags=re.MULTILINE)
    # 6. Strip bold, italic, strikethrough markdown
    t = re.sub(r"(\*\*|__)(.*?)\1", r"\2", t)
    t = re.sub(r"(\*|_)(.*?)\1", r"\2", t)
    t = re.sub(r"~~(.*?)~~", r"\1", t)
    # 7. Strip decorative emojis and pictographs
    t = re.sub(r"[\U00010000-\U0010ffff]", "", t)
    t = re.sub(r"[\u2600-\u27BF\u2300-\u23FF]", "", t)

    # 8. Check if text contains Khmer script or is intended for Khmer voice reading
    has_khmer = bool(re.search(r"[\u1780-\u17FF]", t))

    # 9. Honorific pronouns & titles (Mr. -> លោក, Ms./Miss -> កញ្ញា, Mrs. -> លោកស្រី, Dr. -> លោកបណ្ឌិត)
    t = re.sub(r"\bMr\.?\s+", "លោក ", t, flags=re.IGNORECASE)
    t = re.sub(r"\bMrs\.?\s+", "លោកស្រី ", t, flags=re.IGNORECASE)
    t = re.sub(r"\bMs\.?\s+", "កញ្ញា ", t, flags=re.IGNORECASE)
    t = re.sub(r"\bMiss\s+", "កញ្ញា ", t, flags=re.IGNORECASE)
    t = re.sub(r"\bDr\.?\s+", "លោកបណ្ឌិត ", t, flags=re.IGNORECASE)
    t = re.sub(r"\bProf\.?\s+", "សាស្ត្រាចារ្យ ", t, flags=re.IGNORECASE)

    # Standalone pronouns without trailing space
    t = re.sub(r"\bMr\.?\b", "លោក", t, flags=re.IGNORECASE)
    t = re.sub(r"\bMrs\.?\b", "លោកស្រី", t, flags=re.IGNORECASE)
    t = re.sub(r"\bMs\.?\b", "កញ្ញា", t, flags=re.IGNORECASE)
    t = re.sub(r"\bMiss\b", "កញ្ញា", t, flags=re.IGNORECASE)
    t = re.sub(r"\bDr\.?\b", "លោកបណ្ឌិត", t, flags=re.IGNORECASE)
    t = re.sub(r"\bProf\.?\b", "សាស្ត្រាចារ្យ", t, flags=re.IGNORECASE)

    # 10. Known institutional and specialized acronyms
    for pat, rep in CUSTOM_ACRONYMS.items():
        t = re.sub(pat, rep, t, flags=re.IGNORECASE)

    # 11. Read any remaining uppercase acronyms (2 to 7 letters) letter-by-letter in Khmer
    # e.g., PNC -> ភី អិន ស៊ី, SKAI -> អេស ខេ អេ អាយ, ABA -> អេ ប៊ី អេ
    def _spell_letter_by_letter(m):
        word = m.group(0)
        # Skip if word is already a known Khmer string
        if any("\u1780" <= c <= "\u17FF" for c in word):
            return word
        sounds = [KHMER_LETTER_SOUNDS.get(c, c) for c in word]
        return " ".join(sounds)

    t = re.sub(r"\b[A-Z]{2,7}\b", _spell_letter_by_letter, t)

    # 12. Clean extra whitespace
    t = re.sub(r"\s+", " ", t).strip()
    return t


class TTSRequest(Question.__base__):
    text: str
    lang: Optional[str] = None
    voice: Optional[str] = None


@router.post("/tts")
async def text_to_speech(req: TTSRequest):
    import io
    import re
    from fastapi.responses import Response
    import edge_tts
    from gtts import gTTS

    clean_text = _normalize_speech_text(req.text)
    if not clean_text:
        raise HTTPException(status_code=400, detail="Text is empty after normalization")

    # Support full-length multi-paragraph responses (up to 25,000 chars)
    if len(clean_text) > 25000:
        clean_text = clean_text[:25000]

    has_khmer = bool(re.search(r"[\u1780-\u17FF]", clean_text))

    # Supported Neural Voice Profiles with authentic Cambodian voice personas
    voice_profiles = {
        # Standard Base Voices
        "km-KH-PisethNeural": {"base": "km-KH-PisethNeural", "rate": "+0%", "pitch": "+0Hz"},
        "km-KH-SreymomNeural": {"base": "km-KH-SreymomNeural", "rate": "+0%", "pitch": "+0Hz"},
        "en-US-AvaNeural": {"base": "en-US-AvaNeural", "rate": "+0%", "pitch": "+0Hz"},
        # 10 Distinct Khmer People Personas
        "prof-chan": {"base": "km-KH-PisethNeural", "rate": "-8%", "pitch": "-15Hz"},       # សាស្ត្រាចារ្យ ច័ន្ទ (Senior Professor)
        "teacher-sokha": {"base": "km-KH-PisethNeural", "rate": "+4%", "pitch": "-4Hz"},    # លោកគ្រូ សុខា (Tech & STEM Educator)
        "teacher-bopha": {"base": "km-KH-SreymomNeural", "rate": "-2%", "pitch": "+8Hz"},   # អ្នកគ្រូ បុប្ផា (Khmer Literature Teacher)
        "monk-dhammo": {"base": "km-KH-PisethNeural", "rate": "-14%", "pitch": "-18Hz"},    # ព្រះតេជគុណ ធម្មរង្សី (Peaceful Dhamma Talk)
        "news-sopheap": {"base": "km-KH-SreymomNeural", "rate": "+8%", "pitch": "+12Hz"},   # កញ្ញា សុភាព (Professional Presenter)
        "biz-vaddhana": {"base": "km-KH-PisethNeural", "rate": "+6%", "pitch": "-6Hz"},     # លោក វឌ្ឍនា (Entrepreneur / Executive)
        "youth-dara": {"base": "km-KH-PisethNeural", "rate": "+10%", "pitch": "+14Hz"},     # យុវជន តារា (Energetic Modern Youth)
        "young-devi": {"base": "km-KH-SreymomNeural", "rate": "+5%", "pitch": "+24Hz"},     # កុមារី ទេវី (Curious Young Learner)
        "grandpa-kong": {"base": "km-KH-PisethNeural", "rate": "-15%", "pitch": "-25Hz"},   # លោកតា គង់ (Elder Historian & Storyteller)
        "grandma-mao": {"base": "km-KH-SreymomNeural", "rate": "-12%", "pitch": "-10Hz"},   # លោកយាយ ម៉ៅ (Gentle Folk Storyteller)
        # Custom Professor Alias
        "custom-professor": {"base": "km-KH-PisethNeural", "rate": "-8%", "pitch": "-15Hz"},
    }

    voice_id = req.voice or ("km-KH-PisethNeural" if has_khmer else "en-US-AvaNeural")
    profile = voice_profiles.get(voice_id, {
        "base": voice_id if "Neural" in voice_id else ("km-KH-PisethNeural" if has_khmer else "en-US-AvaNeural"),
        "rate": "+0%",
        "pitch": "+0Hz",
    })
    base_voice = profile["base"]
    voice_rate = profile["rate"]
    voice_pitch = profile["pitch"]

    try:
        # 1. High-fidelity Microsoft Neural Voice synthesis with Persona Pitch & Rate
        comm = edge_tts.Communicate(clean_text, voice=base_voice, rate=voice_rate, pitch=voice_pitch)
        audio_buffer = bytearray()
        async for chunk in comm.stream():
            if chunk["type"] == "audio":
                audio_buffer.extend(chunk["data"])
        
        if audio_buffer:
            return Response(
                content=bytes(audio_buffer),
                media_type="audio/mpeg",
                headers={"Content-Disposition": "inline; filename=speech.mp3"},
            )
    except Exception as e:
        logger.warning("Neural TTS failed with voice=%s: %s, falling back to gTTS", voice, e)

    # 2. Fallback to gTTS if Neural service is unreachable
    try:
        fp = io.BytesIO()
        lang_code = "km" if has_khmer else "en"
        tts = gTTS(text=clean_text, lang=lang_code, slow=False)
        tts.write_to_fp(fp)
        fp.seek(0)
        return Response(
            content=fp.getvalue(),
            media_type="audio/mpeg",
            headers={"Content-Disposition": "inline; filename=speech.mp3"},
        )
    except Exception as e2:
        logger.error("TTS fallback failed: %s", e2)
        raise HTTPException(status_code=500, detail=f"TTS synthesis error: {e2}")
