"""Tests for the tool registry: listing, execution, and arg safety."""
import asyncio

from services import tools as tool_registry


def test_tools_listed():
    names = {t["name"] for t in tool_registry.list_tools()}
    assert {"web_fetch", "cambodia_directory_search", "calculator", "rag_query"} <= names


def test_calculator_tool():
    out = asyncio.run(tool_registry.run_tool("calculator", {"expression": "2**10"}))
    assert out.strip() == "1024"


def test_calculator_rejects_names():
    out = asyncio.run(tool_registry.run_tool("calculator", {"expression": "__import__('os')"}))
    assert "error" in out.lower()


def test_directory_search_finds_fintech():
    out = asyncio.run(tool_registry.run_tool("cambodia_directory_search", {"query": "fintech"}))
    assert "Wing" in out or "ABA" in out or "Bakong" in out


def test_cambodia_knowledge_lookup():
    out = asyncio.run(tool_registry.run_tool("cambodia_knowledge_lookup", {"query": "Angkor Wat"}))
    assert "Suryavarman II" in out or "Angkor" in out

    out_food = asyncio.run(tool_registry.run_tool("cambodia_knowledge_lookup", {"query": "Fish Amok"}))
    assert "Amok" in out_food or "kroeung" in out_food.lower()


def test_unknown_tool():
    out = asyncio.run(tool_registry.run_tool("nonexistent", {}))
    assert "unknown tool" in out.lower()
