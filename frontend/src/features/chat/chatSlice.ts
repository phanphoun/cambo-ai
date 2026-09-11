import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { Message, Attachment, ToolCall, Citation } from "../../types/chat";

function getCurrentUserEmail(): string {
  try {
    const raw = localStorage.getItem("sastra_auth_user");
    if (raw) {
      const u = JSON.parse(raw);
      if (u && u.email) return u.email.trim().toLowerCase();
    }
  } catch {
    /* noop */
  }
  return "guest";
}

function getHistoryKey(userEmail?: string): string {
  const email = userEmail || getCurrentUserEmail();
  return `sastra_chat_history_${email}`;
}

function getSessionKey(userEmail?: string): string {
  const email = userEmail || getCurrentUserEmail();
  return `sastra_chat_session_${email}`;
}

const TOOLS_KEY = "cambo-use-tools";

function load<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function sanitizeForStorage(messages: Message[]): Message[] {
  return messages.slice(-50).map((m) => ({
    ...m,
    images: m.images ? m.images.map((_, i) => `[Attachment ${i + 1}]`) : undefined,
  }));
}

function save(key: string, value: unknown) {
  try {
    const toSave = Array.isArray(value) ? sanitizeForStorage(value as Message[]) : value;
    localStorage.setItem(key, JSON.stringify(toSave));
  } catch {
    /* noop */
  }
}

export type ResponseLanguage = "km" | "en" | "fr" | "zh";

const RESPONSE_LANG_KEY = "sastra_response_language";

export interface ChatState {
  sessionId: string | null;
  messages: Message[];
  isStreaming: boolean;
  useTools: boolean;
  attachments: Attachment[];
  responseLanguage: ResponseLanguage;
}

const initialState: ChatState = {
  sessionId: load<string | null>(getSessionKey(), null),
  messages: load<Message[]>(getHistoryKey(), []),
  isStreaming: false,
  useTools: load<boolean>(TOOLS_KEY, false),
  attachments: [],
  responseLanguage: load<ResponseLanguage>(RESPONSE_LANG_KEY, "km"),
};

const chatSlice = createSlice({
  name: "chat",
  initialState,
  reducers: {
    switchUserChat(state, action: PayloadAction<string | undefined>) {
      const email = action.payload || getCurrentUserEmail();
      state.sessionId = load<string | null>(getSessionKey(email), null);
      state.messages = load<Message[]>(getHistoryKey(email), []);
      state.isStreaming = false;
      state.attachments = [];
    },
    addMessage(state, action: PayloadAction<Message>) {
      state.messages.push(action.payload);
      save(getHistoryKey(), state.messages);
    },
    setSessionId(state, action: PayloadAction<string>) {
      state.sessionId = action.payload;
      save(getSessionKey(), action.payload);
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
      }
    },
    persistChat(state) {
      save(getHistoryKey(), state.messages);
    },
    setAssistantMeta(state, action: PayloadAction<{ tool_calls?: ToolCall[]; citations?: Citation[] }>) {
      const last = state.messages[state.messages.length - 1];
      if (last && last.role === "assistant") {
        if (action.payload.tool_calls) last.tool_calls = action.payload.tool_calls;
        if (action.payload.citations) last.citations = action.payload.citations;
        save(getHistoryKey(), state.messages);
      }
    },
    resetChat(state, action: PayloadAction<string | undefined>) {
      const email = action?.payload || getCurrentUserEmail();
      state.sessionId = null;
      state.messages = [];
      state.isStreaming = false;
      state.attachments = [];
      try {
        localStorage.removeItem(getHistoryKey(email));
        localStorage.removeItem(getSessionKey(email));
      } catch {
        /* noop */
      }
    },
    setResponseLanguage(state, action: PayloadAction<ResponseLanguage>) {
      state.responseLanguage = action.payload;
      save(RESPONSE_LANG_KEY, action.payload);
    },
  },
});

export const {
  switchUserChat,
  addMessage,
  setSessionId,
  setStreaming,
  setUseTools,
  addAttachment,
  removeAttachment,
  clearAttachments,
  appendToLastAssistant,
  persistChat,
  setAssistantMeta,
  resetChat,
  setResponseLanguage,
} = chatSlice.actions;

export default chatSlice.reducer;
