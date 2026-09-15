import { API_BASE } from "../../config/api";
import type { AgentEvent, AgentPatch, AgentRunSummary, AgentStatus, PatchSummary } from "./types";

function authHeaders(): Record<string, string> {
  const token = localStorage.getItem("sastra_auth_token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...authHeaders(),
      ...(init.headers ?? {}),
    },
  });
  if (!res.ok) {
    let detail = `HTTP ${res.status}`;
    try {
      const body = await res.json();
      detail = body?.detail ?? detail;
    } catch {
      /* non-JSON error body */
    }
    throw new Error(detail);
  }
  return res.json() as Promise<T>;
}

export const agentApi = {
  status: () => request<AgentStatus>("/api/agent/status"),

  openWorkspace: (path: string) =>
    request<{ workspace: string; entries: { path: string; is_dir: boolean; size: number }[] }>(
      "/api/agent/workspace",
      { method: "POST", body: JSON.stringify({ path }) },
    ),

  tree: (path = ".") =>
    request<{ workspace: string; tree: string[] }>(
      `/api/agent/workspace/tree?path=${encodeURIComponent(path)}`,
    ),

  readFile: (path: string) =>
    request<{ path: string; content: string }>(
      `/api/agent/workspace/file?path=${encodeURIComponent(path)}`,
    ),

  getRun: (runId: string) => request<AgentRunSummary>(`/api/agent/runs/${runId}`),

  listRuns: (limit = 20) =>
    request<{ runs: AgentRunSummary[] }>(`/api/agent/runs?limit=${limit}`),

  applyPatch: (runId: string, patchId: string) =>
    request<{ patch: AgentPatch; summary: PatchSummary }>(
      `/api/agent/runs/${runId}/patches/${patchId}/apply`,
      { method: "POST" },
    ),

  rejectPatch: (runId: string, patchId: string) =>
    request<{ patch: AgentPatch; summary: PatchSummary }>(
      `/api/agent/runs/${runId}/patches/${patchId}/reject`,
      { method: "POST" },
    ),

  revertPatch: (runId: string, patchId: string) =>
    request<{ patch: AgentPatch; summary: PatchSummary }>(
      `/api/agent/runs/${runId}/patches/${patchId}/revert`,
      { method: "POST" },
    ),

  applyAll: (runId: string) =>
    request<{ applied: AgentPatch[]; failed: { id: string; path: string; error: string }[]; summary: PatchSummary }>(
      `/api/agent/runs/${runId}/apply-all`,
      { method: "POST" },
    ),

  revertAll: (runId: string) =>
    request<{ reverted: AgentPatch[]; summary: PatchSummary }>(
      `/api/agent/runs/${runId}/revert-all`,
      { method: "POST" },
    ),
};

/**
 * Start a run and surface each SSE event via `onEvent`.
 *
 * Returns an abort function. The backend keeps the run addressable after the
 * stream closes, so aborting only stops the client listening — pending patches
 * remain approvable via `agentApi`.
 */
export function streamAgentRun(
  body: { goal: string; workspace_path?: string; model?: string; max_rounds?: number },
  onEvent: (event: AgentEvent) => void,
  onError: (message: string) => void,
): () => void {
  const controller = new AbortController();

  (async () => {
    try {
      const res = await fetch(`${API_BASE}/api/agent/run`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify(body),
        signal: controller.signal,
      });

      if (!res.ok || !res.body) {
        let detail = `HTTP ${res.status}`;
        try {
          detail = (await res.json())?.detail ?? detail;
        } catch {
          /* ignore */
        }
        onError(detail);
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        // SSE frames are separated by a blank line.
        const frames = buffer.split("\n\n");
        buffer = frames.pop() ?? "";

        for (const frame of frames) {
          const line = frame.split("\n").find((l) => l.startsWith("data: "));
          if (!line) continue;
          try {
            onEvent(JSON.parse(line.slice(6)) as AgentEvent);
          } catch {
            /* skip malformed frame */
          }
        }
      }
    } catch (err) {
      if ((err as Error).name !== "AbortError") {
        onError((err as Error).message || "Agent stream failed");
      }
    }
  })();

  return () => controller.abort();
}
