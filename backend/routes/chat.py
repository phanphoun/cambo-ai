"""Chat-related routes: single Q&A, streaming, conversational, multimodal, RAG, tools."""
import logging
import httpx
from typing import Optional
from fastapi import APIRouter, HTTPException
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
    if "429" in msg or "RESOURCE_EXHAUSTED" in msg or "quota" in msg.lower():
        return HTTPException(status_code=429, detail="API quota exceeded. Try again later.")
    if "401" in msg or "API key" in msg or "PERMISSION_DENIED" in msg:
        return HTTPException(status_code=401, detail="Invalid API key. Check your .env file.")
    if "Connection refused" in msg or "ConnectError" in msg:
        return HTTPException(status_code=503, detail="Provider unreachable. Make sure Ollama is running (localhost:11434).")
    if "Embedding model unavailable" in msg:
        return HTTPException(status_code=503, detail="RAG embeddings unavailable — embedding model is not loaded.")
    if isinstance(e, httpx.ReadTimeout):
        return HTTPException(status_code=504, detail="Model response timed out. The cloud model may still be loading — try again.")
    if isinstance(e, RuntimeError):
        return HTTPException(status_code=500, detail=str(e))
    logger.exception("Unhandled chat error")
    return HTTPException(status_code=500, detail=f"Chat error: {str(e)}")


def _retrieve_rag(req: ChatRequest) -> dict:
    if not req.document_ids:
        return {"context": "", "citations": []}
    try:
        hits = rag_store.search(req.document_ids, req.message)
    except Exception as e:
        logger.warning("RAG retrieval failed: %s", e)
        return {"context": "", "citations": []}
    return build_context(hits)


@router.post("/ask", response_model=Answer)
async def ask(q: Question):
    try:
        result = await provider_manager.ask(q.question)
        return Answer(**result)
    except Exception as e:
        raise _ai_error(e) from e


@router.post("/chat/stream")
async def chat_stream(req: ChatRequest):
    async def generate():
        try:
            session_id = req.session_id or chat_history.create_session()
            history = chat_history.get_history(session_id)
            chat_history.add_message(session_id, "user", req.message)

            rag = _retrieve_rag(req)
            provider = req.provider or settings.default_provider

            full_answer = []
            async for chunk in provider_manager.ask_stream(
                req.message,
                history=history,
                mode=req.mode,
                provider=provider,
                image_data=req.image_data,
                image_urls=[str(u) for u in req.image_urls],
                rag_context=rag["context"] or None,
            ):
                full_answer.append(chunk)
                yield f"data: {chunk}\n\n"

            answer = "".join(full_answer)
            chat_history.add_message(session_id, "assistant", answer)
            yield "data: [DONE]\n\n"
        except Exception as e:
            exc = _ai_error(e)
            yield f"data: Error: {exc.detail}\n\n"

    return StreamingResponse(generate(), media_type="text/event-stream")


@router.post("/chat", response_model=ChatResponse)
async def chat(req: ChatRequest):
    try:
        session_id = req.session_id or chat_history.create_session()
        history = chat_history.get_history(session_id)
        chat_history.add_message(session_id, "user", req.message)

        # RAG grounding
        rag = _retrieve_rag(req)
        provider = req.provider or settings.default_provider

        result = await provider_manager.ask(
            req.message, history=history, mode=req.mode, provider=provider,
            image_data=req.image_data, image_urls=[str(u) for u in req.image_urls],
            rag_context=rag["context"] or None, use_tools=req.use_tools,
        )

        chat_history.add_message(session_id, "assistant", result["answer"])
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
