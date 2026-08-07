import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { Message, Attachment, ToolCall, Citation } from "../../types/chat";

const HISTORY_KEY = "cambo-history";
const SESSION_KEY = "cambo-session";
const TOOLS_KEY = "cambo-use-tools";

function load<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function save(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch { /* noop */ }
}

export interface ChatState {
  sessionId: string | null;
  messages: Message[];
  isStreaming: boolean;
  useTools: boolean;
  attachments: Attachment[];
}

const initialState: ChatState = {
  sessionId: load<string | null>(SESSION_KEY, null),
  messages: load<Message[]>(HISTORY_KEY, []),
  isStreaming: false,
  useTools: load<boolean>(TOOLS_KEY, false),
  attachments: [],
};

const chatSlice = createSlice({
  name: "chat",
  initialState,
  reducers: {
    addMessage(state, action: PayloadAction<Message>) {
      state.messages.push(action.payload);
      save(HISTORY_KEY, state.messages);
    },
    setSessionId(state, action: PayloadAction<string>) {
      state.sessionId = action.payload;
      save(SESSION_KEY, action.payload);
    },
    setStreaming(state, action: PayloadAction<boolean>) {
      state.isStreaming = action.payload;
    },
    setUseTools(state, action: PayloadAction<boolean>) {
      state.useTools = action.payload;
      save(TOOLS_KEY, action.payload);
    },
    addAttachment(state, action: PayloadAction<Attachment>) {
      state.attachments.push(action.payload);
    },
    removeAttachment(state, action: PayloadAction<string>) {
      state.attachments = state.attachments.filter((a) => a.id !== action.payload);
    },
    clearAttachments(state) {
      state.attachments = [];
    },
    appendToLastAssistant(state, action: PayloadAction<string>) {
      const last = state.messages[state.messages.length - 1];
      if (last && last.role === "assistant") {
        last.content += action.payload;
        save(HISTORY_KEY, state.messages);
      }
    },
    setAssistantMeta(state, action: PayloadAction<{ tool_calls?: ToolCall[]; citations?: Citation[] }>) {
      const last = state.messages[state.messages.length - 1];
      if (last && last.role === "assistant") {
        if (action.payload.tool_calls) last.tool_calls = action.payload.tool_calls;
        if (action.payload.citations) last.citations = action.payload.citations;
        save(HISTORY_KEY, state.messages);
      }
    },
    resetChat(state) {
      state.sessionId = null;
      state.messages = [];
      state.isStreaming = false;
      state.attachments = [];
      localStorage.removeItem(HISTORY_KEY);
      localStorage.removeItem(SESSION_KEY);
    },
  },
});

export const {
  addMessage,
  setSessionId,
  setStreaming,
  setUseTools,
  addAttachment,
  removeAttachment,
  clearAttachments,
  appendToLastAssistant,
  setAssistantMeta,
  resetChat,
} = chatSlice.actions;

export default chatSlice.reducer;
