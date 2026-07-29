import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { Message } from "../../types/chat";

const STORAGE_KEY = "cambo-pins";

function loadPins(): Message[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function savePins(pins: Message[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(pins));
  } catch { /* noop */ }
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

export const { togglePin, removePin } = pinSlice.actions;
export default pinSlice.reducer;
