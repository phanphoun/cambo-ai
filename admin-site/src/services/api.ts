import type { UserItem, ProviderItem, TelemetryStats, ActivityLogItem } from "../types";

const API_BASE = (import.meta as any).env?.VITE_API_BASE ?? "http://localhost:8000";

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem("sastra_auth_token");
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string> || {}),
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  });

  if (!res.ok) {
    let errorMsg = `HTTP Error ${res.status}`;
    try {
      const data = await res.json();
      if (data.detail) errorMsg = data.detail;
    } catch {
      /* noop */
    }
    throw new Error(errorMsg);
  }

  return res.json();
}

export const AdminApi = {
  // Users
  getUsers: () => request<UserItem[]>("/api/admin/users"),
  createUser: (data: { name: string; email: string; password: string; role: string }) =>
    request<UserItem>("/api/admin/users", { method: "POST", body: JSON.stringify(data) }),
  updateUserRole: (userId: string, role: string) =>
    request<{ status: string; new_role: string }>(`/api/admin/users/${userId}/role`, {
      method: "PATCH",
      body: JSON.stringify({ role }),
    }),
  updateUserStatus: (userId: string, status: "active" | "locked") =>
    request<{ status: string; user_id: string; new_status: string }>(`/api/admin/users/${userId}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    }),
  getUserChats: (userId: string) =>
    request<{ user: any; chats: any[] }>(`/api/admin/users/${userId}/chats`),
  deleteUser: (userId: string) =>
    request<{ status: string; message: string }>(`/api/admin/users/${userId}`, { method: "DELETE" }),

  // Providers
  getProviders: () => request<ProviderItem[]>("/api/admin/providers"),
  addProvider: (data: Partial<ProviderItem> & { api_key?: string }) =>
    request<ProviderItem>("/api/admin/providers", { method: "POST", body: JSON.stringify(data) }),
  updateProviderKey: (providerId: string, data: { api_key: string; base_url?: string; model?: string }) =>
    request<{ status: string; provider_id: string; message: string }>(`/api/admin/providers/${providerId}/key`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),
  testProvider: (providerId: string) =>
    request<{ provider_id: string; status: string; latency_ms: number; message: string }>(
      `/api/admin/providers/${providerId}/test`,
      { method: "POST" }
    ),
  deleteProvider: (providerId: string) =>
    request<{ status: string; message: string }>(`/api/admin/providers/${providerId}`, { method: "DELETE" }),

  // Telemetry
  getStats: () => request<TelemetryStats>("/api/admin/telemetry/stats"),
  getLogs: (params?: { limit?: number; action?: string }) => {
    const query = new URLSearchParams();
    if (params?.limit) query.append("limit", params.limit.toString());
    if (params?.action) query.append("action", params.action);
    const qs = query.toString();
    return request<ActivityLogItem[]>(`/api/admin/telemetry/logs${qs ? `?${qs}` : ""}`);
  },
  clearLogs: () => request<{ status: string; message: string }>("/api/admin/telemetry/logs", { method: "DELETE" }),
};
