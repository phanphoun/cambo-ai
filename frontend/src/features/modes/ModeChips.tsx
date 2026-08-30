import { useDispatch, useSelector } from "react-redux";
import { MessageSquare, Languages, Search, Code2 } from "lucide-react";
import { setMode, type AiMode } from "./modesSlice";
import { cn } from "../../lib/utils";
import type { RootState } from "../../store";

const MODES: { id: AiMode; label: string; icon: typeof MessageSquare; shortcut: string }[] = [
  { id: "chat", label: "Chat", icon: MessageSquare, shortcut: "/chat" },
  { id: "translate", label: "Translate", icon: Languages, shortcut: "/translate" },
  { id: "search", label: "Search", icon: Search, shortcut: "/search" },
  { id: "code", label: "Code", icon: Code2, shortcut: "/code" },
];

export default function ModeChips() {
  const dispatch = useDispatch();
  const current = useSelector((s: RootState) => s.modes.current);

  return (
    <div className="flex items-center gap-1.5">
      {MODES.map((mode) => {
        const Icon = mode.icon;
        const active = current === mode.id;
        return (
          <button
            key={mode.id}
            type="button"
            onClick={() => dispatch(setMode(mode.id))}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold transition-all border",
              active
                ? "border-gold/60 bg-gold/15 text-gold shadow-xs"
                : "border-[#3A2E1C]/60 bg-[#16120C]/60 text-stone-400 hover:border-gold/40 hover:text-stone-200",
            )}
            title={`Switch to ${mode.label} mode (${mode.shortcut})`}
          >
            <Icon className={cn("h-3.5 w-3.5", active ? "text-gold" : "text-stone-400")} />
            <span>{mode.label}</span>
          </button>
        );
      })}
    </div>
  );
}
