// Shapes mirroring backend/services/agent — keep in sync with runner.py events.

export type PatchKind = "edit" | "create" | "rewrite" | "delete";
export type PatchStatus = "pending" | "applied" | "rejected" | "stale";
export type StepStatus = "pending" | "active" | "done" | "blocked";

export interface AgentPatch {
  id: string;
  kind: PatchKind;
  path: string;
  rationale: string;
  diff: string;
  status: PatchStatus;
  added: number;
  removed: number;
  created_at: number;
  applied_at: number | null;
  error: string | null;
}

export interface PlanStep {
  index: number;
  title: string;
  status: StepStatus;
  note: string;
}

export interface AgentPlan {
  goal: string;
  steps: PlanStep[];
  complete: boolean;
  updated_at: number;
}

export interface PatchSummary {
  total: number;
  pending: number;
  applied: number;
  rejected: number;
  files: string[];
  added: number;
  removed: number;
}

export interface CommandResult {
  command: string;
  exit_code: number;
  stdout: string;
  stderr: string;
  duration_ms: number;
  timed_out: boolean;
  ok: boolean;
}

export interface ToolCallEvent {
  name: string;
  args: Record<string, unknown>;
}

export interface ToolResultEvent {
  name: string;
  ok: boolean;
  preview: string;
}

/** One entry in the run timeline the UI renders. */
export type TimelineEntry =
  | { kind: "message"; id: string; text: string }
  | { kind: "tool"; id: string; name: string; args: Record<string, unknown>; ok?: boolean; preview?: string; running: boolean }
  | { kind: "command"; id: string; result: CommandResult }
  | { kind: "patch"; id: string; patchId: string }
  | { kind: "fallback"; id: string; to: string }
  | { kind: "error"; id: string; message: string };

export interface AgentStatus {
  enabled: boolean;
  workspace: string | null;
  workspace_open: boolean;
  max_rounds: number;
  command_timeout: number;
  allowed_commands: string[];
  model: string;
  active_runs: number;
}

export interface AgentRunSummary {
  id: string;
  goal: string;
  workspace: string;
  model: string;
  finished: boolean;
  summary: string;
  error: string | null;
  rounds_used: number;
  created_at: number;
  plan: AgentPlan;
  patches: AgentPatch[];
  patch_summary: PatchSummary;
}

/** Raw SSE payload from POST /api/agent/run */
export interface AgentEvent {
  type: string;
  run_id?: string;
  ts?: number;
  data: Record<string, never> | any;
}
