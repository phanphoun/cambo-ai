import { useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Circle,
  CircleDot,
  ListOrdered,
} from "lucide-react";
import type { AgentPlan, StepStatus } from "./types";

const STEP_CONFIG: Record<
  StepStatus,
  {
    icon: typeof Circle;
    color: string;
    bg: string;
    text: string;
    label: string;
  }
> = {
  pending: {
    icon: Circle,
    color: "text-slate-600",
    bg: "bg-transparent",
    text: "text-slate-400 font-normal",
    label: "Pending",
  },
  active: {
    icon: CircleDot,
    color: "text-gold animate-pulse",
    bg: "bg-gold/10 border-gold/30 shadow-sm",
    text: "text-slate-100 font-medium",
    label: "In progress",
  },
  done: {
    icon: CheckCircle2,
    color: "text-emerald-400",
    bg: "bg-emerald-500/5",
    text: "text-slate-400 line-through decoration-slate-600/70",
    label: "Done",
  },
  blocked: {
    icon: AlertCircle,
    color: "text-rose-400",
    bg: "bg-rose-500/10 border-rose-500/20",
    text: "text-rose-200 font-medium",
    label: "Blocked",
  },
};

export default function PlanView({ plan }: { plan: AgentPlan }) {
  const [collapsed, setCollapsed] = useState(false);
  if (!plan.steps.length) return null;

  const doneCount = plan.steps.filter((s) => s.status === "done").length;
  const total = plan.steps.length;
  const percent = Math.round((doneCount / total) * 100);

  return (
    <section className="overflow-hidden rounded-xl border border-slate-700/60 bg-slate-800/40 shadow-sm">
      <header className="flex items-center justify-between border-b border-slate-700/50 px-3.5 py-2.5">
        <div className="flex items-center gap-2">
          <ListOrdered className="h-4 w-4 text-gold" />
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-300">
            Execution Plan
          </h3>
          <span className="rounded-full bg-slate-700/60 px-2 py-0.5 font-mono text-[10px] text-slate-400">
            {doneCount}/{total} ({percent}%)
          </span>
        </div>

        <button
          type="button"
          onClick={() => setCollapsed(!collapsed)}
          className="rounded p-1 text-slate-400 transition hover:bg-slate-700/50 hover:text-slate-200"
          title={collapsed ? "Expand plan" : "Collapse plan"}
        >
          {collapsed ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronUp className="h-3.5 w-3.5" />}
        </button>
      </header>

      {/* Progress line */}
      <div className="h-1 w-full bg-slate-700/30">
        <div
          className="h-full bg-gradient-to-r from-amber-500 to-gold transition-all duration-500"
          style={{ width: `${percent}%` }}
        />
      </div>

      {!collapsed && (
        <ol className="divide-y divide-slate-800/60 p-2 space-y-1">
          {plan.steps.map((step) => {
            const cfg = STEP_CONFIG[step.status];
            const Icon = cfg.icon;
            const isActive = step.status === "active";

            return (
              <li
                key={step.index}
                className={`flex items-start gap-2.5 rounded-lg border border-transparent p-2 transition ${cfg.bg}`}
              >
                <Icon className={`mt-0.5 h-4 w-4 shrink-0 ${cfg.color}`} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className={`text-xs leading-snug ${cfg.text}`}>
                      <span className="mr-1.5 font-mono text-[11px] opacity-60">#{step.index}</span>
                      {step.title}
                    </p>
                    {isActive && (
                      <span className="shrink-0 rounded-full bg-gold/15 px-2 py-0.5 text-[9px] font-medium uppercase tracking-wider text-gold">
                        Active
                      </span>
                    )}
                  </div>
                  {step.note && (
                    <p className="mt-1 rounded bg-slate-900/50 px-2 py-1 font-mono text-[10px] leading-snug text-slate-400">
                      {step.note}
                    </p>
                  )}
                </div>
              </li>
            );
          })}
        </ol>
      )}
    </section>
  );
}
