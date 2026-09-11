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
    "cambodia_knowledge_lookup",
    "Lookup verified encyclopedia facts about Cambodia including historical eras (Angkor, Funan, Chenla), "
    "kings, temples, 25 provinces, UNESCO heritage, traditional festivals (Khmer New Year, Pchum Ben, Bon Om Touk), "
    "cuisine recipes, Khmer linguistics, and Bakong fintech.",
    {
        "type": "object",
        "properties": {
            "query": {
                "type": "string",
                "description": "Topic or keyword, e.g. 'Angkor Wat', 'Pchum Ben', 'Fish Amok', 'Bakong', 'Siem Reap', 'Jayavarman VII'."
            }
        },
        "required": ["query"],
    },
)
def cambodia_knowledge_lookup(query: str) -> str:
    import json
    from pathlib import Path
    data_file = Path(__file__).resolve().parent.parent / "data" / "cambodia_encyclopedia.json"
    if not data_file.exists():
        return "[error] Cambodia encyclopedia data file is missing."
    try:
        encyclopedia = json.loads(data_file.read_text(encoding="utf-8"))
    except Exception as e:
        return f"[error] Encyclopedia unavailable: {e}"

    q = query.lower().strip()
    results = []

    # Search History
    for era in encyclopedia.get("history", []):
        hay = json.dumps(era, ensure_ascii=False).lower()
        if q in hay or any(tok in hay for tok in q.split()):
            results.append(f"[History: {era.get('era')} ({era.get('period')})]\n{era.get('summary')}\nKey Figures: {', '.join(era.get('key_figures', []))}\nSignificance: {era.get('significance')}")

    # Search Geography & Provinces
    geo = encyclopedia.get("geography_provinces", {})
    cap = geo.get("capital", {})
    if q in json.dumps(cap, ensure_ascii=False).lower() or any(tok in json.dumps(cap, ensure_ascii=False).lower() for tok in q.split()):
        results.append(f"[Capital: {cap.get('name')}]\n{cap.get('geography')}\nLandmarks: {', '.join(cap.get('landmarks', []))}\nRole: {cap.get('role')}")

    for prov in geo.get("provinces", []):
        hay = json.dumps(prov, ensure_ascii=False).lower()
        if q in hay or any(tok in hay for tok in q.split() if len(tok) > 2):
            results.append(f"[Province: {prov.get('name')}]\n{prov.get('highlights')}")

    # Search UNESCO Heritage
    for t in encyclopedia.get("unesco_heritage", {}).get("tangible", []):
        hay = json.dumps(t, ensure_ascii=False).lower()
        if q in hay or any(tok in hay for tok in q.split() if len(tok) > 2):
            results.append(f"[UNESCO Tangible: {t.get('site')} ({t.get('year')})]\n{t.get('description')}")

    for i in encyclopedia.get("unesco_heritage", {}).get("intangible", []):
        hay = json.dumps(i, ensure_ascii=False).lower()
        if q in hay or any(tok in hay for tok in q.split() if len(tok) > 2):
            results.append(f"[UNESCO Intangible: {i.get('element')} ({i.get('year')})]\n{i.get('description')}")

    # Search Culture & Festivals
    for fest in encyclopedia.get("culture_and_festivals", []):
        hay = json.dumps(fest, ensure_ascii=False).lower()
        if q in hay or any(tok in hay for tok in q.split() if len(tok) > 2):
            rituals_text = json.dumps(fest.get('rituals'), ensure_ascii=False) if isinstance(fest.get('rituals'), list) else fest.get('rituals')
            results.append(f"[Festival: {fest.get('name')} - Timing: {fest.get('timing')}]\nRituals: {rituals_text}")

    # Search Culinary
    for dish in encyclopedia.get("culinary_treasures", []):
        hay = json.dumps(dish, ensure_ascii=False).lower()
        if q in hay or any(tok in hay for tok in q.split() if len(tok) > 2):
            results.append(f"[Cuisine: {dish.get('dish')}]\n{dish.get('description')}")

    # Search Fintech
    fintech = encyclopedia.get("fintech_and_digital_economy", {})
    if q in json.dumps(fintech, ensure_ascii=False).lower() or any(tok in json.dumps(fintech, ensure_ascii=False).lower() for tok in q.split() if len(tok) > 2):
        bakong = fintech.get("bakong_system", {})
        results.append(f"[Fintech Bakong System]\nTechnology: {bakong.get('technology')}\nSignificance: {bakong.get('significance')}\nCross-border: {bakong.get('cross_border_interoperability')}")

    # Search Language
    lang = encyclopedia.get("khmer_language_linguistics", {})
    if q in json.dumps(lang, ensure_ascii=False).lower() or any(tok in json.dumps(lang, ensure_ascii=False).lower() for tok in q.split() if len(tok) > 2):
        results.append(f"[Khmer Linguistics]\nOverview: {lang.get('alphabet_overview')}\nConsonants: {lang.get('consonants')}\nVowels: {lang.get('vowels')}\nRegisters: {lang.get('registers_politeness')}")

    if not results:
        return f"No specific encyclopedia entry found for '{query}'. You may use general knowledge or web research."

    return "\n\n".join(results[:5])


def _safe_calc_eval(node, env):
    import ast
    if isinstance(node, ast.Expression):
        return _safe_calc_eval(node.body, env)
    if isinstance(node, ast.Constant):
        if isinstance(node.value, (int, float)):
            return node.value
        raise ValueError("Only numbers allowed.")
    if isinstance(node, ast.Name):
        if node.id in env:
            return env[node.id]
        raise ValueError(f"Unknown symbol: {node.id}")
    if isinstance(node, ast.UnaryOp):
        val = _safe_calc_eval(node.operand, env)
        if isinstance(node.op, ast.UAdd):
            return +val
        if isinstance(node.op, ast.USub):
            return -val
    if isinstance(node, ast.BinOp):
        left = _safe_calc_eval(node.left, env)
        right = _safe_calc_eval(node.right, env)
        if isinstance(node.op, ast.Add):
            return left + right
        if isinstance(node.op, ast.Sub):
            return left - right
        if isinstance(node.op, ast.Mult):
            return left * right
        if isinstance(node.op, ast.Div):
            return left / right
        if isinstance(node.op, ast.FloorDiv):
            return left // right
        if isinstance(node.op, ast.Mod):
            return left % right
        if isinstance(node.op, ast.Pow):
            return left ** right
    if isinstance(node, ast.Call):
        func = _safe_calc_eval(node.func, env)
        if callable(func):
            args = [_safe_calc_eval(arg, env) for arg in node.args]
            return func(*args)
    raise ValueError("Unsupported mathematical syntax.")


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
    import ast
    env = {k: getattr(math, k) for k in dir(math) if not k.startswith("_")}
    parsed = ast.parse(expression.strip(), mode="eval")
    result = _safe_calc_eval(parsed, env)
    return str(result)


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


def _search_ddg_lite(query: str, max_results: int = 5) -> List[Dict[str, str]]:
    """Fast resilient web search via DuckDuckGo Lite with zero API key requirement."""
    import httpx
    import re
    from urllib.parse import unquote

    headers = {
        "User-Agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Referer": "https://lite.duckduckgo.com/",
    }
    try:
        with httpx.Client(headers=headers, follow_redirects=True, timeout=8.0) as client:
            resp = client.post("https://lite.duckduckgo.com/lite/", data={"q": query})
            links = re.findall(r'<a rel="nofollow" href="([^"]+)"[^>]*>(.*?)</a>', resp.text)
            snippets = re.findall(r'<td class=[\'"]result-snippet[\'"]>(.*?)</td>', resp.text, re.DOTALL)
            
            results = []
            count = min(len(links), len(snippets), max_results)
            for i in range(count):
                raw_url, raw_title = links[i]
                title = re.sub(r'<[^>]+>', '', raw_title).strip()
                snip = re.sub(r'\s+', ' ', re.sub(r'<[^>]+>', ' ', snippets[i])).strip()
                url = raw_url
                m = re.search(r'uddg=([^&]+)', raw_url)
                if m:
                    url = unquote(m.group(1))
                results.append({"title": title, "url": url, "snippet": snip})
            return results
    except Exception:
        return []


@register_tool(
    "web_search",
    "Search the live web for official websites, social media profiles (Facebook, LinkedIn, etc.), "
    "news, companies, technical documentation, and real-time facts.",
    {
        "type": "object",
        "properties": {
            "query": {"type": "string", "description": "Search query keywords."},
            "search_depth": {
                "type": "string",
                "enum": ["basic", "advanced"],
                "description": "Depth of search.",
            },
            "max_results": {
                "type": "integer",
                "description": "Number of results to return (default: 5).",
                "minimum": 1,
                "maximum": 10,
            },
        },
        "required": ["query"],
    },
)
def web_search(query: str, search_depth: str | None = None, max_results: int | None = None) -> str:
    from config import settings
    limit = max_results or settings.tavily_max_results or 5

    # 1. Try Tavily if configured
    if settings.tavily_api_key:
        try:
            from tavily import TavilyClient
            client = TavilyClient(api_key=settings.tavily_api_key)
            depth = search_depth or settings.tavily_search_depth or "basic"
            result = client.search(query, search_depth=depth, max_results=limit)
            hits = result.get("results") or []
            if hits:
                out = []
                for i, hit in enumerate(hits[:limit], start=1):
                    title = hit.get("title") or "(untitled)"
                    url = hit.get("url") or ""
                    snippet = (hit.get("content") or "").strip()
                    out.append(f"{i}. {title}\n   URL: {url}\n   Snippet: {snippet}")
                return "\n\n".join(out)
        except Exception:
            pass

    # 2. Fallback to resilient web search
    ddg_hits = _search_ddg_lite(query, max_results=limit)
    if ddg_hits:
        out = []
        for i, hit in enumerate(ddg_hits, start=1):
            out.append(f"{i}. {hit['title']}\n   URL: {hit['url']}\n   Snippet: {hit['snippet']}")
        return "\n\n".join(out)

    return "No web search results found."


# ------------------------------------------------------------------
# Tool 5: Document Generation Engine (PDF, Word, Markdown, CSV)
# ------------------------------------------------------------------
@register_tool(
    name="generate_document",
    description="Generate a downloadable document file (PDF, Word .docx, Markdown .md, or CSV) for the user. Use this whenever the user asks to create, export, download, or generate a document, report, proposal, summary, or file.",
    parameters={
        "type": "object",
        "properties": {
            "title": {
                "type": "string",
                "description": "The title of the document (e.g. 'Cambodia Tech Startup Ecosystem Report 2026')",
            },
            "format": {
                "type": "string",
                "enum": ["pdf", "docx", "md", "csv"],
                "description": "File format to generate: 'pdf' for PDF reports, 'docx' for Word documents, 'md' for Markdown, 'csv' for spreadsheets.",
            },
            "content": {
                "type": "string",
                "description": "The structured content of the document. Use standard markdown headers (#, ##, ###), bullet points (-), and clean paragraphs.",
            },
            "subtitle": {
                "type": "string",
                "description": "Optional subtitle or metadata tagline.",
            },
        },
        "required": ["title", "format", "content"],
    },
)
def generate_document(title: str, format: str, content: str, subtitle: str | None = None) -> str:
    from services.doc_generator import doc_generator

    fmt = format.lower().strip()
    if fmt == "pdf":
        meta = doc_generator.generate_pdf(title=title, content=content, subtitle=subtitle)
    elif fmt in ("docx", "doc", "word"):
        meta = doc_generator.generate_docx(title=title, content=content)
    elif fmt in ("csv", "excel"):
        meta = doc_generator.generate_csv(title=title, content=content)
    else:
        meta = doc_generator.generate_markdown(title=title, content=content)

    return (
        f"[DOCUMENT_GENERATED]\n"
        f"Title: {meta['title']}\n"
        f"Format: {meta['format'].upper()}\n"
        f"Filename: {meta['filename']}\n"
        f"Size: {meta['size_formatted']}\n"
        f"The document '{meta['filename']}' ({meta['size_formatted']}) has been generated successfully and is ready for download."
    )


@register_tool(
    "generate_image",
    "Generate an ultra-realistic, high-definition 8K raw photographic image from a prompt. "
    "Features authentic Cambodian cultural rendering (traditional silk Sampot Hol, Sbai, Angkor Wat sandstone, natural skin texture, golden hour lighting) "
    "powered by the Flux.1 Realism engine. Supports both Khmer and English prompts.",
    {
        "type": "object",
        "properties": {
            "prompt": {
                "type": "string",
                "description": "The visual prompt for the image to generate (in Khmer or English).",
            },
            "aspect_ratio": {
                "type": "string",
                "enum": ["1:1", "16:9", "9:16", "4:3", "3:4"],
                "description": "Aspect ratio of the generated image: '1:1' for square/portraits, '16:9' for landscapes, '9:16' for phone wallpapers, '4:3' for standard photos. Default is '1:1'.",
            },
        },
        "required": ["prompt"],
    },
)
async def generate_image(prompt: str, aspect_ratio: str = "1:1") -> str:
    from services.image_service import image_service
    res = await image_service.generate_image(prompt=prompt, aspect_ratio=aspect_ratio)
    if res.get("success"):
        return res["markdown"]
    return f"[image error] {res.get('error', 'Failed to generate realistic image')}"


@register_tool(
    "edit_image",
    "Edit or transform an uploaded reference image into an ultra-realistic photographic masterpiece based on user instructions "
    "(e.g. change outfit to royal Khmer silk Sampot, adjust background to sunset Angkor Wat, enhance lighting, add authentic traditional elements).",
    {
        "type": "object",
        "properties": {
            "prompt": {
                "type": "string",
                "description": "The edit instructions describing how to transform the image.",
            },
            "aspect_ratio": {
                "type": "string",
                "enum": ["1:1", "16:9", "9:16", "4:3", "3:4"],
                "description": "Target aspect ratio.",
            },
        },
        "required": ["prompt"],
    },
)
async def edit_image(prompt: str, aspect_ratio: str = "1:1") -> str:
    from services.image_service import image_service
    res = await image_service.generate_image(prompt=prompt, aspect_ratio=aspect_ratio)
    if res.get("success"):
        return res["markdown"]
    return f"[image error] {res.get('error', 'Failed to edit image')}"


@register_tool(
    "khmer_calendar_lookup",
    "Lookup Cambodian real-time date and time (ICT UTC+7 Phnom Penh), convert between Gregorian and Khmer Lunisolar Calendar (Chhankitek ចន្ទគតិ), "
    "check Buddhist holy days (ថ្ងៃសីល - 8th/15th waxing/waning), moon phases (ខ្នើត/រនោច), 12 Zodiac Animal years (ឆ្នាំជូត...កុរ), "
    "10 Sak eras (ឯកស័ក...សំរឹទ្ធិស័ក), Buddhist Era (ព.ស.), and traditional Khmer festivals (ចូលឆ្នាំខ្មែរ, ភ្ជុំបិណ្ឌ, អុំទូក, វិសាខបូជា, មាឃបូជា).",
    {
        "type": "object",
        "properties": {
            "query_type": {
                "type": "string",
                "enum": ["today", "next_holy_day", "convert_date"],
                "description": "Type of query: 'today' for today's complete Cambodian calendar and time, 'next_holy_day' for upcoming ថ្ងៃសីល, 'convert_date' for a specific date.",
            },
            "date": {
                "type": "string",
                "description": "Optional specific ISO date (YYYY-MM-DD) e.g. '2026-09-07' or '2026-10-10'. Defaults to today in Cambodia.",
            },
        },
    },
)
def khmer_calendar_lookup(query_type: str = "today", date: Optional[str] = None) -> str:
    from services.khmer_calendar import (
        get_current_khmer_calendar_context,
        calculate_khmer_lunar,
        find_next_holy_day,
    )
    from datetime import date as dt_date

    if query_type == "next_holy_day":
        nxt = find_next_holy_day()
        if nxt:
            return (
                f"ថ្ងៃសីលបន្ទាប់គឺ៖ {nxt['lunar_str_kh']}\n"
                f"ត្រូវនឹងថ្ងៃសុរិយគតិ៖ {nxt['solar_str_kh']} ({nxt['gregorian_date']})\n"
                f"ប្រភេទថ្ងៃសីល៖ {nxt['holy_day_label']}\n"
                f"រយៈពេល៖ នៅសល់ {nxt['days_away']} ថ្ងៃទៀត។"
            )
        return "មិនអាចរកឃើញថ្ងៃសីលក្នុងអំឡុង ៣០ ថ្ងៃខាងមុខ។"

    if date:
        try:
            parsed_date = dt_date.fromisoformat(date)
            res = calculate_khmer_lunar(parsed_date)
            holy_txt = f"\n• ស្ថានភាពថ្ងៃសីល៖ {res['holy_day_label']}" if res['is_holy_day'] else "\n• ស្ថានភាពថ្ងៃសីល៖ មិនមែនជាថ្ងៃសីល"
            obs_txt = f"\n• ពិធីបុណ្យប្រពៃណី៖ {res['observance']}" if res.get('observance') else ""
            return (
                f"=== KHMER CALENDAR CONVERSION FOR {date} ===\n"
                f"• កាលបរិច្ឆេទសុរិយគតិ៖ {res['solar_str_kh']} ({res['day_en']})\n"
                f"• កាលបរិច្ឆេទចន្ទគតិ៖ {res['lunar_str_kh']}\n"
                f"• ដំណាក់កាលព្រះចន្ទ៖ {res['moon_phase']}"
                f"{holy_txt}{obs_txt}\n"
                f"• ឆ្នាំសត្វ៖ ឆ្នាំ{res['zodiac_year']} | ស័ក៖ {res['stem']} | ពុទ្ធសករាជ៖ {res['lunar_year_be']}"
            )
        except Exception as e:
            return f"[error] invalid date format '{date}': {e}. Please use YYYY-MM-DD."

    return get_current_khmer_calendar_context()


