"""The agent's tools, bound to a single run.

Unlike ``services/tools.py`` (a process-wide registry of stateless helpers),
these tools close over one run's workspace and patch store, so two concurrent
runs can never see each other's proposals. Each entry carries a JSON-schema
declaration in the shape Gemini's function calling expects.
"""
from __future__ import annotations

import fnmatch
import logging
import re
from typing import TYPE_CHECKING, Any, Callable, Dict, List

from services.agent import shell
from services.agent.workspace import WorkspaceError

if TYPE_CHECKING:                       # pragma: no cover
    from services.agent.runner import AgentRun

logger = logging.getLogger("cambo.agent.toolset")

MAX_GREP_MATCHES = 60
MAX_GLOB_RESULTS = 200


def _numbered(text: str, start: int = 1) -> str:
    """cat -n style output so the model can cite line numbers accurately."""
    return "\n".join(
        f"{i:>5}\t{line}" for i, line in enumerate(text.splitlines(), start=start)
    )


def build_toolset(run: "AgentRun") -> Dict[str, dict]:
    """Return ``{name: {declaration, fn}}`` bound to this run."""
    ws = run.ws

    # ------------------------------------------------------------ read tools

    def read_file(path: str, offset: int = 1, limit: int = 400) -> str:
        text = ws.read_text(path)
        lines = text.splitlines()
        total = len(lines)
        start = max(1, int(offset))
        end = min(total, start + int(limit) - 1)
        if start > total:
            return f"{path} has only {total} lines; offset {start} is past the end."
        body = _numbered("\n".join(lines[start - 1:end]), start=start)
        header = f"# {path} (lines {start}-{end} of {total})\n"
        footer = ""
        if end < total:
            footer = f"\n…[{total - end} more lines — call read_file with offset={end + 1}]"
        return header + body + footer

    def list_dir(path: str = ".") -> str:
        entries = ws.list_dir(path)
        if not entries:
            return f"{path} is empty (or contains only ignored files)."
        lines = [
            f"{'dir ' if e.is_dir else 'file'}  {e.path}" + ("" if e.is_dir else f"  ({e.size:,}B)")
            for e in entries
        ]
        return f"# {path}\n" + "\n".join(lines)

    def project_tree(path: str = ".") -> str:
        lines = ws.tree(path)
        return f"# Project tree from {path} (ignoring node_modules, venv, .git, dist)\n" + "\n".join(lines)

    def glob_files(pattern: str, path: str = ".") -> str:
        matches: List[str] = []
        for fpath in ws.walk(path):
            rel = ws.relative(fpath)
            if fnmatch.fnmatch(rel, pattern) or fnmatch.fnmatch(fpath.name, pattern):
                matches.append(rel)
                if len(matches) >= MAX_GLOB_RESULTS:
                    break
        if not matches:
            return f"No files matching '{pattern}' under {path}."
        return f"# {len(matches)} file(s) matching '{pattern}'\n" + "\n".join(sorted(matches))

    def grep_search(pattern: str, path: str = ".", glob: str = "", ignore_case: bool = True) -> str:
        try:
            rx = re.compile(pattern, re.IGNORECASE if ignore_case else 0)
        except re.error as e:
            raise WorkspaceError(f"Invalid regex '{pattern}': {e}") from None

        hits: List[str] = []
        files_searched = 0
        for fpath in ws.walk(path):
            rel = ws.relative(fpath)
            if glob and not (fnmatch.fnmatch(rel, glob) or fnmatch.fnmatch(fpath.name, glob)):
                continue
            if ws.is_binary(fpath):
                continue
            try:
                content = fpath.read_text(encoding="utf-8", errors="replace")
            except OSError:
                continue
            files_searched += 1
            for lineno, line in enumerate(content.splitlines(), 1):
                if rx.search(line):
                    snippet = line.strip()[:200]
                    hits.append(f"{rel}:{lineno}: {snippet}")
                    if len(hits) >= MAX_GREP_MATCHES:
                        hits.append(f"…[stopped at {MAX_GREP_MATCHES} matches]")
                        return f"# grep '{pattern}'\n" + "\n".join(hits)
        if not hits:
            return f"No matches for '{pattern}' in {files_searched} file(s) under {path}."
        return f"# grep '{pattern}' — {len(hits)} match(es) in {files_searched} file(s)\n" + "\n".join(hits)

    # ----------------------------------------------------------- write tools
    # None of these touch disk. They queue a proposal for human approval.

    def edit_file(path: str, old_str: str, new_str: str, rationale: str = "") -> str:
        patch = run.patches.propose_edit(path, old_str, new_str, rationale)
        run.emit("patch", patch.to_dict())
        return (
            f"Proposed edit to {path} (+{patch.added}/-{patch.removed}), id={patch.id}. "
            "NOT yet written to disk — it is queued for the user to approve. "
            "Continue with the rest of the task; do not re-propose this change."
        )

    def create_file(path: str, content: str, rationale: str = "") -> str:
        patch = run.patches.propose_create(path, content, rationale)
        run.emit("patch", patch.to_dict())
        return (
            f"Proposed new file {path} ({patch.added} lines), id={patch.id}. "
            "Queued for user approval, not yet on disk."
        )

    def rewrite_file(path: str, content: str, rationale: str = "") -> str:
        patch = run.patches.propose_rewrite(path, content, rationale)
        run.emit("patch", patch.to_dict())
        return (
            f"Proposed full rewrite of {path} (+{patch.added}/-{patch.removed}), id={patch.id}. "
            "Queued for user approval, not yet on disk."
        )

    def delete_file(path: str, rationale: str = "") -> str:
        patch = run.patches.propose_delete(path, rationale)
        run.emit("patch", patch.to_dict())
        return f"Proposed deletion of {path}, id={patch.id}. Queued for user approval."

    # ---------------------------------------------------------- plan + shell

    def write_plan(steps: List[str]) -> str:
        if isinstance(steps, str):
            steps = [s for s in re.split(r"\n|(?<=\d)\.\s", steps) if s.strip()]
        run.plan.set_steps(list(steps))
        run.emit("plan", run.plan.to_dict())
        return f"Plan recorded:\n{run.plan.render()}"

    def update_plan(step: int, status: str = "", note: str = "") -> str:
        try:
            run.plan.update_step(int(step), status or None, note)
        except ValueError as e:
            raise WorkspaceError(str(e)) from None
        run.emit("plan", run.plan.to_dict())
        return f"Plan updated:\n{run.plan.render()}"

    async def run_command(command: str, cwd: str = "") -> str:
        result = await shell.run_command(ws, command, cwd=cwd or None)
        run.emit("command", result.to_dict())
        return result.to_model_text()

    # ------------------------------------------------------------ signalling

    def finish(summary: str) -> str:
        run.finish_summary = summary.strip()
        run.finished = True
        return "Run complete."

    # ------------------------------------------------------------------ decls

    def T(name: str, fn: Callable[..., Any], description: str, properties: dict, required: List[str]) -> tuple:
        return name, {
            "declaration": {
                "name": name,
                "description": description,
                "parameters": {
                    "type": "object",
                    "properties": properties,
                    "required": required,
                },
            },
            "fn": fn,
        }

    entries = [
        T(
            "read_file", read_file,
            "Read a text file from the project with line numbers. Always read a file "
            "before editing it — edits require quoting its exact current content.",
            {
                "path": {"type": "string", "description": "Project-relative path, e.g. backend/config.py"},
                "offset": {"type": "integer", "description": "First line to read (1-based). Default 1."},
                "limit": {"type": "integer", "description": "How many lines to read. Default 400."},
            },
            ["path"],
        ),
        T(
            "list_dir", list_dir,
            "List the files and subdirectories of one directory.",
            {"path": {"type": "string", "description": "Project-relative directory. Default '.'"}},
            [],
        ),
        T(
            "project_tree", project_tree,
            "Show the project's directory tree. Use this first to orient yourself in an "
            "unfamiliar codebase.",
            {"path": {"type": "string", "description": "Subtree root. Default '.'"}},
            [],
        ),
        T(
            "glob_files", glob_files,
            "Find files by name pattern, e.g. '*.test.ts' or 'src/**/*.py'.",
            {
                "pattern": {"type": "string", "description": "Glob pattern."},
                "path": {"type": "string", "description": "Directory to search. Default '.'"},
            },
            ["pattern"],
        ),
        T(
            "grep_search", grep_search,
            "Search file contents with a regular expression. Returns path:line: match. "
            "The fastest way to locate a symbol, an error string, or a usage.",
            {
                "pattern": {"type": "string", "description": "Python regular expression."},
                "path": {"type": "string", "description": "Directory to search. Default '.'"},
                "glob": {"type": "string", "description": "Restrict to matching filenames, e.g. '*.py'."},
                "ignore_case": {"type": "boolean", "description": "Case-insensitive. Default true."},
            },
            ["pattern"],
        ),
        T(
            "edit_file", edit_file,
            "Propose replacing an exact snippet in an existing file. old_str must appear "
            "EXACTLY ONCE — include surrounding lines to disambiguate. This does not write "
            "to disk; it queues a diff for the user to approve.",
            {
                "path": {"type": "string", "description": "Project-relative path."},
                "old_str": {"type": "string", "description": "Exact current text, including indentation."},
                "new_str": {"type": "string", "description": "Replacement text."},
                "rationale": {"type": "string", "description": "One sentence: why this change."},
            },
            ["path", "old_str", "new_str"],
        ),
        T(
            "create_file", create_file,
            "Propose creating a new file. Queued for user approval, not written immediately.",
            {
                "path": {"type": "string", "description": "Project-relative path for the new file."},
                "content": {"type": "string", "description": "Full file content."},
                "rationale": {"type": "string", "description": "One sentence: why this file."},
            },
            ["path", "content"],
        ),
        T(
            "rewrite_file", rewrite_file,
            "Propose replacing an entire file's content. Prefer edit_file for targeted "
            "changes — only rewrite when most of the file changes.",
            {
                "path": {"type": "string", "description": "Project-relative path."},
                "content": {"type": "string", "description": "Complete new content."},
                "rationale": {"type": "string", "description": "One sentence: why a full rewrite."},
            },
            ["path", "content"],
        ),
        T(
            "delete_file", delete_file,
            "Propose deleting a file. Queued for user approval.",
            {
                "path": {"type": "string", "description": "Project-relative path."},
                "rationale": {"type": "string", "description": "One sentence: why remove it."},
            },
            ["path"],
        ),
        T(
            "run_command", run_command,
            "Run a read-only or verification command in the project (tests, type check, "
            "lint, git status). No shell operators; one command per call. Use this to SEE "
            "a real error before fixing it, and to verify after the user applies patches.",
            {
                "command": {"type": "string", "description": "e.g. 'pytest -q' or 'npx tsc --noEmit'"},
                "cwd": {"type": "string", "description": "Project-relative working directory."},
            },
            ["command"],
        ),
        T(
            "write_plan", write_plan,
            "Record the ordered steps you intend to take. Call this ONCE, early, before "
            "doing substantive work.",
            {
                "steps": {
                    "type": "array",
                    "items": {"type": "string"},
                    "description": "Short imperative step titles, in order.",
                }
            },
            ["steps"],
        ),
        T(
            "update_plan", update_plan,
            "Mark a plan step active, done, or blocked as you progress.",
            {
                "step": {"type": "integer", "description": "1-based step number."},
                "status": {"type": "string", "description": "pending | active | done | blocked"},
                "note": {"type": "string", "description": "Optional short note, e.g. why blocked."},
            },
            ["step"],
        ),
        T(
            "finish", finish,
            "Call when the goal is met or you are blocked. Provide a summary for the user: "
            "what you found, what you changed, and what they should do next.",
            {"summary": {"type": "string", "description": "Markdown summary of the run."}},
            ["summary"],
        ),
    ]

    return dict(entries)
