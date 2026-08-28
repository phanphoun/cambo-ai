import { useDispatch, useSelector } from "react-redux";
import { Languages, Search, Code, MessageSquare } from "lucide-react";
import { setMode, type AiMode } from "./modesSlice";
import { cn } from "../../lib/utils";
import type { RootState } from "../../store";

const MODES: { id: AiMode; label: string; icon: typeof MessageSquare; shortcut: string }[] = [
  { id: "chat", label: "Chat", icon: MessageSquare, shortcut: "/chat" },
  { id: "translate", label: "Translate", icon: Languages, shortcut: "/translate" },
  { id: "search", label: "Search", icon: Search, shortcut: "/search" },
  { id: "code", label: "Code", icon: Code, shortcut: "/code" },
];

export default function ModeChips() {
  const dispatch = useDispatch();
  const current = useSelector((s: RootState) => s.modes.current);

  return (
    <div className="flex flex-wrap items-center gap-1.5 px-1">
      {MODES.map((mode) => {
        const Icon = mode.icon;
        const active = current === mode.id;
        return (
          <button
            key={mode.id}
            type="button"
            onClick={() => dispatch(setMode(mode.id))}
            className={cn(
              "inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-[11px] font-medium transition-all border",
              active
                ? "border-primary bg-primary/10 text-primary shadow-sm"
                : "border-border text-muted-foreground hover:border-primary/50 hover:text-foreground",
            )}
            title={`Switch to ${mode.label} mode (type ${mode.shortcut})`}
          >
            <Icon className="h-3 w-3" />
            <span>{mode.label}</span>
          </button>
        );
      })}
    </div>
  );
}
