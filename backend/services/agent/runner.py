"""The agent loop.

A run is a bounded conversation with a tool-calling model over a confined
workspace. Each round the model either calls tools (which we execute and feed
back) or produces prose. The loop ends when the model calls ``finish``, stops
requesting tools, or hits the round budget.

Everything interesting is published to an ``asyncio.Queue`` as a typed event, so
the HTTP layer can stream the run to the UI live over SSE.
"""
from __future__ import annotations

import asyncio
import json
import logging
import time
import uuid
from typing import Any, AsyncGenerator, Dict, List, Optional

from config import settings
from services.agent.patches import PatchStore
from services.agent.plan import Plan
from services.agent.prompts import build_agent_prompt
from services.agent.toolset import build_toolset
from services.agent.workspace import Workspace, WorkspaceError, get_workspace

logger = logging.getLogger("cambo.agent.runner")

DEFAULT_MAX_ROUNDS = 24
MODEL_TIMEOUT_SECONDS = 90.0
SENTINEL = object()

# Same failover ladder the rest of the app uses, so an overloaded primary model
# degrades instead of failing the run.
FALLBACK_MODELS = [
    "gemini-3.5-flash-lite",
    "gemini-3.6-flash",
    "gemini-3.5-flash",
]
RETRYABLE = ("503", "429", "404", "resource_exhausted", "quota", "unavailable",
             "high demand", "overloaded", "internal error")


class AgentRun:
    """State and event bus for one agent execution."""

    def __init__(
        self,
        goal: str,
        workspace: Optional[Workspace] = None,
        model: Optional[str] = None,
        max_rounds: Optional[int] = None,
        user_id: Optional[str] = None,
    ):
        self.id = f"run_{uuid.uuid4().hex[:12]}"
        self.goal = goal
        self.ws = workspace or get_workspace()
        self.patches = PatchStore(self.ws)
        self.plan = Plan(goal=goal)
        self.model = model or settings.gemini_model
        self.max_rounds = int(max_rounds or getattr(settings, "agent_max_rounds", DEFAULT_MAX_ROUNDS))
        self.user_id = user_id

        self.created_at = time.time()
        self.finished = False
        self.finish_summary = ""
        self.error: Optional[str] = None
        self.rounds_used = 0
        self.transcript: List[Dict[str, Any]] = []
        self.events: asyncio.Queue = asyncio.Queue()

    # ---------------------------------------------------------------- events

    def emit(self, kind: str, data: Any) -> None:
        """Publish an event. Never blocks — the queue is unbounded."""
        event = {"type": kind, "run_id": self.id, "ts": time.time(), "data": data}
        self.transcript.append(event)
        self.events.put_nowait(event)

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "goal": self.goal,
            "workspace": str(self.ws.root),
            "model": self.model,
            "finished": self.finished,
            "summary": self.finish_summary,
            "error": self.error,
            "rounds_used": self.rounds_used,
            "created_at": self.created_at,
            "plan": self.plan.to_dict(),
            "patches": [p.to_dict() for p in self.patches.all()],
            "patch_summary": self.patches.summary(),
        }

    # ------------------------------------------------------------------ loop

    async def execute(self) -> None:
        """Drive the model/tool loop to completion. Events stream as it goes."""
        from google import genai
        from google.genai import types

        tools = build_toolset(self)
        client = genai.Client(api_key=settings.gemini_api_key)

        declarations = [t["declaration"] for t in tools.values()]
        messages: List[Any] = [
            types.Content(role="user", parts=[types.Part.from_text(text=self.goal)])
        ]

        self.emit("start", {
            "goal": self.goal,
            "workspace": str(self.ws.root),
            "model": self.model,
            "max_rounds": self.max_rounds,
        })

        candidates = [self.model] + [m for m in FALLBACK_MODELS if m != self.model]
        active_model = candidates[0]
        model_index = 0

        try:
            while self.rounds_used < self.max_rounds and not self.finished:
                self.rounds_used += 1

                # Warn as the budget runs down so the model wraps up with a
                # summary instead of being cut off mid-investigation.
                remaining = self.max_rounds - self.rounds_used
                budget_note = ""
                if remaining <= 1:
                    budget_note = (
                        "**This is your FINAL round.** Call `finish` now with a summary "
                        "of what you found and proposed, even if incomplete."
                    )
                elif remaining <= 4:
                    budget_note = (
                        f"You have {remaining} tool rounds left. Start converging — "
                        "stop exploring and call `finish` once you can summarise."
                    )

                config = types.GenerateContentConfig(
                    temperature=0.15,           # low: this is engineering, not prose
                    max_output_tokens=settings.gemini_max_tokens,
                    system_instruction=build_agent_prompt(
                        workspace_root=str(self.ws.root),
                        plan_text=self.plan.render(),
                        extra=budget_note,
                    ),
                    tools=[types.Tool(function_declarations=declarations)],
                )

                try:
                    response = await asyncio.wait_for(
                        client.aio.models.generate_content(
                            model=active_model, contents=messages, config=config
                        ),
                        timeout=MODEL_TIMEOUT_SECONDS,
                    )
                except (asyncio.TimeoutError, Exception) as e:
                    retryable = isinstance(e, asyncio.TimeoutError) or any(
                        k in str(e).lower() for k in RETRYABLE
                    )
                    if retryable and model_index + 1 < len(candidates):
                        model_index += 1
                        active_model = candidates[model_index]
                        self.rounds_used -= 1     # a failover is not a work round
                        self.emit("model_fallback", {"to": active_model, "reason": str(e)[:200]})
                        logger.warning("Agent falling back to %s: %s", active_model, e)
                        continue
                    raise

                if not response.candidates:
                    self.emit("message", {"text": "The model returned no candidates."})
                    break

                candidate = response.candidates[0]
                if candidate.content:
                    messages.append(candidate.content)

                text = ""
                try:
                    text = response.text or ""
                except Exception:
                    text = ""
                if text.strip():
                    self.emit("message", {"text": text})

                calls = []
                if candidate.content and candidate.content.parts:
                    for part in candidate.content.parts:
                        fc = getattr(part, "function_call", None)
                        if fc is not None:
                            calls.append(fc)

                if not calls:
                    # No tools requested — the model considers itself done.
                    if not self.finish_summary and text.strip():
                        self.finish_summary = text
                    self.finished = True
                    break

                tool_parts = []
                for call in calls:
                    name = call.name
                    args = dict(call.args or {})
                    result = await self._invoke(tools, name, args)
                    tool_parts.append(
                        types.Part(
                            function_response=types.FunctionResponse(
                                name=name, response={"result": result}
                            )
                        )
                    )
                    if self.finished:      # `finish` was called
                        break

                messages.append(types.Content(role="user", parts=tool_parts))

            if self.rounds_used >= self.max_rounds and not self.finished:
                # Budget exhausted without an explicit finish. The work done so
                # far is still valuable, so synthesise a summary rather than
                # handing back nothing but an error.
                self.finish_summary = self._fallback_summary()
                self.emit("message", {"text": self.finish_summary})
                self.emit("budget_exhausted", {
                    "max_rounds": self.max_rounds,
                    "hint": "Raise AGENT_MAX_ROUNDS or narrow the goal for a fuller answer.",
                })

        except Exception as e:
            self.error = f"{type(e).__name__}: {e}"
            logger.exception("Agent run %s failed", self.id)
            self.emit("error", {"message": self.error})
        finally:
            self.finished = True
            self.emit("done", {
                "summary": self.finish_summary,
                "error": self.error,
                "rounds_used": self.rounds_used,
                "plan": self.plan.to_dict(),
                "patch_summary": self.patches.summary(),
                "patches": [p.to_dict() for p in self.patches.all()],
            })
            await self.events.put(SENTINEL)

    def _fallback_summary(self) -> str:
        """Best-effort summary when the model never called `finish`."""
        lines = [
            f"⚠ The agent reached its {self.max_rounds}-round limit without a final summary. "
            "Here is what it accomplished:",
            "",
        ]
        if self.plan.steps:
            lines += ["**Plan progress**", "```", self.plan.render(), "```", ""]

        patches = self.patches.all()
        if patches:
            lines.append(f"**Proposed changes ({len(patches)})**")
            for p in patches:
                lines.append(f"- `{p.path}` — {p.kind.value} (+{p.added}/-{p.removed})"
                             + (f": {p.rationale}" if p.rationale else ""))
        else:
            lines.append("**No file changes were proposed.**")

        commands = [e["data"] for e in self.transcript if e["type"] == "command"]
        if commands:
            lines += ["", "**Commands run**"]
            for c in commands[-5:]:
                lines.append(f"- `{c['command']}` → exit {c['exit_code']}")

        lines += ["", "Re-run with a narrower goal, or raise `AGENT_MAX_ROUNDS`, for a complete answer."]
        return "\n".join(lines)

    async def _invoke(self, tools: Dict[str, dict], name: str, args: dict) -> str:
        """Execute one tool call, converting failures into model-readable text."""
        self.emit("tool_call", {"name": name, "args": _preview_args(args)})

        tool = tools.get(name)
        if not tool:
            msg = f"[error] Unknown tool '{name}'. Available: {', '.join(tools)}"
            self.emit("tool_result", {"name": name, "ok": False, "preview": msg})
            return msg

        try:
            result = tool["fn"](**args)
            if asyncio.iscoroutine(result):
                result = await result
            text = result if isinstance(result, str) else json.dumps(result, ensure_ascii=False, default=str)
            ok = True
        except WorkspaceError as e:
            # Expected, recoverable — tell the model precisely what went wrong so
            # it can correct itself rather than abandoning the step.
            text = f"[refused] {e}"
            ok = False
        except TypeError as e:
            text = f"[error] Bad arguments for {name}: {e}"
            ok = False
        except Exception as e:
            text = f"[error] {type(e).__name__}: {e}"
            ok = False
            logger.warning("Tool %s raised", name, exc_info=True)

        self.emit("tool_result", {"name": name, "ok": ok, "preview": text[:600]})
        return text

    # ---------------------------------------------------------------- stream

    async def stream(self) -> AsyncGenerator[dict, None]:
        """Yield events as they are produced, ending after the `done` event."""
        while True:
            event = await self.events.get()
            if event is SENTINEL:
                return
            yield event


def _preview_args(args: dict) -> dict:
    """Trim bulky tool arguments (file contents) before they reach the UI."""
    out = {}
    for key, value in args.items():
        if isinstance(value, str) and len(value) > 400:
            out[key] = value[:400] + f"…[+{len(value) - 400} chars]"
        else:
            out[key] = value
    return out
