"""RAG ingestion: extract text from PDF/URL/markdown, chunk, embed, persist.

This is a thin orchestration layer over `rag_store` + `embeddings`.
Long-running CPU work (embedding) is meant to be called via FastAPI's
`run_in_threadpool` from the route handlers.
"""
from __future__ import annotations
import re
from typing import List, Optional

import httpx

from config import settings
from services.rag_store import RagStore, chunk_text, rag_store
from services.embeddings import embed


_URL_CLEAN_RE = re.compile(r"\s+", re.MULTILINE)


def _clean_text(text: str) -> str:
    text = text.replace("\u00a0", " ")
    text = _URL_CLEAN_RE.sub(" ", text)
    text = re.sub(r"\n{3,}", "\n\n", text)
    return text.strip()


def extract_text_from_pdf_bytes(data: bytes) -> str:
    import io
    from pypdf import PdfReader
    reader = PdfReader(io.BytesIO(data))
    parts = []
    for page in reader.pages:
        try:
            parts.append(page.extract_text() or "")
        except Exception:
            parts.append("")
    return _clean_text("\n\n".join(parts))


def extract_text_from_markdown(text: str) -> str:
    # Strip code fences' noise but keep headings as context.
    return _clean_text(text)


def extract_text_from_url(url: str) -> str:
    timeout = settings.web_fetch_timeout_seconds
    max_chars = settings.web_fetch_max_chars
    headers = {"User-Agent": settings.web_fetch_user_agent, "Accept": "text/html,text/markdown,*/*"}
    with httpx.Client(timeout=timeout, follow_redirects=True) as client:
        resp = client.get(str(url), headers=headers)
        resp.raise_for_status()
        ctype = resp.headers.get("content-type", "")
        body = resp.text
    if "application/json" in ctype or url.endswith(".json"):
        return _clean_text(body[:max_chars])
    # Lightweight HTML -> text (no heavy deps): strip tags.
    if "<" in body[:200] or "text/html" in ctype:
        body = re.sub(r"(?is)<(script|style|head).*?</\1>", " ", body)
        body = re.sub(r"(?is)<[^>]+>", " ", body)
        body = re.sub(r"&nbsp;", " ", body)
        body = re.sub(r"&amp;", "&", body)
        body = re.sub(r"&lt;", "<", body)
        body = re.sub(r"&gt;", ">", body)
    return _clean_text(body[:max_chars])


def ingest_text(name: str, text: str, source_type: str = "text", metadata: Optional[dict] = None) -> dict:
    text = _clean_text(text)
    if not text:
        raise ValueError("Empty document text after cleaning.")
    chunks = chunk_text(text)
    if not chunks:
        raise ValueError("No chunks produced from document.")
    vectors = embed(chunks)
    meta = rag_store.create(
        name=name,
        source_type=source_type,
        size_bytes=len(text.encode("utf-8")),
        chunks=chunks,
        embeddings=vectors,
        metadata=metadata or {},
        source_label=name,
    )
    return meta.to_dict()


def ingest_pdf(name: str, data: bytes, metadata: Optional[dict] = None) -> dict:
    text = extract_text_from_pdf_bytes(data)
    if not text.strip():
        raise ValueError("Could not extract any text from the PDF (it may be scanned/image-only).")
    return ingest_text(name, text, source_type="pdf", metadata=metadata)


def ingest_url(url: str, name: Optional[str] = None, metadata: Optional[dict] = None) -> dict:
    text = extract_text_from_url(url)
    if not text.strip():
        raise ValueError("Could not extract any text from that URL.")
    doc_name = name or _slugify(url)
    return ingest_text(doc_name, text, source_type="url", metadata={"url": url, **(metadata or {})})


def _slugify(url: str) -> str:
    return re.sub(r"\W+", "_", str(url))[:80].strip("_") or "url_doc"
