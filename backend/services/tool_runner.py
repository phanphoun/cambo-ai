"""Agentic tool-calling loop for Gemini.

Given a user message (+ history), asks Gemini with the tool declarations. If the
model requests tool calls, we execute them via `services.tools`, feed the results
back, and repeat until the model produces a final answer (or we hit a step cap).
Records every tool call so the API can show them to the UI.
"""
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
    contents: list | dict,
    tool_decls: Optional[List[dict]] = None,
) -> Dict[str, Any]:
    """Run a tool-enabled turn. Returns {answer, tool_calls, model}.

    `contents` can be a single content dict or a list of content dicts.
    """
    from google.genai import types

    tool_decls = tool_decls or tool_registry.list_tools()
    tool_calls: List[Dict[str, Any]] = []

    config = types.GenerateContentConfig(
        temperature=settings.gemini_temperature,
        max_output_tokens=settings.gemini_max_tokens,
        system_instruction=system_instruction,
        tools=[types.Tool(function_declarations=[_to_gemini_function_decl(t) for t in tool_decls])],
    )

    # Running conversation: seed with the user turn(s).
    messages = list(contents) if isinstance(contents, list) else [contents]
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
        part_text = response.text or ""
        messages.append({"role": "model", "parts": [part_text]})
        last_text = part_text

        # Collect any function calls in this candidate.
        func_calls = []
        if candidate.content and candidate.content.parts:
            for p in candidate.content.parts:
                fc = getattr(p, "function_call", None)
                if fc is not None:
                    func_calls.append(fc)

        if not func_calls:
            break  # final natural-language answer

        # Execute and feed results back.
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
        messages.append({"role": "user", "parts": tool_parts})

    return {
        "answer": last_text,
        "tool_calls": tool_calls,
        "model": model,
    }
