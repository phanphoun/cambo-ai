import { useState, useRef, useEffect, memo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-hot-toast";
import { Check, ChevronDown, Languages } from "lucide-react";
import { cn } from "../lib/utils";
import {
  setResponseLanguage,
  type ResponseLanguage,
} from "../features/chat/chatSlice";
import type { RootState } from "../store";

export interface LanguageOption {
  code: ResponseLanguage;
  name: string;
  enName: string;
  flag: string;
  nativeDescription: string;
}

export const SUPPORTED_LANGUAGES: LanguageOption[] = [
  {
    code: "km",
    name: "ភាសាខ្មែរ",
    enName: "Khmer",
    flag: "🇰🇭",
    nativeDescription: "ឆ្លើយជាភាសាខ្មែរត្រឹមត្រូវ ១០០%",
  },
  {
    code: "en",
    name: "English",
    enName: "English",
    flag: "🇬🇧",
    nativeDescription: "Respond in English",
  },
  {
    code: "fr",
    name: "Français",
    enName: "French",
    flag: "🇫🇷",
    nativeDescription: "Répondre en français",
  },
  {
    code: "zh",
    name: "中文",
    enName: "Chinese",
    flag: "🇨🇳",
    nativeDescription: "用简体中文回答",
  },
];

interface LanguageDropdownProps {
  size?: "sm" | "md";
  className?: string;
  placement?: "top" | "bottom";
}

export const LanguageDropdown = memo(function LanguageDropdown({
  size = "md",
  className,
  placement = "top",
}: LanguageDropdownProps) {
  const dispatch = useDispatch();
  const currentLang = useSelector(
    (s: RootState) => s.chat.responseLanguage || "km",
  );
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selected =
    SUPPORTED_LANGUAGES.find((l) => l.code === currentLang) ||
    SUPPORTED_LANGUAGES[0];

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  const handleSelect = (lang: LanguageOption) => {
    dispatch(setResponseLanguage(lang.code));
    setOpen(false);

    let notifyMsg = "";
    if (lang.code === "km") {
      notifyMsg = "AI នឹងឆ្លើយជាភាសាខ្មែរ (Khmer)";
    } else if (lang.code === "en") {
      notifyMsg = "AI will respond in English";
    } else if (lang.code === "fr") {
      notifyMsg = "L'IA répondra en français";
    } else if (lang.code === "zh") {
      notifyMsg = "AI 将以中文进行回复";
    }
    toast.success(notifyMsg, { icon: lang.flag, duration: 2500 });
  };

  return (
    <div ref={dropdownRef} className={cn("relative inline-block", className)}>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className={cn(
          "group flex items-center gap-1.5 rounded-xl border border-[#3C301D] bg-[#16120C]/90 text-stone-300 transition-all duration-200 hover:border-gold/60 hover:bg-[#201911] hover:text-gold shadow-xs cursor-pointer select-none",
          size === "sm"
            ? "h-8 px-2 sm:px-2.5 text-xs"
            : "h-7 sm:h-8 px-2 sm:px-2.5 text-xs",
          open && "border-gold/80 bg-[#221A11] text-gold ring-1 ring-gold/30",
        )}
        title={`Response Language: ${selected.name} (${selected.enName})`}
        aria-label={`Select AI Response Language. Currently ${selected.name}`}
      >
        <span className="text-sm leading-none shrink-0 drop-shadow-xs">
          {selected.flag}
        </span>
        <span className="font-khmer font-medium text-[11px] sm:text-xs text-stone-200 group-hover:text-gold truncate max-w-[85px] sm:max-w-[100px]">
          {selected.name}
        </span>
        <ChevronDown
          className={cn(
            "h-3 w-3 text-stone-400 transition-transform duration-200 group-hover:text-gold shrink-0",
            open && "rotate-180 text-gold",
          )}
        />
      </button>

      {/* Language Menu Dropdown */}
      {open && (
        <div
          className={cn(
            "absolute z-50 w-64 sm:w-72 rounded-2xl border-2 border-[#4A3B22] bg-[#16120C] p-2 shadow-2xl shadow-black animate-fade-in backdrop-blur-md",
            placement === "top"
              ? "bottom-full mb-2 left-0 sm:left-auto"
              : "top-full mt-2 right-0",
          )}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-2.5 py-1.5 border-b border-[#2C2114] mb-1">
            <span className="flex items-center gap-1.5 font-khmer text-xs font-semibold text-gold">
              <Languages className="h-3.5 w-3.5 text-gold" />
              ភាសាឆ្លើយតបរបស់ AI
            </span>
            <span className="text-[10px] font-mono text-stone-400 uppercase">
              Language
            </span>
          </div>

          {/* Options */}
          <div className="space-y-1">
            {SUPPORTED_LANGUAGES.map((lang) => {
              const isSelected = lang.code === currentLang;
              return (
                <button
                  key={lang.code}
                  type="button"
                  onClick={() => handleSelect(lang)}
                  className={cn(
                    "w-full flex items-center justify-between gap-2.5 rounded-xl px-2.5 py-2 text-left transition-all duration-150 cursor-pointer",
                    isSelected
                      ? "bg-[#271E12] border border-gold/50 text-gold shadow-sm"
                      : "border border-transparent hover:bg-[#1E170F] hover:border-[#382B18] text-stone-200 hover:text-stone-100",
                  )}
                >
                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    <span className="text-lg shrink-0 leading-none">
                      {lang.flag}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <span className="font-khmer font-bold text-xs truncate">
                          {lang.name}
                        </span>
                        <span className="text-[10.5px] font-sans text-stone-400">
                          ({lang.enName})
                        </span>
                      </div>
                      <p className="text-[10px] text-stone-400 truncate mt-0.5">
                        {lang.nativeDescription}
                      </p>
                    </div>
                  </div>

                  {isSelected && (
                    <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-gold/20 text-gold border border-gold/40">
                      <Check className="h-3 w-3 stroke-[2.5]" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          {/* Footer note */}
          <div className="mt-2 pt-1.5 border-t border-[#261B0E] px-2 text-center">
            <span className="text-[10px] text-stone-400 font-khmer">
              ជ្រើសរើសភាសាដែលអ្នកចង់ឱ្យ AI ឆ្លើយតប
            </span>
          </div>
        </div>
      )}
    </div>
  );
});

export default LanguageDropdown;
