import { useCallback, useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Toaster, toast } from "react-hot-toast";
import {
  addMessage,
  setSessionId,
  setStreaming,
  appendToLastAssistant,
  setAssistantMeta,
  persistChat,
  resetChat,
  clearAttachments,
  switchUserChat,
  type ChatState,
} from "./features/chat/chatSlice";
import { setMode } from "./features/modes/modesSlice";
import { saveConversation, switchUserConversations } from "./features/conversations/conversationsSlice";
import { switchUserPins } from "./features/pin/pinSlice";
import {
  useClearSessionMutation,
  useCheckHealthQuery,
} from "./features/chat/chatApi";

const API_BASE = import.meta.env.VITE_API_BASE ?? "http://localhost:8000";
import Sidebar from "./components/Sidebar";
import Topbar from "./components/Topbar";
import ChatContainer from "./components/ChatContainer";
import ChatInput from "./components/ChatInput";
import WelcomeScreen from "./components/WelcomeScreen";
import DirectoryPanel from "./features/directory/DirectoryPanel";
import DocumentsPanel from "./features/documents/DocumentsPanel";
import PinnedMessagesDrawer from "./features/pin/PinnedMessagesDrawer";
import SettingsModal from "./components/SettingsModal";
import AuthModal from "./features/auth/AuthModal";
import LoginPage from "./features/auth/LoginPage";
import { setAuthModalOpen, setAuthMode } from "./features/auth/authSlice";
import KhmerSanctuaryBackdrop from "./components/KhmerSanctuaryBackdrop";
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
  const currentModel = useSelector((s: RootState) => s.provider.currentModel);
  const currentUser = useSelector((s: RootState) => s.auth.user);
  const isAuthenticated = useSelector((s: RootState) => s.auth.isAuthenticated);
  const [clearSession] = useClearSessionMutation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [docsOpen, setDocsOpen] = useState(false);
  const [pinsOpen, setPinsOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [settingsTab, setSettingsTab] = useState<"profile" | "provider" | "privacy">("profile");
  const [showScrollBtn, setShowScrollBtn] = useState(false);

  const handleOpenSettings = (tab: "profile" | "provider" | "privacy" = "provider") => {
    setSettingsTab(tab);
    setSettingsOpen(true);
  };

  const abortRef = useRef<AbortController | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Check URL query parameters for direct login/signup modal triggers (e.g. from public website)
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const auth = params.get("auth");
      if (auth === "login" || auth === "signin") {
        dispatch(setAuthMode("signin"));
        dispatch(setAuthModalOpen(true));
        window.history.replaceState({}, document.title, window.location.pathname);
      } else if (auth === "signup" || auth === "register") {
        dispatch(setAuthMode("signup"));
        dispatch(setAuthModalOpen(true));
        window.history.replaceState({}, document.title, window.location.pathname);
      }
    } catch {}
  }, [dispatch]);

  // Isolate and synchronize chat history, saved conversations, and pins per user
  useEffect(() => {
    const userEmail = currentUser?.email || "guest";
    dispatch(switchUserChat(userEmail));
    dispatch(switchUserConversations(userEmail));
    dispatch(switchUserPins(userEmail));
  }, [currentUser?.email, dispatch]);

  // Ensure dark obsidian sanctuary theme is always active
  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove("light");
    root.classList.add("dark");
  }, []);

  useCheckHealthQuery(undefined, {
    pollingInterval: 30_000,
    refetchOnMountOrArgChange: true,
  });

  // Auto-scroll when new messages arrive without layout thrashing
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const raf = requestAnimationFrame(() => {
      const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
      if (distanceFromBottom < 350) {
        el.scrollTop = el.scrollHeight;
      }
    });
    return () => cancelAnimationFrame(raf);
  }, [messages]);

  // Track scroll position for "scroll to bottom" button
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    let ticking = false;
    const handleScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
          setShowScrollBtn(distanceFromBottom > 300);
          ticking = false;
        });
        ticking = true;
      }
    };
    el.addEventListener("scroll", handleScroll, { passive: true });
    return () => el.removeEventListener("scroll", handleScroll);
  }, []);

  const handleSend = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      const currentAttachments = attachments.map((a) => a.dataUrl);

      if (!trimmed && currentAttachments.length === 0) return;

      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      const now = Date.now();
      dispatch(
        addMessage({
          role: "user",
          content: trimmed,
          timestamp: new Date(now).toISOString(),
          images: currentAttachments.length > 0 ? currentAttachments : undefined,
        }),
      );

      dispatch(clearAttachments());

      dispatch(
        addMessage({
          role: "assistant",
          content: "",
          timestamp: new Date(now + 1).toISOString(),
        }),
      );

      dispatch(setStreaming(true));

      try {
        const token = localStorage.getItem("sastra_auth_token");
        const headers: Record<string, string> = { "Content-Type": "application/json" };
        if (token) {
          headers["Authorization"] = `Bearer ${token}`;
        }

        const res = await fetch(`${API_BASE}/api/chat/stream`, {
          method: "POST",
          headers,
          signal: controller.signal,
          body: JSON.stringify({
            message: trimmed,
            session_id: sessionId ?? undefined,
            user_email: currentUser?.email || undefined,
            images: currentAttachments,
            image_data: currentAttachments,
            provider: currentProvider,
            model: currentModel || undefined,
            use_tools: useTools,
            selected_document_ids: selectedDocs,
            document_ids: selectedDocs,
            mode: currentMode,
          }),
        });

        if (!res.ok) {
          const errBody = await res.json().catch(() => ({}));
          let errMsg = `HTTP ${res.status}`;
          if (errBody && errBody.detail) {
            if (typeof errBody.detail === "string") {
              errMsg = errBody.detail;
            } else if (Array.isArray(errBody.detail)) {
              errMsg = errBody.detail
                .map((d: any) => `${d.loc ? d.loc.slice(-1)[0] : "field"}: ${d.msg}`)
                .join(", ");
            } else {
              errMsg = JSON.stringify(errBody.detail);
            }
          }
          dispatch(appendToLastAssistant(`\n\n❌ ${errMsg}`));
          dispatch(setStreaming(false));
          return;
        }

        const reader = res.body?.getReader();
        if (!reader) {
          dispatch(appendToLastAssistant("\n\n❌ Stream unavailable"));
          dispatch(setStreaming(false));
          return;
        }

        const decoder = new TextDecoder();
        let buffer = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() ?? "";

          for (const line of lines) {
            if (!line.startsWith("data: ")) continue;
            const dataStr = line.slice(6).trim();
            if (!dataStr) continue;

            try {
              const data = JSON.parse(dataStr);
              if (data.session_id && !sessionId) {
                dispatch(setSessionId(data.session_id));
              }
              if (data.error) {
                dispatch(appendToLastAssistant(`\n\n❌ ${data.error}`));
                dispatch(setStreaming(false));
                return;
              }
              const incomingText = data.content ?? data.token ?? data.text;
              if (typeof incomingText === "string" && incomingText.length > 0) {
                dispatch(appendToLastAssistant(incomingText));
              }
              if (data.tool_calls || data.citations) {
                dispatch(
                  setAssistantMeta({
                    tool_calls: data.tool_calls,
                    citations: data.citations,
                  }),
                );
              }
              if (data.done) {
                dispatch(setStreaming(false));
              }
            } catch {
              // Ignore malformed chunks
            }
          }
        }
      } catch (err: unknown) {
        if ((err as { name?: string }).name !== "AbortError") {
          dispatch(
            appendToLastAssistant(
              "\n\n❌ Connection error. Please check backend server.",
            ),
          );
        }
      } finally {
        dispatch(setStreaming(false));
        dispatch(persistChat());
      }
    },
    [dispatch, sessionId, attachments, currentProvider, useTools, selectedDocs, currentMode],
  );

  const handleStop = useCallback(() => {
    abortRef.current?.abort();
    dispatch(setStreaming(false));
  }, [dispatch]);

  const handleNewChat = useCallback(async () => {
    abortRef.current?.abort();
    if (messages.length > 0) {
      dispatch(
        saveConversation({
          messages,
          sessionId,
          userEmail: currentUser?.email,
        }),
      );
      if (sessionId) {
        clearSession(sessionId).catch(() => {});
      }
    }
    dispatch(resetChat(currentUser?.email));
    dispatch(setMode("chat"));
    toast.success("New chat started", { duration: 2000 });
  }, [dispatch, sessionId, clearSession, messages, currentUser?.email]);

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

  // Global Keyboard Shortcut: Ctrl+B / Cmd+B to toggle & hide/show sidebar
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isB = e.key === "b" || e.key === "B" || e.code === "KeyB";
      if ((e.ctrlKey || e.metaKey) && isB) {
        e.preventDefault();
        e.stopPropagation();
        if (typeof window !== "undefined" && window.innerWidth < 768) {
          setSidebarOpen((prev) => !prev);
        } else {
          setSidebarCollapsed((prev) => !prev);
        }
      }
    };

    // Use capture phase (true) to intercept even when inputs/textareas are focused
    window.addEventListener("keydown", handleKeyDown, true);
    return () => window.removeEventListener("keydown", handleKeyDown, true);
  }, []);

  const scrollToBottom = () => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  };

  // Protected Route: If not authenticated, require login first!
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen w-full bg-[#0A0805]">
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 3000,
            style: {
              background: "#16120C",
              color: "#F3EFE6",
              border: "1px solid #45341E",
              borderRadius: "14px",
              fontSize: "13px",
              padding: "12px 16px",
              boxShadow: "0 8px 32px rgba(0,0,0,0.6)",
            },
            success: {
              iconTheme: { primary: "#D4AF37", secondary: "#16120C" },
            },
            error: {
              iconTheme: { primary: "#ef4444", secondary: "#fff" },
            },
          }}
        />
        <LoginPage />
      </div>
    );
  }

  return (
    <div className="flex h-dvh max-h-dvh w-full max-w-full overflow-hidden bg-[#0A0805] text-[#F3EFE6] relative">
      <Toaster
        position="bottom-right"
        gutter={12}
        containerStyle={{ bottom: 24, right: 24 }}
        toastOptions={{
          duration: 3000,
          style: {
            background: "#16120C",
            color: "#F3EFE6",
            border: "1px solid #45341E",
            borderRadius: "14px",
            fontSize: "13px",
            padding: "12px 16px",
            boxShadow: "0 8px 32px rgba(0,0,0,0.6)",
          },
          success: {
            iconTheme: { primary: "#D4AF37", secondary: "#16120C" },
          },
          error: {
            iconTheme: { primary: "#ef4444", secondary: "#fff" },
          },
        }}
      />

      {/* Navigation Sidebar */}
      {/* Full-Screen Unified Ancient Khmer Temple Sanctuary Backdrop */}
      <KhmerSanctuaryBackdrop />

      {/* Navigation Sidebar */}
      {/* Navigation Sidebar */}
      <Sidebar
        open={sidebarOpen}
        collapsed={sidebarCollapsed}
        onClose={() => setSidebarOpen(false)}
        onToggleCollapse={() => setSidebarCollapsed((c) => !c)}
        onNewChat={handleNewChat}
        onOpenDocs={() => setDocsOpen(true)}
        onOpenPins={() => setPinsOpen(true)}
        onOpenSettings={() => handleOpenSettings("provider")}
        onSelectPrompt={(p) => handleSend(p)}
      />

      {/* Main Chat Workspace */}
      <main className="flex flex-1 flex-col min-w-0 max-w-full h-full relative z-10 bg-transparent overflow-hidden">
        {/* Sticky Top Header Bar */}
        <Topbar
          onToggleMobileSidebar={() => setSidebarOpen((o) => !o)}
          onToggleCollapse={() => setSidebarCollapsed((c) => !c)}
          sidebarCollapsed={sidebarCollapsed}
          onOpenDocs={() => setDocsOpen(true)}
          onOpenPins={() => setPinsOpen(true)}
          onOpenSettings={(tab) => handleOpenSettings(tab || "provider")}
          onNewChat={handleNewChat}
        />

        {/* Chat Stream / Message Feed */}
        <div
          ref={scrollRef}
          className="relative z-10 flex-1 overflow-y-auto scrollbar-thin px-3 sm:px-6 py-4 sm:py-6"
        >
          {messages.length === 0 ? (
            <WelcomeScreen onPick={(q) => handleSend(q)} />
          ) : (
            <ChatContainer
              messages={messages}
              isStreaming={isStreaming}
              provider={currentProvider}
            />
          )}
        </div>

        {/* Floating Scroll to bottom button */}
        {showScrollBtn && messages.length > 0 && (
          <button
            type="button"
            onClick={scrollToBottom}
            className="absolute bottom-28 left-1/2 z-20 -translate-x-1/2 animate-fade-in rounded-full border border-gold/40 bg-[#16120C]/90 px-4 py-2 text-xs font-semibold text-gold shadow-xl backdrop-blur transition-all hover:border-gold hover:scale-105"
            title="Scroll to bottom"
          >
            ↓ Scroll to bottom
          </button>
        )}

        {/* Bottom Chat Input */}
        <div className="relative z-10">
          <ChatInput
            onSend={handleSend}
            onStop={handleStop}
            disabled={isStreaming}
            isStreaming={isStreaming}
            onOpenDocuments={() => setDocsOpen(true)}
          />
        </div>
      </main>

      {/* Modals & Drawers */}
      <DirectoryPanel />
      <DocumentsPanel open={docsOpen} onClose={() => setDocsOpen(false)} />
      <PinnedMessagesDrawer open={pinsOpen} onClose={() => setPinsOpen(false)} />
      <SettingsModal open={settingsOpen} initialTab={settingsTab} onClose={() => setSettingsOpen(false)} />
      <AuthModal />
    </div>
  );
}
