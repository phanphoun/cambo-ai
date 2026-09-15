import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-hot-toast";
import {
  Check,
  ChevronDown,
  ChevronRight,
  Copy,
  FilePlus2,
  FileX2,
  Loader2,
  Pencil,
  RotateCcw,
  X,
} from "lucide-react";
import type { RootState } from "../../store";
import { agentApi } from "./agentApi";
import {
  setPatchBusy,
  setPatchSummary,
  toggleExpandedPatch,
  upsertPatch,
} from "./agentSlice";
import DiffView from "./DiffView";
import type { AgentPatch } from "./types";

const KIND_ICON = {
  edit: Pencil,
  create: FilePlus2,
  rewrite: Pencil,
  delete: FileX2,
} as const;

const STATUS_BADGE: Record<AgentPatch["status"], string> = {
  pending: "bg-amber-500/15 text-amber-300 border-amber-500/30",
  applied: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
  rejected: "bg-slate-600/20 text-slate-400 border-slate-600/40",
  stale: "bg-rose-500/15 text-rose-300 border-rose-500/30",
};

const STATUS_LABEL: Record<AgentPatch["status"], string> = {
  pending: "Awaiting review",
  applied: "Applied to disk",
  rejected: "Rejected",
  stale: "Out of date",
};

export default function PatchCard({ patch }: { patch: AgentPatch }) {
  const dispatch = useDispatch();
  const runId = useSelector((s: RootState) => s.agent.runId);
  const expanded = useSelector((s: RootState) => s.agent.expandedPatch === patch.id);
  const busy = useSelector((s: RootState) => s.agent.busyPatches.includes(patch.id));
  const [copied, setCopied] = useState(false);

  const Icon = KIND_ICON[patch.kind] ?? Pencil;

  const handleCopyDiff = () => {
    navigator.clipboard.writeText(patch.diff);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  async function act(kind: "apply" | "reject" | "revert") {
    if (!runId) return;
    dispatch(setPatchBusy({ id: patch.id, busy: true }));
    try {
      const fn =
        kind === "apply"
          ? agentApi.applyPatch
          : kind === "reject"
            ? agentApi.rejectPatch
            : agentApi.revertPatch;
      const res = await fn(runId, patch.id);
      dispatch(upsertPatch(res.patch));
      dispatch(setPatchSummary(res.summary));
      toast.success(
        kind === "apply"
          ? `Applied to ${patch.path}`
          : kind === "reject"
            ? "Change rejected"
            : `Reverted ${patch.path}`,
      );
    } catch (err) {
      toast.error((err as Error).message);
      // A stale patch comes back 409 — refresh so the badge reflects reality.
      if (runId) {
        try {
          const run = await agentApi.getRun(runId);
          const fresh = run.patches.find((p) => p.id === patch.id);
          if (fresh) dispatch(upsertPatch(fresh));
        } catch {
          /* leave the card as-is */
        }
      }
    } finally {
      dispatch(setPatchBusy({ id: patch.id, busy: false }));
    }
  }

  return (
    <div className="overflow-hidden rounded-xl border border-slate-700/60 bg-slate-800/40">
      <button
        type="button"
        onClick={() => dispatch(toggleExpandedPatch(patch.id))}
        className="flex w-full items-start gap-2 px-3 py-2.5 text-left transition hover:bg-slate-700/30"
      >
        {expanded ? (
          <ChevronDown className="mt-0.5 h-4 w-4 shrink-0 text-slate-500" />
        ) : (
          <ChevronRight className="mt-0.5 h-4 w-4 shrink-0 text-slate-500" />
        )}
        <Icon className="mt-0.5 h-4 w-4 shrink-0 text-gold" />

        <span className="min-w-0 flex-1">
          <span className="flex flex-wrap items-center gap-2">
            <code className="truncate font-mono text-xs text-slate-200">{patch.path}</code>
            <span className="shrink-0 font-mono text-[10px] text-emerald-400">+{patch.added}</span>
            <span className="shrink-0 font-mono text-[10px] text-rose-400">−{patch.removed}</span>
          </span>
          {patch.rationale && (
            <span className="mt-0.5 block text-[11px] leading-snug text-slate-400">
              {patch.rationale}
            </span>
          )}
        </span>

        <span
          className={`shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-medium ${STATUS_BADGE[patch.status]}`}
        >
          {STATUS_LABEL[patch.status]}
        </span>
      </button>

      {expanded && (
        <div className="border-t border-slate-700/60 px-3 pb-3 pt-2">
          {patch.error && (
            <p className="mb-2 rounded-lg border border-rose-500/30 bg-rose-500/10 px-2.5 py-1.5 text-[11px] text-rose-200">
              {patch.error}
            </p>
          )}

          <DiffView diff={patch.diff} />

          <div className="mt-2.5 flex flex-wrap items-center gap-2">
            {patch.status === "pending" && (
              <>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => act("apply")}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-emerald-500 disabled:opacity-50"
                >
                  {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
                  Apply
                </button>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => act("reject")}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-slate-600 px-3 py-1.5 text-xs font-medium text-slate-300 transition hover:bg-slate-700/50 disabled:opacity-50"
                >
                  <X className="h-3.5 w-3.5" />
                  Reject
                </button>
              </>
            )}

            {patch.status === "applied" && (
              <button
                type="button"
                disabled={busy}
                onClick={() => act("revert")}
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-600 px-3 py-1.5 text-xs font-medium text-slate-300 transition hover:bg-slate-700/50 disabled:opacity-50"
              >
                {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RotateCcw className="h-3.5 w-3.5" />}
                Undo
              </button>
            )}

            {patch.status === "stale" && (
              <p className="text-[11px] text-slate-400">
                The file changed after this was proposed. Re-run the agent so it can read the
                current version.
              </p>
            )}

            <button
              type="button"
              onClick={handleCopyDiff}
              className="ml-auto inline-flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800/60 px-2.5 py-1.5 text-xs font-medium text-slate-400 transition hover:bg-slate-700/60 hover:text-slate-200"
              title="Copy unified diff"
            >
              {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
              <span>{copied ? "Copied diff" : "Copy diff"}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
