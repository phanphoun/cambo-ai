import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { Message } from "../../types/chat";

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

function getStorageKey(userEmail?: string): string {
  const email = userEmail || getCurrentUserEmail();
  return `sastra_conversations_${email}`;
}

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

function load(userEmail?: string): SavedConversation[] {
  try {
    const raw = localStorage.getItem(getStorageKey(userEmail));
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function sanitizeConversations(conversations: SavedConversation[]): SavedConversation[] {
  return conversations.slice(0, MAX_CONVERSATIONS).map((c) => ({
    ...c,
    messages: c.messages.slice(-50).map((m) => ({
      ...m,
      images: m.images ? m.images.map((_, i) => `[Attachment ${i + 1}]`) : undefined,
    })),
  }));
}

function save(conversations: SavedConversation[], userEmail?: string) {
  try {
    localStorage.setItem(getStorageKey(userEmail), JSON.stringify(sanitizeConversations(conversations)));
  } catch {
    /* noop */
  }
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
    switchUserConversations(state, action: PayloadAction<string | undefined>) {
      state.list = load(action.payload);
    },

    saveConversation(state, action: PayloadAction<{ messages: Message[]; sessionId: string | null; userEmail?: string }>) {
      const { messages, sessionId, userEmail } = action.payload;
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

      save(state.list, userEmail);
    },

    deleteConversation(state, action: PayloadAction<{ id: string; userEmail?: string } | string>) {
      const id = typeof action.payload === "string" ? action.payload : action.payload.id;
      const userEmail = typeof action.payload === "object" ? action.payload.userEmail : undefined;
      state.list = state.list.filter((c) => c.id !== id);
      save(state.list, userEmail);
    },

    clearAllConversations(state, action: PayloadAction<string | undefined>) {
      state.list = [];
      try {
        localStorage.removeItem(getStorageKey(action.payload));
      } catch {
        /* noop */
      }
    },
  },
});

export const {
  switchUserConversations,
  saveConversation,
  deleteConversation,
  clearAllConversations,
} = conversationsSlice.actions;

export default conversationsSlice.reducer;
