import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { Message } from "../../types/chat";

const STORAGE_KEY = "cambo-conversations";
const MAX_CONVERSATIONS = 50;

export interface SavedConversation {
  id: string;
  title: string;
  messages: Message[];
  sessionId: string | null;
  createdAt: string;
  updatedAt: string;
  messageCount: number;
}

function load(): SavedConversation[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function save(conversations: SavedConversation[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(conversations.slice(0, MAX_CONVERSATIONS)));
  } catch { /* noop */ }
}

function generateTitle(messages: Message[]): string {
  const firstUser = messages.find((m) => m.role === "user");
  if (!firstUser) return "New conversation";
  const text = firstUser.content.trim();
  if (text.length <= 45) return text;
  return text.slice(0, 42) + "...";
}

interface ConversationsState {
  list: SavedConversation[];
}

const initialState: ConversationsState = {
  list: load(),
};

const conversationsSlice = createSlice({
  name: "conversations",
  initialState,
  reducers: {
    saveConversation(state, action: PayloadAction<{ messages: Message[]; sessionId: string | null }>) {
      const { messages, sessionId } = action.payload;
      if (messages.length === 0) return;

      const existingIdx = state.list.findIndex(
        (c) => c.sessionId && c.sessionId === sessionId,
      );

      const entry: SavedConversation = {
        id: sessionId || Date.now().toString(),
        title: generateTitle(messages),
        messages: messages.slice(),
        sessionId,
        createdAt: existingIdx >= 0 ? state.list[existingIdx].createdAt : new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        messageCount: messages.filter((m) => m.content).length,
      };

      if (existingIdx >= 0) {
        state.list[existingIdx] = entry;
      } else {
        state.list.unshift(entry);
      }

      save(state.list);
    },

    deleteConversation(state, action: PayloadAction<string>) {
      state.list = state.list.filter((c) => c.id !== action.payload);
      save(state.list);
    },

    clearAllConversations(state) {
      state.list = [];
      save(state.list);
    },
  },
});

export const { saveConversation, deleteConversation, clearAllConversations } = conversationsSlice.actions;
export default conversationsSlice.reducer;
