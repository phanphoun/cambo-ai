export interface Message {
  role: "user" | "assistant";
  content: string;
  timestamp: string;
}

export interface ChatRequest {
  message: string;
  session_id?: string | null;
  mode?: string;
  provider?: string;
  history?: Message[];
}

export interface ChatResponse {
  reply: string;
  model: string;
  session_id: string;
  tokens_used?: number | null;
}

export interface AskResponse {
  answer: string;
  model: string;
  tokens_used?: number | null;
  session_id?: string | null;
}
