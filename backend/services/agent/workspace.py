"""Workspace confinement for the SASTRA coding agent.

Every filesystem operation the agent performs is funnelled through `Workspace`,
which guarantees three things:

1. **Root confinement** — a resolved path must live inside the configured root.
   Symlinks are resolved *before* the check, so a symlink pointing outside the
   workspace is rejected rather than followed.
2. **Ignore rules** — heavy or sensitive directories (``node_modules``, ``venv``,
   ``.git``) and secret files (``.env``) are invisible to the agent, so it never
   burns context on them or reads credentials into a model prompt.
3. **Size caps** — no single read, and no directory listing, can blow up the
   model's context window.
"""
from __future__ import annotations

import fnmatch
import logging
import os
from dataclasses import dataclass
from pathlib import Path
from typing import Iterator, List, Optional

logger = logging.getLogger("cambo.agent.workspace")

# Directories the agent never descends into.
IGNORED_DIRS = {
    ".git", "node_modules", "venv", ".venv", "__pycache__", "dist", "build",
    ".next", ".cache", ".pytest_cache", ".mypy_cache", ".ruff_cache",
    "site-packages", ".idea", ".vscode", "coverage", ".turbo", ".parcel-cache",
}

# Files the agent may never read, however it reaches them. Secrets stay out of
# model prompts even when the user explicitly points the agent at them.
SECRET_PATTERNS = [
    ".env", ".env.*", "*.pem", "*.key", "*.p12", "*.pfx",
    "id_rsa", "id_ed25519", "*.keystore", "credentials.json",
    "service-account*.json", "*.sqlite", "*.db",
]
# ...but these are safe and useful (they are templates, not real secrets).
SECRET_ALLOWLIST = {".env.example", ".env.sample", ".env.template"}

# Binary/large file extensions that are pointless to feed a language model.
BINARY_EXTENSIONS = {
    ".png", ".jpg", ".jpeg", ".gif", ".webp", ".ico", ".bmp", ".tiff", ".svg",
    ".pdf", ".docx", ".xlsx", ".pptx", ".zip", ".tar", ".gz", ".bz2", ".xz",
    ".7z", ".rar", ".mp3", ".mp4", ".avi", ".mov", ".wav", ".flac", ".ogg",
    ".ttf", ".otf", ".woff", ".woff2", ".eot", ".so", ".dylib", ".dll",
    ".exe", ".bin", ".pyc", ".pyo", ".class", ".jar", ".wasm", ".lock",
}

MAX_READ_BYTES = 256_000          # hard cap on a single file read
MAX_LIST_ENTRIES = 400            # hard cap on entries returned by list_dir
MAX_TREE_ENTRIES = 1_200          # hard cap on entries returned by tree()


class WorkspaceError(Exception):
    """Raised when an operation is rejected (escape attempt, missing file, …)."""


@dataclass
class FileInfo:
    path: str          # workspace-relative, forward-slashed
    is_dir: bool
    size: int
    ext: str


class Workspace:
    """A confined view of one directory on disk."""

    def __init__(self, root: str | os.PathLike):
        resolved = Path(root).expanduser().resolve()
        if not resolved.exists():
            raise WorkspaceError(f"Workspace root does not exist: {resolved}")
        if not resolved.is_dir():
            raise WorkspaceError(f"Workspace root is not a directory: {resolved}")
        self.root: Path = resolved

    # ---------------------------------------------------------------- paths

    def resolve(self, rel_path: str, must_exist: bool = False) -> Path:
        """Resolve a workspace-relative path, refusing anything outside the root.

        Absolute paths are accepted only when they already point inside the
        workspace; everything else (``..`` traversal, escaping symlinks) raises.
        """
        if rel_path is None:
            raise WorkspaceError("path is required")

        cleaned = str(rel_path).strip().replace("\\", "/")
        if not cleaned or cleaned == ".":
            return self.root

        candidate = Path(cleaned)
        if candidate.is_absolute():
            target = candidate.resolve()
        else:
            target = (self.root / candidate).resolve()

        # Resolve-then-compare defeats both `..` traversal and symlink escapes.
        try:
            target.relative_to(self.root)
        except ValueError:
            raise WorkspaceError(
                f"Path escapes the workspace root and was refused: {rel_path}"
            ) from None

        if must_exist and not target.exists():
            raise WorkspaceError(f"No such file or directory: {rel_path}")

        return target

    def relative(self, path: Path) -> str:
        """Workspace-relative, forward-slashed display path."""
        try:
            return path.relative_to(self.root).as_posix()
        except ValueError:
            return path.as_posix()

    # --------------------------------------------------------------- filters

    @staticmethod
    def is_secret(path: Path) -> bool:
        name = path.name
        if name in SECRET_ALLOWLIST:
            return False
        return any(fnmatch.fnmatch(name, pat) for pat in SECRET_PATTERNS)

    @staticmethod
    def is_binary(path: Path) -> bool:
        return path.suffix.lower() in BINARY_EXTENSIONS

    def is_ignored(self, path: Path) -> bool:
        """True if any path segment is an ignored directory, or it is a secret."""
        try:
            parts = path.relative_to(self.root).parts
        except ValueError:
            return True
        if any(part in IGNORED_DIRS for part in parts):
            return True
        return self.is_secret(path)

    # ----------------------------------------------------------------- reads

    def read_text(self, rel_path: str, max_bytes: int = MAX_READ_BYTES) -> str:
        path = self.resolve(rel_path, must_exist=True)
        if path.is_dir():
            raise WorkspaceError(f"{rel_path} is a directory, not a file")
        if self.is_secret(path):
            raise WorkspaceError(
                f"Refusing to read {rel_path}: files matching secret patterns "
                "are never exposed to the model."
            )
        if self.is_binary(path):
            raise WorkspaceError(
                f"Refusing to read {rel_path}: binary file ({path.suffix})."
            )

        size = path.stat().st_size
        raw = path.read_bytes()[:max_bytes]
        try:
            text = raw.decode("utf-8")
        except UnicodeDecodeError:
            text = raw.decode("utf-8", errors="replace")

        if size > max_bytes:
            text += f"\n\n…[truncated: showing {max_bytes:,} of {size:,} bytes]"
        return text

    def write_text(self, rel_path: str, content: str) -> Path:
        """Write a file, creating parent directories. Used only by patch apply."""
        path = self.resolve(rel_path)
        if self.is_secret(path):
            raise WorkspaceError(f"Refusing to write to protected file: {rel_path}")
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(content, encoding="utf-8")
        return path

    def exists(self, rel_path: str) -> bool:
        try:
            return self.resolve(rel_path).exists()
        except WorkspaceError:
            return False

    # ------------------------------------------------------------- listings

    def list_dir(self, rel_path: str = ".", limit: int = MAX_LIST_ENTRIES) -> List[FileInfo]:
        path = self.resolve(rel_path, must_exist=True)
        if not path.is_dir():
            raise WorkspaceError(f"{rel_path} is not a directory")

        entries: List[FileInfo] = []
        for child in sorted(path.iterdir(), key=lambda p: (not p.is_dir(), p.name.lower())):
            if child.name in IGNORED_DIRS or self.is_secret(child):
                continue
            try:
                size = child.stat().st_size if child.is_file() else 0
            except OSError:
                continue
            entries.append(
                FileInfo(
                    path=self.relative(child),
                    is_dir=child.is_dir(),
                    size=size,
                    ext=child.suffix.lower(),
                )
            )
            if len(entries) >= limit:
                break
        return entries

    def walk(self, rel_path: str = ".") -> Iterator[Path]:
        """Yield every non-ignored file under `rel_path`."""
        start = self.resolve(rel_path, must_exist=True)
        for dirpath, dirnames, filenames in os.walk(start):
            # Prune in place so os.walk never descends into ignored trees.
            dirnames[:] = [d for d in dirnames if d not in IGNORED_DIRS]
            for fname in filenames:
                fpath = Path(dirpath) / fname
                if self.is_secret(fpath):
                    continue
                yield fpath

    def tree(self, rel_path: str = ".", max_entries: int = MAX_TREE_ENTRIES) -> List[str]:
        """A flat, indented project tree — the agent's orientation view."""
        start = self.resolve(rel_path, must_exist=True)
        lines: List[str] = []
        count = 0

        for dirpath, dirnames, filenames in os.walk(start):
            dirnames[:] = sorted(d for d in dirnames if d not in IGNORED_DIRS)
            current = Path(dirpath)
            depth = len(current.relative_to(start).parts)
            if depth > 4:          # keep the tree shallow enough to stay useful
                dirnames[:] = []
                continue

            if current != start:
                lines.append("  " * (depth - 1) + f"{current.name}/")
                count += 1

            for fname in sorted(filenames):
                fpath = current / fname
                if self.is_secret(fpath):
                    continue
                lines.append("  " * depth + fname)
                count += 1
                if count >= max_entries:
                    lines.append(f"…[truncated at {max_entries} entries]")
                    return lines
        return lines


_active: Optional[Workspace] = None


def get_workspace() -> Workspace:
    """The process-wide active workspace. Raises if none is configured."""
    if _active is None:
        raise WorkspaceError(
            "No workspace is open. Set AGENT_WORKSPACE_ROOT or call "
            "POST /api/agent/workspace with a project path first."
        )
    return _active


def set_workspace(root: str | os.PathLike) -> Workspace:
    global _active
    _active = Workspace(root)
    logger.info("Agent workspace set to %s", _active.root)
    return _active


def current_root() -> Optional[str]:
    return str(_active.root) if _active else None
