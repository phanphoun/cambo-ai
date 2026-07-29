import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { Message } from "../../types/chat";

const HISTORY_KEY = "cambo-history";
const SESSION_KEY = "cambo-session";

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
}

const initialState: ChatState = {
  sessionId: load<string | null>(SESSION_KEY, null),
  messages: load<Message[]>(HISTORY_KEY, []),
  isStreaming: false,
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
    appendToLastAssistant(state, action: PayloadAction<string>) {
      const last = state.messages[state.messages.length - 1];
      if (last && last.role === "assistant") {
        last.content += action.payload;
        save(HISTORY_KEY, state.messages);
      }
    },
    resetChat(state) {
      state.sessionId = null;
      state.messages = [];
      state.isStreaming = false;
      localStorage.removeItem(HISTORY_KEY);
      localStorage.removeItem(SESSION_KEY);
    },
  },
});

export const {
  addMessage,
  setSessionId,
  setStreaming,
  appendToLastAssistant,
  resetChat,
} = chatSlice.actions;

export default chatSlice.reducer;
