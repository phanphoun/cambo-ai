import { memo, useState, useCallback } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  Bot,
  Check,
  Copy,
  Sparkles,
  Cpu,
  Cloud,
  User,
  AlertTriangle,
  ThumbsUp,
  ThumbsDown,
  Wrench,
} from "lucide-react";
import { cn, formatTime } from "../lib/utils";
import type { Message } from "../types/chat";
import type { AiProvider } from "../features/provider/providerSlice";
import PinButton from "../features/pin/PinButton";

interface ChatContainerProps {
  messages: Message[];
  isStreaming: boolean;
  provider: AiProvider;
}

export default function ChatContainer({
  messages,
  isStreaming,
  provider,
}: ChatContainerProps) {
  return (
    <div className="mx-auto w-full max-w-3xl space-y-5 pb-4">
      {messages.map((m, i) => (
        <MessageBubble
          key={m.timestamp || i}
          message={m}
          isLast={i === messages.length - 1}
          isStreaming={isStreaming}
          messageIndex={i}
          provider={provider}
        />
      ))}
    </div>
  );
}

const MessageBubble = memo(function MessageBubble({
  message,
  isLast,
  isStreaming,
  messageIndex,
  provider,
}: {
  message: Message;
  isLast: boolean;
  isStreaming: boolean;
  messageIndex: number;
  provider: AiProvider;
}) {
  const isUser = message.role === "user";
  const isEmpty = !message.content;
  const showCursor = isLast && !isUser && isStreaming && isEmpty;
  const isLoading = isLast && !isUser && isStreaming && !isEmpty;
  const hasError =
    !isUser && message.content.includes("quota") && /⚠️|❌/.test(message.content);

  return (
    <div
      className={cn(
        "group flex animate-slide-in gap-3",
        isUser ? "flex-row-reverse" : "flex-row",
      )}
      style={{ animationDelay: `${Math.min(messageIndex * 30, 300)}ms` }}
    >
      {/* Avatar */}
      <div
        className={cn(
          "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-sm font-medium shadow-sm ring-1 ring-black/10 transition-transform hover:scale-110",
          isUser
            ? "bg-gradient-to-br from-indigo-500 via-violet-500 to-purple-600 text-white"
            : "bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-600 text-white",
        )}
      >
        {isUser ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
      </div>

      <div
        className={cn(
          "flex max-w-[85%] flex-col gap-1",
          isUser ? "items-end" : "items-start",
        )}
      >
        {/* Header */}
        <div
          className={cn(
            "flex items-center gap-2 text-[11px] text-muted-foreground",
            isUser ? "flex-row-reverse" : "flex-row",
          )}
        >
          <span className="font-medium">{isUser ? "You" : "CAMBO AI"}</span>
          <span aria-hidden>·</span>
          <time dateTime={message.timestamp} className="tabular-nums">
            {formatTime(message.timestamp)}
          </time>
          {!isUser && (
            <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium"
              style={{
                backgroundColor: "hsl(var(--chat-ai-accent) / 0.15)",
                color: "hsl(var(--chat-ai-accent))",
              }}
            >
              {provider === "gemini" && <Sparkles className="h-2.5 w-2.5" />}
              {provider === "ollama" && <Cpu className="h-2.5 w-2.5" />}
              {provider === "ollama-cloud" && <Cloud className="h-2.5 w-2.5" />}
              <span className="hidden xs:inline">
                {provider === "gemini" && "Gemini"}
                {provider === "ollama" && "Ollama (Local)"}
                {provider === "ollama-cloud" && "Ollama Cloud"}
              </span>
            </span>
          )}
        </div>

        {/* Content */}
        <div
          className={cn(
            "rounded-2xl px-4 py-3 text-[15px] leading-relaxed break-words shadow-sm transition-shadow hover:shadow-md",
            isUser
              ? "rounded-tr-sm bg-gradient-to-br from-indigo-500 via-violet-500 to-purple-600 text-white"
              : "rounded-tl-sm border bg-card text-card-foreground",
            hasError && "border-destructive/30 bg-destructive/5",
            showCursor && "typing-cursor min-h-[1.5em]",
          )}
          style={!isUser ? {
            borderColor: "hsl(var(--border))",
            backgroundColor: "hsl(var(--chat-assistant))",
            color: "hsl(var(--chat-assistant-foreground))",
          } : undefined}
        >
          {hasError && (
            <div className="mb-2 flex items-center gap-2 text-xs font-medium text-destructive">
              <AlertTriangle className="h-3.5 w-3.5" />
              API issue
            </div>
          )}
          {isUser ? (
            <p className="whitespace-pre-wrap">{message.content}</p>
          ) : (
            <div className="markdown">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  code({ className, children, ...props }) {
                    const codeStr = String(children).replace(/\n$/, "");
                    // Fenced code blocks: block-level code has a language class or contains newlines.
                    const match = /language-(\w+)/.exec(className || "");
                    if (match || codeStr.includes("\n")) {
                      return <CodeBlock code={codeStr} language={match?.[1] ?? ""} />;
                    }
                    // Inline code (single backticks)
                    return (
                      <code className={cn("rounded bg-secondary px-1.5 py-0.5 font-mono text-[13px] text-primary", className)} {...props}>
                        {children}
                      </code>
                    );
                  },
                  pre({ children }) {
                    // pre is handled inside CodeBlock above
                    return <>{children}</>;
                  },
                }}
              >
                {message.content}
              </ReactMarkdown>
            </div>
          )}

          {/* User-attached images */}
          {isUser && message.images?.length ? (
            <div className="mt-2 flex flex-wrap gap-2">
              {message.images.map((src, i) => (
                <a
                  key={i}
                  href={src}
                  target="_blank"
                  rel="noreferrer"
                  className="block h-24 w-24 overflow-hidden rounded-lg border border-border shadow-sm"
                >
                  <img src={src} alt={`attachment ${i + 1}`} className="h-full w-full object-cover" />
                </a>
              ))}
            </div>
          ) : null}
        </div>

        {/* Assistant tool calls + citations */}
        {!isUser && (message.tool_calls?.length || message.citations?.length) ? (
          <div className="mt-2 flex flex-col gap-1.5">
            {message.tool_calls?.map((tc, i) => (
              <div
                key={i}
                className="flex items-start gap-2 rounded-lg border border-border bg-secondary/40 px-2.5 py-1.5 text-[11px]"
              >
                <Wrench className="mt-0.5 h-3 w-3 shrink-0 text-primary" />
                <div className="min-w-0">
                  <span className="font-medium text-foreground">{tc.name}</span>
                  <span className="text-muted-foreground">
                    {" "}({Object.entries(tc.args ?? {}).map(([k, v]) => `${k}=${JSON.stringify(v)}`).join(", ")})
                  </span>
                  {tc.result_preview ? (
                    <p className="mt-0.5 line-clamp-2 text-muted-foreground/80">{tc.result_preview}</p>
                  ) : null}
                </div>
              </div>
            ))}
            {message.citations?.length ? (
              <details className="rounded-lg border border-border bg-secondary/40 px-2.5 py-1.5 text-[11px]">
                <summary className="cursor-pointer font-medium text-muted-foreground">
                  {message.citations.length} source{message.citations.length > 1 ? "s" : ""}
                </summary>
                <ul className="mt-1.5 space-y-1.5">
                  {message.citations.map((c, i) => (
                    <li key={c.chunk_id ?? i} className="text-muted-foreground/90">
                      <span className="font-medium text-foreground">{c.source}</span>
                      <p className="line-clamp-3">{c.snippet}</p>
                    </li>
                  ))}
                </ul>
              </details>
            ) : null}
          </div>
        ) : null}

        {/* Streaming dots indicator */}
        {isLoading && (
          <div className="flex items-center gap-1 px-2 py-1" aria-hidden="true">
            <span className="h-1.5 w-1.5 rounded-full bg-primary/60 animate-streaming-dot" />
            <span className="h-1.5 w-1.5 rounded-full bg-primary/60 animate-streaming-dot" />
            <span className="h-1.5 w-1.5 rounded-full bg-primary/60 animate-streaming-dot" />
          </div>
        )}

        {/* Action buttons */}
        {!isEmpty && (
          <div
            className={cn(
              "flex items-center gap-1 text-muted-foreground opacity-0 transition-all duration-200 group-hover:opacity-100 focus-within:opacity-100",
              isUser ? "flex-row-reverse" : "flex-row",
            )}
          >
            <CopyButton text={message.content} />
            {!isUser && (
              <>
                <PinButton message={message} />
                <FeedbackButtons />
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
});

/** Code block with copy button */
function CodeBlock({ code, language }: { code: string; language: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = code;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    }
  }, [code]);

  return (
    <div className="group/code relative my-3 overflow-hidden rounded-lg first:mt-0 last:mb-0"
      style={{
        border: "1px solid hsl(var(--code-border))",
        backgroundColor: "hsl(var(--code-bg))",
      }}
    >
      {/* Header bar */}
      <div className="flex items-center justify-between px-3 py-1.5"
        style={{
          borderBottom: "1px solid hsl(var(--code-border))",
          backgroundColor: "hsl(var(--code-header))",
        }}
      >
        <span className="text-[11px] font-medium text-muted-foreground">
          {language || "code"}
        </span>
        <button
          type="button"
          onClick={handleCopy}
          className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11px] text-muted-foreground/70 opacity-0 transition-all hover:bg-background hover:text-foreground group-hover/code:opacity-100"
          aria-label="Copy code"
          title="Copy code"
        >
          {copied ? (
            <>
              <Check className="h-3 w-3 text-emerald-400" />
              <span className="text-emerald-400">Copied!</span>
            </>
          ) : (
            <>
              <Copy className="h-3 w-3" />
              <span>Copy</span>
            </>
          )}
        </button>
      </div>
      {/* Code content */}
      <pre className="!my-0 !border-0 !rounded-none overflow-x-auto p-4 text-[13px] leading-relaxed"
        style={{ backgroundColor: "hsl(var(--code-bg))" }}
      >
        <code>{code}</code>
      </pre>
    </div>
  );
}

function FeedbackButtons() {
  const [feedback, setFeedback] = useState<"up" | "down" | null>(null);

  return (
    <div className="flex items-center gap-0.5">
      <button
        type="button"
        onClick={() => setFeedback(feedback === "up" ? null : "up")}
        className={cn(
          "inline-flex h-7 w-7 items-center justify-center rounded-md text-xs transition-all hover:bg-secondary hover:text-foreground",
          feedback === "up" && "text-emerald-400",
        )}
        aria-label="Like"
        title="Helpful"
      >
        <ThumbsUp className={cn("h-3 w-3", feedback === "up" && "fill-current")} />
      </button>
      <button
        type="button"
        onClick={() => setFeedback(feedback === "down" ? null : "down")}
        className={cn(
          "inline-flex h-7 w-7 items-center justify-center rounded-md text-xs transition-all hover:bg-secondary hover:text-foreground",
          feedback === "down" && "text-destructive",
        )}
        aria-label="Dislike"
        title="Not helpful"
      >
        <ThumbsDown className={cn("h-3 w-3", feedback === "down" && "fill-current")} />
      </button>
    </div>
  );
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = text;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      try {
        document.execCommand("copy");
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      } catch {
        /* noop */
      }
      document.body.removeChild(ta);
    }
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      className="inline-flex h-7 items-center gap-1 rounded-md px-2 text-xs transition-colors hover:bg-secondary hover:text-foreground"
      aria-label="Copy message"
      title="Copy"
    >
      {copied ? (
        <>
          <Check className="h-3 w-3 text-emerald-400" />
          <span className="text-emerald-400">Copied</span>
        </>
      ) : (
        <>
          <Copy className="h-3 w-3" />
          <span>Copy</span>
        </>
      )}
    </button>
  );
}
