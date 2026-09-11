import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import { DEFAULT_BACKGROUND_ID } from "../../data/backgrounds";
import { DEFAULT_FONT_ID, type KhmerFontId, KHMER_FONT_PRESETS } from "../../data/fonts";

export type Theme = "dark" | "light";

const STORAGE_THEME_KEY = "cambo-theme";
const STORAGE_BG_KEY = "sastra-background-id";
const STORAGE_OPACITY_KEY = "sastra-background-opacity";
const STORAGE_FONT_KEY = "sastra-font-family";

function loadTheme(): Theme {
  try {
    const val = localStorage.getItem(STORAGE_THEME_KEY);
    if (val === "dark" || val === "light") return val;
  } catch { /* noop */ }
  // Default to dark if system doesn't prefer light
  if (window.matchMedia?.("(prefers-color-scheme: light)").matches) {
    return "light";
  }
  return "dark";
}

function loadBackgroundId(): string {
  try {
    const val = localStorage.getItem(STORAGE_BG_KEY);
    if (val) return val;
  } catch { /* noop */ }
  return DEFAULT_BACKGROUND_ID;
}

function loadBackgroundOpacity(): number {
  try {
    const val = localStorage.getItem(STORAGE_OPACITY_KEY);
    if (val) {
      const parsed = parseFloat(val);
      if (!isNaN(parsed) && parsed >= 0.1 && parsed <= 1.0) return parsed;
    }
  } catch { /* noop */ }
  return 0.5;
}

function loadFontId(): KhmerFontId {
  try {
    const val = localStorage.getItem(STORAGE_FONT_KEY) as KhmerFontId | null;
    if (val && KHMER_FONT_PRESETS.some((f) => f.id === val)) {
      return val;
    }
  } catch { /* noop */ }
  return DEFAULT_FONT_ID;
}

interface ThemeState {
  current: Theme;
  backgroundId: string;
  backgroundOpacity: number;
  fontFamilyId: KhmerFontId;
}

const initialState: ThemeState = {
  current: loadTheme(),
  backgroundId: loadBackgroundId(),
  backgroundOpacity: loadBackgroundOpacity(),
  fontFamilyId: loadFontId(),
};

const themeSlice = createSlice({
  name: "theme",
  initialState,
  reducers: {
    setTheme(state, action: PayloadAction<Theme>) {
      state.current = action.payload;
      try { localStorage.setItem(STORAGE_THEME_KEY, action.payload); } catch { /* noop */ }
    },
    toggleTheme(state) {
      state.current = state.current === "dark" ? "light" : "dark";
      try { localStorage.setItem(STORAGE_THEME_KEY, state.current); } catch { /* noop */ }
    },
    setBackgroundId(state, action: PayloadAction<string>) {
      state.backgroundId = action.payload;
      try { localStorage.setItem(STORAGE_BG_KEY, action.payload); } catch { /* noop */ }
    },
    setBackgroundOpacity(state, action: PayloadAction<number>) {
      state.backgroundOpacity = action.payload;
      try { localStorage.setItem(STORAGE_OPACITY_KEY, action.payload.toString()); } catch { /* noop */ }
    },
    setFontFamily(state, action: PayloadAction<KhmerFontId>) {
      state.fontFamilyId = action.payload;
      try { localStorage.setItem(STORAGE_FONT_KEY, action.payload); } catch { /* noop */ }
    },
  },
});

export const {
  setTheme,
  toggleTheme,
  setBackgroundId,
  setBackgroundOpacity,
  setFontFamily,
} = themeSlice.actions;
export default themeSlice.reducer;


