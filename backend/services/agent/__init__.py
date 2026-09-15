"""SASTRA autonomous coding agent.

A confined, approval-gated software engineering agent: it reads the project,
plans, runs verification commands, and proposes diffs that a human approves.
"""
from services.agent.workspace import (  # noqa: F401
    Workspace, WorkspaceError, get_workspace, set_workspace, current_root,
)
from services.agent.runner import AgentRun  # noqa: F401
from services.agent.registry import run_registry  # noqa: F401

__all__ = [
    "Workspace", "WorkspaceError", "get_workspace", "set_workspace",
    "current_root", "AgentRun", "run_registry",
]
