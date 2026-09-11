"""Agentic tool-calling loop for Gemini with proper google-genai Content types."""
from __future__ import annotations
import asyncio
import logging
from typing import List, Dict, Any, Optional

from config import settings
from services import tools as tool_registry

logger = logging.getLogger("cambo.services.tool_runner")
MAX_TOOL_ROUNDS = 4
# Some models (esp. preview/high-demand ones) can hang indefinitely instead of
# erroring out. Bound every per-model call so a stuck model fails over instead
# of blocking the request forever.
MODEL_TIMEOUT_SECONDS = 20.0


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
    contents: Optional[list | Any] = None,
    tool_decls: Optional[List[dict]] = None,
    user_message: Optional[str] = None,
    history: Optional[List[Dict[str, Any]]] = None,
) -> Dict[str, Any]:
    """Run a tool-enabled turn with automatic model fallback for 503/429/high-demand. Returns {answer, tool_calls, model}."""
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
    if contents is not None:
        if isinstance(contents, list):
            base_messages = list(contents)
        else:
            base_messages = [contents]
    else:
        base_messages = []
        if history:
            for turn in history[-10:]:
                role = turn.get("role", "user")
                text = turn.get("content", "")
                base_messages.append(types.Content(role=role, parts=[types.Part.from_text(text=text)]))
        if user_message:
            base_messages.append(types.Content(role="user", parts=[types.Part.from_text(text=user_message)]))

    models_to_try = [model, "gemini-3.5-flash-lite", "gemini-3.1-flash-lite", "gemma-4-31b-it", "gemini-3.5-flash", "gemini-3.6-flash"]
    unique_models = list(dict.fromkeys(models_to_try))

    last_err = None
    for active_model in unique_models:
        messages = list(base_messages)
        last_text = ""
        try:
            for _round in range(MAX_TOOL_ROUNDS):
                response = await asyncio.wait_for(
                    client.aio.models.generate_content(
                        model=active_model,
                        contents=messages,
                        config=config,
                    ),
                    timeout=MODEL_TIMEOUT_SECONDS,
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
                "model": active_model,
            }
        except asyncio.TimeoutError as e:
            last_err = e
            logger.warning("Tool execution on model %s timed out after %ss, trying next fallback...", active_model, MODEL_TIMEOUT_SECONDS)
            continue
        except Exception as e:
            last_err = e
            err_str = str(e).lower()
            if any(k in err_str for k in ["503", "429", "404", "resource_exhausted", "quota", "unavailable", "high demand", "overloaded"]):
                logger.warning("Tool execution on model %s failed (%s), trying next fallback...", active_model, e)
                continue
            raise e

    if last_err:
        raise last_err
    return {
        "answer": "",
        "tool_calls": [],
        "model": model,
    }
