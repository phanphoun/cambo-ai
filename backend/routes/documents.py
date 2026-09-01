"""Document ingestion + management routes for RAG.

Ingestion runs embedding in a threadpool (CPU-bound) so it doesn't block the
event loop. File uploads are size-limited; URL ingestion fetches over httpx.
"""
import logging
from typing import Optional
from pathlib import Path
from pydantic import BaseModel, Field

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


class GenerateDocRequest(BaseModel):
    title: str = Field(..., min_length=2, max_length=200)
    format: str = Field("pdf", description="pdf, docx, md, csv")
    content: str = Field(..., min_length=1)
    subtitle: Optional[str] = None


@router.post("/generate")
async def generate_document_endpoint(payload: GenerateDocRequest):
    """Generate a document (PDF, Word, Markdown, CSV) directly via REST API."""
    from services.doc_generator import doc_generator

    fmt = payload.format.lower().strip()
    try:
        if fmt == "pdf":
            meta = doc_generator.generate_pdf(
                title=payload.title,
                content=payload.content,
                subtitle=payload.subtitle,
            )
        elif fmt in ("docx", "doc", "word"):
            meta = doc_generator.generate_docx(
                title=payload.title,
                content=payload.content,
            )
        elif fmt in ("csv", "excel"):
            meta = doc_generator.generate_csv(
                title=payload.title,
                content=payload.content,
            )
        else:
            meta = doc_generator.generate_markdown(
                title=payload.title,
                content=payload.content,
            )
        return meta
    except Exception as e:
        logger.exception("Document generation failed: %s", e)
        raise HTTPException(status_code=500, detail=f"Failed to generate document: {e}")


@router.get("/generated/{doc_id}")
async def download_generated_document(doc_id: str):
    """Download a generated document file."""
    from fastapi.responses import FileResponse
    from services.doc_generator import doc_generator

    meta = doc_generator.get_document(doc_id)
    if not meta:
        raise HTTPException(status_code=404, detail="Generated document not found")

    file_path = doc_generator.get_document_path(doc_id)
    if not file_path or not file_path.exists():
        raise HTTPException(status_code=404, detail="Document file missing on disk")

    filename = meta.get("filename", f"{doc_id}.{meta.get('format', 'bin')}")
    media_types = {
        "pdf": "application/pdf",
        "docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "md": "text/markdown; charset=utf-8",
        "csv": "text/csv; charset=utf-8",
    }
    media_type = media_types.get(meta.get("format", ""), "application/octet-stream")

    return FileResponse(
        path=str(file_path),
        filename=filename,
        media_type=media_type,
    )


@router.get("/generated/{doc_id}/meta")
async def get_generated_document_meta(doc_id: str):
    """Get metadata for a generated document."""
    from services.doc_generator import doc_generator

    meta = doc_generator.get_document(doc_id)
    if not meta:
        raise HTTPException(status_code=404, detail="Generated document not found")
    return meta


async def _run_in_thread(fn, *args):
    from fastapi.concurrency import run_in_threadpool
    return await run_in_threadpool(fn, *args)
