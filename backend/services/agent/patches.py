"""Proposed edits, unified diffs, and approval-gated application.

The agent never writes to disk. It *proposes* — each proposal is validated
against the current file contents, rendered as a unified diff, and parked in a
`PatchStore` until a human clicks Apply. Application is the only code path that
touches the filesystem, and it snapshots the original bytes first so any applied
patch can be reverted.
"""
from __future__ import annotations

import difflib
import logging
import time
import uuid
from dataclasses import dataclass, field
from enum import Enum
from typing import Dict, List, Optional

from services.agent.workspace import Workspace, WorkspaceError

logger = logging.getLogger("cambo.agent.patches")


class PatchStatus(str, Enum):
    PENDING = "pending"
    APPLIED = "applied"
    REJECTED = "rejected"
    STALE = "stale"        # file changed on disk after the patch was proposed


class PatchKind(str, Enum):
    EDIT = "edit"          # replace a unique snippet inside an existing file
    CREATE = "create"      # create a new file
    REWRITE = "rewrite"    # replace an existing file wholesale
    DELETE = "delete"      # remove a file


@dataclass
class Patch:
    id: str
    kind: PatchKind
    path: str                       # workspace-relative
    rationale: str
    old_content: Optional[str]      # None for CREATE
    new_content: Optional[str]      # None for DELETE
    diff: str
    status: PatchStatus = PatchStatus.PENDING
    created_at: float = field(default_factory=time.time)
    applied_at: Optional[float] = None
    error: Optional[str] = None
    # Bytes as they were immediately before apply, for undo.
    backup: Optional[str] = None
    existed_before: bool = True

    @property
    def added(self) -> int:
        return sum(
            1 for line in self.diff.splitlines()
            if line.startswith("+") and not line.startswith("+++")
        )

    @property
    def removed(self) -> int:
        return sum(
            1 for line in self.diff.splitlines()
            if line.startswith("-") and not line.startswith("---")
        )

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "kind": self.kind.value,
            "path": self.path,
            "rationale": self.rationale,
            "diff": self.diff,
            "status": self.status.value,
            "added": self.added,
            "removed": self.removed,
            "created_at": self.created_at,
            "applied_at": self.applied_at,
            "error": self.error,
        }


def _unified(path: str, old: str, new: str) -> str:
    return "".join(
        difflib.unified_diff(
            old.splitlines(keepends=True),
            new.splitlines(keepends=True),
            fromfile=f"a/{path}",
            tofile=f"b/{path}",
            n=3,
        )
    )


class PatchStore:
    """Ordered collection of proposals belonging to one agent run."""

    def __init__(self, workspace: Workspace):
        self.ws = workspace
        self._patches: Dict[str, Patch] = {}
        self._order: List[str] = []

    # ------------------------------------------------------------- proposals

    def propose_edit(self, path: str, old_str: str, new_str: str, rationale: str) -> Patch:
        """Replace an exact, unique snippet — the safest edit primitive.

        Uniqueness is enforced so an edit can never silently hit the wrong
        occurrence, which is the classic failure mode of model-generated patches.
        """
        current = self.ws.read_text(path)

        if old_str not in current:
            raise WorkspaceError(
                f"The text to replace was not found in {path}. Re-read the file "
                "and quote the snippet exactly, including indentation."
            )
        occurrences = current.count(old_str)
        if occurrences > 1:
            raise WorkspaceError(
                f"The text to replace appears {occurrences} times in {path}. "
                "Include more surrounding context to make the snippet unique."
            )
        if old_str == new_str:
            raise WorkspaceError("old_str and new_str are identical — nothing to change.")

        updated = current.replace(old_str, new_str, 1)
        return self._store(
            PatchKind.EDIT, path, rationale, current, updated, existed_before=True
        )

    def propose_create(self, path: str, content: str, rationale: str) -> Patch:
        if self.ws.exists(path):
            raise WorkspaceError(
                f"{path} already exists — use edit_file or rewrite_file instead."
            )
        # Validate confinement now rather than at apply time.
        self.ws.resolve(path)
        return self._store(
            PatchKind.CREATE, path, rationale, None, content, existed_before=False
        )

    def propose_rewrite(self, path: str, content: str, rationale: str) -> Patch:
        current = self.ws.read_text(path)
        if current == content:
            raise WorkspaceError(f"{path} already has exactly this content.")
        return self._store(
            PatchKind.REWRITE, path, rationale, current, content, existed_before=True
        )

    def propose_delete(self, path: str, rationale: str) -> Patch:
        current = self.ws.read_text(path)
        return self._store(
            PatchKind.DELETE, path, rationale, current, None, existed_before=True
        )

    def _store(
        self,
        kind: PatchKind,
        path: str,
        rationale: str,
        old: Optional[str],
        new: Optional[str],
        existed_before: bool,
    ) -> Patch:
        patch = Patch(
            id=f"p_{uuid.uuid4().hex[:10]}",
            kind=kind,
            path=path,
            rationale=rationale.strip(),
            old_content=old,
            new_content=new,
            diff=_unified(path, old or "", new or ""),
            existed_before=existed_before,
        )
        self._patches[patch.id] = patch
        self._order.append(patch.id)
        logger.info("Proposed %s on %s (+%d/-%d)", kind.value, path, patch.added, patch.removed)
        return patch

    # ----------------------------------------------------------------- access

    def get(self, patch_id: str) -> Optional[Patch]:
        return self._patches.get(patch_id)

    def all(self) -> List[Patch]:
        return [self._patches[pid] for pid in self._order]

    def pending(self) -> List[Patch]:
        return [p for p in self.all() if p.status == PatchStatus.PENDING]

    def applied(self) -> List[Patch]:
        return [p for p in self.all() if p.status == PatchStatus.APPLIED]

    # ------------------------------------------------------------ transitions

    def apply(self, patch_id: str) -> Patch:
        patch = self._patches.get(patch_id)
        if not patch:
            raise WorkspaceError(f"Unknown patch: {patch_id}")
        if patch.status != PatchStatus.PENDING:
            raise WorkspaceError(f"Patch {patch_id} is already {patch.status.value}.")

        # Re-validate against disk: the file may have changed since proposal.
        if patch.existed_before:
            try:
                on_disk = self.ws.read_text(patch.path)
            except WorkspaceError as e:
                patch.status = PatchStatus.STALE
                patch.error = str(e)
                raise
            if on_disk != patch.old_content:
                patch.status = PatchStatus.STALE
                patch.error = (
                    f"{patch.path} changed on disk after this patch was proposed. "
                    "Re-run the agent so it can read the current version."
                )
                raise WorkspaceError(patch.error)
            patch.backup = on_disk

        try:
            if patch.kind == PatchKind.DELETE:
                self.ws.resolve(patch.path, must_exist=True).unlink()
            else:
                self.ws.write_text(patch.path, patch.new_content or "")
        except Exception as e:
            patch.error = f"{type(e).__name__}: {e}"
            raise

        patch.status = PatchStatus.APPLIED
        patch.applied_at = time.time()
        logger.info("Applied patch %s to %s", patch_id, patch.path)
        return patch

    def reject(self, patch_id: str) -> Patch:
        patch = self._patches.get(patch_id)
        if not patch:
            raise WorkspaceError(f"Unknown patch: {patch_id}")
        if patch.status == PatchStatus.APPLIED:
            raise WorkspaceError("Cannot reject an applied patch — use revert instead.")
        patch.status = PatchStatus.REJECTED
        return patch

    def revert(self, patch_id: str) -> Patch:
        """Restore the pre-apply bytes of an applied patch."""
        patch = self._patches.get(patch_id)
        if not patch:
            raise WorkspaceError(f"Unknown patch: {patch_id}")
        if patch.status != PatchStatus.APPLIED:
            raise WorkspaceError(f"Patch {patch_id} is not applied.")

        if not patch.existed_before:
            # It was a CREATE — reverting means removing the created file.
            target = self.ws.resolve(patch.path)
            if target.exists():
                target.unlink()
        else:
            self.ws.write_text(patch.path, patch.backup or patch.old_content or "")

        patch.status = PatchStatus.PENDING
        patch.applied_at = None
        logger.info("Reverted patch %s on %s", patch_id, patch.path)
        return patch

    def revert_all(self) -> List[Patch]:
        """Undo every applied patch, newest first."""
        reverted = []
        for patch in reversed(self.applied()):
            try:
                reverted.append(self.revert(patch.id))
            except Exception as e:
                logger.warning("Could not revert %s: %s", patch.id, e)
        return reverted

    def summary(self) -> dict:
        patches = self.all()
        return {
            "total": len(patches),
            "pending": sum(1 for p in patches if p.status == PatchStatus.PENDING),
            "applied": sum(1 for p in patches if p.status == PatchStatus.APPLIED),
            "rejected": sum(1 for p in patches if p.status == PatchStatus.REJECTED),
            "files": sorted({p.path for p in patches}),
            "added": sum(p.added for p in patches),
            "removed": sum(p.removed for p in patches),
        }
