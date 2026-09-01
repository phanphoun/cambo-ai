export interface UserItem {
  id: string;
  email: string;
  name: string;
  role: "admin" | "member" | "guest";
  status: "active" | "locked";
  avatar?: string;
  created_at: number;
  last_active?: number;
  total_queries?: number;
  total_tokens?: number;
  docs_count?: number;
}

export interface UserChatTurn {
  id: string;
  timestamp: number;
  user_email: string;
  session_id: string;
  user_message: string;
  ai_response: string;
  provider: string;
  model: string;
  tokens_used: number;
  tool_calls: any[];
  has_document: boolean;
}

export interface UserDetailResponse {
  user: UserItem & {
    stats: {
      total_queries: number;
      total_tokens: number;
      docs_count: number;
      last_active: number | null;
    };
  };
  chats: UserChatTurn[];
}

export interface ProviderItem {
  id: string;
  name: string;
  type: string;
  status: "active" | "inactive";
  base_url: string;
  model: string;
  api_key?: string;
  api_key_masked?: string;
  has_key?: boolean;
  latency_ms?: number;
  description?: string;
}

export interface TelemetryStats {
  total_requests: number;
  total_tokens: number;
  avg_latency_ms: number;
  error_count: number;
  success_rate: number;
  active_users_count: number;
  provider_breakdown: Record<string, number>;
  action_breakdown: Record<string, number>;
}

export interface ActivityLogItem {
  id: string;
  timestamp: number;
  action: string;
  user: string;
  provider: string;
  status_code: number;
  latency_ms: number;
  tokens_est: number;
  details?: string;
}
