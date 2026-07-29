import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

export type Theme = "dark" | "light";

const STORAGE_KEY = "cambo-theme";

function load(): Theme {
  try {
    const val = localStorage.getItem(STORAGE_KEY);
    if (val === "dark" || val === "light") return val;
  } catch { /* noop */ }
  // Default to dark if system doesn't prefer light
  if (window.matchMedia?.("(prefers-color-scheme: light)").matches) {
    return "light";
  }
  return "dark";
}

interface ThemeState {
  current: Theme;
}

const initialState: ThemeState = {
  current: load(),
};

const themeSlice = createSlice({
  name: "theme",
  initialState,
  reducers: {
    setTheme(state, action: PayloadAction<Theme>) {
      state.current = action.payload;
      try { localStorage.setItem(STORAGE_KEY, action.payload); } catch { /* noop */ }
    },
    toggleTheme(state) {
      state.current = state.current === "dark" ? "light" : "dark";
      try { localStorage.setItem(STORAGE_KEY, state.current); } catch { /* noop */ }
    },
  },
});

export const { setTheme, toggleTheme } = themeSlice.actions;
export default themeSlice.reducer;
