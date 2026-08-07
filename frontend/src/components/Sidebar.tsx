import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  PanelLeftClose,
  Plus,
  MapPin,
  MessageSquare,
  Sparkles,
  Pin,
  BookOpen,
  Trash2,
  ChevronDown,
  ChevronRight,
  Clock,
} from "lucide-react";
import { Button } from "./ui/button";
import { cn } from "../lib/utils";
import { removePin } from "../features/pin/pinSlice";
import { setDirectoryOpen } from "../features/directory/directorySlice";
import { deleteConversation, saveConversation } from "../features/conversations/conversationsSlice";
import { addMessage, setSessionId, resetChat } from "../features/chat/chatSlice";
import ProviderSelector from "../features/provider/ProviderSelector";
import type { RootState } from "../store";

interface SidebarProps {
  open: boolean;
  collapsed: boolean;
  onClose: () => void;
  onToggleCollapse: () => void;
  onNewChat: () => void;
}

export default function Sidebar({
  open,
  collapsed,
  onClose,
  onToggleCollapse,
  onNewChat,
}: SidebarProps) {
  const dispatch = useDispatch();
  const pinned = useSelector((s: RootState) => s.pin.pinned);
  const conversations = useSelector((s: RootState) => s.conversations.list);
  const currentMessages = useSelector((s: RootState) => s.chat.messages);
  const currentSessionId = useSelector((s: RootState) => s.chat.sessionId);
  const [pinnedOpen, setPinnedOpen] = useState(true);
  const [historyOpen, setHistoryOpen] = useState(true);

  function handleLoadConversation(conv: typeof conversations[0]) {
    // Save current conversation first
    if (currentMessages.length > 0) {
      dispatch(saveConversation({ messages: currentMessages, sessionId: currentSessionId }));
    }
    // Load the selected conversation
    dispatch(resetChat());
    dispatch(setSessionId(conv.sessionId || conv.id));
    conv.messages.forEach((msg) => {
      dispatch(addMessage(msg));
    });
    onClose();
  }

  function handleDeleteConversation(e: React.MouseEvent, id: string) {
    e.stopPropagation();
    dispatch(deleteConversation(id));
  }

  function formatDate(iso: string) {
    const d = new Date(iso);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    } else if (diffDays === 1) {
      return "Yesterday";
    } else if (diffDays < 7) {
      return `${diffDays}d ago`;
    }
    return d.toLocaleDateString([], { month: "short", day: "numeric" });
  }

  return (
    <>
      {/* Mobile overlay */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm animate-fade-in md:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <aside
        className={cn(
          "fixed md:relative inset-y-0 left-0 z-50 shrink-0",
          "bg-card border-r border-border flex flex-col gap-4",
          "transition-all duration-300 ease-out",
          collapsed
            ? "w-0 md:w-16 md:p-2 overflow-hidden"
            : "w-72 p-4",
          "md:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full md:translate-x-0",
        )}
        aria-label="Sidebar"
      >
        {/* Header */}
        <div
          className={cn(
            "flex items-center gap-2 shrink-0",
            collapsed && "md:justify-center",
          )}
        >
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 text-xl font-bold">
                <span className="text-2xl leading-none" aria-hidden>
                  🇰🇭
                </span>
                <span className="truncate">CAMBO AI</span>
              </div>
              <p className="mt-0.5 text-[11px] text-muted-foreground leading-snug">
                Cambodia&apos;s First AI Technology Assistant
              </p>
            </div>
          )}

          {collapsed && (
            <span className="text-2xl" aria-hidden>
              🇰🇭
            </span>
          )}

          <Button
            variant="ghost"
            size="icon"
            onClick={onToggleCollapse}
            className="hidden md:inline-flex h-8 w-8 shrink-0"
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            title={collapsed ? "Expand (Ctrl+B)" : "Collapse (Ctrl+B)"}
          >
            <PanelLeftClose
              className={cn(
                "h-4 w-4 transition-transform",
                collapsed && "rotate-180",
              )}
            />
          </Button>
        </div>

        {/* Action buttons */}
        {!collapsed && (
          <div className="space-y-2 shrink-0">
            <Button
              onClick={onNewChat}
              variant="outline"
              className="w-full justify-start gap-2 hover:border-primary/50 hover:bg-secondary"
            >
              <Plus className="h-4 w-4" />
              New Chat
              <kbd className="ml-auto rounded border border-border bg-background px-1 py-0.5 font-mono text-[10px] text-muted-foreground">
                Ctrl+N
              </kbd>
            </Button>

            <Button
              onClick={() => dispatch(setDirectoryOpen(true))}
              variant="outline"
              className="w-full justify-start gap-2 hover:border-primary/50"
            >
              <BookOpen className="h-4 w-4" />
              Tech Directory
            </Button>
          </div>
        )}

        {collapsed && (
          <div className="hidden md:flex flex-col items-center gap-2 shrink-0">
            <Button
              onClick={onNewChat}
              variant="outline"
              size="icon"
              className="h-10 w-10"
              aria-label="New chat"
              title="New chat"
            >
              <Plus className="h-4 w-4" />
            </Button>
            <Button
              onClick={() => dispatch(setDirectoryOpen(true))}
              variant="outline"
              size="icon"
              className="h-10 w-10"
              aria-label="Tech directory"
              title="Tech Directory"
            >
              <BookOpen className="h-4 w-4" />
            </Button>
          </div>
        )}

        {/* Scrollable content */}
        {!collapsed && (
          <div className="flex-1 min-h-0 flex flex-col gap-3 overflow-y-auto scrollbar-thin">
            {/* Pinned messages */}
            {pinned.length > 0 && (
              <div>
                <button
                  type="button"
                  onClick={() => setPinnedOpen(!pinnedOpen)}
                  className="flex w-full items-center gap-1.5 px-1 py-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70 transition-colors hover:text-foreground"
                >
                  {pinnedOpen ? (
                    <ChevronDown className="h-3 w-3" />
                  ) : (
                    <ChevronRight className="h-3 w-3" />
                  )}
                  <Pin className="h-3 w-3" />
                  Pinned ({pinned.length})
                </button>
                {pinnedOpen && (
                  <div className="mt-1 space-y-1">
                    {pinned.map((msg) => (
                      <div
                        key={msg.timestamp}
                        className="group relative rounded-lg border border-border/50 bg-background/50 px-2.5 py-2 transition-colors hover:bg-secondary/50"
                      >
                        <p className="line-clamp-2 text-[11px] leading-relaxed text-muted-foreground">
                          {msg.content || "(empty)"}
                        </p>
                        <span className="mt-1 block text-[9px] text-muted-foreground/50">
                          {new Date(msg.timestamp).toLocaleDateString()}
                        </span>
                        <button
                          type="button"
                          onClick={() => dispatch(removePin(msg.timestamp))}
                          className="absolute right-1.5 top-1.5 rounded p-0.5 text-muted-foreground/40 opacity-0 transition-all hover:text-destructive group-hover:opacity-100"
                          title="Remove pin"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Provider selector */}
            <ProviderSelector />

            {/* Conversation history */}
            <div>
              <button
                type="button"
                onClick={() => setHistoryOpen(!historyOpen)}
                className="flex w-full items-center gap-1.5 px-1 py-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70 transition-colors hover:text-foreground"
              >
                {historyOpen ? (
                  <ChevronDown className="h-3 w-3" />
                ) : (
                  <ChevronRight className="h-3 w-3" />
                )}
                <MessageSquare className="h-3 w-3" />
                Recent ({conversations.length})
              </button>

              {historyOpen && (
                <div className="mt-1 space-y-1 max-h-[320px] overflow-y-auto scrollbar-thin">
                  {conversations.length === 0 ? (
                    <div className="rounded-lg border border-dashed border-border/60 px-3 py-5 text-center transition-colors hover:border-border">
                      <MessageSquare className="mx-auto h-5 w-5 text-muted-foreground/40" />
                      <p className="mt-2 text-xs text-muted-foreground">
                        No conversations yet
                      </p>
                      <p className="mt-1 text-[10px] text-muted-foreground/60">
                        Start a chat and it will auto-save here
                      </p>
                    </div>
                  ) : (
                    conversations.map((conv) => (
                      <div
                        key={conv.id}
                        role="button"
                        tabIndex={0}
                        onClick={() => handleLoadConversation(conv)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            handleLoadConversation(conv);
                          }
                        }}
                        className={cn(
                          "group flex w-full cursor-pointer items-start gap-2 rounded-lg border border-border/40 px-2.5 py-2 text-left transition-all",
                          "hover:border-primary/30 hover:bg-secondary/50 focus:outline-none focus:ring-1 focus:ring-primary/30",
                          currentSessionId === conv.sessionId && "border-primary/30 bg-primary/5",
                        )}
                      >
                        <Clock className="mt-0.5 h-3 w-3 shrink-0 text-muted-foreground/60" />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-[12px] font-medium text-foreground">
                            {conv.title}
                          </p>
                          <div className="mt-0.5 flex items-center gap-2 text-[10px] text-muted-foreground/60">
                            <span>{formatDate(conv.updatedAt)}</span>
                            <span>·</span>
                            <span>{conv.messageCount} msgs</span>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={(e: React.MouseEvent) => handleDeleteConversation(e, conv.id)}
                          className="mt-0.5 shrink-0 rounded p-0.5 text-muted-foreground/30 opacity-0 transition-all hover:text-destructive group-hover:opacity-100"
                          title="Delete conversation"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {collapsed && <div className="flex-1" />}

        {/* Footer */}
        {!collapsed && (
          <div className="pt-3 mt-auto border-t border-border space-y-2 text-xs text-muted-foreground shrink-0">
            <div>
              <p className="uppercase tracking-wider text-[10px] text-muted-foreground/70">
                Powered by
              </p>
              <p className="mt-0.5 flex items-center gap-1.5 text-sm text-foreground">
                <Sparkles className="h-3.5 w-3.5 text-primary" /> Google Gemini
              </p>
            </div>
            <div className="text-[11px]">
              <p>Made in Cambodia 🇰🇭</p>
              <p className="mt-0.5 flex items-center gap-1">
                <MapPin className="h-3 w-3 inline" /> Phnom Penh · Cambodia
              </p>
            </div>
          </div>
        )}

        {collapsed && (
          <div className="hidden md:flex justify-center pt-3 mt-auto border-t border-border shrink-0">
            <Sparkles className="h-4 w-4 text-primary" aria-label="Powered by Gemini" />
          </div>
        )}
      </aside>
    </>
  );
}
