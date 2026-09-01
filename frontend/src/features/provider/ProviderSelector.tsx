import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Sparkles, Cpu, Cloud, HardDrive, Shield } from "lucide-react";
import { selectModel, fetchModels } from "./providerSlice";
import { cn } from "../../lib/utils";
import type { RootState, AppDispatch } from "../../store";

export default function ProviderSelector() {
  const dispatch = useDispatch<AppDispatch>();
  const { selectedModelId, models } = useSelector((s: RootState) => s.provider);

  useEffect(() => {
    dispatch(fetchModels());
  }, [dispatch]);

  // Group models into Local, Cloud, and Gemini
  const localModels = models.filter((m) => m.type === "local");
  const cloudModels = models.filter((m) => m.type === "cloud");

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-gold/80 flex items-center gap-1">
          <Sparkles className="w-3 h-3 text-gold" />
          AI Engine & Local Models
        </p>
        <span className="text-[10px] text-stone-400 font-mono">
          {models.length} available
        </span>
      </div>

      <div className="flex flex-col gap-1.5 max-h-[360px] overflow-y-auto pr-0.5 custom-scrollbar">
        {/* Gemini Flagship */}
        {cloudModels.filter(m => m.provider === "gemini").map((m) => {
          const active = selectedModelId === m.id;
          return (
            <button
              key={m.id}
              type="button"
              onClick={() => dispatch(selectModel(m.id))}
              className={cn(
                "group flex flex-col gap-1 rounded-xl p-2 text-left transition-all border cursor-pointer",
                active
                  ? "bg-[#2A2012]/90 text-gold border-gold/60 shadow-xs ring-1 ring-gold/40"
                  : "bg-[#14100A]/80 text-stone-300 border-[#2D2417] hover:border-gold/30 hover:bg-[#1C160F]",
              )}
            >
              <div className="flex items-center gap-2">
                <div className={cn(
                  "flex h-6 w-6 items-center justify-center rounded-lg p-1 shrink-0",
                  active ? "bg-gold/20 text-gold" : "bg-[#1E1810] text-gold/60 group-hover:text-gold"
                )}>
                  <Sparkles className="h-3.5 w-3.5" />
                </div>
                <span className="flex-1 font-medium text-xs truncate">{m.name}</span>
                {active && <span className="h-2 w-2 rounded-full bg-gold shrink-0 shadow-[0_0_8px_rgba(234,179,8,0.8)]" />}
              </div>
              <div className="flex items-center gap-1.5 pl-8 text-[10px] text-stone-400">
                <span className="text-gold/90 font-medium">Multimodal</span>
                <span>•</span>
                <span>Khmer NLP</span>
                <span>•</span>
                <span>Web Grounding</span>
              </div>
            </button>
          );
        })}

        {/* Local Ollama Models */}
        {localModels.length > 0 && (
          <div className="pt-2">
            <p className="text-[9px] font-semibold uppercase tracking-wider text-emerald-400/90 mb-1 flex items-center gap-1 px-1">
              <Shield className="w-2.5 h-2.5 text-emerald-400" />
              100% Offline Local Models (Ollama)
            </p>
            <div className="flex flex-col gap-1">
              {localModels.map((m) => {
                const active = selectedModelId === m.id;
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => dispatch(selectModel(m.id))}
                    className={cn(
                      "group flex flex-col gap-0.5 rounded-xl p-2 text-left transition-all border cursor-pointer",
                      active
                        ? "bg-emerald-950/40 text-emerald-300 border-emerald-500/60 shadow-xs ring-1 ring-emerald-500/30"
                        : "bg-[#14100A]/80 text-stone-300 border-[#2D2417] hover:border-emerald-500/30 hover:bg-[#1C160F]",
                    )}
                  >
                    <div className="flex items-center gap-2">
                      <div className={cn(
                        "flex h-6 w-6 items-center justify-center rounded-lg p-1 shrink-0",
                        active ? "bg-emerald-500/20 text-emerald-400" : "bg-[#1E1810] text-emerald-400/60 group-hover:text-emerald-400"
                      )}>
                        <Cpu className="h-3.5 w-3.5" />
                      </div>
                      <span className="flex-1 font-medium text-xs truncate">{m.name}</span>
                      {active && <span className="h-2 w-2 rounded-full bg-emerald-400 shrink-0 shadow-[0_0_8px_rgba(52,211,153,0.8)]" />}
                    </div>
                    <div className="flex items-center gap-2 pl-8 text-[10px] text-stone-400">
                      <span className="flex items-center gap-0.5 text-emerald-400/80">
                        <HardDrive className="w-2.5 h-2.5" />
                        {m.size_formatted}
                      </span>
                      <span>•</span>
                      <span>{m.param_size}</span>
                      <span>•</span>
                      <span className="text-stone-400 truncate">{m.badge || "Local"}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Cloud Ollama Models */}
        {cloudModels.filter(m => m.provider !== "gemini").length > 0 && (
          <div className="pt-2">
            <p className="text-[9px] font-semibold uppercase tracking-wider text-sky-400/90 mb-1 flex items-center gap-1 px-1">
              <Cloud className="w-2.5 h-2.5 text-sky-400" />
              Cloud Accelerated Models
            </p>
            <div className="flex flex-col gap-1">
              {cloudModels.filter(m => m.provider !== "gemini").map((m) => {
                const active = selectedModelId === m.id;
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => dispatch(selectModel(m.id))}
                    className={cn(
                      "group flex flex-col gap-0.5 rounded-xl p-2 text-left transition-all border cursor-pointer",
                      active
                        ? "bg-sky-950/40 text-sky-300 border-sky-500/60 shadow-xs ring-1 ring-sky-500/30"
                        : "bg-[#14100A]/80 text-stone-300 border-[#2D2417] hover:border-sky-500/30 hover:bg-[#1C160F]",
                    )}
                  >
                    <div className="flex items-center gap-2">
                      <div className={cn(
                        "flex h-6 w-6 items-center justify-center rounded-lg p-1 shrink-0",
                        active ? "bg-sky-500/20 text-sky-400" : "bg-[#1E1810] text-sky-400/60 group-hover:text-sky-400"
                      )}>
                        <Cloud className="h-3.5 w-3.5" />
                      </div>
                      <span className="flex-1 font-medium text-xs truncate">{m.name}</span>
                      {active && <span className="h-2 w-2 rounded-full bg-sky-400 shrink-0 shadow-[0_0_8px_rgba(56,189,248,0.8)]" />}
                    </div>
                    <div className="flex items-center gap-2 pl-8 text-[10px] text-stone-400">
                      <span className="text-sky-400/80">{m.badge || "Cloud"}</span>
                      <span>•</span>
                      <span>{m.param_size}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

