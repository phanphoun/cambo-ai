import { useState, useRef, useEffect, memo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { MessageSquare, Languages, Search, Code2, Sparkles, ChevronDown, Check } from "lucide-react";
import { setMode, type AiMode } from "./modesSlice";
import { cn } from "../../lib/utils";
import type { RootState } from "../../store";
import { KbachCorner } from "../../components/KhmerOrnaments";

interface ModeItem {
  id: AiMode;
  labelEn: string;
  labelKm: string;
  descKm: string;
  icon: React.ComponentType<{ className?: string }>;
  shortcut: string;
}

const MODES: ModeItem[] = [
  {
    id: "chat",
    labelEn: "Chat",
    labelKm: "សន្ទនាទូទៅ",
    descKm: "ឆ្លើយសំណួរ ទូទៅ និងការសន្ទនា",
    icon: MessageSquare,
    shortcut: "/chat",
  },
  {
    id: "translate",
    labelEn: "Translate",
    labelKm: "បកប្រែភាសា",
    descKm: "បកប្រែភាសាខ្មែរ ↔ អន្តរជាតិ",
    icon: Languages,
    shortcut: "/translate",
  },
  {
    id: "search",
    labelEn: "Search",
    labelKm: "ស្រាវជ្រាវ",
    descKm: "ស្វែងរកព័ត៌មាន និង Directory",
    icon: Search,
    shortcut: "/search",
  },
  {
    id: "code",
    labelEn: "Code",
    labelKm: "សរសេរកូដ",
    descKm: "ជំនួយការសរសេរកូដ និង Debug",
    icon: Code2,
    shortcut: "/code",
  },
  {
    id: "image",
    labelEn: "Image / Art",
    labelKm: "បង្កើត & កែរូបភាព",
    descKm: "បង្កើតរូបភាព ឬកែប្រែរូបថត",
    icon: Sparkles,
    shortcut: "/image",
  },
];

export default memo(function ModeDropdown() {
  const dispatch = useDispatch();
  const currentMode = useSelector((s: RootState) => s.modes.current);
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const activeItem = MODES.find((m) => m.id === currentMode) || MODES[0];
  const ActiveIcon = activeItem.icon;

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  return (
    <div ref={dropdownRef} className="relative inline-block text-left select-none">
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className={cn(
          "inline-flex items-center gap-2 rounded-xl border px-3 py-1.5 text-xs font-medium transition-all duration-200 cursor-pointer shadow-xs",
          open
            ? "border-gold bg-gold/20 text-gold ring-1 ring-gold/40"
            : "border-[#4A381E] bg-[#1A140D]/90 text-stone-200 hover:border-gold/60 hover:text-gold hover:bg-[#221B11]",
        )}
        title="Select AI interaction mode"
        aria-haspopup="true"
        aria-expanded={open}
      >
        <ActiveIcon className="h-3.5 w-3.5 text-gold" />
        <span className="font-heading font-semibold text-xs">{activeItem.labelKm}</span>
        <span className="text-[10.5px] text-stone-400 font-sans hidden sm:inline">({activeItem.labelEn})</span>
        <ChevronDown
          className={cn("h-3 w-3 text-stone-400 transition-transform duration-200", open && "rotate-180 text-gold")}
        />
      </button>

      {/* Dropdown Popup Menu */}
      {open && (
        <div className="absolute bottom-full left-0 mb-2 w-72 sm:w-80 rounded-2xl border-2 border-[#5C4520] bg-[#140F0A] p-2 shadow-2xl shadow-black/90 backdrop-blur-xl z-50 animate-scale-in">
          {/* Subtle Corner Ornaments */}
          <div className="absolute top-1 left-1 text-gold/30 pointer-events-none">
            <KbachCorner className="h-3.5 w-3.5" />
          </div>
          <div className="absolute top-1 right-1 rotate-90 text-gold/30 pointer-events-none">
            <KbachCorner className="h-3.5 w-3.5" />
          </div>

          {/* Header */}
          <div className="px-2.5 py-1.5 border-b border-[#2C2012] mb-1">
            <span className="text-[11px] font-heading font-semibold text-gold tracking-normal">
              មុខងារដំណើរការ AI (AI Mode)
            </span>
          </div>

          {/* Options List */}
          <div className="space-y-1">
            {MODES.map((mode) => {
              const Icon = mode.icon;
              const isSelected = mode.id === currentMode;
              return (
                <button
                  key={mode.id}
                  type="button"
                  onClick={() => {
                    dispatch(setMode(mode.id));
                    setOpen(false);
                  }}
                  className={cn(
                    "w-full flex items-center justify-between gap-3 rounded-xl px-3 py-2.5 text-left transition-all duration-150 cursor-pointer",
                    isSelected
                      ? "border border-gold/50 bg-gradient-to-r from-gold/15 to-transparent text-gold"
                      : "border border-transparent text-stone-300 hover:bg-[#201810] hover:text-stone-100",
                  )}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={cn(
                        "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border",
                        isSelected
                          ? "border-gold/60 bg-gold/20 text-gold"
                          : "border-[#3A2C18] bg-[#18120C] text-stone-400",
                      )}
                    >
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="font-heading font-semibold text-xs">
                          {mode.labelKm}
                        </span>
                        <span className="text-[10.5px] text-stone-400 font-sans">
                          {mode.labelEn}
                        </span>
                      </div>
                      <p className="font-khmer text-[11px] text-stone-400 truncate leading-snug mt-0.5">
                        {mode.descKm}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-[9.5px] font-mono text-stone-500 bg-black/40 px-1.5 py-0.5 rounded border border-[#2C2012]">
                      {mode.shortcut}
                    </span>
                    {isSelected && <Check className="h-3.5 w-3.5 text-gold stroke-[2.5]" />}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
});
