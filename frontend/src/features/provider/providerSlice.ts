import { createSlice, createAsyncThunk, type PayloadAction } from "@reduxjs/toolkit";

export type AiProvider = "gemini" | "ollama" | "ollama-cloud" | string;

export interface ModelInfo {
  id: string; // e.g. "gemini", "ollama:gemma4:latest", "ollama:gemma3:4b", "ollama:deepseek-coder:6.7b", "ollama-cloud:minimax-m3:cloud", etc.
  provider: string;
  model: string;
  name: string;
  type: "local" | "cloud";
  category?: string;
  badge?: string;
  badge_color?: string;
  size_formatted?: string;
  param_size?: string;
  description?: string;
  tags?: string[];
  recommended?: boolean;
  status?: string;
}

const STORAGE_PROVIDER_KEY = "cambo-provider";
const STORAGE_MODEL_KEY = "cambo-model";
const STORAGE_MODEL_ID_KEY = "cambo-model-id";

export const DEFAULT_MODELS: ModelInfo[] = [
  {
    id: "gemini",
    provider: "gemini",
    model: "gemini-2.5-flash",
    name: "Google Gemini 3.7 Flash",
    type: "cloud",
    category: "Google Cloud",
    badge: "Recommended · Ultra Fast",
    badge_color: "border-gold/50 bg-gold/15 text-gold",
    size_formatted: "Cloud Hosted",
    param_size: "1M Context",
    description: "Multimodal AI engine with high-precision Khmer natural language processing and live web citations.",
    tags: ["Khmer NLP", "Multimodal Vision", "Web Grounding", "Low Latency"],
    recommended: true,
  },
  {
    id: "ollama:gemma4:latest",
    provider: "ollama",
    model: "gemma4:latest",
    name: "Gemma 4 (8B · Local Flagship)",
    type: "local",
    category: "Ollama Local (Offline)",
    badge: "Local Flagship",
    badge_color: "border-emerald-500/50 bg-emerald-500/15 text-emerald-400",
    size_formatted: "9.0 GB",
    param_size: "8.0B",
    description: "Google's next-gen dense open model running 100% locally on localhost:11434 with zero cloud egress.",
    tags: ["100% Offline", "Zero Egress", "General Chat", "Logic"],
  },
  {
    id: "ollama:gemma3:4b",
    provider: "ollama",
    model: "gemma3:4b",
    name: "Gemma 3 (4B · Lightweight)",
    type: "local",
    category: "Ollama Local (Offline)",
    badge: "Fast & Light",
    badge_color: "border-emerald-500/50 bg-emerald-500/15 text-emerald-400",
    size_formatted: "3.1 GB",
    param_size: "4.3B",
    description: "Ultra-fast, lightweight local model optimized for low RAM consumption and snappy conversational responses.",
    tags: ["Lightweight", "Low RAM", "100% Offline", "Snappy"],
  },
  {
    id: "ollama:deepseek-coder:6.7b",
    provider: "ollama",
    model: "deepseek-coder:6.7b",
    name: "DeepSeek Coder (6.7B · Code Specialist)",
    type: "local",
    category: "Ollama Local (Offline)",
    badge: "Code Specialist",
    badge_color: "border-amber-500/50 bg-amber-500/15 text-amber-400",
    size_formatted: "3.6 GB",
    param_size: "7B",
    description: "Specialized coding intelligence fine-tuned for Python, TypeScript, React, and technical debugging.",
    tags: ["Full-Stack Code", "Refactoring", "Algorithms", "100% Offline"],
  },
  {
    id: "ollama-cloud:minimax-m3:cloud",
    provider: "ollama-cloud",
    model: "minimax-m3:cloud",
    name: "MiniMax M3 (Cloud AI)",
    type: "cloud",
    category: "Ollama Cloud",
    badge: "Cloud Reasoning",
    badge_color: "border-sky-500/50 bg-sky-500/15 text-sky-400",
    size_formatted: "Cloud Hosted",
    param_size: "Cloud",
    description: "High-capacity cloud reasoning model hosted on accelerated servers for complex technical problem solving.",
    tags: ["Deep Logic", "Full-Stack Code", "Extended Context", "High Throughput"],
  },
  {
    id: "ollama-cloud:gemma4:31b-cloud",
    provider: "ollama-cloud",
    model: "gemma4:31b-cloud",
    name: "Gemma 4 (31B · Cloud AI)",
    type: "cloud",
    category: "Ollama Cloud",
    badge: "Cloud 31B",
    badge_color: "border-sky-500/50 bg-sky-500/15 text-sky-400",
    size_formatted: "Cloud Hosted",
    param_size: "32.7B",
    description: "High-capacity 31B dense reasoning model accelerated in Ollama Cloud with deep logic and vision capabilities.",
    tags: ["Cloud Accelerated", "31B Reasoning", "Vision", "Coding"],
  },
  {
    id: "ollama-cloud:deepseek-v4-flash:cloud",
    provider: "ollama-cloud",
    model: "deepseek-v4-flash:cloud",
    name: "DeepSeek V4 Flash (304B MoE Cloud)",
    type: "cloud",
    category: "Ollama Cloud",
    badge: "Cloud 304B MoE",
    badge_color: "border-purple-500/50 bg-purple-500/15 text-purple-400",
    size_formatted: "Cloud Hosted",
    param_size: "304B",
    description: "Massive 304B mixture-of-experts model for extreme reasoning depth, high-throughput math, and complex code.",
    tags: ["304B MoE", "Extreme Depth", "Math & Logic", "Cloud"],
  },
];

function loadInitialSelection(): { provider: string; model: string; modelId: string } {
  try {
    const savedId = localStorage.getItem(STORAGE_MODEL_ID_KEY);
    const savedProvider = localStorage.getItem(STORAGE_PROVIDER_KEY);
    const savedModel = localStorage.getItem(STORAGE_MODEL_KEY);

    if (savedId) {
      const match = DEFAULT_MODELS.find((m) => m.id === savedId);
      if (match) {
        return { provider: match.provider, model: match.model, modelId: match.id };
      }
    }
    if (savedProvider) {
      if (savedProvider === "ollama") {
        return { provider: "ollama", model: savedModel || "gemma4:latest", modelId: `ollama:${savedModel || "gemma4:latest"}` };
      }
      if (savedProvider === "ollama-cloud") {
        return { provider: "ollama-cloud", model: savedModel || "minimax-m3:cloud", modelId: `ollama-cloud:${savedModel || "minimax-m3:cloud"}` };
      }
    }
  } catch { /* noop */ }
  return { provider: "gemini", model: "gemini-2.5-flash", modelId: "gemini" };
}

interface ProviderState {
  current: AiProvider;
  currentModel: string;
  selectedModelId: string;
  models: ModelInfo[];
  isLoadingModels: boolean;
}

const initial = loadInitialSelection();

const initialState: ProviderState = {
  current: initial.provider,
  currentModel: initial.model,
  selectedModelId: initial.modelId,
  models: DEFAULT_MODELS,
  isLoadingModels: false,
};

export const fetchModels = createAsyncThunk("provider/fetchModels", async () => {
  try {
    const res = await fetch("/api/models");
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        return data as ModelInfo[];
      }
    }
  } catch {
    // fallback to defaults
  }
  return DEFAULT_MODELS;
});

const providerSlice = createSlice({
  name: "provider",
  initialState,
  reducers: {
    setProvider(state, action: PayloadAction<AiProvider>) {
      state.current = action.payload;
      try {
        localStorage.setItem(STORAGE_PROVIDER_KEY, action.payload);
      } catch { /* noop */ }
    },
    selectModel(state, action: PayloadAction<string | ModelInfo>) {
      let targetModel: ModelInfo | undefined;
      if (typeof action.payload === "string") {
        const id = action.payload;
        targetModel = state.models.find((m) => m.id === id || m.model === id);
        if (!targetModel) {
          // Parse compound string e.g. "ollama:gemma3:4b"
          if (id.startsWith("ollama-cloud:")) {
            const mName = id.replace("ollama-cloud:", "");
            targetModel = { id, provider: "ollama-cloud", model: mName, name: mName, type: "cloud" };
          } else if (id.startsWith("ollama:")) {
            const mName = id.replace("ollama:", "");
            targetModel = { id, provider: "ollama", model: mName, name: mName, type: "local" };
          } else if (id === "gemini") {
            targetModel = DEFAULT_MODELS[0];
          }
        }
      } else {
        targetModel = action.payload;
      }

      if (targetModel) {
        state.selectedModelId = targetModel.id;
        state.current = targetModel.provider;
        state.currentModel = targetModel.model;

        try {
          localStorage.setItem(STORAGE_MODEL_ID_KEY, targetModel.id);
          localStorage.setItem(STORAGE_PROVIDER_KEY, targetModel.provider);
          localStorage.setItem(STORAGE_MODEL_KEY, targetModel.model);
        } catch { /* noop */ }
      }
    },
    setModels(state, action: PayloadAction<ModelInfo[]>) {
      state.models = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchModels.pending, (state) => {
        state.isLoadingModels = true;
      })
      .addCase(fetchModels.fulfilled, (state, action) => {
        state.isLoadingModels = false;
        if (action.payload && action.payload.length > 0) {
          state.models = action.payload;
          // Verify current selection exists
          const exists = action.payload.some((m) => m.id === state.selectedModelId);
          if (!exists && action.payload[0]) {
            state.selectedModelId = action.payload[0].id;
            state.current = action.payload[0].provider;
            state.currentModel = action.payload[0].model;
          }
        }
      })
      .addCase(fetchModels.rejected, (state) => {
        state.isLoadingModels = false;
      });
  },
});

export const { setProvider, selectModel, setModels } = providerSlice.actions;
export default providerSlice.reducer;

