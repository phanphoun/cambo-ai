import { useCallback, useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-hot-toast";
import {
  Bot,
  Check,
  CheckCheck,
  Copy,
  FolderOpen,
  Loader2,
  RotateCcw,
  Send,
  Sparkles,
  Square,
  X,
} from "lucide-react";
import type { RootState } from "../../store";
import { agentApi, streamAgentRun } from "./agentApi";
import {
  finishRun,
  pushCommand,
  pushError,
  pushFallback,
  pushMessage,
  pushToolCall,
  resetRun,
  resolveToolCall,
  setGoal,
  setPanelOpen,
  setPatchSummary,
  setPlan,
  setRunId,
  setStatus,
  setWorkspacePath,
  startRun,
  stopRun,
  upsertPatch,
} from "./agentSlice";
import PlanView from "./PlanView";
import Timeline from "./Timeline";
import MarkdownRenderer from "./MarkdownRenderer";
import type { AgentEvent } from "./types";

export default function AgentPanel() {
  const dispatch = useDispatch();
  const agent = useSelector((s: RootState) => s.agent);
  const {
    open,
    status,
    goal,
    running,
    finished,
    summary,
    plan,
    patchSummary,
    runId,
  } = agent;

  const [input, setInput] = useState("");
  const [wsInput, setWsInput] = useState("");
  const [showWsInput, setShowWsInput] = useState(false);
  const [openingWs, setOpeningWs] = useState(false);
  const [bulkBusy, setBulkBusy] = useState(false);
  const [copiedSummary, setCopiedSummary] = useState(false);

  const abortRef = useRef<(() => void) | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const stickToBottom = useRef(true);

  // Load capability status whenever the panel opens.
  useEffect(() => {
    if (!open) return;
    agentApi
      .status()
      .then((s) => {
        dispatch(setStatus(s));
        if (s.workspace) setWsInput(s.workspace);
      })
      .catch((e) => dispatch(pushError((e as Error).message)));
  }, [open, dispatch]);

  // Follow the stream, but yield to the user the moment they scroll up.
  useEffect(() => {
    const el = scrollRef.current;
    if (el && stickToBottom.current) el.scrollTop = el.scrollHeight;
  }, [agent.timeline, summary]);

  const onScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    stickToBottom.current = el.scrollHeight - el.scrollTop - el.clientHeight < 80;
  }, []);

  // Stop the stream if the panel unmounts mid-run.
  useEffect(() => () => abortRef.current?.(), []);

  const handleEvent = useCallback(
    (event: AgentEvent) => {
      const d = event.data ?? {};
      switch (event.type) {
        case "run_id":
          dispatch(setRunId(d.run_id));
          break;
        case "start":
          break;
        case "plan":
          dispatch(setPlan(d));
          break;
        case "tool_call":
          // Finish tool contains the complete summary string — skip timeline rendering
          // so it doesn't flood the feed; the dedicated summary card renders it.
          if (d.name === "finish") break;
          dispatch(pushToolCall({ name: d.name, args: d.args ?? {} }));
          break;
        case "tool_result":
          if (d.name === "finish") break;
          dispatch(resolveToolCall({ name: d.name, ok: d.ok, preview: d.preview ?? "" }));
          break;
        case "command":
          dispatch(pushCommand(d));
          break;
        case "patch":
          dispatch(upsertPatch(d));
          break;
        case "message":
          if (d.text?.trim()) dispatch(pushMessage(d.text));
          break;
        case "model_fallback":
          dispatch(pushFallback(d.to));
          break;
        case "budget_exhausted":
          break;
        case "error":
          dispatch(pushError(d.message));
          break;
        case "done":
          if (d.patch_summary) dispatch(setPatchSummary(d.patch_summary));
          if (d.plan) dispatch(setPlan(d.plan));
          dispatch(
            finishRun({
              summary: d.summary ?? "",
              error: d.error ?? null,
              rounds_used: d.rounds_used ?? 0,
            }),
          );
          break;
        default:
          break;
      }
    },
    [dispatch],
  );

  async function openWorkspace() {
    const path = wsInput.trim();
    if (!path) return;
    setOpeningWs(true);
    try {
      const res = await agentApi.openWorkspace(path);
      dispatch(setWorkspacePath(res.workspace));
      const s = await agentApi.status();
      dispatch(setStatus(s));
      setShowWsInput(false);
      toast.success(`Workspace opened: ${res.workspace}`);
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setOpeningWs(false);
    }
  }

  function launch() {
    const text = input.trim();
    if (!text || running) return;
    if (!status?.workspace_open && !wsInput.trim()) {
      toast.error("Open a project folder first.");
      setShowWsInput(true);
      return;
    }

    dispatch(startRun(text));
    dispatch(setGoal(text));
    setInput("");
    stickToBottom.current = true;

    abortRef.current = streamAgentRun(
      { goal: text, workspace_path: wsInput.trim() || undefined },
      handleEvent,
      (message) => {
        dispatch(pushError(message));
        dispatch(stopRun());
      },
    );
  }

  function stop() {
    abortRef.current?.();
    abortRef.current = null;
    dispatch(stopRun());
    toast("Stopped watching. Pending changes are still reviewable.", { icon: "⏹" });
  }

  async function bulk(action: "apply" | "revert") {
    if (!runId) return;
    setBulkBusy(true);
    try {
      if (action === "apply") {
        const res = await agentApi.applyAll(runId);
        res.applied.forEach((p) => dispatch(upsertPatch(p)));
        dispatch(setPatchSummary(res.summary));
        if (res.failed.length) {
          toast.error(`${res.failed.length} change(s) could not be applied`);
          const run = await agentApi.getRun(runId);
          run.patches.forEach((p) => dispatch(upsertPatch(p)));
        } else {
          toast.success(`Applied ${res.applied.length} change(s)`);
        }
      } else {
        const res = await agentApi.revertAll(runId);
        res.reverted.forEach((p) => dispatch(upsertPatch(p)));
        dispatch(setPatchSummary(res.summary));
        toast.success(`Reverted ${res.reverted.length} change(s)`);
      }
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBulkBusy(false);
    }
  }

  const handleCopySummary = () => {
    if (!summary) return;
    navigator.clipboard.writeText(summary);
    setCopiedSummary(true);
    toast.success("Summary copied to clipboard");
    setTimeout(() => setCopiedSummary(false), 2000);
  };

  if (!open) return null;

  const disabled = status && !status.enabled;
  const pending = patchSummary?.pending ?? 0;
  const applied = patchSummary?.applied ?? 0;

  return (
    <aside className="fixed inset-y-0 right-0 z-40 flex w-full max-w-xl flex-col border-l border-slate-700/70 bg-slate-900/95 shadow-2xl backdrop-blur-md sm:w-[min(92vw,38rem)]">
      {/* Top Header */}
      <header className="flex items-center justify-between border-b border-slate-800 bg-slate-900/90 px-4 py-3">
        <div className="flex min-w-0 items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gold/15 text-gold shadow-inner border border-gold/25">
            <Bot className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="font-heading text-sm font-semibold tracking-wide text-slate-100">
                SASTRA Agent
              </h2>
              {running ? (
                <span className="flex items-center gap-1 rounded-full border border-amber-500/30 bg-amber-500/15 px-2 py-0.5 text-[10px] font-medium text-amber-300">
                  <Loader2 className="h-2.5 w-2.5 animate-spin" />
                  Running
                </span>
              ) : finished ? (
                <span className="flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/15 px-2 py-0.5 text-[10px] font-medium text-emerald-300">
                  <CheckCheck className="h-2.5 w-2.5" />
                  Done
                </span>
              ) : (
                <span className="rounded-full border border-slate-700/60 bg-slate-800 px-2 py-0.5 text-[10px] font-medium text-slate-400">
                  Ready
                </span>
              )}
            </div>
            <p className="truncate font-mono text-[10px] text-slate-400">
              {status?.workspace ? status.workspace : "No workspace connected"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          {running && (
            <button
              type="button"
              onClick={stop}
              className="inline-flex items-center gap-1 rounded-lg border border-rose-500/40 bg-rose-500/10 px-2.5 py-1 text-xs font-medium text-rose-300 transition hover:bg-rose-500/20"
              title="Stop current run"
            >
              <Square className="h-3 w-3" />
              Stop
            </button>
          )}

          {(goal || finished || agent.timeline.length > 0) && !running && (
            <button
              type="button"
              onClick={() => dispatch(resetRun())}
              className="inline-flex items-center gap-1 rounded-lg border border-slate-700/70 bg-slate-800/60 px-2.5 py-1 text-xs font-medium text-slate-300 transition hover:bg-slate-700 hover:text-white"
              title="Start a new task"
            >
              <RotateCcw className="h-3 w-3" />
              New task
            </button>
          )}

          <button
            type="button"
            onClick={() => dispatch(setPanelOpen(false))}
            className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-800 hover:text-slate-200"
            aria-label="Close agent panel"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </header>

      {disabled ? (
        <div className="flex flex-1 items-center justify-center p-6">
          <div className="max-w-sm rounded-xl border border-amber-500/30 bg-amber-500/10 p-5 text-center shadow-lg">
            <p className="text-sm font-semibold text-amber-200">Agent mode is disabled</p>
            <p className="mt-2 text-xs leading-relaxed text-amber-200/80">
              Set <code className="font-mono bg-black/30 px-1 py-0.5 rounded">AGENT_ENABLED=true</code> in{" "}
              <code className="font-mono bg-black/30 px-1 py-0.5 rounded">backend/.env</code> and restart the backend. Enable it
              only on a machine you control — the agent reads local files and executes commands.
            </p>
          </div>
        </div>
      ) : (
        <>
          {/* Workspace Bar */}
          {status?.workspace && !showWsInput ? (
            <div className="flex items-center justify-between border-b border-slate-800 bg-slate-900/50 px-4 py-2 text-xs">
              <div className="flex min-w-0 items-center gap-2">
                <FolderOpen className="h-3.5 w-3.5 shrink-0 text-gold" />
                <span className="text-[11px] text-slate-400">Workspace:</span>
                <span className="truncate font-mono text-[11px] text-slate-200">
                  {status.workspace}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setShowWsInput(true)}
                className="shrink-0 rounded px-2 py-0.5 text-[10px] font-medium text-slate-400 transition hover:bg-slate-800 hover:text-gold"
              >
                Change folder
              </button>
            </div>
          ) : (
            <div className="border-b border-slate-800 bg-slate-900/60 px-4 py-2.5">
              <div className="mb-1.5 flex items-center justify-between">
                <label className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                  Project Folder
                </label>
                {status?.workspace && (
                  <button
                    type="button"
                    onClick={() => setShowWsInput(false)}
                    className="text-[10px] text-slate-500 transition hover:text-slate-300"
                  >
                    Cancel
                  </button>
                )}
              </div>
              <div className="flex gap-2">
                <input
                  value={wsInput}
                  onChange={(e) => setWsInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && openWorkspace()}
                  placeholder="/home/you/my-project"
                  spellCheck={false}
                  className="min-w-0 flex-1 rounded-lg border border-slate-700 bg-slate-800/80 px-2.5 py-1.5 font-mono text-xs text-slate-200 outline-none transition placeholder:text-slate-500 focus:border-gold/60 focus:ring-1 focus:ring-gold/30"
                />
                <button
                  type="button"
                  onClick={openWorkspace}
                  disabled={openingWs || !wsInput.trim()}
                  className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs font-medium text-slate-200 transition hover:bg-slate-700 hover:text-white disabled:opacity-50"
                >
                  {openingWs ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin text-gold" />
                  ) : (
                    <FolderOpen className="h-3.5 w-3.5 text-gold" />
                  )}
                  Connect
                </button>
              </div>
            </div>
          )}

          {/* Main Feed */}
          <div
            ref={scrollRef}
            onScroll={onScroll}
            className="flex-1 space-y-3 overflow-y-auto px-4 py-3"
          >
            {/* Empty State / Suggestions */}
            {!goal && !running && (
              <div className="py-6 text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl border border-gold/25 bg-gold/10 text-gold shadow-inner">
                  <Bot className="h-6 w-6" />
                </div>
                <h3 className="mt-3 font-heading text-sm font-semibold text-slate-200">
                  Autonomous Code Agent
                </h3>
                <p className="mx-auto mt-1 max-w-sm text-xs leading-relaxed text-slate-400">
                  Ask the agent to investigate your code, inspect directories, diagnose test
                  failures, or make targeted code changes.
                </p>

                <div className="mt-5 space-y-2 text-left">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                    Suggested tasks
                  </p>
                  {[
                    {
                      label: "Inspect architecture & services",
                      prompt: "Inspect the architecture, services, and running topology of this project.",
                    },
                    {
                      label: "Diagnose test failures and propose fixes",
                      prompt: "Run the test suite, find why tests fail, and propose fixes.",
                    },
                    {
                      label: "Review API endpoints & health checks",
                      prompt: "Review the API routes, health check endpoints, and configurations.",
                    },
                    {
                      label: "Explain codebase workflow",
                      prompt: "Explain how data flows from the frontend to the backend services.",
                    },
                  ].map((item) => (
                    <button
                      key={item.label}
                      type="button"
                      onClick={() => setInput(item.prompt)}
                      className="group flex w-full items-center justify-between rounded-xl border border-slate-700/60 bg-slate-800/40 px-3.5 py-2 text-left text-xs text-slate-300 transition hover:border-gold/50 hover:bg-slate-800/80 hover:text-white"
                    >
                      <span>{item.label}</span>
                      <span className="text-slate-500 transition group-hover:translate-x-0.5 group-hover:text-gold">
                        →
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Current Goal */}
            {goal && (
              <div className="rounded-xl border border-gold/30 bg-gold/5 p-3.5 shadow-sm">
                <div className="flex items-center justify-between">
                  <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-gold">
                    <Sparkles className="h-3.5 w-3.5" />
                    Goal
                  </p>
                  {running && (
                    <span className="flex items-center gap-1 rounded-full bg-gold/15 px-2 py-0.5 font-mono text-[10px] font-medium text-gold">
                      <Loader2 className="h-2.5 w-2.5 animate-spin" />
                      In progress
                    </span>
                  )}
                </div>
                <p className="mt-1 text-xs leading-relaxed text-slate-200">{goal}</p>
              </div>
            )}

            {/* Execution Plan */}
            {plan && <PlanView plan={plan} />}

            {/* Timeline Stream */}
            <Timeline />

            {/* Summary Card with Markdown Rendering */}
            {finished && summary && (
              <div className="space-y-3 rounded-xl border border-slate-700/80 bg-slate-800/50 p-4 shadow-lg">
                <div className="flex items-center justify-between border-b border-slate-700/60 pb-2.5">
                  <div className="flex items-center gap-2">
                    <div className="flex h-6 w-6 items-center justify-center rounded-lg border border-gold/30 bg-gold/20 text-gold shadow-sm">
                      <Sparkles className="h-3.5 w-3.5" />
                    </div>
                    <h3 className="font-heading text-xs font-semibold uppercase tracking-wider text-slate-200">
                      Summary & Findings
                    </h3>
                  </div>
                  <div className="flex items-center gap-2">
                    {agent.roundsUsed > 0 && (
                      <span className="rounded-full border border-slate-700 bg-slate-900/60 px-2 py-0.5 font-mono text-[10px] text-slate-400">
                        {agent.roundsUsed} round{agent.roundsUsed > 1 ? "s" : ""}
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={handleCopySummary}
                      className="inline-flex items-center gap-1 rounded-lg border border-slate-700 bg-slate-800 px-2.5 py-1 text-[11px] font-medium text-slate-300 transition hover:bg-slate-700 hover:text-white"
                      title="Copy markdown summary"
                    >
                      {copiedSummary ? (
                        <Check className="h-3.5 w-3.5 text-emerald-400" />
                      ) : (
                        <Copy className="h-3.5 w-3.5" />
                      )}
                      <span>{copiedSummary ? "Copied" : "Copy"}</span>
                    </button>
                  </div>
                </div>

                <MarkdownRenderer content={summary} />
              </div>
            )}

            {/* Active Execution Banner */}
            {running && (
              <div className="flex items-center justify-between rounded-xl border border-gold/30 bg-gold/10 px-3.5 py-2.5 text-xs shadow-sm">
                <div className="flex items-center gap-2 text-gold">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="font-medium">Agent analyzing codebase and executing actions…</span>
                </div>
                <button
                  type="button"
                  onClick={stop}
                  className="inline-flex items-center gap-1 rounded-lg border border-rose-500/30 bg-rose-500/10 px-2 py-1 text-[11px] font-medium text-rose-300 transition hover:bg-rose-500/20"
                >
                  <Square className="h-3 w-3" />
                  Stop
                </button>
              </div>
            )}
          </div>

          {/* Review Bar (Bulk Apply / Revert) */}
          {(pending > 0 || applied > 0) && (
            <div className="flex items-center gap-2 border-t border-slate-800 bg-slate-900/90 px-4 py-2.5 shadow-md">
              <p className="min-w-0 flex-1 text-xs text-slate-400">
                {pending > 0 && (
                  <span className="font-medium text-amber-300">
                    {pending} change{pending > 1 ? "s" : ""} awaiting review
                  </span>
                )}
                {pending > 0 && applied > 0 && <span className="text-slate-600"> · </span>}
                {applied > 0 && (
                  <span className="font-medium text-emerald-400">
                    {applied} applied
                  </span>
                )}
              </p>
              {pending > 0 && (
                <button
                  type="button"
                  onClick={() => bulk("apply")}
                  disabled={bulkBusy}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white shadow-sm transition hover:bg-emerald-500 disabled:opacity-50"
                >
                  {bulkBusy ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <CheckCheck className="h-3.5 w-3.5" />
                  )}
                  Apply all
                </button>
              )}
              {applied > 0 && (
                <button
                  type="button"
                  onClick={() => bulk("revert")}
                  disabled={bulkBusy}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs font-medium text-slate-300 transition hover:bg-slate-700 hover:text-white disabled:opacity-50"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  Undo all
                </button>
              )}
            </div>
          )}

          {/* Composer */}
          <div className="border-t border-slate-800 bg-slate-900/80 p-3.5">
            <div className="relative flex items-end gap-2 rounded-xl border border-slate-700/80 bg-slate-800/80 p-1.5 shadow-sm transition focus-within:border-gold/60 focus-within:ring-1 focus-within:ring-gold/30">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    launch();
                  }
                }}
                rows={2}
                disabled={running}
                placeholder="What should the agent do? (e.g. Inspect architecture, fix a bug, audit tests)"
                className="min-h-[3rem] flex-1 resize-none bg-transparent px-2.5 py-1.5 text-xs leading-relaxed text-slate-100 outline-none placeholder:text-slate-500 disabled:opacity-60"
              />
              <button
                type="button"
                onClick={launch}
                disabled={running || !input.trim()}
                className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gold text-slate-950 shadow-md transition hover:bg-gold-light hover:scale-105 active:scale-95 disabled:pointer-events-none disabled:opacity-40"
                aria-label="Run agent"
              >
                {running ? (
                  <Loader2 className="h-4 w-4 animate-spin text-slate-950" />
                ) : (
                  <Send className="h-4 w-4 text-slate-950" />
                )}
              </button>
            </div>

            <div className="mt-2 flex items-center justify-between px-1 text-[10px] text-slate-500">
              <span>Press ↵ to run · Shift+↵ for new line</span>
              {finished && (
                <button
                  type="button"
                  onClick={() => dispatch(resetRun())}
                  className="font-medium text-slate-400 transition hover:text-gold"
                >
                  Clear & start new run
                </button>
              )}
            </div>
          </div>
        </>
      )}
    </aside>
  );
}
