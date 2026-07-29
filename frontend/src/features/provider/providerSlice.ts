import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

export type AiProvider = "gemini" | "ollama" | "ollama-cloud";

const STORAGE_KEY = "cambo-provider";

function load(): AiProvider {
  try {
    const val = localStorage.getItem(STORAGE_KEY);
    if (val === "gemini" || val === "ollama" || val === "ollama-cloud") return val;
  } catch { /* noop */ }
  return "gemini";
}

interface ProviderState {
  current: AiProvider;
}

const initialState: ProviderState = {
  current: load(),
};

const providerSlice = createSlice({
  name: "provider",
  initialState,
  reducers: {
    setProvider(state, action: PayloadAction<AiProvider>) {
      state.current = action.payload;
      try { localStorage.setItem(STORAGE_KEY, action.payload); } catch { /* noop */ }
    },
  },
});

export const { setProvider } = providerSlice.actions;
export default providerSlice.reducer;
