import { useDispatch, useSelector } from "react-redux";
import { Sparkles, Cpu, Cloud } from "lucide-react";
import { setProvider, type AiProvider } from "./providerSlice";
import { cn } from "../../lib/utils";
import type { RootState } from "../../store";

const PROVIDERS: { id: AiProvider; label: string; icon: typeof Sparkles; description: string }[] = [
  { id: "gemini", label: "Gemini", icon: Sparkles, description: "Google Gemini API" },
  { id: "ollama", label: "Ollama (Local)", icon: Cpu, description: "Local LLM via Ollama" },
  { id: "ollama-cloud", label: "Ollama Cloud", icon: Cloud, description: "Cloud models via Ollama" },
];

export default function ProviderSelector() {
  const dispatch = useDispatch();
  const current = useSelector((s: RootState) => s.provider.current);

  return (
    <div className="space-y-1.5">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70">
        AI Provider
      </p>
      <div className="flex flex-col gap-1">
        {PROVIDERS.map((p) => {
          const Icon = p.icon;
          const active = current === p.id;
          return (
            <button
              key={p.id}
              type="button"
              onClick={() => dispatch(setProvider(p.id))}
              className={cn(
                "flex items-center gap-2 rounded-lg px-2.5 py-2 text-left text-xs transition-all",
                active
                  ? "bg-primary/10 text-primary ring-1 ring-primary/30"
                  : "text-muted-foreground hover:bg-secondary hover:text-foreground",
              )}
            >
              <Icon className={cn("h-3.5 w-3.5 shrink-0", active ? "text-primary" : "")} />
              <div className="min-w-0 flex-1">
                <span className="block font-medium">{p.label}</span>
                <span className="block text-[10px] text-muted-foreground/70">
                  {p.description}
                </span>
              </div>
              {active && (
                <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
