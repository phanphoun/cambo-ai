export interface ToolCall {
  name: string;
  args: Record<string, unknown>;
  result_preview: string;
}

export interface Citation {
  document_id: string | null;
  chunk_id: string | null;
  source: string;
  snippet: string;
  score: number;
}

export interface Attachment {
  id: string;
  dataUrl: string; // data:image/...;base64,...
  name: string;
}

export interface Message {
  role: "user" | "assistant";
  content: string;
  timestamp: string;
  images?: string[]; // data URLs shown under a user message
  tool_calls?: ToolCall[];
  citations?: Citation[];
}

export interface ChatRequest {
  message: string;
  session_id?: string | null;
  mode?: string;
  provider?: string;
  image_data?: string[];
  image_urls?: string[];
  document_ids?: string[];
  use_tools?: boolean;
  history?: Message[];
  response_language?: string;
}

export interface ChatResponse {
  reply: string;
  model: string;
  session_id: string;
  tokens_used?: number | null;
  tool_calls?: ToolCall[];
  citations?: Citation[];
}

export interface AskResponse {
  answer: string;
  model: string;
  tokens_used?: number | null;
  session_id?: string | null;
}

export interface RagDocument {
  id: string;
  name: string;
  source_type: "pdf" | "text" | "url" | "markdown";
  size_bytes: number;
  chunks: number;
  created_at: string;
  metadata: Record<string, unknown>;
}

export interface ToolDescriptor {
  name: string;
  description: string;
  parameters: Record<string, unknown>;
}
