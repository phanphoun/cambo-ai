# 🤖 SASTRA Agent — Autonomous Coding Mode

SASTRA Agent turns the platform into a software engineering agent that works on a real project on your machine: it **reads** your code, **plans** its approach, **runs** tests and type checks to diagnose failures, and **proposes code changes as diffs you approve by hand**.

---

## The core guarantee: the agent cannot write to your files

Every editing tool queues a *proposal*. Nothing reaches disk until you click **Apply** on a diff you have read. Applied changes can be undone with **Undo**, which restores the exact bytes from before the write.

```
agent proposes  →  you read the diff  →  you Apply  →  bytes written  →  Undo restores
      │                                      │
   nothing on disk yet               the ONLY path that writes
```

---

## ⚠ Enable it only on a machine you control

The agent reads local files and executes commands on whatever host runs the backend. It is **disabled by default** and must never be enabled on a public deployment (Render, Hugging Face Spaces, an internet-reachable VPS).

```bash
# backend/.env
AGENT_ENABLED=true
AGENT_WORKSPACE_ROOT=/home/you/your-project
AGENT_REQUIRE_ADMIN=true       # keep this on
```

Three gates protect every endpoint:

| Gate | Default | Behaviour |
| :--- | :--- | :--- |
| `AGENT_ENABLED` | `false` | All 14 endpoints return **403** |
| Authentication | required | No/invalid token → **401** |
| `AGENT_REQUIRE_ADMIN` | `true` | Non-admin account → **403** |

---

## Sandbox

**Filesystem.** Confined to `AGENT_WORKSPACE_ROOT`. Paths are resolved *before* the containment check, so `../` traversal and symlinks pointing outside are both refused. `.env`, `*.pem`, `*.key`, and other secret patterns are unreadable even by exact path — `.env.example` and friends stay readable. `node_modules`, `venv`, `.git`, `dist` and similar are invisible, so the agent never wastes context on them.

**Commands.** `run_command` runs allowlisted executables with **no shell** — arguments are parsed with `shlex` and passed to `subprocess` as a list, so `;`, `&&`, `|`, `$()` and redirection are inert text. Allowed: test, lint, build and inspection tools (`pytest`, `tsc`, `eslint`, `git status`, `ls`, `grep`, …). Blocked: package installs, `git push`/`commit`/`reset`, network fetches, and anything not on the list. Every command is killed after `AGENT_COMMAND_TIMEOUT` and its output truncated.

---

## Using it

Click **Agent** in the top bar, point it at a project folder, and describe a task:

- *"Find why the test suite fails and propose a fix"*
- *"Add input validation to the login endpoint"*
- *"Explain how authentication flows through this codebase"*

You'll see the plan build, each tool call as it happens, real command output, and diffs with **Apply** / **Reject** per change — plus **Apply all** and **Undo all**.

---

## API

| Method | Endpoint | Purpose |
| :--- | :--- | :--- |
| `GET` | `/api/agent/status` | Capabilities, workspace, allowlist |
| `POST` | `/api/agent/workspace` | Open a project directory |
| `GET` | `/api/agent/workspace/tree` | Project tree |
| `GET` | `/api/agent/workspace/file` | Read one file |
| `POST` | `/api/agent/run` | Start a run — **streams SSE events** |
| `GET` | `/api/agent/runs/{id}` | Run state, plan, patches |
| `GET` | `/api/agent/runs/{id}/patches` | List proposals |
| `POST` | `.../patches/{pid}/apply` | Write one proposal to disk |
| `POST` | `.../patches/{pid}/reject` | Discard one proposal |
| `POST` | `.../patches/{pid}/revert` | Undo an applied proposal |
| `POST` | `/api/agent/runs/{id}/apply-all` | Apply every pending proposal |
| `POST` | `/api/agent/runs/{id}/revert-all` | Undo everything applied |

SSE event types: `run_id`, `start`, `plan`, `tool_call`, `tool_result`, `command`, `patch`, `message`, `model_fallback`, `budget_exhausted`, `error`, `done`.

```bash
curl -N -X POST http://localhost:8001/api/agent/run \
  -H 'Content-Type: application/json' \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"goal":"Find why the tests fail and propose a fix"}'
```

---

## The agent's tools

| Tool | Effect |
| :--- | :--- |
| `project_tree`, `list_dir` | Orient in the codebase |
| `read_file` | Read with line numbers |
| `grep_search`, `glob_files` | Find code by content or name |
| `run_command` | Execute an allowlisted command |
| `write_plan`, `update_plan` | Build and update the visible plan |
| `edit_file`, `create_file`, `rewrite_file`, `delete_file` | **Propose** a change (never writes) |
| `finish` | End the run with a summary |

`edit_file` requires its `old_str` to match **exactly once** in the file — an ambiguous snippet is refused rather than applied to the wrong occurrence. If a file changes after a proposal was made, applying it fails as **stale** instead of clobbering your edit.

---

## Architecture

```
backend/services/agent/
  workspace.py   path confinement, secret/ignore filtering, size caps
  patches.py     proposals, unified diffs, apply/reject/revert
  shell.py       allowlisted, shell-less, timeout-bounded execution
  plan.py        the visible todo list
  toolset.py     tool declarations bound to one run
  runner.py      the model/tool loop, event stream, model failover
  prompts.py     agent system prompt
  registry.py    in-memory run store
backend/routes/agent.py        14 endpoints
frontend/src/features/agent/   AgentPanel, Timeline, PatchCard, DiffView, PlanView
```

Covered by 43 tests in `backend/tests/test_agent.py`, focused on the boundaries: escape attempts, secret reads, command injection, and the propose-never-writes guarantee.
