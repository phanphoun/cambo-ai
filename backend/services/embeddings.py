"""Lazy-loaded sentence-transformers wrapper.

The first call to `embed()` loads the model (~80MB on disk) and warms up.
Importing this module is cheap; only embedding calls pay the cost.
"""
from __future__ import annotations
import threading
from typing import List, Optional
import numpy as np

from config import settings


_model_lock = threading.Lock()
_model = None
_model_name: Optional[str] = None
_model_error: Optional[str] = None


def _load():
    global _model, _model_name, _model_error
    with _model_lock:
        if _model is not None:
            return _model
        try:
            from sentence_transformers import SentenceTransformer  # heavy import
            try:
                _model = SentenceTransformer(settings.embedding_model, local_files_only=True)
            except Exception:
                _model = SentenceTransformer(settings.embedding_model)
            _model_name = settings.embedding_model
            return _model
        except Exception as e:  # pragma: no cover — depends on env
            _model_error = f"{type(e).__name__}: {e}"
            return None


def is_ready() -> bool:
    return _model is not None


def status() -> dict:
    return {
        "model": _model_name or settings.embedding_model,
        "loaded": _model is not None,
        "error": _model_error,
    }


def warm_up() -> bool:
    """Pre-load the embedding model. Returns True on success."""
    m = _load()
    if m is None:
        return False
    # tiny warm-up
    try:
        m.encode(["warmup"], normalize_embeddings=True)
        return True
    except Exception as e:  # pragma: no cover
        _model_error = f"warmup failed: {e}"
        return False


def embed(texts: List[str]) -> np.ndarray:
    """Encode a list of texts into a (N, D) float32 matrix, L2-normalized."""
    if not texts:
        return np.zeros((0, 384), dtype=np.float32)
    m = _load()
    if m is None:
        raise RuntimeError(
            f"Embedding model unavailable ({_model_error}). "
            "Run `uv run python -c 'from services.embeddings import warm_up; warm_up()'` "
            "to see the underlying error."
        )
    vecs = m.encode(texts, normalize_embeddings=True, convert_to_numpy=True)
    return vecs.astype(np.float32)


def embed_one(text: str) -> np.ndarray:
    return embed([text])[0]
