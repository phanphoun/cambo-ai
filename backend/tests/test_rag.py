"""Tests for RAG chunking + retrieval using real embeddings (model lazily loads)."""
import shutil
from pathlib import Path

import pytest

from config import settings
from services.rag_store import RagStore, chunk_text
from services import rag_service
from services.rag_context import build_context


@pytest.fixture(autouse=True)
def _clean_rag_dir():
    d = settings.rag_dir_path
    yield
    for sub in Path(d).iterdir():
        if sub.is_dir():
            shutil.rmtree(sub)


def test_chunk_text_respects_window():
    text = " ".join(f"w{i}" for i in range(400))
    chunks = chunk_text(text)
    assert 1 < len(chunks) <= 20
    for c in chunks:
        assert 0 < len(c) <= settings.rag_chunk_size + 200


def test_ingest_and_search_roundtrip():
    store = RagStore()
    meta = rag_service.ingest_text(
        "kb", "Wing Bank and ABA are leading Cambodian fintech companies.", "text", {}
    )
    assert meta["chunks"] >= 1
    hits = store.search([meta["id"]], "Cambodian fintech")
    assert hits, "expected at least one retrieval hit"
    assert hits[0]["score"] > 0.3
    assert "fintech" in hits[0]["text"].lower()


def test_build_context_produces_citations():
    retrieved = [{
        "document_id": "d1",
        "chunk_id": "d1:0000",
        "text": "Khmer New Year is in April.",
        "source_label": "holidays",
        "score": 0.91,
    }]
    out = build_context(retrieved)
    assert out["context"]
    assert out["citations"][0]["source"] == "holidays"
    assert out["citations"][0]["snippet"]
