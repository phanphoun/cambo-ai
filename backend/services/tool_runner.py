"""Agentic tool-calling loop for Gemini with proper google-genai Content types."""
from __future__ import annotations
from typing import List, Dict, Any, Optional

from config import settings
from services import tools as tool_registry

MAX_TOOL_ROUNDS = 4


def _to_gemini_function_decl(td: dict) -> dict:
    return {
        "name": td["name"],
        "description": td["description"],
        "parameters": td["parameters"],
    }


async def run_with_tools(
    client,
    model: str,
    system_instruction: str,
    contents: list | Any,
    tool_decls: Optional[List[dict]] = None,
) -> Dict[str, Any]:
    """Run a tool-enabled turn. Returns {answer, tool_calls, model}."""
    from google.genai import types

    tool_decls = tool_decls or tool_registry.list_tools()
    tool_calls: List[Dict[str, Any]] = []

    config = types.GenerateContentConfig(
        temperature=settings.gemini_temperature,
        max_output_tokens=settings.gemini_max_tokens,
        system_instruction=system_instruction,
        tools=[types.Tool(function_declarations=[_to_gemini_function_decl(t) for t in tool_decls])],
    )

    # Normalize messages to list of Content
    if isinstance(contents, list):
        messages = list(contents)
    else:
        messages = [contents]

    last_text = ""

    for _round in range(MAX_TOOL_ROUNDS):
        response = await client.aio.models.generate_content(
            model=model,
            contents=messages,
            config=config,
        )
        if not response.candidates:
            break

        candidate = response.candidates[0]
        if candidate.content:
            messages.append(candidate.content)

        part_text = response.text or ""
        if part_text:
            last_text = part_text

        # Collect any function calls in this candidate.
        func_calls = []
        if candidate.content and candidate.content.parts:
            for p in candidate.content.parts:
                fc = getattr(p, "function_call", None)
                if fc is not None:
                    func_calls.append(fc)

        if not func_calls:
            break  # final answer reached

        # Execute tools and feed results back as User Content turn
        tool_parts = []
        for call in func_calls:
            name = call.name
            args = dict(call.args or {})
            result = await tool_registry.run_tool(name, args)
            tool_calls.append({
                "name": name,
                "args": args,
                "result_preview": result[:300],
            })
            tool_parts.append(
                types.Part(
                    function_response=types.FunctionResponse(name=name, response={"result": result})
                )
            )
            # If the tool is generate_document, save its text output
            if name == "generate_document":
                last_text = result

        messages.append(types.Content(role="user", parts=tool_parts))

    return {
        "answer": last_text,
        "tool_calls": tool_calls,
        "model": model,
    }
