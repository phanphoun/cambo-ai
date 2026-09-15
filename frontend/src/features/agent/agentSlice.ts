import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type {
  AgentPatch,
  AgentPlan,
  AgentStatus,
  CommandResult,
  PatchSummary,
  TimelineEntry,
} from "./types";

export interface AgentState {
  open: boolean;
  status: AgentStatus | null;
  workspacePath: string;

  runId: string | null;
  goal: string;
  running: boolean;
  finished: boolean;
  summary: string;
  error: string | null;
  roundsUsed: number;

  plan: AgentPlan | null;
  timeline: TimelineEntry[];
  patches: Record<string, AgentPatch>;
  patchOrder: string[];
  patchSummary: PatchSummary | null;

  /** Patch ids with an approve/reject request in flight. */
  busyPatches: string[];
  expandedPatch: string | null;
}

const initialState: AgentState = {
  open: false,
  status: null,
  workspacePath: "",
  runId: null,
  goal: "",
  running: false,
  finished: false,
  summary: "",
  error: null,
  roundsUsed: 0,
  plan: null,
  timeline: [],
  patches: {},
  patchOrder: [],
  patchSummary: null,
  busyPatches: [],
  expandedPatch: null,
};

let seq = 0;
const nextId = () => `t${++seq}`;

const agentSlice = createSlice({
  name: "agent",
  initialState,
  reducers: {
    setPanelOpen(state, action: PayloadAction<boolean>) {
      state.open = action.payload;
    },
    setStatus(state, action: PayloadAction<AgentStatus>) {
      state.status = action.payload;
      if (action.payload.workspace && !state.workspacePath) {
        state.workspacePath = action.payload.workspace;
      }
    },
    setWorkspacePath(state, action: PayloadAction<string>) {
      state.workspacePath = action.payload;
    },
    setGoal(state, action: PayloadAction<string>) {
      state.goal = action.payload;
    },

    startRun(state, action: PayloadAction<string>) {
      state.goal = action.payload;
      state.running = true;
      state.finished = false;
      state.summary = "";
      state.error = null;
      state.roundsUsed = 0;
      state.plan = null;
      state.timeline = [];
      state.patches = {};
      state.patchOrder = [];
      state.patchSummary = null;
      state.busyPatches = [];
      state.expandedPatch = null;
      state.runId = null;
    },
    setRunId(state, action: PayloadAction<string>) {
      state.runId = action.payload;
    },

    pushMessage(state, action: PayloadAction<string>) {
      state.timeline.push({ kind: "message", id: nextId(), text: action.payload });
    },
    pushToolCall(state, action: PayloadAction<{ name: string; args: Record<string, unknown> }>) {
      state.timeline.push({
        kind: "tool",
        id: nextId(),
        name: action.payload.name,
        args: action.payload.args,
        running: true,
      });
    },
    resolveToolCall(state, action: PayloadAction<{ name: string; ok: boolean; preview: string }>) {
      // Settle the most recent still-running call with this name.
      for (let i = state.timeline.length - 1; i >= 0; i--) {
        const entry = state.timeline[i];
        if (entry.kind === "tool" && entry.name === action.payload.name && entry.running) {
          entry.running = false;
          entry.ok = action.payload.ok;
          entry.preview = action.payload.preview;
          return;
        }
      }
    },
    pushCommand(state, action: PayloadAction<CommandResult>) {
      state.timeline.push({ kind: "command", id: nextId(), result: action.payload });
    },
    pushFallback(state, action: PayloadAction<string>) {
      state.timeline.push({ kind: "fallback", id: nextId(), to: action.payload });
    },
    pushError(state, action: PayloadAction<string>) {
      state.error = action.payload;
      state.timeline.push({ kind: "error", id: nextId(), message: action.payload });
    },

    setPlan(state, action: PayloadAction<AgentPlan>) {
      state.plan = action.payload;
    },

    upsertPatch(state, action: PayloadAction<AgentPatch>) {
      const patch = action.payload;
      const isNew = !state.patches[patch.id];
      state.patches[patch.id] = patch;
      if (isNew) {
        state.patchOrder.push(patch.id);
        state.timeline.push({ kind: "patch", id: nextId(), patchId: patch.id });
        // Auto-open the first proposal so the review surface is never empty.
        if (!state.expandedPatch) state.expandedPatch = patch.id;
      }
    },
    setPatchSummary(state, action: PayloadAction<PatchSummary>) {
      state.patchSummary = action.payload;
    },
    setPatchBusy(state, action: PayloadAction<{ id: string; busy: boolean }>) {
      const { id, busy } = action.payload;
      state.busyPatches = busy
        ? [...new Set([...state.busyPatches, id])]
        : state.busyPatches.filter((p) => p !== id);
    },
    toggleExpandedPatch(state, action: PayloadAction<string>) {
      state.expandedPatch = state.expandedPatch === action.payload ? null : action.payload;
    },

    finishRun(
      state,
      action: PayloadAction<{ summary: string; error: string | null; rounds_used: number }>,
    ) {
      state.running = false;
      state.finished = true;
      state.summary = action.payload.summary;
      state.roundsUsed = action.payload.rounds_used;
      if (action.payload.error) state.error = action.payload.error;
    },
    stopRun(state) {
      state.running = false;
    },
    resetRun(state) {
      return {
        ...initialState,
        open: state.open,
        status: state.status,
        workspacePath: state.workspacePath,
      };
    },
  },
});

export const {
  setPanelOpen,
  setStatus,
  setWorkspacePath,
  setGoal,
  startRun,
  setRunId,
  pushMessage,
  pushToolCall,
  resolveToolCall,
  pushCommand,
  pushFallback,
  pushError,
  setPlan,
  upsertPatch,
  setPatchSummary,
  setPatchBusy,
  toggleExpandedPatch,
  finishRun,
  stopRun,
  resetRun,
} = agentSlice.actions;

export default agentSlice.reducer;
