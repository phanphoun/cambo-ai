"""Tool registry for agentic / function-calling mode.

Each tool is a plain async or sync function decorated with @register_tool, with a
name, description, and a JSON-schema `parameters` block. The Gemini tool-calling
loop (tool_runner.py) reads these and executes them. Results are returned as
strings; we cap length before sending back to the model.
"""
from __future__ import annotations
import math
import json
import re
from typing import Callable, Dict, Any, List

from services.rag_store import rag_store


_TOOLS: Dict[str, dict] = {}
_RESULT_CHAR_CAP = 4000


def register_tool(name: str, description: str, parameters: dict):
    def deco(fn: Callable):
        _TOOLS[name] = {
            "name": name,
            "description": description,
            "parameters": parameters,
            "fn": fn,
        }
        return fn
    return deco


def list_tools() -> List[dict]:
    return [
        {"name": t["name"], "description": t["description"], "parameters": t["parameters"]}
        for t in _TOOLS.values()
    ]


def get_tool(name: str) -> dict | None:
    return _TOOLS.get(name)


async def run_tool(name: str, args: dict) -> str:
    tool = _TOOLS.get(name)
    if not tool:
        return f"[error] unknown tool: {name}"
    try:
        result = tool["fn"](**args)
        if hasattr(result, "__await__"):
            result = await result
        text = result if isinstance(result, str) else json.dumps(result, ensure_ascii=False, default=str)
        if len(text) > _RESULT_CHAR_CAP:
            text = text[:_RESULT_CHAR_CAP] + "\n…[truncated]"
        return text
    except Exception as e:  # surface tool errors to the model
        return f"[tool error] {type(e).__name__}: {e}"


# ------------------------------------------------------------------
# Default tools
# ------------------------------------------------------------------

@register_tool(
    "web_fetch",
    "Fetch a public web page or URL and return its cleaned text. Use to get "
    "current info, docs, or pages the user references.",
    {
        "type": "object",
        "properties": {
            "url": {"type": "string", "description": "Fully-qualified http(s) URL to fetch."}
        },
        "required": ["url"],
    },
)
def web_fetch(url: str) -> str:
    import httpx
    from config import settings
    timeout = settings.web_fetch_timeout_seconds
    headers = {"User-Agent": settings.web_fetch_user_agent, "Accept": "*/*"}
    with httpx.Client(timeout=timeout, follow_redirects=True) as client:
        resp = client.get(url, headers=headers)
        resp.raise_for_status()
        body = resp.text
    body = re.sub(r"(?is)<(script|style|head).*?</\1>", " ", body)
    body = re.sub(r"(?is)<[^>]+>", " ", body)
    body = re.sub(r"\s+", " ", body).strip()
    return body[: settings.web_fetch_max_chars]


@register_tool(
    "cambodia_directory_search",
    "Search the curated Cambodia tech & ecosystem directory for companies, hubs, "
    "government agencies, and events. Use when the user asks about Khmer tech "
    "organizations or local services.",
    {
        "type": "object",
        "properties": {
            "query": {"type": "string", "description": "Search keywords, e.g. 'fintech', 'co-working Phnom Penh'."}
        },
        "required": ["query"],
    },
)
def cambodia_directory_search(query: str) -> str:
    import json
    from pathlib import Path
    data_file = Path(__file__).resolve().parent.parent / "data" / "kh_tech_directory.json"
    if not data_file.exists():
        return "[error] Cambodia directory data file is missing."
    try:
        companies = json.loads(data_file.read_text(encoding="utf-8"))
    except Exception as e:
        return f"[error] directory unavailable: {e}"
    q = query.lower()
    hits = []
    for c in companies:
        hay = " ".join([
            c.get("name", ""),
            c.get("description", ""),
            c.get("category", ""),
            " ".join(c.get("tags", [])),
        ]).lower()
        if q in hay or any(tok in hay for tok in q.split()):
            hits.append(c)
    if not hits:
        return "No matching entries in the Cambodia directory."
    out = []
    for c in hits[:8]:
        out.append(f"- {c.get('name')} ({c.get('category')}): {c.get('description')}")
    return "\n".join(out)


@register_tool(
    "calculator",
    "Evaluate a safe arithmetic/units expression. Supports + - * / ** and math "
    "functions via Python's math module. No assignments or names.",
    {
        "type": "object",
        "properties": {
            "expression": {"type": "string", "description": "e.g. '2**10', 'sqrt(144) + 3*4'"}
        },
        "required": ["expression"],
    },
)
def calculator(expression: str) -> str:
    allowed = set("0123456789+-*/(). ")
    if not all(ch in allowed for ch in expression):
        raise ValueError("Only digits and + - * / ** ( ) . are allowed.")
    env = {k: getattr(math, k) for k in dir(math) if not k.startswith("_")}
    # strip any double-underscore names just in case
    env = {k: v for k, v in env.items() if "__" not in k}
    return str(eval(expression, {"__builtins__": {}}, env))  # noqa: S307 - restricted env


@register_tool(
    "rag_query",
    "Search the user's uploaded RAG documents for relevant passages. Use this to "
    "answer questions grounded in the documents the user has provided.",
    {
        "type": "object",
        "properties": {
            "query": {"type": "string", "description": "The search query to run over the documents."},
            "document_ids": {
                "type": "array",
                "items": {"type": "string"},
                "description": "Optional subset of document IDs to search. Omit to search all.",
            },
        },
        "required": ["query"],
    },
)
def rag_query(query: str, document_ids: list | None = None) -> str:
    ids = document_ids or [d.id for d in rag_store.list()]
    if not ids:
        return "No RAG documents are available to search."
    results = rag_store.search(ids, query)
    if not results:
        return "No relevant passages found in the documents."
    out = []
    for r in results:
        out.append(f"[{r['source_label']}] {r['text']}")
    return "\n\n".join(out)


@register_tool(
    "web_search",
    "Search the web using Tavily and return concise results with titles, URLs, and snippets. "
    "Use this for current events, live info, or anything outside the local knowledge base.",
    {
        "type": "object",
        "properties": {
            "query": {"type": "string", "description": "Search query."},
            "search_depth": {
                "type": "string",
                "enum": ["basic", "advanced"],
                "description": "Depth of search. Use 'advanced' for harder questions.",
            },
            "max_results": {
                "type": "integer",
                "description": "Number of results to return.",
                "minimum": 1,
                "maximum": 10,
            },
        },
        "required": ["query"],
    },
)
def web_search(query: str, search_depth: str | None = None, max_results: int | None = None) -> str:
    from config import settings

    if not settings.tavily_api_key:
        return "[error] Tavily is not configured. Set TAVILY_API_KEY."

    try:
        from tavily import TavilyClient
    except Exception as e:
        return f"[error] tavily client unavailable: {e}"

    client = TavilyClient(api_key=settings.tavily_api_key)
    depth = search_depth or settings.tavily_search_depth or "basic"
    limit = max_results or settings.tavily_max_results or 5
    try:
        result = client.search(query, search_depth=depth, max_results=limit)
    except Exception as e:
        return f"[tool error] tavily search failed: {e}"

    hits = result.get("results") or []
    if not hits:
        return "No web search results found."

    out = []
    for i, hit in enumerate(hits[:limit], start=1):
        title = hit.get("title") or "(untitled)"
        url = hit.get("url") or ""
        snippet = (hit.get("content") or "").strip()
        out.append(f"{i}. {title}\n   {url}\n   {snippet}")
    return "\n\n".join(out)
