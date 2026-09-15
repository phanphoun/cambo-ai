import { useState } from "react";
import { useSelector } from "react-redux";
import {
  AlertTriangle,
  Check,
  ChevronDown,
  ChevronRight,
  Copy,
  CornerDownRight,
  FileCode2,
  FileSearch,
  FolderTree,
  Loader2,
  Search,
  Terminal,
  Wrench,
} from "lucide-react";
import type { RootState } from "../../store";
import PatchCard from "./PatchCard";
import MarkdownRenderer from "./MarkdownRenderer";
import type { TimelineEntry } from "./types";

interface ToolStyle {
  icon: typeof Wrench;
  color: string;
  badgeBg: string;
  badgeText: string;
}

const TOOL_CONFIG: Record<string, ToolStyle> = {
  read_file: {
    icon: FileSearch,
    color: "text-sky-400",
    badgeBg: "bg-sky-500/15 border-sky-500/30",
    badgeText: "text-sky-300",
  },
  list_dir: {
    icon: FolderTree,
    color: "text-indigo-400",
    badgeBg: "bg-indigo-500/15 border-indigo-500/30",
    badgeText: "text-indigo-300",
  },
  project_tree: {
    icon: FolderTree,
    color: "text-indigo-400",
    badgeBg: "bg-indigo-500/15 border-indigo-500/30",
    badgeText: "text-indigo-300",
  },
  glob_files: {
    icon: Search,
    color: "text-amber-400",
    badgeBg: "bg-amber-500/15 border-amber-500/30",
    badgeText: "text-amber-300",
  },
  grep_search: {
    icon: Search,
    color: "text-amber-400",
    badgeBg: "bg-amber-500/15 border-amber-500/30",
    badgeText: "text-amber-300",
  },
  run_command: {
    icon: Terminal,
    color: "text-emerald-400",
    badgeBg: "bg-emerald-500/15 border-emerald-500/30",
    badgeText: "text-emerald-300",
  },
  edit_file: {
    icon: FileCode2,
    color: "text-amber-400",
    badgeBg: "bg-amber-500/15 border-amber-500/30",
    badgeText: "text-amber-300",
  },
  create_file: {
    icon: FileCode2,
    color: "text-emerald-400",
    badgeBg: "bg-emerald-500/15 border-emerald-500/30",
    badgeText: "text-emerald-300",
  },
  rewrite_file: {
    icon: FileCode2,
    color: "text-amber-400",
    badgeBg: "bg-amber-500/15 border-amber-500/30",
    badgeText: "text-amber-300",
  },
  delete_file: {
    icon: FileCode2,
    color: "text-rose-400",
    badgeBg: "bg-rose-500/15 border-rose-500/30",
    badgeText: "text-rose-300",
  },
};

function formatToolDetail(name: string, args: Record<string, unknown>) {
  if (name === "read_file") {
    const path = typeof args.path === "string" ? args.path : "";
    const offset = args.offset ? `L${args.offset}` : "";
    const limit = args.limit ? `+${args.limit}` : "";
    const span = offset ? ` (${offset}${limit ? ` ${limit}` : ""})` : "";
    return { main: path, sub: span };
  }
  if (name === "list_dir" || name === "project_tree") {
    const path = typeof args.path === "string" ? args.path : ".";
    return { main: path, sub: "" };
  }
  if (name === "grep_search") {
    const pattern = typeof args.pattern === "string" ? `"${args.pattern}"` : "";
    const path = typeof args.path === "string" && args.path !== "." ? ` in ${args.path}` : "";
    return { main: pattern, sub: path };
  }
  if (name === "glob_files") {
    const pattern = typeof args.pattern === "string" ? args.pattern : "";
    const path = typeof args.path === "string" && args.path !== "." ? ` in ${args.path}` : "";
    return { main: pattern, sub: path };
  }
  if (name === "run_command") {
    const cmd = typeof args.command === "string" ? args.command : "";
    return { main: cmd, sub: "" };
  }
  if (name === "edit_file" || name === "create_file" || name === "rewrite_file" || name === "delete_file") {
    const path = typeof args.path === "string" ? args.path : "";
    return { main: path, sub: "" };
  }
  // Generic fallback
  const first = Object.values(args).find((v) => typeof v === "string");
  return { main: typeof first === "string" ? first : "", sub: "" };
}

function ToolRow({ entry }: { entry: Extract<TimelineEntry, { kind: "tool" }> }) {
  const [expanded, setExpanded] = useState(false);
  const cfg = TOOL_CONFIG[entry.name] ?? {
    icon: Wrench,
    color: "text-slate-400",
    badgeBg: "bg-slate-700/30 border-slate-700/50",
    badgeText: "text-slate-300",
  };
  const Icon = cfg.icon;
  const { main, sub } = formatToolDetail(entry.name, entry.args);
  const failed = entry.running === false && entry.ok === false;
  const hasPreview = Boolean(entry.preview?.trim());

  return (
    <div className="group rounded-lg border border-slate-800/80 bg-slate-900/40 p-2 transition hover:border-slate-700/80 hover:bg-slate-900/70">
      <div className="flex items-center justify-between gap-2">
        <div className="flex min-w-0 flex-1 items-center gap-2">
          {entry.running ? (
            <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin text-gold" />
          ) : failed ? (
            <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-rose-400" />
          ) : (
            <Check className="h-3.5 w-3.5 shrink-0 text-emerald-400/90" />
          )}

          <span
            className={`inline-flex items-center gap-1 rounded border px-1.5 py-0.5 font-mono text-[10px] font-medium ${cfg.badgeBg} ${cfg.badgeText}`}
          >
            <Icon className="h-3 w-3" />
            {entry.name}
          </span>

          <span className="min-w-0 flex-1 truncate font-mono text-xs text-slate-300">
            {main}
            {sub && <span className="ml-1 text-slate-500">{sub}</span>}
          </span>
        </div>

        {hasPreview && (
          <button
            type="button"
            onClick={() => setExpanded(!expanded)}
            className="flex shrink-0 items-center gap-1 rounded px-1.5 py-0.5 text-[10px] text-slate-500 transition hover:bg-slate-800 hover:text-slate-300"
          >
            <span>{expanded ? "Hide" : "Output"}</span>
            {expanded ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
          </button>
        )}
      </div>

      {hasPreview && (expanded || failed) && (
        <div className="mt-2 rounded border border-slate-800 bg-slate-950/70 p-2">
          <pre
            className={`max-h-48 overflow-auto whitespace-pre-wrap break-words font-mono text-[10px] leading-snug ${
              failed ? "text-rose-300/90" : "text-slate-400"
            }`}
          >
            {entry.preview}
          </pre>
        </div>
      )}
    </div>
  );
}

function CommandRow({ entry }: { entry: Extract<TimelineEntry, { kind: "command" }> }) {
  const [copied, setCopied] = useState(false);
  const { result } = entry;
  const output = (result.stdout || result.stderr || "").trim();

  const handleCopy = () => {
    navigator.clipboard.writeText(result.command + (output ? `\n${output}` : ""));
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="my-1.5 overflow-hidden rounded-lg border border-slate-700/60 bg-slate-950/70 shadow-sm">
      <div className="flex items-center justify-between gap-2 border-b border-slate-800 bg-slate-900/90 px-3 py-1.5">
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <Terminal className="h-3.5 w-3.5 shrink-0 text-gold" />
          <code className="min-w-0 flex-1 truncate font-mono text-xs text-slate-200">
            {result.command}
          </code>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <span
            className={`rounded border px-1.5 py-0.2 font-mono text-[10px] font-medium ${
              result.ok
                ? "border-emerald-500/30 bg-emerald-500/15 text-emerald-300"
                : "border-rose-500/30 bg-rose-500/15 text-rose-300"
            }`}
          >
            {result.timed_out ? "timeout" : `exit ${result.exit_code}`}
          </span>
          <button
            type="button"
            onClick={handleCopy}
            className="rounded p-1 text-slate-500 transition hover:bg-slate-800 hover:text-slate-300"
            title="Copy command and output"
          >
            {copied ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
          </button>
        </div>
      </div>
      {output && (
        <pre className="max-h-60 overflow-auto whitespace-pre-wrap break-words p-3 font-mono text-[11px] leading-snug text-slate-300">
          {output.slice(0, 3000)}
        </pre>
      )}
    </div>
  );
}

export default function Timeline() {
  const timeline = useSelector((s: RootState) => s.agent.timeline);
  const patches = useSelector((s: RootState) => s.agent.patches);

  return (
    <div className="space-y-1.5">
      {timeline.map((entry) => {
        switch (entry.kind) {
          case "message":
            return (
              <div
                key={entry.id}
                className="my-2 rounded-xl border border-slate-700/60 bg-slate-800/40 p-3.5 shadow-sm"
              >
                <MarkdownRenderer content={entry.text} />
              </div>
            );
          case "tool":
            // Never render 'finish' in the tool feed — the rich Summary card handles it cleanly.
            if (entry.name === "finish") return null;
            // Also skip redundant write_plan / update_plan since PlanView renders them prominently above.
            if (entry.name === "update_plan" || entry.name === "write_plan") return null;
            return <ToolRow key={entry.id} entry={entry} />;
          case "command":
            return <CommandRow key={entry.id} entry={entry} />;
          case "patch": {
            const patch = patches[entry.patchId];
            return patch ? (
              <div key={entry.id} className="my-2">
                <PatchCard patch={patch} />
              </div>
            ) : null;
          }
          case "fallback":
            return (
              <div
                key={entry.id}
                className="flex items-center gap-2 rounded-lg border border-amber-500/25 bg-amber-500/10 px-3 py-1.5 text-xs text-amber-300"
              >
                <CornerDownRight className="h-3.5 w-3.5 shrink-0 text-gold" />
                <span>
                  High traffic detected — transitioned seamlessly to{" "}
                  <strong className="font-mono text-white">{entry.to}</strong>
                </span>
              </div>
            );
          case "error":
            return (
              <div
                key={entry.id}
                className="my-2 flex items-start gap-2.5 rounded-lg border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-200"
              >
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-rose-400" />
                <span className="min-w-0 flex-1 whitespace-pre-wrap break-words">{entry.message}</span>
              </div>
            );
          default:
            return null;
        }
      })}
    </div>
  );
}
