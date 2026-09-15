"""Bounded command execution for the agent.

The agent needs to *see* failures to diagnose them — run the test suite, the
type checker, the linter. That requires executing commands, which is the single
most dangerous capability in the system, so it is fenced on five sides:

* **Allowlist** — only the base executables in ``ALLOWED_COMMANDS`` may run, and
  the list is configurable via ``AGENT_ALLOWED_COMMANDS``.
* **No shell** — arguments are parsed with :func:`shlex.split` and handed to
  ``subprocess`` as a list. There is no shell, so ``;``, ``&&``, ``|``, ``$()``
  and redirection are inert text rather than operators.
* **Confined cwd** — commands run inside the workspace root (or a subdirectory
  of it), never elsewhere on the machine.
* **Timeout** — every command is killed after ``AGENT_COMMAND_TIMEOUT`` seconds.
* **Output cap** — stdout/stderr are truncated before reaching the model.
"""
from __future__ import annotations

import asyncio
import logging
import shlex
from dataclasses import dataclass
from typing import List, Optional

from config import settings
from services.agent.workspace import Workspace, WorkspaceError

logger = logging.getLogger("cambo.agent.shell")

# Base executables the agent may invoke. Deliberately read-and-verify oriented:
# build, test, lint, inspect. No package installs, no network fetches, no
# process control, and nothing that mutates git history.
DEFAULT_ALLOWED = {
    # Python
    "python", "python3", "pytest", "ruff", "mypy", "flake8", "black", "isort",
    # JS/TS
    "node", "npm", "npx", "yarn", "pnpm", "tsc", "eslint", "vitest", "jest",
    # inspection
    "git", "ls", "cat", "head", "tail", "wc", "grep", "rg", "find", "file",
    "which", "pwd", "env", "date", "echo", "diff", "tree", "du", "stat",
}

# git subcommands that mutate history or talk to a remote stay blocked even
# though `git` itself is allowed.
GIT_BLOCKED_SUBCOMMANDS = {
    "push", "reset", "rebase", "clean", "checkout", "switch", "restore",
    "commit", "merge", "cherry-pick", "revert", "stash", "filter-branch",
    "remote", "submodule", "config", "gc", "prune", "am", "apply",
}

# npm/yarn/pnpm subcommands that install or publish stay blocked.
NPM_BLOCKED_SUBCOMMANDS = {
    "install", "i", "add", "remove", "uninstall", "publish", "link",
    "update", "upgrade", "audit", "exec", "create", "init",
}

MAX_OUTPUT_CHARS = 12_000


@dataclass
class CommandResult:
    command: str
    exit_code: int
    stdout: str
    stderr: str
    duration_ms: float
    timed_out: bool = False

    @property
    def ok(self) -> bool:
        return self.exit_code == 0 and not self.timed_out

    def to_model_text(self) -> str:
        """Render for the model: status line, then whichever streams have content."""
        head = (
            f"$ {self.command}\n"
            f"exit={self.exit_code}"
            f"{' (TIMED OUT)' if self.timed_out else ''} "
            f"({self.duration_ms:.0f}ms)\n"
        )
        body = ""
        if self.stdout.strip():
            body += f"\n--- stdout ---\n{self.stdout.strip()}\n"
        if self.stderr.strip():
            body += f"\n--- stderr ---\n{self.stderr.strip()}\n"
        if not body:
            body = "\n(no output)\n"
        return head + body

    def to_dict(self) -> dict:
        return {
            "command": self.command,
            "exit_code": self.exit_code,
            "stdout": self.stdout,
            "stderr": self.stderr,
            "duration_ms": self.duration_ms,
            "timed_out": self.timed_out,
            "ok": self.ok,
        }


def allowed_commands() -> set[str]:
    configured = (getattr(settings, "agent_allowed_commands", "") or "").strip()
    if not configured:
        return set(DEFAULT_ALLOWED)
    return {c.strip() for c in configured.split(",") if c.strip()}


def _truncate(text: str) -> str:
    if len(text) <= MAX_OUTPUT_CHARS:
        return text
    half = MAX_OUTPUT_CHARS // 2
    return (
        text[:half]
        + f"\n\n…[{len(text) - MAX_OUTPUT_CHARS:,} chars truncated]…\n\n"
        + text[-half:]
    )


def validate(command: str) -> List[str]:
    """Parse and authorise a command, returning its argv. Raises if refused."""
    if not command or not command.strip():
        raise WorkspaceError("Empty command.")

    try:
        argv = shlex.split(command)
    except ValueError as e:
        raise WorkspaceError(f"Could not parse command: {e}") from None

    if not argv:
        raise WorkspaceError("Empty command.")

    # shlex keeps these as literal argv entries rather than operators, but their
    # presence means the model expected a shell — tell it plainly that it has none.
    for token in argv:
        if token in {"&&", "||", ";", "|", ">", ">>", "<", "&"}:
            raise WorkspaceError(
                "Shell operators are not available — commands run without a shell. "
                "Issue one command per call."
            )

    base = argv[0].rsplit("/", 1)[-1]
    permitted = allowed_commands()
    if base not in permitted:
        raise WorkspaceError(
            f"Command '{base}' is not allowed. Permitted: "
            f"{', '.join(sorted(permitted))}"
        )

    if base == "git" and len(argv) > 1 and argv[1] in GIT_BLOCKED_SUBCOMMANDS:
        raise WorkspaceError(
            f"'git {argv[1]}' is blocked — the agent may inspect the repository "
            "but never mutate it. Propose file edits instead."
        )

    if base in {"npm", "yarn", "pnpm"} and len(argv) > 1 and argv[1] in NPM_BLOCKED_SUBCOMMANDS:
        raise WorkspaceError(
            f"'{base} {argv[1]}' is blocked — the agent may not install or publish "
            "packages. Ask the user to run it themselves if a dependency is missing."
        )

    return argv


async def run_command(
    ws: Workspace,
    command: str,
    cwd: Optional[str] = None,
    timeout: Optional[float] = None,
) -> CommandResult:
    """Execute an allowlisted command inside the workspace."""
    argv = validate(command)
    workdir = ws.resolve(cwd, must_exist=True) if cwd else ws.root
    if not workdir.is_dir():
        raise WorkspaceError(f"cwd is not a directory: {cwd}")

    limit = timeout or float(getattr(settings, "agent_command_timeout", 90.0))
    loop = asyncio.get_event_loop()
    started = loop.time()

    logger.info("agent exec: %s (cwd=%s)", command, workdir)
    proc = await asyncio.create_subprocess_exec(
        *argv,
        cwd=str(workdir),
        stdout=asyncio.subprocess.PIPE,
        stderr=asyncio.subprocess.PIPE,
    )

    timed_out = False
    try:
        stdout_b, stderr_b = await asyncio.wait_for(proc.communicate(), timeout=limit)
    except asyncio.TimeoutError:
        timed_out = True
        proc.kill()
        stdout_b, stderr_b = await proc.communicate()

    duration = (loop.time() - started) * 1000
    return CommandResult(
        command=command,
        exit_code=proc.returncode if proc.returncode is not None else -1,
        stdout=_truncate(stdout_b.decode("utf-8", errors="replace")),
        stderr=_truncate(stderr_b.decode("utf-8", errors="replace")),
        duration_ms=duration,
        timed_out=timed_out,
    )
