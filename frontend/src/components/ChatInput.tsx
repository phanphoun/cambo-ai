import { useEffect, useRef, useState, useCallback, type KeyboardEvent } from "react";
import { useDispatch } from "react-redux";
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
} from "lucide-react";
import { Button } from "./ui/button";
import { cn } from "../lib/utils";
import ModeChips from "../features/modes/ModeChips";
import { setMode, type AiMode } from "../features/modes/modesSlice";
import { setDirectoryOpen } from "../features/directory/directorySlice";
import {
  useSpeechRecognition,
  getLangLabel,
} from "../hooks/useSpeechRecognition";

const MAX_LENGTH = 4000;

interface ChatInputProps {
  onSend: (text: string) => void;
  onStop: () => void;
  disabled: boolean;
  isStreaming: boolean;
}

const MODE_COMMANDS: Record<string, AiMode> = {
  "/chat": "chat",
  "/translate": "translate",
  "/search": "search",
  "/code": "code",
};

export default function ChatInput({
  onSend,
  onStop,
  disabled,
  isStreaming,
}: ChatInputProps) {
  const dispatch = useDispatch();
  const [value, setValue] = useState("");
  const ref = useRef<HTMLTextAreaElement>(null);
  const composingRef = useRef(false);
  const userTypedRef = useRef(false);

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
    // Show toast for critical speech errors
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

  // When interim transcript updates, fill it in the textarea
  // but don't overwrite if the user manually typed during recording
  useEffect(() => {
    if (speech.listening && speech.interim && !userTypedRef.current) {
      setValue(speech.interim);
    }
  }, [speech.listening, speech.interim]);

  function handleMicClick() {
    if (speech.listening) {
      speech.stop();
    } else {
      userTypedRef.current = false; // Reset typing guard for fresh recording
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
    if (!trimmed || disabled) return;

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
  const canSend = !!value.trim() && !disabled && !overLimit;
  const hasText = value.length > 0;
  const isListening = speech.listening;
  const micSupported = speech.supported;

  return (
    <div className="border-t border-border bg-gradient-to-t from-background to-background/80 px-4 pt-3 pb-6 backdrop-blur supports-[backdrop-filter]:bg-background/60 sm:px-6">
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
                {getLangLabel(speech.lang)}
              </span>
            )}
            <button
              type="button"
              onClick={() => dispatch(setDirectoryOpen(true))}
              className="inline-flex items-center gap-1.5 rounded-lg border border-border px-2.5 py-1.5 text-[11px] font-medium text-muted-foreground transition-all hover:border-primary/50 hover:text-foreground hover:shadow-sm"
              title="Browse Cambodia tech companies"
            >
              <BookOpen className="h-3 w-3" />
              <span className="hidden sm:inline">Look Up</span>
            </button>
          </div>
        </div>

        {/* Input area */}
        <div
          className={cn(
            "group relative flex items-end gap-1 rounded-2xl border bg-card transition-all duration-200",
            "shadow-lg shadow-black/5",
            "focus-within:border-primary/70 focus-within:ring-2 focus-within:ring-primary/20 focus-within:shadow-primary/5",
            isStreaming
              ? "border-primary/40 shadow-primary/5"
              : "border-border hover:border-primary/30",
            hasText && "border-primary/20",
            isListening && "border-destructive/60 ring-2 ring-destructive/20 shadow-destructive/5",
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
            onCompositionStart={() => (composingRef.current = true)}
            onCompositionEnd={() => (composingRef.current = false)}
            placeholder={
              isListening
                ? "🎤 Listening... Speak now"
                : isStreaming
                ? "CAMBO AI is thinking... (Esc to stop)"
                : "Ask CAMBO AI about Cambodia tech..."
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
            {/* Voice input button */}
            {micSupported && (
              <>
                {isListening ? (
                  <div className="relative">
                            {/* Language toggle during recording */}
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
                        "bg-destructive text-destructive-foreground shadow-sm shadow-destructive/30",
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
                className="h-9 w-9 shrink-0 rounded-xl bg-destructive text-destructive-foreground shadow-sm transition-all hover:bg-destructive/90 hover:shadow-md active:scale-95"
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
                    ? "bg-gradient-to-br from-indigo-500 to-violet-600 shadow-sm shadow-indigo-500/20 hover:from-indigo-600 hover:to-violet-700 hover:shadow-md"
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
            {!isListening && (
              <>
                <kbd className="rounded border border-border bg-secondary px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground/80">
                  /command
                </kbd>
                <span className="mx-1">switch mode</span>
              </>
            )}
          </span>
          <span className="flex-1 text-center sm:flex-initial">
            {isListening
              ? "🎤 Tap mic again to stop & send"
              : "CAMBO AI may make mistakes. Verify important info."
            }
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
