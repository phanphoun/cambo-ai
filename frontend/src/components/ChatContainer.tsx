import { memo, useState, useCallback, useEffect, useMemo } from "react";
import { API_BASE } from "../config/api";
import { useSelector } from "react-redux";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import remarkBreaks from "remark-breaks";
import rehypeKatex from "rehype-katex";
import {
  Check,
  Copy,
  Sparkles,
  AlertTriangle,
  ThumbsUp,
  ThumbsDown,
  Wrench,
  X,
  ExternalLink,
  BookOpen,
  Globe,
  Calculator,
  Database,
  Search,
  ChevronLeft,
  ChevronRight,
  Maximize2,
  Download,
  Volume2,
  Square,
  Loader2,
} from "lucide-react";
import { cn, formatTime, preprocessLaTeX } from "../lib/utils";
import type { Message } from "../types/chat";
import type { AiProvider } from "../features/provider/providerSlice";
import type { RootState } from "../store";
import PinButton from "../features/pin/PinButton";
import { KbachCorner } from "./KhmerOrnaments";
import { parseGeneratedDoc, GeneratedDocCard } from "./GeneratedDocCard";
import { ExportDocButton } from "../features/documents/ExportDocButton";
import { KhmerProfileAvatar } from "./KhmerProfileAvatar";

interface ChatContainerProps {
  messages: Message[];
  isStreaming: boolean;
  provider: AiProvider;
}

interface LightboxState {
  images: string[];
  index: number;
}

export default function ChatContainer({
  messages,
  isStreaming,
  provider,
}: ChatContainerProps) {
  const [lightbox, setLightbox] = useState<LightboxState | null>(null);

  // Keyboard navigation for Lightbox
  useEffect(() => {
    if (!lightbox) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setLightbox(null);
      if (e.key === "ArrowLeft" && lightbox.images.length > 1) {
        setLightbox((prev) =>
          prev
            ? {
                ...prev,
                index: (prev.index - 1 + prev.images.length) % prev.images.length,
              }
            : null,
        );
      }
      if (e.key === "ArrowRight" && lightbox.images.length > 1) {
        setLightbox((prev) =>
          prev
            ? {
                ...prev,
                index: (prev.index + 1) % prev.images.length,
              }
            : null,
        );
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [lightbox]);

  return (
    <>
      {/* Fullscreen Image Lightbox */}
      {lightbox && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4 backdrop-blur-md animate-fade-in select-none"
          onClick={() => setLightbox(null)}
        >
          <div
            className="relative flex max-h-[92vh] max-w-[92vw] flex-col items-center justify-center"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Top Toolbar */}
            <div className="absolute -top-12 inset-x-0 flex items-center justify-between text-white/90 px-2">
              <span className="text-xs font-mono font-medium">
                {lightbox.images.length > 1
                  ? `${lightbox.index + 1} / ${lightbox.images.length}`
                  : "Image Preview"}
              </span>
              <div className="flex items-center gap-2">
                <a
                  href={lightbox.images[lightbox.index]}
                  download={`cambo-ai-image-${lightbox.index + 1}.png`}
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20"
                  title="Download image"
                >
                  <Download className="h-4 w-4" />
                </a>
                <button
                  type="button"
                  onClick={() => setLightbox(null)}
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20"
                  aria-label="Close preview"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Main Image */}
            <div className="relative overflow-hidden rounded-2xl border border-white/15 bg-black/40 shadow-2xl">
              <img
                src={lightbox.images[lightbox.index]}
                alt={`Preview ${lightbox.index + 1}`}
                className="max-h-[82vh] max-w-full object-contain rounded-2xl"
              />
            </div>

            {/* Previous / Next Navigation Controls */}
            {lightbox.images.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={() =>
                    setLightbox((prev) =>
                      prev
                        ? {
                            ...prev,
                            index:
                              (prev.index - 1 + prev.images.length) %
                              prev.images.length,
                          }
                        : null,
                    )
                  }
                  className="absolute -left-12 top-1/2 -translate-y-1/2 flex h-10 w-10 items-center justify-center rounded-full bg-white/15 text-white backdrop-blur hover:bg-white/30 transition-all"
                  aria-label="Previous image"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setLightbox((prev) =>
                      prev
                        ? {
                            ...prev,
                            index: (prev.index + 1) % prev.images.length,
                          }
                        : null,
                    )
                  }
                  className="absolute -right-12 top-1/2 -translate-y-1/2 flex h-10 w-10 items-center justify-center rounded-full bg-white/15 text-white backdrop-blur hover:bg-white/30 transition-all"
                  aria-label="Next image"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* Centered reading container */}
      <div className="mx-auto w-full max-w-3xl sm:max-w-3.5xl lg:max-w-4xl space-y-6 pb-6 pt-2">
        {messages.map((m, i) => (
          <MessageBubble
            key={`${m.role}-${m.timestamp || i}-${i}`}
            message={m}
            isLast={i === messages.length - 1}
            isStreaming={isStreaming}
            messageIndex={i}
            provider={provider}
            onOpenImageGallery={(images, index) =>
              setLightbox({ images, index })
            }
          />
        ))}
      </div>
    </>
  );
}

const MessageBubble = memo(function MessageBubble({
  message,
  isLast,
  isStreaming,
  messageIndex,
  onOpenImageGallery,
}: {
  message: Message;
  isLast: boolean;
  isStreaming: boolean;
  messageIndex: number;
  provider?: AiProvider;
  onOpenImageGallery: (images: string[], index: number) => void;
}) {
  const currentUser = useSelector((s: RootState) => s.auth.user);
  const isUser = message.role === "user";
  const { cleanContent, docMeta } = parseGeneratedDoc(message.content || "");
  const formattedContent = useMemo(
    () => preprocessLaTeX(cleanContent),
    [cleanContent],
  );
  const isEmpty = !cleanContent && !docMeta;
  const isLoading = isLast && !isUser && isStreaming && !isEmpty;
  const hasError =
    !isUser && cleanContent.includes("quota") && /⚠️|❌/.test(cleanContent);

  return (
    <div
      className={cn(
        "group flex w-full gap-3 sm:gap-4",
        isUser ? "justify-end animate-slide-in" : "justify-start",
      )}
      style={isUser ? { animationDelay: `${Math.min(messageIndex * 30, 300)}ms` } : undefined}
    >
      {/* Assistant Avatar on Left with Authentic Khmer Medallion Art */}
      {!isUser && (
        <KhmerProfileAvatar
          isAi={true}
          size="sm"
          glow={true}
          className="mt-0.5"
        />
      )}

      {/* Bubble Container: Assistant fills available width of centered container, User hugs right */}
      <div
        className={cn(
          "flex flex-col gap-1.5 min-w-0",
          isUser
            ? "max-w-[85%] sm:max-w-[75%] md:max-w-[68%] items-end"
            : "flex-1 w-full items-start",
        )}
      >
        {/* Header Metadata */}
        <div
          className={cn(
            "flex items-center gap-2 text-xs text-stone-400 px-1 font-sans",
            isUser ? "flex-row-reverse" : "flex-row",
          )}
        >
          <span className="font-heading font-semibold text-xs sm:text-[13px] text-stone-200">
            {isUser ? (currentUser?.name?.split(" ")[0] || "You") : "Sastra AI"}
          </span>
          <span aria-hidden className="opacity-40">
            ·
          </span>
          <time
            dateTime={message.timestamp}
            className="tabular-nums text-[11px] sm:text-xs opacity-75 font-sans"
          >
            {formatTime(message.timestamp)}
          </time>
        </div>

        {/* Message Body Card */}
        <div
          className={cn(
            "relative text-[14.5px] sm:text-[15.5px] leading-[1.8] break-words [overflow-wrap:anywhere]",
            isUser
              ? "w-fit rounded-2xl sm:rounded-3xl rounded-tr-sm sm:rounded-tr-md border border-amber-500/30 dark:border-gold/35 bg-gradient-to-br from-[#2B1F13]/90 via-[#20170E]/85 to-[#160F09]/90 backdrop-blur-xl px-4 py-3 sm:px-5 sm:py-3.5 font-khmer text-left shadow-lg shadow-black/40 text-stone-100 transition-all"
              : "w-full bg-transparent border-0 shadow-none px-0 py-0.5 text-stone-900 dark:text-stone-100 transition-none",
            hasError &&
              "border border-destructive/40 bg-destructive/10 text-destructive p-3 rounded-xl",
          )}
        >

          {hasError && (
            <div className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-destructive">
              <AlertTriangle className="h-4 w-4" />
              <span>Service Notice</span>
            </div>
          )}

          {/* User Image Attachments Gallery */}
          {isUser && message.images && message.images.length > 0 && (
            <div className="mb-3">
              <UserImageGallery
                images={message.images}
                onOpen={(idx) => onOpenImageGallery(message.images!, idx)}
              />
            </div>
          )}

          {isUser ? (
            message.content ? (
              <p className="whitespace-pre-wrap leading-[1.8] text-stone-100 font-normal text-left text-[14.5px] sm:text-[15.5px] font-khmer select-text">
                {message.content}
              </p>
            ) : null
          ) : isEmpty && isStreaming ? (
            <div className="space-y-3.5 py-2 animate-fade-in">
              <div className="flex items-center gap-2.5 text-xs font-semibold text-amber-600 dark:text-gold">
                <Sparkles
                  className="h-4 w-4 animate-spin text-amber-600 dark:text-gold"
                  style={{ animationDuration: "3s" }}
                />
                <span className="font-khmer font-medium text-stone-800 dark:text-stone-200 text-xs sm:text-[13px]">
                  កំពុងគិត និងបង្កើតចម្លើយ... (Thinking & Generating)
                </span>
              </div>
              <div className="space-y-2 pt-1">
                <div className="h-3 w-11/12 rounded-full bg-gradient-to-r from-amber-500/20 via-amber-500/40 to-amber-500/10 dark:from-gold/20 dark:via-gold/40 dark:to-gold/10 animate-pulse" />
                <div
                  className="h-3 w-4/5 rounded-full bg-gradient-to-r from-amber-500/20 via-amber-500/40 to-amber-500/10 dark:from-gold/20 dark:via-gold/40 dark:to-gold/10 animate-pulse"
                  style={{ animationDelay: "0.2s" }}
                />
                <div
                  className="h-3 w-3/5 rounded-full bg-gradient-to-r from-amber-500/20 via-amber-500/40 to-amber-500/10 dark:from-gold/20 dark:via-gold/40 dark:to-gold/10 animate-pulse"
                  style={{ animationDelay: "0.4s" }}
                />
              </div>
            </div>
          ) : (
            <div className="markdown text-stone-900 dark:text-stone-100 leading-[1.85] font-khmer text-[15.5px] sm:text-[16.5px]">
              {docMeta && <GeneratedDocCard doc={docMeta} />}
              {cleanContent && (
                <ReactMarkdown
                  remarkPlugins={[remarkGfm, remarkMath, remarkBreaks]}
                  rehypePlugins={[[rehypeKatex, { throwOnError: false, strict: false }]]}
                  components={{
                  p({ children }) {
                    return (
                      <p className="my-3.5 first:mt-0 last:mb-0 leading-[1.85] text-stone-900 dark:text-stone-100 text-[15.5px] sm:text-[16.5px] font-normal tracking-normal">
                        {children}
                      </p>
                    );
                  },
                  ul({ children }) {
                    return (
                      <ul className="my-3.5 ml-5 list-disc space-y-2 text-stone-900 dark:text-stone-100 marker:text-amber-600 dark:marker:text-gold">
                        {children}
                      </ul>
                    );
                  },
                  ol({ children }) {
                    return (
                      <ol className="my-3.5 ml-5 list-decimal space-y-2 text-stone-900 dark:text-stone-100 marker:text-amber-600 dark:marker:text-gold">
                        {children}
                      </ol>
                    );
                  },
                  li({ children }) {
                    return <li className="leading-[1.8] text-stone-900 dark:text-stone-100 text-[15.5px] sm:text-[16.5px] font-normal">{children}</li>;
                  },
                  h1({ children }) {
                    return (
                      <h1 className="mb-3.5 mt-6 font-heading text-xl sm:text-2xl font-bold text-amber-800 dark:text-[#FCD34D] first:mt-0 tracking-normal leading-[1.35] flex items-center gap-2">
                        {children}
                      </h1>
                    );
                  },
                  h2({ children }) {
                    return (
                      <h2 className="mb-3 mt-5 font-heading text-lg sm:text-xl font-semibold text-amber-800 dark:text-[#FCD34D] first:mt-0 tracking-normal leading-[1.4] flex items-center gap-2">
                        {children}
                      </h2>
                    );
                  },
                  h3({ children }) {
                    return (
                      <h3 className="mb-2 mt-4 font-heading text-base sm:text-lg font-semibold text-amber-800 dark:text-[#FCD34D] first:mt-0 tracking-normal leading-[1.45]">
                        {children}
                      </h3>
                    );
                  },
                  strong({ children }) {
                    return (
                      <strong className="font-bold text-black dark:text-white">
                        {children}
                      </strong>
                    );
                  },
                  blockquote({ children }) {
                    return (
                      <div className="relative my-4 rounded-2xl border border-amber-600/40 bg-gradient-to-r from-[#1A140E]/40 via-[#241A10]/40 to-[#140F09]/40 p-4 sm:p-5 shadow-xl shadow-black/40 backdrop-blur-sm overflow-hidden">
                        {/* Corner Ornaments */}
                        <div className="absolute top-1.5 left-1.5 text-gold/70 pointer-events-none">
                          <KbachCorner className="h-4 w-4" />
                        </div>
                        <div className="absolute top-1.5 right-1.5 rotate-90 text-gold/70 pointer-events-none">
                          <KbachCorner className="h-4 w-4" />
                        </div>
                        <div className="absolute bottom-1.5 left-1.5 -rotate-90 text-gold/70 pointer-events-none">
                          <KbachCorner className="h-4 w-4" />
                        </div>
                        <div className="absolute bottom-1.5 right-1.5 rotate-180 text-gold/70 pointer-events-none">
                          <KbachCorner className="h-4 w-4" />
                        </div>

                        <div className="flex items-center justify-between gap-4">
                          <div className="text-center sm:text-left flex-1 font-khmer italic text-[#F5D77F] text-xs sm:text-sm leading-relaxed px-2">
                            {children}
                          </div>
                          <div className="hidden sm:block shrink-0 h-16 w-16 opacity-80 filter drop-shadow">
                            <img
                              src="/src/assets/images/bayon-head.png"
                              alt="Bayon Buddha Head"
                              className="h-full w-full object-contain"
                              onError={(e) => { e.currentTarget.style.display = 'none'; }}
                            />
                          </div>
                        </div>
                      </div>
                    );
                  },
                  hr() {
                    return <hr className="my-4 border-t border-[#382C1B]/80" />;
                  },
                  table({ children }) {
                    return (
                      <div className="my-4 overflow-x-auto rounded-2xl border border-[#483B24]/70 bg-black/25 shadow-xl backdrop-blur-sm">
                        <table className="w-full text-left text-xs sm:text-sm border-collapse font-khmer">
                          {children}
                        </table>
                      </div>
                    );
                  },
                  th({ children }) {
                    return (
                      <th className="border-b border-[#352B19]/80 bg-[#1C1710]/70 px-4 py-2.5 font-bold text-[#E5C058]">
                        {children}
                      </th>
                    );
                  },
                  td({ children }) {
                    return (
                      <td className="border-b border-[#241C10]/60 px-4 py-2.5 text-stone-200 hover:bg-gold/5 transition-colors">
                        {children}
                      </td>
                    );
                  },
                  code({ className, children, ...props }) {
                    const codeStr = String(children).replace(/\n$/, "");
                    const match = /language-(\w+)/.exec(className || "");
                    if (match || codeStr.includes("\n")) {
                      return (
                        <CodeBlock
                          code={codeStr}
                          language={match?.[1] ?? ""}
                        />
                      );
                    }
                    return (
                      <code
                        className={cn(
                          "rounded-md bg-amber-100 dark:bg-[#251F14] px-2 py-0.5 font-mono text-[13px] text-amber-950 dark:text-[#FDE047] font-bold border border-amber-300/80 dark:border-[#3E321E]",
                          className,
                        )}
                        {...props}
                      >
                        {children}
                      </code>
                    );
                  },
                  pre({ children }) {
                    return <>{children}</>;
                  },
                  a({ href, children }) {
                    return (
                      <a
                        href={href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-0.5 text-amber-700 dark:text-[#FCD34D] font-bold underline underline-offset-4 hover:opacity-80"
                      >
                        {children}
                        <ExternalLink className="inline h-3 w-3 ml-0.5" />
                      </a>
                    );
                  },
                }}
              >
                {formattedContent}
              </ReactMarkdown>
              )}
              {isLast && isStreaming && (
                <span
                  className="inline-block h-3.5 w-1.5 ml-1 translate-y-0.5 rounded-full bg-gold animate-blink"
                  aria-hidden="true"
                />
              )}
            </div>
          )}
        </div>

        {/* Assistant Tool Calls */}
        {!isUser &&
        (message.tool_calls?.length || message.citations?.length) ? (
          <div className="mt-1 flex flex-col gap-1.5 w-full">
            {message.tool_calls?.map((tc, i) => {
              const ToolIcon = getToolIcon(tc.name);
              return (
                <div
                  key={i}
                  className="flex items-start gap-2.5 rounded-xl border border-[#382E1C]/80 bg-[#16120C]/80 px-3.5 py-2 text-xs shadow-xs"
                >
                  <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-lg bg-gold/10 text-gold">
                    <ToolIcon className="h-3 w-3" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-stone-200">
                        {formatToolName(tc.name)}
                      </span>
                      <span className="text-[10px] text-stone-400 font-mono">
                        {Object.keys(tc.args || {}).length > 0
                          ? `(${Object.entries(tc.args)
                              .map(([k, v]) => `${k}=${JSON.stringify(v)}`)
                              .join(", ")})`
                          : ""}
                      </span>
                    </div>
                    {tc.result_preview && (
                      <p className="mt-1 text-[11px] text-stone-400 line-clamp-2 bg-black/60 rounded p-1.5 font-mono">
                        {tc.result_preview}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}

            {/* Citations block */}
            {message.citations && message.citations.length > 0 && (
              <details className="group/cit rounded-xl border border-[#382E1C]/80 bg-[#16120C]/60 px-3.5 py-2 text-xs shadow-xs">
                <summary className="cursor-pointer font-semibold text-stone-200 hover:text-gold transition-colors list-none flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <BookOpen className="h-3.5 w-3.5 text-gold" />
                    <span>
                      {message.citations.length} Grounded Source
                      {message.citations.length > 1 ? "s" : ""}
                    </span>
                  </span>
                  <span className="text-[10px] text-stone-400">
                    View details
                  </span>
                </summary>
                <div className="mt-2 space-y-2 pt-2 border-t border-[#382E1C]/50">
                  {message.citations.map((c, i) => (
                    <div
                      key={c.chunk_id ?? i}
                      className="rounded-lg bg-black/60 p-2 text-[11px] border border-[#382E1C]/50"
                    >
                      <span className="font-bold text-gold block mb-0.5">
                        {c.source}
                      </span>
                      <p className="text-stone-300 leading-relaxed">
                        {c.snippet}
                      </p>
                    </div>
                  ))}
                </div>
              </details>
            )}
          </div>
        ) : null}

        {/* Live streaming dots */}
        {isLoading && (
          <div className="flex items-center gap-1 px-2 py-1" aria-hidden="true">
            <span className="h-1.5 w-1.5 rounded-full bg-gold animate-streaming-dot" />
            <span className="h-1.5 w-1.5 rounded-full bg-gold animate-streaming-dot" />
            <span className="h-1.5 w-1.5 rounded-full bg-gold animate-streaming-dot" />
          </div>
        )}

        {/* Message Action Toolbar */}
        {!isEmpty && (
          <div
            className={cn(
              "flex items-center gap-1 text-stone-400 transition-opacity duration-200 opacity-80 sm:opacity-0 group-hover:opacity-100 focus-within:opacity-100 px-1",
              isUser ? "flex-row-reverse" : "flex-row",
            )}
          >
            <CopyButton text={message.content} />
            {!isUser && (
              <>
                <SpeakButton messageId={message.timestamp || message.content.slice(0, 32)} text={message.content} />
                <ExportDocButton content={cleanContent} />
                <PinButton message={message} />
                <FeedbackButtons />
              </>
            )}
          </div>
        )}
      </div>

      {isUser && (
        <KhmerProfileAvatar
          name={currentUser?.name || "You"}
          avatar={currentUser?.avatar}
          size="sm"
          role={currentUser?.role as "admin" | "user"}
          showCrown={currentUser?.role === "admin"}
          glow={true}
          className="mt-0.5"
        />
      )}
    </div>
  );
});

/** Responsive, high-elegance Image Gallery for Single & Multiple attachments */
function UserImageGallery({
  images,
  onOpen,
}: {
  images: string[];
  onOpen: (index: number) => void;
}) {
  const count = images.length;

  if (count === 1) {
    return (
      <div className="overflow-hidden rounded-2xl border border-white/25 bg-black/25 shadow-md transition-all hover:border-white/40">
        <button
          type="button"
          onClick={() => onOpen(0)}
          className="group/single relative block max-h-[300px] w-full overflow-hidden text-left focus:outline-none"
        >
          <img
            src={images[0]}
            alt="Uploaded attachment"
            className="max-h-[280px] w-auto max-w-full rounded-2xl object-contain transition-transform duration-300 group-hover/single:scale-[1.02]"
          />
          <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity group-hover/single:opacity-100">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-black/70 px-3 py-1.5 text-xs font-semibold text-white shadow backdrop-blur">
              <Maximize2 className="h-3.5 w-3.5" />
              <span>Click to enlarge</span>
            </span>
          </div>
        </button>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "grid gap-2 overflow-hidden rounded-2xl",
        count === 2 && "grid-cols-2 max-w-md",
        count === 3 && "grid-cols-3 max-w-lg",
        count >= 4 && "grid-cols-2 sm:grid-cols-2 max-w-md",
      )}
    >
      {images.map((src, idx) => (
        <button
          key={idx}
          type="button"
          onClick={() => onOpen(idx)}
          className="group/multi relative aspect-square overflow-hidden rounded-xl border border-white/25 bg-black/20 shadow-sm transition-all hover:scale-[1.03] hover:border-white/40 focus:outline-none"
        >
          <img
            src={src}
            alt={`Attachment ${idx + 1}`}
            className="h-full w-full object-cover"
          />
          <div className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 transition-opacity group-hover/multi:opacity-100">
            <Maximize2 className="h-4 w-4 text-white drop-shadow" />
          </div>
          <span className="absolute bottom-1 right-1 rounded bg-black/60 px-1 py-0.5 text-[9px] font-mono font-medium text-white/90">
            #{idx + 1}
          </span>
        </button>
      ))}
    </div>
  );
}

function getToolIcon(name: string) {
  if (name.includes("fetch") || name.includes("url")) return Globe;
  if (name.includes("directory")) return BookOpen;
  if (name.includes("calc")) return Calculator;
  if (name.includes("rag") || name.includes("doc")) return Database;
  if (name.includes("search")) return Search;
  return Wrench;
}

function formatToolName(name: string) {
  return name
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

/** Transparent Glassmorphic Code Block with Modern Real-Coding Platform Multi-Color Syntax */
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
    <div className="group/code relative my-4 overflow-hidden rounded-2xl border border-white/10 dark:border-white/15 bg-black/40 dark:bg-black/40 backdrop-blur-xl shadow-2xl shadow-black/40 first:mt-0 last:mb-0 transition-all hover:border-white/20">
      {/* Header Bar */}
      <div className="flex items-center justify-between border-b border-white/10 bg-white/[0.04] backdrop-blur-md px-4 py-2.5">
        <div className="flex items-center gap-2.5">
          {/* macOS 3-dot window controls for authentic IDE aesthetic */}
          <div className="flex items-center gap-1.5 mr-1">
            <span className="h-2.5 w-2.5 rounded-full bg-[#FF5F56]/90 border border-[#E0443E]/60 shadow-sm" />
            <span className="h-2.5 w-2.5 rounded-full bg-[#FFBD2E]/90 border border-[#DEA123]/60 shadow-sm" />
            <span className="h-2.5 w-2.5 rounded-full bg-[#27C93F]/90 border border-[#1AAB29]/60 shadow-sm" />
          </div>
          <span className="font-mono text-[11px] font-bold text-amber-300 uppercase tracking-wider pl-1">
            {language || "code"}
          </span>
        </div>
        <button
          type="button"
          onClick={handleCopy}
          className="inline-flex items-center gap-1.5 rounded-lg border border-white/15 bg-white/[0.06] hover:bg-white/[0.14] px-2.5 py-1 text-[11px] font-semibold text-stone-200 backdrop-blur-sm transition-all hover:text-white cursor-pointer active:scale-95"
          aria-label="Copy code snippet"
          title="Copy code"
        >
          {copied ? (
            <>
              <Check className="h-3.5 w-3.5 text-emerald-400" />
              <span className="text-emerald-400 font-semibold">Copied!</span>
            </>
          ) : (
            <>
              <Copy className="h-3.5 w-3.5" />
              <span>Copy</span>
            </>
          )}
        </button>
      </div>

      {/* Code Text with Transparent Glass & Multi-Color IDE Syntax */}
      <pre className="!my-0 !border-0 !rounded-none overflow-x-auto p-4 sm:p-5 font-mono text-[13.5px] leading-relaxed bg-transparent text-[#E6EDF3] scrollbar-thin selection:bg-amber-500/30">
        <code className="!bg-transparent !p-0 !text-[#E6EDF3] font-mono">
          {highlightTokens(code, language)}
        </code>
      </pre>
    </div>
  );
}

const TOKEN_REGEX = new RegExp(
  [
    "(#[^\\n]*|\\/\\/[^\\n]*)",
    "(f\"(?:\\\\.|[^\"\\\\])*\"|f'(?:\\\\.|[^'\\\\])*')",
    "(\"(?:\\\\.|[^\"\\\\])*\"|'(?:\\\\.|[^'\\\\])*'|`(?:\\\\.|[^`\\\\])*`)",
    "(@[a-zA-Z_]\\w*(?:\\.[a-zA-Z_]\\w*)*)",
    "(\\b(?:def|class|function|return|async|await|yield|lambda|const|let|var|import|from|export|default|type|interface|enum|extends|implements)\\b)",
    "(\\b(?:if|elif|else|for|while|try|except|finally|with|as|raise|throw|catch|break|continue|pass|case|switch|match|in|is|not|and|or)\\b)",
    "(\\b(?:True|False|true|false|None|null|undefined|NaN|Infinity)\\b)",
    "(\\b(?:print|input|len|range|enumerate|zip|map|filter|sum|min|max|sorted|reversed|abs|round|open|type|isinstance|int|float|str|bool|list|dict|set|tuple|console|log|warn|error|info|require|setTimeout|setInterval|fetch|JSON|Math)\\b)",
    "(\\b(?:pip|npm|npx|yarn|pnpm|bun|node|python|python3|git|docker|curl|wget|mkdir|cd|ls|cat|chmod|sudo|grep|find|bash|sh|uv)\\b)",
    "(\\b(?:SELECT|FROM|WHERE|INSERT|UPDATE|DELETE|CREATE|TABLE|JOIN|GROUP\\s+BY|ORDER\\s+BY)\\b)",
    "(?:\\$\\d+(?:\\.\\d+)?|\\b\\d+(?:\\.\\d+)?\\b)",
    "(?:\\+=|-=|\\*=|\\/=|%=|\\*\\*=|\\/\\/=|==|!=|<=|>=|=>|->|\\*\\*|\\/\\/|\\+|-|\\*|\\/|%|=|&|\\||\\^|~|<|>|!)",
    "([{}])",
    "([\\[\\]])",
    "([()])",
    "([,;:])",
  ].join("|"),
  "gi"
);

/** Real-Coding Platform Multi-Color Syntax Tokenizer (VS Code One Dark Pro / Tokyo Night inspired) */
function highlightTokens(code: string, _language?: string) {
  const lines = code.split("\n");

  return lines.map((line, lineIdx) => {
    const trimmed = line.trim();

    // Whole-line comment
    if (trimmed.startsWith("#") || trimmed.startsWith("//") || trimmed.startsWith("--") || trimmed.startsWith("/*") || trimmed.startsWith("*")) {
      return (
        <span key={lineIdx} className="text-[#8B949E] dark:text-[#94A3B8] italic block font-khmer">
          {line || " "}
        </span>
      );
    }

    const parts: React.ReactNode[] = [];
    let lastIndex = 0;
    let match: RegExpExecArray | null;

    // Reset lastIndex for regex exec loop
    TOKEN_REGEX.lastIndex = 0;

    while ((match = TOKEN_REGEX.exec(line)) !== null) {
      if (match.index > lastIndex) {
        const rawText = line.substring(lastIndex, match.index);
        parts.push(
          <span key={`txt-${lastIndex}`} className="text-[#E6EDF3]">
            {rawText}
          </span>
        );
      }

      const token = match[0];
      const key = `tok-${match.index}`;

      // 1. Comments
      if (token.startsWith("#") || token.startsWith("//")) {
        parts.push(
          <span key={key} className="text-[#8B949E] dark:text-[#94A3B8] italic font-khmer">
            {token}
          </span>
        );
      }
      // 2. Python f-strings
      else if (token.startsWith('f"') || token.startsWith("f'")) {
        const quote = token[1];
        const inner = token.slice(2, -1);
        const subParts: React.ReactNode[] = [];
        const exprRegex = /\{([^}]+)\}/g;
        let subLast = 0;
        let subMatch: RegExpExecArray | null;

        while ((subMatch = exprRegex.exec(inner)) !== null) {
          if (subMatch.index > subLast) {
            subParts.push(
              <span key={`f-str-${subLast}`} className="text-[#98C379]">
                {inner.substring(subLast, subMatch.index)}
              </span>
            );
          }
          subParts.push(
            <span key={`f-brc-open-${subMatch.index}`} className="text-[#56B6C2] font-bold">
              {"{"}
            </span>
          );
          subParts.push(
            <span key={`f-var-${subMatch.index}`} className="text-[#E6EDF3]">
              {subMatch[1]}
            </span>
          );
          subParts.push(
            <span key={`f-brc-close-${subMatch.index}`} className="text-[#56B6C2] font-bold">
              {"}"}
            </span>
          );
          subLast = exprRegex.lastIndex;
        }
        if (subLast < inner.length) {
          subParts.push(
            <span key={`f-str-${subLast}`} className="text-[#98C379]">
              {inner.substring(subLast)}
            </span>
          );
        }

        parts.push(
          <span key={key}>
            <span className="text-[#E06C75] font-bold">f</span>
            <span className="text-[#98C379]">{quote}</span>
            {subParts}
            <span className="text-[#98C379]">{quote}</span>
          </span>
        );
      }
      // 3. Regular strings & template literals
      else if (token.startsWith('"') || token.startsWith("'") || token.startsWith("`")) {
        parts.push(
          <span key={key} className="text-[#98C379] font-normal">
            {token}
          </span>
        );
      }
      // 4. Decorators (@app.post)
      else if (token.startsWith("@")) {
        parts.push(
          <span key={key} className="text-[#61AFEF] font-semibold">
            {token}
          </span>
        );
      }
      // 5. Numbers & Currency
      else if (/^(?:\$\d+(?:\.\d+)?|\d+(?:\.\d+)?)$/.test(token)) {
        parts.push(
          <span key={key} className="text-[#D19A66] font-semibold">
            {token}
          </span>
        );
      }
      // 6. CLI tools
      else if (/^(pip|npm|npx|yarn|pnpm|bun|node|python|python3|git|docker|curl|wget|mkdir|cd|ls|cat|chmod|sudo|grep|find|bash|sh|uv)$/i.test(token)) {
        parts.push(
          <span key={key} className="text-[#38BDF8] font-bold">
            {token}
          </span>
        );
      }
      // 7. Declaration keywords (def, class, const, return, async, etc.)
      else if (/^(def|class|function|return|async|await|yield|lambda|const|let|var|import|from|export|default|type|interface|enum|extends|implements)$/i.test(token)) {
        parts.push(
          <span key={key} className="text-[#C678DD] font-semibold">
            {token}
          </span>
        );
      }
      // 8. Control flow keywords (for, in, if, else, while, try, etc.)
      else if (/^(if|elif|else|for|while|try|except|finally|with|as|raise|throw|catch|break|continue|pass|case|switch|match|in|is|not|and|or)$/i.test(token)) {
        parts.push(
          <span key={key} className="text-[#E5C07B] font-bold">
            {token}
          </span>
        );
      }
      // 9. Constants & Booleans (True, False, None, null)
      else if (/^(True|False|true|false|None|null|undefined|NaN|Infinity)$/.test(token)) {
        parts.push(
          <span key={key} className="text-[#E06C75] font-semibold">
            {token}
          </span>
        );
      }
      // 10. Built-in functions (print, range, len, sum, etc.)
      else if (/^(print|input|len|range|enumerate|zip|map|filter|sum|min|max|sorted|reversed|abs|round|open|type|isinstance|int|float|str|bool|list|dict|set|tuple|console|log|warn|error|info|require|setTimeout|setInterval|fetch|JSON|Math)$/i.test(token)) {
        parts.push(
          <span key={key} className="text-[#61AFEF] font-semibold">
            {token}
          </span>
        );
      }
      // 11. SQL keywords
      else if (/^(SELECT|FROM|WHERE|INSERT|UPDATE|DELETE|CREATE|TABLE|JOIN|GROUP|ORDER|BY)$/i.test(token)) {
        parts.push(
          <span key={key} className="text-[#C678DD] font-bold">
            {token}
          </span>
        );
      }
      // 12. Multi-char and arithmetic/assignment operators (+=, =, ==, !=, etc.)
      else if (/^(?:\+=|-=|\*=|\/=|%=|\*\*=|==|!=|<=|>=|=>|->|\*\*|\+|\-|\*|\/|%|=|&|\||\^|~|<|>|!)$/.test(token)) {
        parts.push(
          <span key={key} className="text-[#56B6C2] font-semibold">
            {token}
          </span>
        );
      }
      // 13. Curly braces {}
      else if (token === "{" || token === "}") {
        parts.push(
          <span key={key} className="text-[#56B6C2] font-bold">
            {token}
          </span>
        );
      }
      // 14. Square brackets []
      else if (token === "[" || token === "]") {
        parts.push(
          <span key={key} className="text-[#C678DD] font-bold">
            {token}
          </span>
        );
      }
      // 15. Parentheses ()
      else if (token === "(" || token === ")") {
        parts.push(
          <span key={key} className="text-[#E5C07B] font-bold">
            {token}
          </span>
        );
      }
      // 16. Punctuation (, ; :)
      else if (/^[,;:]$/.test(token)) {
        parts.push(
          <span key={key} className="text-[#94A3B8]">
            {token}
          </span>
        );
      }
      // 17. Fallback (Identifiers, variables, etc.)
      else {
        parts.push(
          <span key={key} className="text-[#E6EDF3]">
            {token}
          </span>
        );
      }

      lastIndex = TOKEN_REGEX.lastIndex;
    }

    if (lastIndex < line.length) {
      const remaining = line.substring(lastIndex);
      parts.push(
        <span key={`rem-${lastIndex}`} className="text-[#E6EDF3]">
          {remaining}
        </span>
      );
    }

    return (
      <span key={lineIdx} className="block">
        {parts.length > 0 ? parts : " "}
      </span>
    );
  });
}

function FeedbackButtons() {
  const [feedback, setFeedback] = useState<"up" | "down" | null>(null);

  return (
    <div className="flex items-center gap-0.5">
      <button
        type="button"
        onClick={() => setFeedback(feedback === "up" ? null : "up")}
        className={cn(
          "inline-flex h-7 w-7 items-center justify-center rounded-lg text-xs transition-colors hover:bg-[#1E1810] hover:text-stone-100",
          feedback === "up" && "text-emerald-400 bg-emerald-500/10",
        )}
        aria-label="Helpful response"
      >
        <ThumbsUp
          className={cn("h-3 w-3", feedback === "up" && "fill-current")}
        />
      </button>
      <button
        type="button"
        onClick={() => setFeedback(feedback === "down" ? null : "down")}
        className={cn(
          "inline-flex h-7 w-7 items-center justify-center rounded-lg text-xs transition-colors hover:bg-[#1E1810] hover:text-stone-100",
          feedback === "down" && "text-destructive bg-destructive/10",
        )}
        aria-label="Not helpful response"
      >
        <ThumbsDown
          className={cn("h-3 w-3", feedback === "down" && "fill-current")}
        />
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
      className="inline-flex h-7 items-center gap-1 rounded-lg px-2 text-xs font-medium text-stone-400 transition-colors hover:bg-[#1E1810] hover:text-stone-100"
      aria-label="Copy message"
      title="Copy"
    >
      {copied ? (
        <>
          <Check className="h-3 w-3 text-emerald-400" />
          <span className="text-emerald-400 font-medium">Copied</span>
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

const KHMER_LETTER_SOUNDS: Record<string, string> = {
  A: "អេ", B: "ប៊ី", C: "ស៊ី", D: "ឌី", E: "អ៊ី",
  F: "អែហ្វ", G: "ជី", H: "អេច", I: "អាយ", J: "ជេ",
  K: "ខេ", L: "អែល", M: "អឹម", N: "អិន", O: "អូ",
  P: "ភី", Q: "គ្យូ", R: "អ័រ", S: "អេស", T: "ធី",
  U: "យូ", V: "វី", W: "ដាប់ប៊លយូ", X: "អិច", Y: "វ៉ាយ",
  Z: "ហ្ស៊ិត",
};

const CUSTOM_SPEECH_ACRONYMS: [RegExp, string][] = [
  [/\bSastra\s+AI\b/gi, "សាស្ត្រា អេអាយ"],
  [/\bPNC\b/g, "ភី អិន ស៊ី"],
  [/\bSKAI\b/g, "អេស ខេ អេ អាយ"],
  [/\bABA\b/g, "អេ ប៊ី អេ"],
  [/\bAI\b/gi, "អេអាយ"],
  [/\bKHQR\b/gi, "ខេអេក្យូអ័រ"],
  [/\bUSD\b/gi, "ដុល្លារ"],
  [/\bKHR\b/gi, "រៀល"],
  [/\bUNESCO\b/gi, "យូណេស្កូ"],
  [/\bNBC\b/gi, "ធនាគារជាតិ"],
  [/\bCADT\b/gi, "ស៊ី អេ ឌី ធី"],
  [/\bRUPP\b/gi, "អ័រ យូ ភី ភី"],
  [/\bITC\b/gi, "អាយ ធី ស៊ី"],
  [/\bEDC\b/gi, "អ៊ី ឌី ស៊ី"],
  [/\bMoEYS\b/gi, "ក្រសួងអប់រំ"],
  [/\bPDF\b/gi, "ភី ឌី អែហ្វ"],
  [/\bHTML\b/gi, "អេច ធី អឹម អែល"],
  [/\bCSS\b/gi, "ស៊ី អេស អេស"],
  [/\bJS\b/gi, "ជេ អេស"],
  [/\bAPI\b/gi, "អេ ភី អាយ"],
  [/\bSDK\b/gi, "អេស ឌី ខេ"],
  [/\bUI\b/gi, "យូ អាយ"],
  [/\bUX\b/gi, "យូ អិច"],
  [/\bIT\b/gi, "អាយ ធី"],
];

function normalizeSpeechKhmer(text: string): string {
  let t = text;
  // 1. Honorific pronouns & titles
  t = t.replace(/\bMr\.?\s+/gi, "លោក ");
  t = t.replace(/\bMrs\.?\s+/gi, "លោកស្រី ");
  t = t.replace(/\bMs\.?\s+/gi, "កញ្ញា ");
  t = t.replace(/\bMiss\s+/gi, "កញ្ញា ");
  t = t.replace(/\bDr\.?\s+/gi, "លោកបណ្ឌិត ");
  t = t.replace(/\bProf\.?\s+/gi, "សាស្ត្រាចារ្យ ");

  t = t.replace(/\bMr\.?\b/gi, "លោក");
  t = t.replace(/\bMrs\.?\b/gi, "លោកស្រី");
  t = t.replace(/\bMs\.?\b/gi, "កញ្ញា");
  t = t.replace(/\bMiss\b/gi, "កញ្ញា");
  t = t.replace(/\bDr\.?\b/gi, "លោកបណ្ឌិត");
  t = t.replace(/\bProf\.?\b/gi, "សាស្ត្រាចារ្យ");

  // 2. Custom organizational & tech initialisms
  for (const [pattern, replacement] of CUSTOM_SPEECH_ACRONYMS) {
    t = t.replace(pattern, replacement);
  }

  // 3. Spell uppercase acronyms (2 to 7 letters) letter-by-letter in Khmer
  t = t.replace(/\b[A-Z]{2,7}\b/g, (match) => {
    return match
      .split("")
      .map((char) => KHMER_LETTER_SOUNDS[char] || char)
      .join(" ");
  });

  return t;
}

function stripMarkdown(text: string): string {
  let cleaned = text
    // remove code blocks
    .replace(/```[\s\S]*?```/g, " ")
    // remove inline code
    .replace(/`([^`]+)`/g, "$1")
    // remove image markdown
    .replace(/!\[(.*?)\]\(.*?\)/g, "$1")
    // remove link markdown
    .replace(/\[(.*?)\]\(.*?\)/g, "$1")
    // remove headings
    .replace(/#{1,6}\s+/g, "")
    // remove blockquotes
    .replace(/^\s*>\s+/gm, "")
    // remove bold/italic
    .replace(/(\*\*|__)(.*?)\1/g, "$2")
    .replace(/(\*|_)(.*?)\1/g, "$2")
    // remove list bullets
    .replace(/^\s*[-*+]\s+/gm, "")
    .replace(/^\s*\d+\.\s+/gm, "")
    // clean excess whitespace
    .replace(/\s+/g, " ")
    .trim();

  // Apply phonetic reading for Khmer voice or mixed Khmer text
  if (/[\u1780-\u17FF]/.test(cleaned) || /\b(Mr|Ms|Mrs|Dr|Prof|PNC|SKAI|ABA|EDC|RUPP|ITC)\b/i.test(cleaned)) {
    cleaned = normalizeSpeechKhmer(cleaned);
  }

  return cleaned;
}

interface GlobalAudioState {
  currentId: string | null;
  loadingId: string | null;
}

let globalAudio: HTMLAudioElement | null = null;
let currentBlobUrl: string | null = null;
let audioListeners: Array<(state: GlobalAudioState) => void> = [];
let audioState: GlobalAudioState = { currentId: null, loadingId: null };

function notifyAudioState() {
  audioListeners.forEach((fn) => fn({ ...audioState }));
}

function stopGlobalSpeech() {
  if (globalAudio) {
    globalAudio.pause();
    globalAudio.currentTime = 0;
    globalAudio = null;
  }
  if (currentBlobUrl) {
    URL.revokeObjectURL(currentBlobUrl);
    currentBlobUrl = null;
  }
  if (typeof window !== "undefined" && "speechSynthesis" in window) {
    window.speechSynthesis.cancel();
  }
  audioState = { currentId: null, loadingId: null };
  notifyAudioState();
}

async function playGlobalSpeech(id: string, text: string) {
  // If clicking the one currently playing or loading, stop it
  if (audioState.currentId === id || audioState.loadingId === id) {
    stopGlobalSpeech();
    return;
  }

  // Immediately stop any other message that was playing
  stopGlobalSpeech();

  const cleanText = stripMarkdown(text);
  if (!cleanText) return;

  audioState = { currentId: null, loadingId: id };
  notifyAudioState();

  const hasKhmer = /[\u1780-\u17FF]/.test(cleanText);
  const lang = hasKhmer ? "km" : "en";
  const userVoice = localStorage.getItem("sastra_voice") || (hasKhmer ? "km-KH-PisethNeural" : "en-US-AvaNeural");

  try {
    const res = await fetch(`${API_BASE}/api/tts`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: cleanText, lang, voice: userVoice }),
    });

    if (res.ok) {
      const blob = await res.blob();
      const blobUrl = URL.createObjectURL(blob);
      currentBlobUrl = blobUrl;

      const audio = new Audio(blobUrl);
      globalAudio = audio;

      audio.onplay = () => {
        audioState = { currentId: id, loadingId: null };
        notifyAudioState();
      };

      audio.onended = () => {
        stopGlobalSpeech();
      };

      audio.onerror = () => {
        stopGlobalSpeech();
      };

      await audio.play();
      return;
    }
  } catch {
    // fallback
  }

  // Fallback to browser SpeechSynthesis
  if (typeof window !== "undefined" && "speechSynthesis" in window) {
    window.speechSynthesis.cancel();
    window.speechSynthesis.resume();

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = hasKhmer ? "km-KH" : "en-US";
    utterance.rate = 0.95;

    utterance.onstart = () => {
      audioState = { currentId: id, loadingId: null };
      notifyAudioState();
    };

    utterance.onend = () => {
      stopGlobalSpeech();
    };

    utterance.onerror = () => {
      stopGlobalSpeech();
    };

    window.speechSynthesis.speak(utterance);
  } else {
    stopGlobalSpeech();
  }
}

function SpeakButton({ messageId, text }: { messageId: string; text: string }) {
  const [state, setState] = useState<GlobalAudioState>(audioState);

  useEffect(() => {
    const listener = (newState: GlobalAudioState) => setState(newState);
    audioListeners.push(listener);
    return () => {
      audioListeners = audioListeners.filter((l) => l !== listener);
    };
  }, []);

  const isPlaying = state.currentId === messageId;
  const isLoading = state.loadingId === messageId;

  return (
    <button
      type="button"
      onClick={() => playGlobalSpeech(messageId, text)}
      className={cn(
        "inline-flex h-7 items-center gap-1.5 rounded-lg px-2 text-xs font-medium transition-all",
        isPlaying
          ? "bg-gold/25 text-gold border border-gold/50 shadow-xs"
          : isLoading
            ? "bg-gold/10 text-gold border border-gold/30"
            : "text-stone-400 hover:bg-[#1E1810] hover:text-stone-100",
      )}
      aria-label={isPlaying ? "Stop reading" : "Read aloud"}
      title={
        isPlaying
          ? "Stop reading (បញ្ឈប់ការអាន)"
          : "Read aloud with AI Voice (អានជាសំឡេង)"
      }
    >
      {isLoading ? (
        <>
          <Loader2 className="h-3 w-3 animate-spin text-gold" />
          <span className="text-gold">Audio...</span>
        </>
      ) : isPlaying ? (
        <>
          <Square className="h-3 w-3 fill-gold text-gold" />
          <span className="text-gold font-bold">Stop</span>
          <span className="flex items-center gap-0.5 ml-0.5">
            <span
              className="h-1.5 w-0.5 bg-gold animate-bounce"
              style={{ animationDelay: "0ms" }}
            />
            <span
              className="h-2.5 w-0.5 bg-gold animate-bounce"
              style={{ animationDelay: "150ms" }}
            />
            <span
              className="h-1.5 w-0.5 bg-gold animate-bounce"
              style={{ animationDelay: "300ms" }}
            />
          </span>
        </>
      ) : (
        <>
          <Volume2 className="h-3 w-3 text-gold" />
          <span>Read aloud</span>
        </>
      )}
    </button>
  );
}
