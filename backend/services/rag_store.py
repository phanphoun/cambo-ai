"""Per-document RAG store with simple chunking and cosine-similarity retrieval.

Layout on disk (under settings.rag_dir_path):
    <doc_id>/
        meta.json     - {id, name, source_type, size_bytes, chunks, created_at, metadata}
        chunks.jsonl  - one JSON object per line: {chunk_id, text, source_label}
        embeddings.npz- numpy array (N, D) float32, L2-normalized

Why not FAISS: keeps zero native deps, ~thousands of chunks per doc is plenty
for a chat UI, and we can swap in faiss later behind the same interface.
"""
from __future__ import annotations
import json
import uuid
from dataclasses import dataclass, asdict
from datetime import datetime, timezone
from pathlib import Path
from typing import List, Optional, Iterable

import numpy as np

from config import settings


# ---- chunking ----

def chunk_text(
    text: str,
    chunk_size: Optional[int] = None,
    overlap: Optional[int] = None,
) -> List[str]:
    """Word-bounded sliding window over text. Avoids mid-word cuts."""
    chunk_size = chunk_size or settings.rag_chunk_size
    overlap = max(0, min(overlap if overlap is not None else settings.rag_chunk_overlap, chunk_size // 2))
    text = text.strip()
    if not text:
        return []
    words = text.split()
    if len(words) <= 1:
        return [text]
    # Approximate: 1 word ~= 1.3 chars; map chunk_size/overlap from chars to words
    approx_word_len = max(1, len(text) // max(1, len(words)))
    win = max(1, chunk_size // approx_word_len)
    step = max(1, win - max(1, overlap // approx_word_len))
    chunks: List[str] = []
    i = 0
    while i < len(words):
        piece = words[i:i + win]
        chunks.append(" ".join(piece))
        if i + win >= len(words):
            break
        i += step
    return chunks


# ---- per-document store ----

@dataclass
class DocumentMeta:
    id: str
    name: str
    source_type: str
    size_bytes: int
    chunks: int
    created_at: str
    metadata: dict

    def to_dict(self) -> dict:
        return asdict(self)


class RagStore:
    """File-backed per-document RAG index. Thread-unsafe (FastAPI sync handler OK
    if we wrap in `run_in_threadpool`; for our endpoints we call from sync paths
    after the embedding model is loaded)."""

    def __init__(self, root: Optional[Path] = None):
        self.root: Path = root or settings.rag_dir_path

    # ---- paths ----
    def _doc_dir(self, doc_id: str) -> Path:
        d = self.root / doc_id
        d.mkdir(parents=True, exist_ok=True)
        return d

    def _meta_path(self, doc_id: str) -> Path:
        return self._doc_dir(doc_id) / "meta.json"

    def _chunks_path(self, doc_id: str) -> Path:
        return self._doc_dir(doc_id) / "chunks.jsonl"

    def _emb_path(self, doc_id: str) -> Path:
        return self._doc_dir(doc_id) / "embeddings.npz"

    # ---- CRUD ----
    def list(self) -> List[DocumentMeta]:
        out: List[DocumentMeta] = []
        for d in sorted(self.root.iterdir()):
            if not d.is_dir():
                continue
            meta_p = d / "meta.json"
            if not meta_p.exists():
                continue
            try:
                data = json.loads(meta_p.read_text())
                out.append(DocumentMeta(**data))
            except Exception:
                continue
        return out

    def get(self, doc_id: str) -> Optional[DocumentMeta]:
        meta_p = self._meta_path(doc_id)
        if not meta_p.exists():
            return None
        return DocumentMeta(**json.loads(meta_p.read_text()))

    def delete(self, doc_id: str) -> bool:
        d = self.root / doc_id
        if not d.exists() or not d.is_dir():
            return False
        for p in d.iterdir():
            p.unlink()
        d.rmdir()
        return True

    def chunks(self, doc_id: str) -> List[dict]:
        p = self._chunks_path(doc_id)
        if not p.exists():
            return []
        return [json.loads(line) for line in p.read_text().splitlines() if line.strip()]

    def create(
        self,
        name: str,
        source_type: str,
        size_bytes: int,
        chunks: List[str],
        embeddings: np.ndarray,
        metadata: Optional[dict] = None,
        source_label: str = "",
        doc_id: Optional[str] = None,
    ) -> DocumentMeta:
        from services.embeddings import embed as _embed  # local import to avoid cycles
        if embeddings is None or len(embeddings) == 0:
            embeddings = _embed(chunks)
        if embeddings.shape[0] != len(chunks):
            raise ValueError("embeddings / chunks length mismatch")
        doc_id = doc_id or uuid.uuid4().hex[:12]
        meta = DocumentMeta(
            id=doc_id,
            name=name,
            source_type=source_type,
            size_bytes=size_bytes,
            chunks=len(chunks),
            created_at=datetime.now(timezone.utc).isoformat(),
            metadata=metadata or {},
        )
        d = self._doc_dir(doc_id)
        # write meta
        (d / "meta.json").write_text(json.dumps(meta.to_dict(), indent=2))
        # write chunks
        with (d / "chunks.jsonl").open("w") as f:
            for i, text in enumerate(chunks):
                f.write(json.dumps({
                    "chunk_id": f"{doc_id}:{i:04d}",
                    "text": text,
                    "source_label": source_label or name,
                }) + "\n")
        # write embeddings
        np.savez_compressed(d / "embeddings.npz", vectors=embeddings)
        return meta

    # ---- retrieval ----
    def search(self, doc_ids: Iterable[str], query: str, top_k: Optional[int] = None) -> List[dict]:
        """Returns [{chunk_id, text, source_label, score, document_id}, ...]"""
        from services.embeddings import embed_one
        top_k = top_k or settings.rag_top_k
        if not query.strip():
            return []
        q_vec = embed_one(query)
        scored: List[dict] = []
        for doc_id in doc_ids:
            emb_p = self._emb_path(doc_id)
            chunks_p = self._chunks_path(doc_id)
            if not (emb_p.exists() and chunks_p.exists()):
                continue
            try:
                data = np.load(emb_p)
                vecs = data["vectors"]
            except Exception:
                continue
            # cosine similarity (vectors are L2-normalized)
            sims = vecs @ q_vec
            order = np.argsort(-sims)[:top_k]
            chunks = self.chunks(doc_id)
            for idx in order:
                idx_i = int(idx)
                if idx_i >= len(chunks):
                    continue
                c = chunks[idx_i]
                scored.append({
                    "document_id": doc_id,
                    "chunk_id": c["chunk_id"],
                    "text": c["text"],
                    "source_label": c.get("source_label", ""),
                    "score": float(sims[idx_i]),
                })
        scored.sort(key=lambda r: r["score"], reverse=True)
        return scored[:top_k]


# Backwards-friendly alias used by route handlers.
DocumentMetadata = DocumentMeta

# Singleton — module-level so it's shared across requests.
rag_store = RagStore()
