import { useEffect, useRef, useState, useCallback, type KeyboardEvent, type DragEvent } from "react";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-hot-toast";
import {
  ArrowUp,
  Square,
  Loader2,
  BookOpen,
  X,
  Mic,
  MicOff,
  Languages,
  ImagePlus,
  Paperclip,
} from "lucide-react";
import { Button } from "./ui/button";
import { cn } from "../lib/utils";
import ModeChips from "../features/modes/ModeChips";
import { setMode, type AiMode } from "../features/modes/modesSlice";
import {
  addAttachment,
  removeAttachment,
  clearAttachments,
  setUseTools,
  type ChatState,
} from "../features/chat/chatSlice";
import type { RootState } from "../store";
import {
  useSpeechRecognition,
  getLangLabel,
} from "../hooks/useSpeechRecognition";

const MAX_LENGTH = 4000;
const MAX_IMAGE_MB = 8;

interface ChatInputProps {
  onSend: (text: string) => void;
  onStop: () => void;
  disabled: boolean;
  isStreaming: boolean;
  onOpenDocuments: () => void;
}

const MODE_COMMANDS: Record<string, AiMode> = {
  "/chat": "chat",
  "/translate": "translate",
  "/search": "search",
  "/code": "code",
};

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsDataURL(file);
  });
}

export default function ChatInput({
  onSend,
  onStop,
  disabled,
  isStreaming,
  onOpenDocuments,
}: ChatInputProps) {
  const dispatch = useDispatch();
  const [value, setValue] = useState("");
  const ref = useRef<HTMLTextAreaElement>(null);
  const composingRef = useRef(false);
  const userTypedRef = useRef(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);

  const attachments = useSelector((s: RootState) => s.chat.attachments);
  const useTools = useSelector((s: RootState) => (s.chat as ChatState).useTools);

  const handleTranscript = useCallback(
    (transcript: string) => {
      const trimmed = transcript.trim();
      if (!trimmed) return;
      setValue(trimmed);
      ref.current?.focus();
    },
    [],
  );

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
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 400)}px`;
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
        toast.error(`${file.name} exceeds ${MAX_IMAGE_MB}MB`);
        continue;
      }
      try {
        const dataUrl = await fileToDataUrl(file);
        dispatch(
          addAttachment({
            id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
            dataUrl,
            name: file.name,
          }),
        );
      } catch {
        toast.error(`Could not read ${file.name}`);
      }
    }
  }

  function handlePaste(e: React.ClipboardEvent<HTMLTextAreaElement>) {
    const items = e.clipboardData?.items;
    if (!items) return;
    const imgs: File[] = [];
    for (const it of Array.from(items)) {
      if (it.type.startsWith("image/")) {
        const f = it.getAsFile();
        if (f) imgs.push(f);
      }
    }
    if (imgs.length) {
      e.preventDefault();
      handleImages(imgs);
    }
  }

  function handleDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer?.files?.length) {
      handleImages(e.dataTransfer.files);
    }
  }

  function handleMicClick() {
    if (speech.listening) {
      speech.stop();
    } else {
      userTypedRef.current = false;
      speech.start();
    }
  }

  function detectCommand(text: string): AiMode | null {
    const trimmed = text.trim().toLowerCase();
    for (const [cmd, mode] of Object.entries(MODE_COMMANDS)) {
      if (trimmed === cmd) return mode;
    }
    return null;
  }

  function submit() {
    const trimmed = value.trim();
    if ((!trimmed && attachments.length === 0) || disabled) return;

    const mode = detectCommand(trimmed);
    if (mode) {
      dispatch(setMode(mode));
      setValue("");
      toastMode(mode);
      ref.current?.focus();
      return;
    }

    onSend(trimmed);
    setValue("");
    dispatch(clearAttachments());
    requestAnimationFrame(() => {
      if (ref.current) ref.current.style.height = "auto";
    });
    ref.current?.focus();
  }

  function toastMode(mode: AiMode) {
    const labels: Record<AiMode, string> = {
      chat: "💬 Chat mode",
      translate: "🌐 Translate mode",
      search: "🔍 Search mode",
      code: "💻 Code mode",
    };
    const el = ref.current;
    if (el) {
      el.placeholder = labels[mode];
      el.focus();
    }
  }

  function handleKey(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.nativeEvent.isComposing || composingRef.current) return;

    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      submit();
    } else if (e.key === "Escape" && isStreaming) {
      e.preventDefault();
      onStop();
    } else if (e.key === "Escape" && speech.listening) {
      e.preventDefault();
      speech.stop();
    }
  }

  const remaining = MAX_LENGTH - value.length;
  const showCounter = value.length > MAX_LENGTH * 0.8;
  const overLimit = value.length > MAX_LENGTH;
  const canSend = (!!value.trim() || attachments.length > 0) && !disabled && !overLimit;
  const hasText = value.length > 0;
  const isListening = speech.listening;
  const micSupported = speech.supported;

  return (
    <div className="border-t border-border bg-background px-4 pt-3 pb-6 sm:px-6">
      <div className="mx-auto w-full max-w-3xl">
        {/* Mode chips + Look up button */}
        <div className="mb-2 flex items-center justify-between">
          <ModeChips />
          <div className="flex items-center gap-2">
            {micSupported && !isListening && (
              <span className="text-[10px] text-muted-foreground/50">
                {getLangLabel(speech.lang)}
              </span>
            )}
            {isListening && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-destructive/10 px-2.5 py-1 text-[10px] font-medium text-destructive animate-fade-in">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-destructive opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-destructive" />
                </span>
                {getLangLabel(speech.lang === "km-KH" ? "en-US" : "km-KH")}
              </span>
            )}
            <button
              type="button"
              onClick={onOpenDocuments}
              className="inline-flex items-center gap-1.5 rounded-lg border border-border px-2.5 py-1.5 text-[11px] font-medium text-muted-foreground transition-all hover:border-primary/50 hover:text-foreground hover:shadow-sm"
              title="Manage documents for RAG"
            >
              <BookOpen className="h-3 w-3" />
              <span className="hidden sm:inline">Docs</span>
            </button>
          </div>
        </div>

        {/* Attachment thumbnails */}
        {attachments.length > 0 && (
          <div className="mb-2 flex flex-wrap gap-2">
            {attachments.map((a) => (
              <div
                key={a.id}
                className="group relative h-16 w-16 overflow-hidden rounded-lg border border-border shadow-sm"
              >
                <img src={a.dataUrl} alt={a.name} className="h-full w-full object-cover" />
                <button
                  type="button"
                  onClick={() => dispatch(removeAttachment(a.id))}
                  className="absolute right-0.5 top-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-black/60 text-white opacity-0 transition-opacity group-hover:opacity-100"
                  aria-label={`Remove ${a.name}`}
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Input area */}
        <div
          onDrop={handleDrop}
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          className={cn(
            "group relative flex items-end gap-1 rounded-2xl border bg-background transition-all duration-200",
            "focus-within:border-gold focus-within:ring-2 focus-within:ring-gold/20",
            isStreaming
              ? "border-gold/40"
              : "border-border hover:border-gold/30",
            hasText && "border-gold/20",
            isListening && "border-destructive/60 ring-2 ring-destructive/20",
            dragOver && "border-gold/80 ring-2 ring-gold/30",
          )}
        >
          <textarea
            ref={ref}
            value={value}
            onChange={(e) => {
              setValue(e.target.value.slice(0, MAX_LENGTH));
              if (speech.listening) userTypedRef.current = true;
            }}
            onKeyDown={handleKey}
            onPaste={handlePaste}
            onCompositionStart={() => (composingRef.current = true)}
            onCompositionEnd={() => (composingRef.current = false)}
            placeholder={
              isListening
                ? "🎤 Listening... Speak now"
                : isStreaming
                ? "CAMBO AI is thinking... (Esc to stop)"
                : "Ask CAMBO AI, paste/drop an image, or attach a doc..."
            }
            rows={1}
            autoComplete="off"
            spellCheck={true}
            disabled={false}
            className={cn(
              "flex-1 resize-none bg-transparent px-4 py-3.5 text-[15px] leading-relaxed",
              "outline-none placeholder:text-muted-foreground/60",
              "max-h-[400px] scrollbar-thin",
              isListening && "placeholder:text-destructive/60",
            )}
          />

          {/* Waveform indicator when listening */}
          {isListening && (
            <div className="flex items-center gap-0.5 px-1" aria-hidden="true">
              {[1, 2, 3, 4, 5].map((i) => (
                <span
                  key={i}
                  className="block w-0.5 rounded-full bg-destructive/70"
                  style={{
                    height: "16px",
                    transformOrigin: "bottom",
                    animation: `voice-wave 0.8s ease-in-out ${i * 0.1}s infinite`,
                  }}
                />
              ))}
            </div>
          )}

          {/* Clear button */}
          {hasText && !isStreaming && !isListening && (
            <button
              type="button"
              onClick={() => {
                setValue("");
                ref.current?.focus();
              }}
              className="shrink-0 rounded-lg p-1.5 text-muted-foreground/50 transition-all hover:bg-secondary hover:text-foreground"
              aria-label="Clear input"
              title="Clear"
            >
              <X className="h-4 w-4" />
            </button>
          )}

          {/* Action buttons row */}
          <div className="flex items-center gap-0.5 p-1.5">
            {/* Attach image */}
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className={cn(
                "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition-all",
                "text-muted-foreground hover:bg-secondary hover:text-foreground active:scale-90",
              )}
              aria-label="Attach image"
              title="Attach image (or paste / drop)"
            >
              <ImagePlus className="h-4 w-4" />
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              multiple
              hidden
              onChange={(e) => {
                if (e.target.files?.length) handleImages(e.target.files);
                e.target.value = "";
              }}
            />

            {/* Paperclip (tools toggle) */}
            <button
              type="button"
              onClick={() => dispatch(setUseTools(!useTools))}
              className={cn(
                "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition-all active:scale-90",
                useTools
                  ? "bg-primary/15 text-primary hover:bg-primary/25"
                  : "text-muted-foreground hover:bg-secondary hover:text-foreground",
              )}
              aria-label="Toggle tool calling"
              title="Enable tools (web fetch, search, calculator)"
            >
              <Paperclip className="h-4 w-4" />
            </button>

            {/* Voice input button */}
            {micSupported && (
              <>
                {isListening ? (
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => {
                        speech.toggleLang();
                        speech.stop();
                        setTimeout(() => speech.start(), 200);
                      }}
                      className="absolute -top-8 left-1/2 -translate-x-1/2 animate-fade-in rounded-full border border-destructive/30 bg-card px-2 py-1 text-[9px] font-medium text-destructive whitespace-nowrap shadow-sm hover:bg-destructive/10"
                      title="Switch language"
                    >
                      <Languages className="mr-1 inline-block h-2.5 w-2.5" />
                      {getLangLabel(speech.lang === "km-KH" ? "en-US" : "km-KH")}
                    </button>
                    <button
                      type="button"
                      onClick={handleMicClick}
                      className={cn(
                        "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition-all",
                        "bg-destructive text-destructive-foreground shadow-sm",
                        "active:scale-90",
                      )}
                      aria-label="Stop recording"
                      title="Stop recording"
                    >
                      <MicOff className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={handleMicClick}
                    className={cn(
                      "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition-all",
                      "text-muted-foreground hover:bg-secondary hover:text-foreground",
                      "active:scale-90",
                    )}
                    aria-label="Start voice input"
                    title={`Voice input (${getLangLabel(speech.lang)})`}
                    disabled={disabled || isStreaming}
                  >
                    <Mic className="h-4 w-4" />
                  </button>
                )}
              </>
            )}

            {/* Send / Stop button */}
            {isStreaming ? (
              <Button
                size="icon"
                onClick={onStop}
                className="h-9 w-9 shrink-0 rounded-xl bg-destructive text-destructive-foreground shadow-sm transition-all hover:bg-destructive/90 active:scale-95"
                aria-label="Stop generation"
                title="Stop (Esc)"
              >
                <Square className="h-3.5 w-3.5 fill-current" />
              </Button>
            ) : (
              <Button
                size="icon"
                onClick={submit}
                disabled={!canSend}
                className={cn(
                  "h-9 w-9 shrink-0 rounded-xl transition-all active:scale-95",
                  canSend
                    ? "bg-primary text-primary-foreground shadow-sm hover:bg-primary/90"
                    : "",
                )}
                aria-label="Send message"
                title="Send (Enter)"
              >
                {disabled ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <ArrowUp className="h-4 w-4" strokeWidth={2.5} />
                )}
              </Button>
            )}
          </div>
        </div>

        {/* Footer hints */}
        <div className="mt-2 flex items-center justify-between gap-3 px-1 text-[11px] text-muted-foreground/60">
          <span className="hidden sm:inline">
            <kbd className="rounded border border-border bg-secondary px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground/80">
              Enter
            </kbd>
            <span className="mx-1">send</span>
            <kbd className="rounded border border-border bg-secondary px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground/80">
              Shift+Enter
            </kbd>
            <span className="mx-1">new line</span>
            {isStreaming && (
              <>
                <kbd className="rounded border border-border bg-secondary px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground/80">
                  Esc
                </kbd>
                <span className="mx-1">stop</span>
              </>
            )}
          </span>
          <span className="flex-1 text-center sm:flex-initial">
            {isListening
              ? "🎤 Tap mic again to stop & send"
              : "CAMBO AI may make mistakes. Verify important info."}
          </span>
          <span
            className={cn(
              "tabular-nums transition-colors",
              showCounter && (overLimit ? "text-destructive" : "text-amber-400"),
            )}
          >
            {showCounter ? `${remaining}` : ""}
          </span>
        </div>
      </div>
    </div>
  );
}
