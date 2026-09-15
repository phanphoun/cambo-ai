"""Agent HTTP surface: start runs, stream progress, approve or reject diffs.

Every endpoint is gated three ways — the feature flag, an open workspace, and
(by default) an authenticated admin. The agent can read source and execute
commands on the host, so it is treated as a privileged local developer tool
rather than a product feature.
"""
from __future__ import annotations

import asyncio
import json
import logging
from typing import Optional

from fastapi import APIRouter, Depends, Header, HTTPException
from fastapi.responses import StreamingResponse

from config import settings
from models.schemas import (
    AgentRunRequest, AgentWorkspaceRequest, PatchActionResponse,
)
from routes.auth import get_current_user
from services.agent import run_registry, set_workspace, current_root
from services.agent.runner import AgentRun
from services.agent.shell import allowed_commands
from services.agent.workspace import Workspace, WorkspaceError, get_workspace

logger = logging.getLogger("cambo.routes.agent")
router = APIRouter(prefix="/api/agent", tags=["agent"])


def _require_agent(user: Optional[dict] = Depends(get_current_user)) -> dict:
    """Feature flag + (optionally) admin role. Applied to every agent route."""
    if not settings.agent_enabled:
        raise HTTPException(
            status_code=403,
            detail=(
                "Agent mode is disabled. Set AGENT_ENABLED=true in backend/.env to "
                "enable it — only on a machine you control, never on a public host."
            ),
        )
    if settings.agent_require_admin:
        if not user:
            raise HTTPException(status_code=401, detail="Authentication required for agent mode.")
        if user.get("role") != "admin":
            raise HTTPException(status_code=403, detail="Agent mode requires an admin account.")
    return user or {"id": "local", "role": "admin"}


def _ws_or_400() -> Workspace:
    try:
        return get_workspace()
    except WorkspaceError as e:
        raise HTTPException(status_code=400, detail=str(e)) from None


def _run_or_404(run_id: str) -> AgentRun:
    run = run_registry.get(run_id)
    if not run:
        raise HTTPException(status_code=404, detail=f"Unknown run: {run_id}")
    return run


# --------------------------------------------------------------- workspace

@router.get("/status")
async def agent_status(user: dict = Depends(_require_agent)):
    """What the agent can see and do right now."""
    root = current_root()
    return {
        "enabled": settings.agent_enabled,
        "workspace": root,
        "workspace_open": root is not None,
        "max_rounds": settings.agent_max_rounds,
        "command_timeout": settings.agent_command_timeout,
        "allowed_commands": sorted(allowed_commands()),
        "model": settings.gemini_model,
        "active_runs": len(run_registry.list(limit=100)),
    }


@router.post("/workspace")
async def open_workspace(req: AgentWorkspaceRequest, user: dict = Depends(_require_agent)):
    """Point the agent at a project directory on this machine."""
    try:
        ws = set_workspace(req.path)
    except WorkspaceError as e:
        raise HTTPException(status_code=400, detail=str(e)) from None

    entries = ws.list_dir(".")
    return {
        "workspace": str(ws.root),
        "entries": [
            {"path": e.path, "is_dir": e.is_dir, "size": e.size} for e in entries[:100]
        ],
    }


@router.get("/workspace/tree")
async def workspace_tree(path: str = ".", user: dict = Depends(_require_agent)):
    ws = _ws_or_400()
    try:
        return {"workspace": str(ws.root), "tree": ws.tree(path)}
    except WorkspaceError as e:
        raise HTTPException(status_code=400, detail=str(e)) from None


@router.get("/workspace/file")
async def workspace_file(path: str, user: dict = Depends(_require_agent)):
    """Read one file — backs the diff viewer's 'open full file' action."""
    ws = _ws_or_400()
    try:
        return {"path": path, "content": ws.read_text(path)}
    except WorkspaceError as e:
        raise HTTPException(status_code=400, detail=str(e)) from None


# --------------------------------------------------------------------- runs

@router.post("/run")
async def start_run(req: AgentRunRequest, user: dict = Depends(_require_agent)):
    """Start an agent run and stream its events as they happen (SSE)."""
    if req.workspace_path:
        try:
            set_workspace(req.workspace_path)
        except WorkspaceError as e:
            raise HTTPException(status_code=400, detail=str(e)) from None

    ws = _ws_or_400()
    run = AgentRun(
        goal=req.goal,
        workspace=ws,
        model=req.model,
        max_rounds=req.max_rounds,
        user_id=user.get("id"),
    )
    run_registry.add(run)

    async def generate():
        # Hand the client the run id immediately so it can approve patches even
        # if the stream is interrupted later.
        yield f"data: {json.dumps({'type': 'run_id', 'data': {'run_id': run.id}})}\n\n"

        task = asyncio.create_task(run.execute())
        try:
            async for event in run.stream():
                yield f"data: {json.dumps(event, ensure_ascii=False, default=str)}\n\n"
        except asyncio.CancelledError:
            task.cancel()
            raise
        finally:
            if not task.done():
                await asyncio.gather(task, return_exceptions=True)

    return StreamingResponse(
        generate(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )


@router.get("/runs")
async def list_runs(limit: int = 20, user: dict = Depends(_require_agent)):
    return {"runs": [r.to_dict() for r in run_registry.list(limit=limit)]}


@router.get("/runs/{run_id}")
async def get_run(run_id: str, user: dict = Depends(_require_agent)):
    return _run_or_404(run_id).to_dict()


@router.get("/runs/{run_id}/transcript")
async def get_transcript(run_id: str, user: dict = Depends(_require_agent)):
    run = _run_or_404(run_id)
    return {"run_id": run.id, "events": run.transcript}


# ------------------------------------------------------------------ patches

@router.get("/runs/{run_id}/patches")
async def list_patches(run_id: str, user: dict = Depends(_require_agent)):
    run = _run_or_404(run_id)
    return {
        "run_id": run.id,
        "patches": [p.to_dict() for p in run.patches.all()],
        "summary": run.patches.summary(),
    }


@router.post("/runs/{run_id}/patches/{patch_id}/apply", response_model=PatchActionResponse)
async def apply_patch(run_id: str, patch_id: str, user: dict = Depends(_require_agent)):
    """Write one approved proposal to disk."""
    run = _run_or_404(run_id)
    try:
        patch = run.patches.apply(patch_id)
    except WorkspaceError as e:
        raise HTTPException(status_code=409, detail=str(e)) from None
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"{type(e).__name__}: {e}") from None

    logger.info("User %s applied patch %s (%s)", user.get("email", "local"), patch_id, patch.path)
    return PatchActionResponse(patch=patch.to_dict(), summary=run.patches.summary())


@router.post("/runs/{run_id}/patches/{patch_id}/reject", response_model=PatchActionResponse)
async def reject_patch(run_id: str, patch_id: str, user: dict = Depends(_require_agent)):
    run = _run_or_404(run_id)
    try:
        patch = run.patches.reject(patch_id)
    except WorkspaceError as e:
        raise HTTPException(status_code=409, detail=str(e)) from None
    return PatchActionResponse(patch=patch.to_dict(), summary=run.patches.summary())


@router.post("/runs/{run_id}/patches/{patch_id}/revert", response_model=PatchActionResponse)
async def revert_patch(run_id: str, patch_id: str, user: dict = Depends(_require_agent)):
    """Undo a patch that was already written to disk."""
    run = _run_or_404(run_id)
    try:
        patch = run.patches.revert(patch_id)
    except WorkspaceError as e:
        raise HTTPException(status_code=409, detail=str(e)) from None
    return PatchActionResponse(patch=patch.to_dict(), summary=run.patches.summary())


@router.post("/runs/{run_id}/apply-all")
async def apply_all(run_id: str, user: dict = Depends(_require_agent)):
    """Apply every pending proposal, reporting per-patch outcomes."""
    run = _run_or_404(run_id)
    applied, failed = [], []
    for patch in run.patches.pending():
        try:
            applied.append(run.patches.apply(patch.id).to_dict())
        except Exception as e:
            failed.append({"id": patch.id, "path": patch.path, "error": str(e)})
    return {"applied": applied, "failed": failed, "summary": run.patches.summary()}


@router.post("/runs/{run_id}/revert-all")
async def revert_all(run_id: str, user: dict = Depends(_require_agent)):
    run = _run_or_404(run_id)
    reverted = [p.to_dict() for p in run.patches.revert_all()]
    return {"reverted": reverted, "summary": run.patches.summary()}
