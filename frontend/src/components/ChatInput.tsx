import { useEffect, useRef, useState, useCallback, useMemo, type KeyboardEvent, type DragEvent } from "react";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-hot-toast";
import {
  Send,
  Square,
  X,
  Mic,
  MicOff,
  Paperclip,
  BookOpen,
  Sparkles,
  MessageSquare,
  Languages,
  Search,
  Code2,
  Rocket,
  ShoppingCart,
  Landmark,
  GraduationCap,
  Palette,
  Factory,
  Truck,
  Radio,
  ShieldCheck,
  Building2,
} from "lucide-react";
import { cn } from "../lib/utils";
import ModeDropdown from "../features/modes/ModeDropdown";
import LanguageDropdown from "./LanguageDropdown";
import { useTranslation } from "../i18n/useTranslation";
import { setMode, type AiMode } from "../features/modes/modesSlice";
import { setDirectoryOpen } from "../features/directory/directorySlice";
import {
  KhmerInputCorner,
  KhmerBorderPediment,
  KhmerDividerAccent,
} from "./KhmerOrnaments";
import {
  companies,
  DIRECTORY_SECTORS,
} from "../data/cambodia-tech-directory";
import {
  addAttachment,
  removeAttachment,
} from "../features/chat/chatSlice";
import type { RootState } from "../store";
import { useSpeechRecognition } from "../hooks/useSpeechRecognition";

interface SlashOption {
  id: string;
  type: "directory-modal" | "sector" | "company" | "mode";
  slashCmd: string;
  titleEn: string;
  titleKm?: string;
  subtitle?: string;
  icon: React.ComponentType<{ className?: string }>;
  prompt?: string;
  modeId?: AiMode;
}

const MAX_LENGTH = 4000;
const MAX_IMAGE_MB = 8;

interface ChatInputProps {
  onSend: (text: string) => void;
  onStop: () => void;
  disabled: boolean;
  isStreaming: boolean;
  onOpenDocuments: () => void;
}

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsDataURL(file);
  });
}

function getSectorIcon(iconName: string) {
  switch (iconName) {
    case "Rocket":
      return Rocket;
    case "ShoppingCart":
      return ShoppingCart;
    case "Landmark":
      return Landmark;
    case "GraduationCap":
      return GraduationCap;
    case "Palette":
      return Palette;
    case "Factory":
      return Factory;
    case "Truck":
      return Truck;
    case "Radio":
      return Radio;
    case "ShieldCheck":
      return ShieldCheck;
    default:
      return Building2;
  }
}

export default function ChatInput({
  onSend,
  onStop,
  disabled,
  isStreaming,
}: ChatInputProps) {
  const dispatch = useDispatch();
  const { t } = useTranslation();
  const [value, setValue] = useState("");
  const [slashOpen, setSlashOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);

  const ref = useRef<HTMLTextAreaElement>(null);
  const composingRef = useRef(false);
  const userTypedRef = useRef(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const [dragOver, setDragOver] = useState(false);

  const attachments = useSelector((s: RootState) => s.chat.attachments);

  // ── Build All Available Slash Options ──
  const allSlashOptions: SlashOption[] = useMemo(() => {
    const list: SlashOption[] = [
      {
        id: "dir-open",
        type: "directory-modal",
        slashCmd: "/directory",
        titleEn: "Open Sectors Directory (58 Organizations)",
        titleKm: "បើកបញ្ជីឈ្មោះធុរកិច្ច & ស្ថាប័នកម្ពុជា",
        subtitle: "Full Cambodia ecosystem classified across 9 sectors",
        icon: BookOpen,
      },
    ];

    // Sectors
    for (const sec of DIRECTORY_SECTORS) {
      const slug = "/" + sec.id.replace(/-/g, "");
      list.push({
        id: `sec-${sec.id}`,
        type: "sector",
        slashCmd: slug,
        titleEn: sec.name,
        titleKm: sec.khmerName,
        subtitle: sec.description,
        icon: getSectorIcon(sec.iconName),
        prompt: `សូមរៀបរាប់ និងបង្ហាញទិដ្ឋភាពទូទៅអំពីវិស័យ ${sec.name} (${sec.khmerName}) នៅកម្ពុជា រួមទាំងស្ថាប័នសំខាន់ៗ និងការរីកចម្រើននាពេលបច្ចុប្បន្ន។`,
      });
    }

    // AI Modes
    list.push(
      {
        id: "mode-chat",
        type: "mode",
        slashCmd: "/chat",
        titleEn: "Switch to Chat Mode",
        titleKm: "របៀបសន្ទនាទូទៅ",
        subtitle: "General conversation & multilingual knowledge",
        icon: MessageSquare,
        modeId: "chat",
      },
      {
        id: "mode-translate",
        type: "mode",
        slashCmd: "/translate",
        titleEn: "Switch to Translate Mode",
        titleKm: "របៀបបកប្រែភាសាខ្មែរ-អង់គ្លេស",
        subtitle: "Accurate Khmer-English cultural translation",
        icon: Languages,
        modeId: "translate",
      },
      {
        id: "mode-search",
        type: "mode",
        slashCmd: "/search",
        titleEn: "Switch to Search Mode",
        titleKm: "របៀបស្វែងរកទិន្នន័យ",
        subtitle: "Deep web research & citations",
        icon: Search,
        modeId: "search",
      },
      {
        id: "mode-code",
        type: "mode",
        slashCmd: "/code",
        titleEn: "Switch to Code Mode",
        titleKm: "របៀបសរសេរកូដ Full-Stack",
        subtitle: "Architecture, Python, TypeScript & AI engineering",
        icon: Code2,
        modeId: "code",
      },
    );

    // Companies / Organizations
    for (const comp of companies) {
      const cleanName = comp.name.toLowerCase().replace(/[^a-z0-9]/g, "");
      list.push({
        id: `comp-${comp.id}`,
        type: "company",
        slashCmd: `/${cleanName}`,
        titleEn: comp.name,
        titleKm: comp.khmerName,
        subtitle: `${comp.category} · ${comp.location}`,
        icon: Sparkles,
        prompt: `សូមរៀបរាប់ និងបង្ហាញព័ត៌មានលម្អិតអំពីស្ថាប័ន ${comp.name} (${comp.khmerName || ""}) ក្នុងវិស័យ ${comp.category} នៅកម្ពុជា៖ ${comp.description}`,
      });
    }

    return list;
  }, []);

  // ── Filtered Options based on User Typing /query ──
  const filteredSlashOptions = useMemo(() => {
    if (!value.startsWith("/")) return [];
    const query = value.slice(1).trim().toLowerCase();
    if (!query) return allSlashOptions;

    return allSlashOptions.filter(
      (opt) =>
        opt.slashCmd.toLowerCase().includes(query) ||
        opt.titleEn.toLowerCase().includes(query) ||
        (opt.titleKm && opt.titleKm.toLowerCase().includes(query)) ||
        (opt.subtitle && opt.subtitle.toLowerCase().includes(query)),
    );
  }, [value, allSlashOptions]);

  // Keep slashOpen state in sync
  useEffect(() => {
    if (value.startsWith("/")) {
      setSlashOpen(true);
      setSelectedIndex(0);
    } else {
      setSlashOpen(false);
    }
  }, [value]);

  // Scroll active item into view
  useEffect(() => {
    if (!slashOpen || !listRef.current) return;
    const activeEl = listRef.current.querySelector<HTMLElement>(
      `[data-index="${selectedIndex}"]`,
    );
    if (activeEl) {
      activeEl.scrollIntoView({ block: "nearest", behavior: "smooth" });
    }
  }, [selectedIndex, slashOpen]);

  const handleSelectSlashOption = useCallback(
    (option: SlashOption) => {
      setSlashOpen(false);

      if (option.type === "directory-modal") {
        setValue("");
        dispatch(setDirectoryOpen(true));
        return;
      }

      if (option.type === "mode" && option.modeId) {
        dispatch(setMode(option.modeId));
        setValue("");
        toast.success(`Switched to ${option.titleEn}`);
        return;
      }

      if (option.prompt) {
        setValue(option.prompt);
        userTypedRef.current = true;
        ref.current?.focus();
      }
    },
    [dispatch],
  );

  const handleTranscript = useCallback((transcript: string) => {
    const trimmed = transcript.trim();
    if (!trimmed) return;
    setValue(trimmed);
    ref.current?.focus();
  }, []);

  const handleError = useCallback((error: string) => {
    if (!error) return;
    console.warn("Voice input:", error);
    if (
      error.includes("denied") ||
      error.includes("microphone") ||
      error.includes("not found") ||
      error.includes("not supported")
    ) {
      toast.error(error, { duration: 4000 });
    }
  }, []);

  const speech = useSpeechRecognition({
    onResult: handleTranscript,
    onError: handleError,
  });

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (!value) {
      el.style.height = "28px";
      return;
    }
    const raf = requestAnimationFrame(() => {
      el.style.height = "28px";
      const targetHeight = Math.min(Math.max(el.scrollHeight, 28), 160);
      el.style.height = `${targetHeight}px`;
    });
    return () => cancelAnimationFrame(raf);
  }, [value]);

  useEffect(() => {
    ref.current?.focus();
  }, []);

  useEffect(() => {
    if (speech.listening && speech.interim && !userTypedRef.current) {
      setValue(speech.interim);
    }
  }, [speech.listening, speech.interim]);

  async function handleImages(files: FileList | File[]) {
    for (const file of Array.from(files)) {
      if (!file.type.startsWith("image/")) {
        toast.error(`${file.name} is not an image`);
        continue;
      }
      if (file.size > MAX_IMAGE_MB * 1024 * 1024) {
        toast.error(`${file.name} exceeds ${MAX_IMAGE_MB}MB limit`);
        continue;
      }
      try {
        const dataUrl = await fileToDataUrl(file);
        dispatch(addAttachment({ id: crypto.randomUUID(), dataUrl, name: file.name }));
      } catch {
        toast.error(`Failed to load ${file.name}`);
      }
    }
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files && e.target.files.length > 0) {
      handleImages(e.target.files);
      e.target.value = "";
    }
  }

  function handleDragOver(e: DragEvent) {
    e.preventDefault();
    setDragOver(true);
  }

  function handleDragLeave(e: DragEvent) {
    e.preventDefault();
    setDragOver(false);
  }

  function handleDrop(e: DragEvent) {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleImages(e.dataTransfer.files);
    }
  }

  function handlePaste(e: React.ClipboardEvent) {
    const items = Array.from(e.clipboardData.items);
    const imageFiles: File[] = [];
    for (const item of items) {
      if (item.type.startsWith("image/")) {
        const file = item.getAsFile();
        if (file) imageFiles.push(file);
      }
    }
    if (imageFiles.length > 0) {
      e.preventDefault();
      handleImages(imageFiles);
    }
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    // Slash Menu Keyboard Navigation
    if (slashOpen && filteredSlashOptions.length > 0) {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % filteredSlashOptions.length);
        return;
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex(
          (prev) => (prev - 1 + filteredSlashOptions.length) % filteredSlashOptions.length,
        );
        return;
      }
      if (e.key === "Enter" || e.key === "Tab") {
        e.preventDefault();
        const selected = filteredSlashOptions[selectedIndex];
        if (selected) {
          handleSelectSlashOption(selected);
        }
        return;
      }
      if (e.key === "Escape") {
        e.preventDefault();
        setSlashOpen(false);
        return;
      }
    }

    if (e.key === "Enter" && !e.shiftKey && !composingRef.current) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleSubmit = () => {
    const trimmed = value.trim();
    if ((!trimmed && attachments.length === 0) || disabled) return;
    onSend(trimmed);
    setValue("");
    userTypedRef.current = false;
    if (ref.current) {
      ref.current.style.height = "28px";
    }
  };

  return (
    <div className="relative px-2 sm:px-6 pb-2.5 sm:pb-4 pt-1 max-w-full">
      <div className="relative mx-auto max-w-3xl sm:max-w-3.5xl lg:max-w-4xl">
        {/* Floating Slash Shortcuts Dropdown Menu */}
        {slashOpen && filteredSlashOptions.length > 0 && (
          <div
            ref={listRef}
            className="absolute bottom-full mb-3 left-0 right-0 z-40 max-h-72 overflow-y-auto rounded-2xl border border-gold/50 bg-[#14100B]/98 p-2 shadow-2xl shadow-black/95 backdrop-blur-2xl scrollbar-thin animate-fade-in"
          >
            {/* Header Info */}
            <div className="flex items-center justify-between px-2.5 py-1.5 border-b border-[#2C2114] text-[11px] text-stone-400">
              <span className="font-semibold text-gold flex items-center gap-1.5">
                <span>⚡</span>
                <span>{t.input.slashTitle}</span>
              </span>
              <span className="text-[10px] text-stone-500 font-mono">
                {t.input.shortcutsHelp}
              </span>
            </div>

            {/* List of items */}
            <div className="mt-1 space-y-0.5">
              {filteredSlashOptions.map((opt, idx) => {
                const active = idx === selectedIndex;
                const IconComp = opt.icon;
                return (
                  <button
                    key={opt.id}
                    data-index={idx}
                    type="button"
                    onClick={() => handleSelectSlashOption(opt)}
                    onMouseEnter={() => setSelectedIndex(idx)}
                    className={cn(
                      "w-full flex items-center justify-between gap-3 rounded-xl px-3 py-2 text-left transition-all cursor-pointer",
                      active
                        ? "bg-gold/20 text-gold border border-gold/50 shadow-xs"
                        : "text-stone-300 hover:bg-[#1C160F] border border-transparent",
                    )}
                  >
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                      <div
                        className={cn(
                          "flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border text-xs",
                          active
                            ? "border-gold/60 bg-gold/20 text-gold"
                            : "border-[#352818] bg-[#1C160F] text-stone-400",
                        )}
                      >
                        <IconComp className="h-3.5 w-3.5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold font-mono text-gold">
                            {opt.slashCmd}
                          </span>
                          <span className="text-xs font-medium text-stone-200 truncate">
                            {opt.titleEn}
                          </span>
                        </div>
                        {opt.titleKm && (
                          <p className="font-khmer text-[11px] text-gold/80 truncate leading-tight mt-0.5">
                            {opt.titleKm}
                          </p>
                        )}
                      </div>
                    </div>

                    {opt.subtitle && (
                      <span className="hidden sm:inline text-[10.5px] text-stone-500 truncate max-w-[200px] text-right font-sans">
                        {opt.subtitle}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Main Input Composer Capsule with Khmer Heritage Styling */}
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={cn(
            "group relative flex flex-col rounded-2xl border border-[#4E371C]/90 bg-[#120E09]/95 px-3 py-2 sm:px-3.5 sm:py-2.5 shadow-[0_8px_30px_rgba(0,0,0,0.85)] backdrop-blur-2xl transition-all duration-300",
            "focus-within:border-gold/75 focus-within:shadow-[0_8px_32px_rgba(212,175,55,0.16)] focus-within:ring-1 focus-within:ring-gold/30",
            dragOver && "border-gold ring-2 ring-gold/50 bg-gold/10",
          )}
        >
          {/* Top Architectural Pediment Crest (ហោជាងលម្អកណ្តាល) */}
          <div className="absolute -top-2 sm:-top-2.5 left-1/2 -translate-x-1/2 pointer-events-none z-20 transition-all duration-300 opacity-75 group-focus-within:opacity-100 group-focus-within:drop-shadow-[0_0_6px_rgba(212,175,55,0.4)]">
            <KhmerBorderPediment className="h-2.5 sm:h-3 w-32 sm:w-40 text-gold" />
          </div>

          {/* Inner Golden Hairline Accent Frame */}
          <div className="absolute inset-[2px] sm:inset-[2.5px] rounded-[13px] sm:rounded-[14px] border border-[#3E2E16]/40 pointer-events-none group-focus-within:border-[#D4AF37]/25 transition-colors duration-300" />

          {/* Four Inset Traditional Khmer Kbach Corner Motifs (ក្បាច់កាច់ជ្រុងបន្ទាយស្រី) */}
          <div className="absolute top-0.5 left-0.5 pointer-events-none z-20 transition-all duration-300 opacity-55 group-focus-within:opacity-85 group-focus-within:drop-shadow-[0_0_4px_rgba(212,175,55,0.35)]">
            <KhmerInputCorner className="h-4 w-4 sm:h-4.5 sm:w-4.5" />
          </div>
          <div className="absolute top-0.5 right-0.5 pointer-events-none z-20 transition-all duration-300 opacity-55 group-focus-within:opacity-85 group-focus-within:drop-shadow-[0_0_4px_rgba(212,175,55,0.35)] rotate-90">
            <KhmerInputCorner className="h-4 w-4 sm:h-4.5 sm:w-4.5" />
          </div>
          <div className="absolute bottom-0.5 left-0.5 pointer-events-none z-20 transition-all duration-300 opacity-55 group-focus-within:opacity-85 group-focus-within:drop-shadow-[0_0_4px_rgba(212,175,55,0.35)] -rotate-90">
            <KhmerInputCorner className="h-4 w-4 sm:h-4.5 sm:w-4.5" />
          </div>
          <div className="absolute bottom-0.5 right-0.5 pointer-events-none z-20 transition-all duration-300 opacity-55 group-focus-within:opacity-85 group-focus-within:drop-shadow-[0_0_4px_rgba(212,175,55,0.35)] rotate-180">
            <KhmerInputCorner className="h-4 w-4 sm:h-4.5 sm:w-4.5" />
          </div>

          {/* Subtle Horizontal Golden Rim Gleam */}
          <div className="absolute top-0 left-16 right-16 h-[1px] bg-gradient-to-r from-transparent via-[#D4AF37]/30 to-transparent pointer-events-none" />
          <div className="absolute bottom-0 left-16 right-16 h-[1px] bg-gradient-to-r from-transparent via-[#D4AF37]/20 to-transparent pointer-events-none" />

          {/* Image Attachments Tray */}
          {attachments.length > 0 && (
            <div className="mb-2 flex flex-wrap gap-2 pt-0.5 z-10 px-1">
              {attachments.map((att) => (
                <div
                  key={att.id}
                  className="group relative h-10 w-10 sm:h-12 sm:w-12 overflow-hidden rounded-xl border border-gold/40 bg-black/60 shadow-sm"
                >
                  <img
                    src={att.dataUrl}
                    alt={att.name || "Attachment"}
                    className="h-full w-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => dispatch(removeAttachment(att.id))}
                    className="absolute top-0.5 right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-black/80 text-white transition-colors hover:bg-rose-600"
                    title="Remove attachment"
                  >
                    <X className="h-2.5 w-2.5" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Multilingual Text Input Area */}
          <div className="relative z-10 w-full px-1.5 sm:px-2 flex items-start gap-1.5">
            <textarea
              ref={ref}
              value={value}
              onChange={(e) => {
                setValue(e.target.value);
                userTypedRef.current = true;
              }}
              onKeyDown={handleKeyDown}
              onPaste={handlePaste}
              onCompositionStart={() => (composingRef.current = true)}
              onCompositionEnd={() => (composingRef.current = false)}
              placeholder={t.input.placeholder}
              disabled={disabled}
              rows={1}
              maxLength={MAX_LENGTH}
              style={{ minHeight: "28px" }}
              className="w-full resize-none bg-transparent font-khmer text-[13.5px] sm:text-[14.5px] leading-relaxed text-stone-100 placeholder:text-stone-500 placeholder:font-khmer placeholder:text-xs sm:placeholder:text-[13px] focus:outline-none scrollbar-thin py-0.5"
            />
            {value && (
              <button
                type="button"
                onClick={() => {
                  setValue("");
                  userTypedRef.current = false;
                  if (ref.current) {
                    ref.current.style.height = "28px";
                    ref.current.focus();
                  }
                }}
                className="shrink-0 mt-0.5 flex h-5 w-5 items-center justify-center rounded-full text-stone-400 hover:text-stone-200 hover:bg-white/10 transition-colors cursor-pointer"
                title={t.input.clearInput}
                aria-label={t.input.clearInput}
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </div>

          {/* Sleek Khmer Divider Accent */}
          <div className="relative my-1 sm:my-1.5 flex items-center justify-center px-1">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-[#3B2C17]/60 group-focus-within:border-[#6B5024]/50 transition-colors" />
            </div>
            <div className="relative bg-[#120E09] px-2">
              <KhmerDividerAccent className="h-1.5 sm:h-2 w-16 sm:w-20 text-gold/50 group-focus-within:text-gold/80 transition-colors" />
            </div>
          </div>

          {/* Bottom Toolbar: Mode & Language Dropdowns on left, Tools & Golden Send on right */}
          <div className="relative z-10 flex items-center justify-between gap-2 px-0.5">
            {/* Mode & Language Dropdown Selectors */}
            <div className="flex items-center gap-1.5 sm:gap-2">
              <ModeDropdown />
              <LanguageDropdown placement="top" />
            </div>

            {/* Right Action Tools */}
            <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
              {/* Character counter (only when longer than 200 chars) */}
              {value.length > 200 && (
                <span className="text-[10px] font-mono text-stone-500 mr-1 select-none">
                  {value.length}/{MAX_LENGTH}
                </span>
              )}

              {/* Image upload hidden file input */}
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={handleFileChange}
              />

              {/* Attach button */}
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="flex h-7 w-7 sm:h-7.5 sm:w-7.5 items-center justify-center rounded-lg text-stone-400 hover:text-gold hover:bg-[#1E1810] transition-colors cursor-pointer"
                title={t.input.attachImages}
                aria-label={t.input.attachImages}
              >
                <Paperclip className="h-3.5 w-3.5" />
              </button>

              {/* Voice input button */}
              {speech.supported && (
                <button
                  type="button"
                  onClick={speech.listening ? speech.stop : speech.start}
                  className={cn(
                    "flex h-7 w-7 sm:h-7.5 sm:w-7.5 items-center justify-center rounded-lg transition-colors cursor-pointer",
                    speech.listening
                      ? "bg-rose-500/20 text-rose-400 animate-pulse"
                      : "text-stone-400 hover:text-gold hover:bg-[#1E1810]",
                  )}
                  title={speech.listening ? t.input.stopListening : t.input.voiceInput}
                  aria-label={speech.listening ? t.input.stopListening : t.input.voiceInput}
                >
                  {speech.listening ? (
                    <MicOff className="h-3.5 w-3.5" />
                  ) : (
                    <Mic className="h-3.5 w-3.5" />
                  )}
                </button>
              )}

              {/* Main Golden Circular Send Button */}
              {isStreaming ? (
                <button
                  type="button"
                  onClick={onStop}
                  className="flex h-7.5 w-7.5 sm:h-8 sm:w-8 items-center justify-center rounded-full bg-amber-600 text-white shadow-md shadow-amber-600/30 hover:bg-amber-500 transition-all cursor-pointer"
                  title={t.input.stopGenerating}
                  aria-label={t.input.stopGenerating}
                >
                  <Square className="h-3.5 w-3.5 fill-current" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={!value.trim() && attachments.length === 0}
                  className={cn(
                    "flex h-7.5 w-7.5 sm:h-8 sm:w-8 items-center justify-center rounded-full transition-all duration-200 shadow-md cursor-pointer",
                    value.trim() || attachments.length > 0
                      ? "bg-gradient-to-br from-[#F5D77F] via-[#D4AF37] to-[#996515] text-black font-bold shadow-gold/25 hover:scale-105 active:scale-95"
                      : "bg-[#221A10] text-stone-500 cursor-not-allowed border border-[#3A2E1C]",
                  )}
                  title={t.input.sendMessage}
                  aria-label={t.input.sendMessage}
                >
                  <Send className="h-3.5 w-3.5 ml-0.5" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Footer Hint */}
        <p className="mt-1.5 text-center text-[10.5px] text-stone-500/80 font-sans select-none">
          {t.input.shortcuts}
        </p>
      </div>
    </div>
  );
}
