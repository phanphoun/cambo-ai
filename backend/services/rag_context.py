"""Build a grounded-context block + citation records from RAG retrieval results."""
from __future__ import annotations
from typing import List, Dict, Any


def build_context(retrieved: List[dict]) -> Dict[str, Any]:
    """Turn raw retrieval hits into (context_string, citations)."""
    if not retrieved:
        return {"context": "", "citations": []}
    lines = []
    citations: List[Dict[str, Any]] = []
    for i, r in enumerate(retrieved, start=1):
        label = r.get("source_label") or r.get("document_id") or "source"
        snippet = r.get("text", "")
        lines.append(f"[{i}] {label}:\n{snippet}")
        citations.append({
            "document_id": r.get("document_id"),
            "chunk_id": r.get("chunk_id"),
            "source": label,
            "snippet": snippet[:280],
            "score": round(r.get("score", 0.0), 4),
        })
    context = "REFERENCE PASSAGES:\n" + "\n\n".join(lines)
    return {"context": context, "citations": citations}
