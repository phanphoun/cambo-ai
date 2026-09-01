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
  return `sastra_pins_${email}`;
}

function loadPins(userEmail?: string): Message[] {
  try {
    const raw = localStorage.getItem(getStorageKey(userEmail));
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function savePins(pins: Message[], userEmail?: string) {
  try {
    localStorage.setItem(getStorageKey(userEmail), JSON.stringify(pins));
  } catch {
    /* noop */
  }
}

interface PinState {
  pinned: Message[];
}

const initialState: PinState = {
  pinned: loadPins(),
};

const pinSlice = createSlice({
  name: "pin",
  initialState,
  reducers: {
    switchUserPins(state, action: PayloadAction<string | undefined>) {
      state.pinned = loadPins(action.payload);
    },
    togglePin(state, action: PayloadAction<Message>) {
      const idx = state.pinned.findIndex((m) => m.timestamp === action.payload.timestamp);
      if (idx >= 0) {
        state.pinned.splice(idx, 1);
      } else {
        state.pinned.push(action.payload);
      }
      savePins(state.pinned);
    },
    removePin(state, action: PayloadAction<string>) {
      state.pinned = state.pinned.filter((m) => m.timestamp !== action.payload);
      savePins(state.pinned);
    },
  },
});

export const { switchUserPins, togglePin, removePin } = pinSlice.actions;
export default pinSlice.reducer;
