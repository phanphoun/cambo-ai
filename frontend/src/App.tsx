import { useCallback, useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Toaster, toast } from "react-hot-toast";
import {
  addMessage,
  setSessionId,
  setStreaming,
  appendToLastAssistant,
  resetChat,
  clearAttachments,
  type ChatState,
} from "./features/chat/chatSlice";
import { setMode } from "./features/modes/modesSlice";
import { saveConversation } from "./features/conversations/conversationsSlice";
import {
  useClearSessionMutation,
  useCheckHealthQuery,
} from "./features/chat/chatApi";

const API_BASE = import.meta.env.VITE_API_BASE ?? "http://localhost:8000";
import Sidebar from "./components/Sidebar";
import ChatContainer from "./components/ChatContainer";
import ChatInput from "./components/ChatInput";
import WelcomeScreen from "./components/WelcomeScreen";
import DirectoryPanel from "./features/directory/DirectoryPanel";
import DocumentsPanel from "./features/documents/DocumentsPanel";
import type { RootState } from "./store";

export default function App() {
  const dispatch = useDispatch();
  const { sessionId, messages, isStreaming } = useSelector(
    (state: { chat: ChatState }) => state.chat,
  );
  const attachments = useSelector((s: RootState) => s.chat.attachments);
  const useTools = useSelector((s: RootState) => s.chat.useTools);
  const selectedDocs = useSelector((s: RootState) => s.documents.selected);
  const currentMode = useSelector((s: RootState) => s.modes.current);
  const currentProvider = useSelector((s: RootState) => s.provider.current);
  const currentTheme = useSelector((s: RootState) => s.theme.current);
  const [clearSession] = useClearSessionMutation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [docsOpen, setDocsOpen] = useState(false);
  const [showScrollBtn, setShowScrollBtn] = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(false);

  const abortRef = useRef<AbortController | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Sync theme class on <html>
  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove("dark", "light");
    root.classList.add(currentTheme);
  }, [currentTheme]);

  useCheckHealthQuery(undefined, {
    pollingInterval: 30_000,
    refetchOnMountOrArgChange: true,
  });

  // Auto-scroll when new messages arrive
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    if (distanceFromBottom < 300) {
      el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
    }
  }, [messages]);

  // Track scroll position for "scroll to bottom" button
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const handleScroll = () => {
      const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
      setShowScrollBtn(distanceFromBottom > 300);
    };
    el.addEventListener("scroll", handleScroll, { passive: true });
    return () => el.removeEventListener("scroll", handleScroll);
  }, []);

  // Keyboard shortcuts — stable event listener using refs
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "b") {
        e.preventDefault();
        setSidebarCollapsed((c) => !c);
      }
      if ((e.metaKey || e.ctrlKey) && e.key === "n") {
        e.preventDefault();
        handleNewChatRef.current();
      }
      if (e.key === "?" || ((e.metaKey || e.ctrlKey) && e.key === "/")) {
        e.preventDefault();
        setShowShortcuts((s) => !s);
      }
      if (e.key === "Escape") {
        setShowShortcuts(false);
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, []);

  const handleSend = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      const imageData = attachments.map((a) => a.dataUrl);
      if ((!trimmed && imageData.length === 0) || isStreaming) return;

      dispatch(
        addMessage({
          role: "user",
          content: trimmed || "(attached image)",
          timestamp: new Date().toISOString(),
          images: imageData.length ? imageData : undefined,
        }),
      );
      dispatch(
        addMessage({
          role: "assistant",
          content: "",
          timestamp: new Date().toISOString(),
        }),
      );
      dispatch(setStreaming(true));

      const controller = new AbortController();
      abortRef.current = controller;

      try {
        const body = {
          message: trimmed,
          session_id: sessionId,
          mode: currentMode,
          provider: currentProvider,
          image_data: imageData.length ? imageData : undefined,
          use_tools: useTools,
          document_ids: selectedDocs.length ? selectedDocs : undefined,
        };

        const res = await fetch(`${API_BASE}/api/chat/stream`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
          signal: controller.signal,
        });

        if (!res.ok) {
          const text = await res.text().catch(() => "");
          throw new Error(text || `HTTP ${res.status}`);
        }

        const reader = res.body?.getReader();
        if (!reader) throw new Error("Streaming unavailable");

        const decoder = new TextDecoder();
        let session = sessionId;
        let hasError = false;

        while (true) {
          const { value, done } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          for (const line of chunk.split("\n")) {
            const trimmedLine = line.trim();
            if (!trimmedLine || !trimmedLine.startsWith("data:")) continue;
            const payload = trimmedLine.slice(5).trim();
            if (payload === "[DONE]") continue;
            if (payload.startsWith("Error:")) {
              dispatch(appendToLastAssistant(payload.replace(/^Error:\s*/, "")));
              hasError = true;
              continue;
            }
            dispatch(appendToLastAssistant(payload));
          }
        }

        if (!hasError && session) {
          dispatch(setSessionId(session));
        }
      } catch (err) {
        if ((err as { name?: string })?.name === "AbortError") return;
        const message = err instanceof Error ? err.message : "Unknown error";
        const isQuota = /quota|429|rate.?limit/i.test(message);
        const friendly = isQuota
          ? "⚠️ API quota exhausted. Try again later."
          : `❌ ${message}`;
        dispatch(appendToLastAssistant(`\n\n${friendly}`));
        toast.error(isQuota ? "API quota exhausted" : "Message failed to send", {
          duration: 5000,
        });
      } finally {
        dispatch(setStreaming(false));
        dispatch(clearAttachments());
        abortRef.current = null;
      }
    },
    [
      dispatch,
      isStreaming,
      sessionId,
      currentMode,
      currentProvider,
      attachments,
      useTools,
      selectedDocs,
    ],
  );

  const handleStop = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    dispatch(setStreaming(false));
    dispatch(appendToLastAssistant("\n\n_⏹ Generation stopped._"));
    toast("Stopped", { icon: "⏹", duration: 2000 });
  }, [dispatch]);

  const handleNewChat = useCallback(async () => {
    if (messages.length > 0) {
      dispatch(saveConversation({ messages, sessionId }));
    }
    if (sessionId) {
      try {
        await clearSession(sessionId).unwrap();
      } catch (err) {
        console.warn("Failed to clear session:", err);
      }
    }
    dispatch(resetChat());
    dispatch(setMode("chat"));
    toast.success("New chat started", { duration: 2000 });
  }, [dispatch, sessionId, clearSession, messages]);

  const handleNewChatRef = useRef(handleNewChat);
  handleNewChatRef.current = handleNewChat;

  const handleSendRef = useRef(handleSend);
  handleSendRef.current = handleSend;

  useEffect(() => {
    function handleAsk(e: CustomEvent) {
      const { prompt } = e.detail;
      handleSendRef.current(prompt);
    }
    window.addEventListener("cambo-ask", handleAsk as EventListener);
    return () => window.removeEventListener("cambo-ask", handleAsk as EventListener);
  }, []);

  const scrollToBottom = () => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-background text-foreground">
      {/* Keyboard shortcuts modal */}
      {showShortcuts && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          onClick={() => setShowShortcuts(false)}
        >
          <div
            className="animate-scale-in w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-lg font-bold text-foreground">Keyboard Shortcuts</h2>
            <p className="mt-1 text-xs text-muted-foreground">
              Use these shortcuts to navigate faster
            </p>
            <div className="mt-4 space-y-2.5">
              {[
                { keys: "Ctrl + B", label: "Toggle sidebar" },
                { keys: "Ctrl + N", label: "New chat" },
                { keys: "Enter", label: "Send message" },
                { keys: "Shift + Enter", label: "New line" },
                { keys: "Esc", label: "Stop generating / Close" },
                { keys: "Ctrl + /", label: "Show this menu" },
                { keys: "↑ / ↓", label: "Navigate history" },
              ].map((shortcut) => (
                <div
                  key={shortcut.keys}
                  className="flex items-center justify-between rounded-lg bg-secondary/50 px-3 py-2"
                >
                  <span className="text-sm text-foreground">{shortcut.label}</span>
                  <kbd className="rounded-md border border-border bg-background px-2 py-0.5 font-mono text-[11px] text-muted-foreground shadow-sm">
                    {shortcut.keys}
                  </kbd>
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={() => setShowShortcuts(false)}
              className="mt-4 w-full rounded-lg bg-primary py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
            >
              Got it
            </button>
          </div>
        </div>
      )}

      <Toaster
        position="bottom-right"
        gutter={12}
        containerStyle={{ bottom: 24, right: 24 }}
        toastOptions={{
          duration: 3000,
          style: {
            background: "hsl(var(--card))",
            color: "hsl(var(--card-foreground))",
            border: "1px solid hsl(var(--border))",
            borderRadius: "12px",
            fontSize: "13px",
            padding: "12px 16px",
            boxShadow: currentTheme === "dark"
              ? "0 4px 24px rgba(0,0,0,0.4)"
              : "0 4px 24px rgba(0,0,0,0.1)",
          },
          success: {
            iconTheme: { primary: "#22c55e", secondary: "#fff" },
          },
          error: {
            iconTheme: { primary: "#ef4444", secondary: "#fff" },
          },
        }}
      />
      <Sidebar
        open={sidebarOpen}
        collapsed={sidebarCollapsed}
        onClose={() => setSidebarOpen(false)}
        onToggleCollapse={() => setSidebarCollapsed((c) => !c)}
        onNewChat={handleNewChat}
      />
      <main className="flex flex-1 flex-col min-w-0 relative">
        <div
          ref={scrollRef}
          className="flex-1 overflow-y-auto scrollbar-thin px-4 sm:px-6 py-6"
        >
          {messages.length === 0 ? (
            <WelcomeScreen onPick={(q) => handleSend(q)} />
          ) : (
            <ChatContainer messages={messages} isStreaming={isStreaming} provider={currentProvider} />
          )}
        </div>

        {/* Scroll to bottom button */}
        {showScrollBtn && messages.length > 0 && (
          <button
            type="button"
            onClick={scrollToBottom}
            className="absolute bottom-32 left-1/2 z-10 -translate-x-1/2 animate-fade-in rounded-full border border-border bg-card px-4 py-2 text-xs font-medium text-muted-foreground shadow-lg backdrop-blur transition-all hover:border-primary/50 hover:text-foreground hover:shadow-primary/10"
            title="Scroll to bottom"
          >
            ↓ Scroll to bottom
          </button>
        )}

        <ChatInput
          onSend={handleSend}
          onStop={handleStop}
          disabled={isStreaming}
          isStreaming={isStreaming}
          onOpenDocuments={() => setDocsOpen(true)}
        />
      </main>
      <DirectoryPanel />
      <DocumentsPanel open={docsOpen} onClose={() => setDocsOpen(false)} />
    </div>
  );
}
