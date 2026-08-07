"""Document ingestion + management routes for RAG.

Ingestion runs embedding in a threadpool (CPU-bound) so it doesn't block the
event loop. File uploads are size-limited; URL ingestion fetches over httpx.
"""
import logging
from pathlib import Path

from fastapi import APIRouter, UploadFile, File, HTTPException, Form
from fastapi.background import BackgroundTasks

from models.schemas import DocumentList, IngestTextRequest, IngestUrlRequest
from services import rag_service
from services.rag_store import rag_store
from services.rag_store import DocumentMetadata
from config import settings

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/documents", tags=["documents"])


def _meta_to_dict(m: DocumentMetadata) -> dict:
    return m.to_dict()


@router.get("", response_model=DocumentList)
async def list_documents():
    docs = [_meta_to_dict(d) for d in rag_store.list()]
    return {"documents": docs}


@router.get("/{doc_id}")
async def get_document(doc_id: str):
    meta = rag_store.get(doc_id)
    if not meta:
        raise HTTPException(status_code=404, detail="Document not found")
    return {"meta": _meta_to_dict(meta), "chunks": rag_store.chunks(doc_id)}


@router.delete("/{doc_id}")
async def delete_document(doc_id: str):
    if not rag_store.delete(doc_id):
        raise HTTPException(status_code=404, detail="Document not found")
    return {"message": "Document deleted", "document_id": doc_id}


@router.post("/text")
async def ingest_text(payload: IngestTextRequest):
    try:
        meta = await _run_in_thread(
            rag_service.ingest_text, payload.name, payload.text, "text", payload.metadata
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.exception("text ingest failed")
        raise HTTPException(status_code=500, detail=f"Ingestion failed: {e}")
    return _meta_to_dict(DocumentMetadata(**meta))


@router.post("/url")
async def ingest_url(payload: IngestUrlRequest):
    try:
        meta = await _run_in_thread(
            rag_service.ingest_url, str(payload.url), payload.name, payload.metadata
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.exception("url ingest failed")
        raise HTTPException(status_code=502, detail=f"Could not ingest URL: {e}")
    return _meta_to_dict(DocumentMetadata(**meta))


@router.post("/upload")
async def upload_document(
    file: UploadFile = File(...),
    name: str = Form(None),
):
    import io
    from fastapi.concurrency import run_in_threadpool

    raw = await file.read()
    if len(raw) > settings.max_document_bytes:
        raise HTTPException(
            status_code=413,
            detail=f"File too large ({len(raw)//1024//1024}MB > {settings.max_document_mb}MB).",
        )
    doc_name = name or file.filename or "uploaded_document"
    content_type = file.content_type or ""
    try:
        if "pdf" in content_type or doc_name.lower().endswith(".pdf"):
            meta = await run_in_threadpool(rag_service.ingest_pdf, doc_name, raw, {})
        else:
            text = raw.decode("utf-8", errors="ignore")
            meta = await run_in_threadpool(rag_service.ingest_text, doc_name, text, "text", {})
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.exception("upload ingest failed")
        raise HTTPException(status_code=500, detail=f"Ingestion failed: {e}")
    return _meta_to_dict(DocumentMetadata(**meta))


async def _run_in_thread(fn, *args):
    from fastapi.concurrency import run_in_threadpool
    return await run_in_threadpool(fn, *args)
