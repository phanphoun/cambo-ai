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
        return Answer(**result)
    except Exception as e:
        raise _ai_error(e) from e


@router.post("/chat/stream")
async def chat_stream(req: ChatRequest, authorization: Optional[str] = Header(None)):
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
                rag_context=rag["context"] or None,
            ):
                full_answer.append(chunk)
                yield f"data: {json.dumps({'content': chunk})}\n\n"

            elapsed_ms = (time.perf_counter() - start_t) * 1000
            answer = "".join(full_answer)
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
async def chat(req: ChatRequest, authorization: Optional[str] = Header(None)):
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
        )
        elapsed_ms = (time.perf_counter() - start_t) * 1000

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
    # 8. Phoneticize common acronyms for natural human Khmer pronunciation
    has_khmer = bool(re.search(r"[\u1780-\u17FF]", t))
    if has_khmer:
        t = re.sub(r"\bSastra AI\b", "សាស្ត្រា អេអាយ", t, flags=re.IGNORECASE)
        t = re.sub(r"\bAI\b", "អេអាយ", t, flags=re.IGNORECASE)
        t = re.sub(r"\bKHQR\b", "ខេអេក្យូអ័រ", t, flags=re.IGNORECASE)
        t = re.sub(r"\bUSD\b", "ដុល្លារ", t, flags=re.IGNORECASE)
        t = re.sub(r"\bKHR\b", "រៀល", t, flags=re.IGNORECASE)
        t = re.sub(r"\bUNESCO\b", "យូណេស្កូ", t, flags=re.IGNORECASE)
        t = re.sub(r"\bNBC\b", "ធនាគារជាតិ", t, flags=re.IGNORECASE)
        t = re.sub(r"\bCADT\b", "បណ្ឌិត្យសភាបច្ចេកវិទ្យាឌីជីថល", t, flags=re.IGNORECASE)
    # 9. Clean extra whitespace
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
    
    # Select best neural voice
    if has_khmer:
        # km-KH-PisethNeural (friendly natural Khmer male voice)
        # or km-KH-SreymomNeural (friendly natural Khmer female voice)
        voice = req.voice or "km-KH-PisethNeural"
    else:
        voice = req.voice or "en-US-AvaNeural"

    try:
        # 1. High-fidelity Microsoft Neural Voice synthesis (Real human sound)
        comm = edge_tts.Communicate(clean_text, voice=voice, rate="+0%", pitch="+0Hz")
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
