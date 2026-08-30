import { memo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  Home,
  Clock,
  Bookmark,
  FileText,
  Settings,
  PanelLeftClose,
  Plus,
  Landmark,
  Languages,
  Lightbulb,
  Code2,
  TrendingUp,
  X,
  Trash2,
} from "lucide-react";
import { KhmerAngkorCrest, KbachCorner, KbachLotus } from "./KhmerOrnaments";
import {
  deleteConversation,
  type SavedConversation,
} from "../features/conversations/conversationsSlice";
import {
  resetChat,
  setSessionId,
  addMessage,
  type ChatState,
} from "../features/chat/chatSlice";
import { cn, formatTime } from "../lib/utils";
import type { RootState } from "../store";

interface SidebarProps {
  open: boolean;
  collapsed: boolean;
  onClose: () => void;
  onToggleCollapse: () => void;
  onNewChat?: () => void;
  onOpenDocs: () => void;
  onOpenPins: () => void;
  onOpenSettings?: () => void;
  onSelectPrompt?: (prompt: string) => void;
}

export const SUGGESTED_TOPICS = [
  {
    id: "angkor",
    icon: Landmark,
    titleKm: "អំពី អង្គរវត្ត",
    titleEn: "About Angkor Wat",
    prompt: "សូមរៀបរាប់អំពីប្រវត្តិ និងស្ថាបត្យកម្មដ៏អស្ចារ្យនៃប្រាសាទអង្គរវត្ត និងចក្រភពខ្មែរបុរាណ។",
  },
  {
    id: "language",
    icon: Languages,
    titleKm: "ភាសាខ្មែរ",
    titleEn: "Khmer Language",
    prompt: "សូមបង្រៀនពាក្យគួរសម ឃ្លាសន្ទនាប្រចាំថ្ងៃ និងវេយ្យាករណ៍ភាសាខ្មែរ។",
  },
  {
    id: "history",
    icon: Lightbulb,
    titleKm: "ប្រវត្តិសាស្ត្រ",
    titleEn: "Khmer History",
    prompt: "សូមរៀបរាប់អំពីប្រវត្តិសាស្ត្រប្រទេសកម្ពុជាពីសម័យហ្វូណន ចេនឡា រហូតដល់បច្ចុប្បន្ន។",
  },
  {
    id: "tech",
    icon: Code2,
    titleKm: "បច្ចេកវិទ្យា",
    titleEn: "Technology in Cambodia",
    prompt: "តើប្រព័ន្ធអេកូឡូស៊ីបច្ចេកវិទ្យា Tech Startup និង AI នៅកម្ពុជាមានការវិវត្តយ៉ាងណាខ្លះ?",
  },
  {
    id: "economy",
    icon: TrendingUp,
    titleKm: "សេដ្ឋកិច្ច",
    titleEn: "Cambodia Economy",
    prompt: "សូមបង្ហាញអំពីស្ថានភាពសេដ្ឋកិច្ច ប្រព័ន្ធធនាគារឌីជីថល បាគង (Bakong) និងការវិនិយោគនៅកម្ពុជា។",
  },
];

export default memo(function Sidebar({
  open,
  collapsed,
  onClose,
  onToggleCollapse,
  onNewChat,
  onOpenDocs,
  onOpenPins,
  onOpenSettings,
  onSelectPrompt,
}: SidebarProps) {
  const dispatch = useDispatch();
  const conversations = useSelector((s: RootState) => s.conversations.list);
  const activeSessionId = useSelector((s: { chat: ChatState }) => s.chat.sessionId);
  const pinnedCount = useSelector((s: RootState) => s.pin.pinned.length);
  const selectedDocsCount = useSelector((s: RootState) => s.documents.selected.length);

  const [activeNav, setActiveNav] = useState<"home" | "history" | "bookmarks" | "documents" | "settings">("home");
  const [showHistoryDrawer, setShowHistoryDrawer] = useState(false);

  const handleSelectConversation = (conv: SavedConversation) => {
    dispatch(resetChat());
    if (conv.sessionId) {
      dispatch(setSessionId(conv.sessionId));
    }
    conv.messages.forEach((m) => dispatch(addMessage(m)));
    setShowHistoryDrawer(false);
    onClose();
  };

  const handlePickTopic = (prompt: string) => {
    if (onSelectPrompt) {
      onSelectPrompt(prompt);
    }
    onClose();
  };

  const handleNewChatClick = () => {
    if (onNewChat) {
      onNewChat();
    } else {
      dispatch(resetChat());
    }
    setActiveNav("home");
    onClose();
  };

  return (
    <>
      {/* Mobile overlay backdrop */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/80 backdrop-blur-sm md:hidden animate-fade-in"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <aside
        className={cn(
          "fixed md:static inset-y-0 left-0 z-50 flex h-full flex-col border-r border-[#2C2114] bg-[#0E0C09]/95 backdrop-blur-xl shadow-2xl md:shadow-none transition-all duration-200 ease-in-out select-none",
          collapsed
            ? "w-0 p-0 border-r-0 opacity-0 pointer-events-none overflow-hidden md:hidden"
            : "w-72 max-w-[85vw] md:w-72 p-3.5 opacity-100",
          open ? "translate-x-0 !flex !w-72 !p-3.5 !opacity-100 !pointer-events-auto" : "-translate-x-full md:translate-x-0",
        )}
        aria-label="Navigation Sidebar"
      >
        {/* ── Brand Header ── */}
        <div className="relative z-10 flex items-center justify-between shrink-0 pb-3 border-b border-[#2C2114]">
          <div className="flex items-center gap-2.5">
            <KhmerAngkorCrest className="h-8 w-8 text-gold drop-shadow shrink-0" />
            <div className="flex flex-col">
              <span className="font-bold text-base text-[#E5C058] tracking-tight leading-none">
                Sastra AI
              </span>
              <span className="font-khmer text-[11px] font-semibold text-gold/80 mt-1 leading-none">
                សាស្ត្រា អេអាយ
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="md:hidden flex h-7 w-7 items-center justify-center rounded-lg border border-[#3C301D] bg-[#16120C]/90 text-gold/80 hover:text-gold transition-all"
            aria-label="Close sidebar"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* ── Action Buttons Row: [ |< ] + [ + New Chat ] ── */}
        <div className="relative z-10 mt-3 flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={onToggleCollapse}
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#3C301D] bg-[#16120C]/90 text-gold/80 hover:text-gold hover:border-gold/60 hover:bg-[#1F1910] transition-all shadow-xs shrink-0"
            title="Collapse sidebar (Ctrl+B)"
            aria-label="Collapse sidebar"
          >
            <PanelLeftClose className="h-4 w-4" />
          </button>

          <button
            type="button"
            onClick={handleNewChatClick}
            className="flex flex-1 items-center justify-center gap-2 h-9 rounded-xl border border-gold/40 bg-[#16120C] px-3 text-xs font-semibold text-gold shadow-xs hover:border-gold/70 hover:bg-gold/10 transition-all"
            title="New Conversation"
          >
            <Plus className="h-3.5 w-3.5 stroke-[2.5]" />
            <span>New Chat</span>
          </button>
        </div>

        {/* ── Main Navigation List (Home, History, Bookmarks, Documents, Settings) ── */}
        <div className="relative z-10 mt-3 space-y-1 shrink-0">
          {/* Home */}
          <button
            type="button"
            onClick={() => {
              setActiveNav("home");
              setShowHistoryDrawer(false);
            }}
            className={cn(
              "w-full flex items-center gap-3 rounded-xl px-3 py-2 text-xs font-semibold transition-all text-left",
              activeNav === "home" && !showHistoryDrawer
                ? "bg-[#251D12] text-gold border border-gold/40 shadow-xs"
                : "text-stone-300 hover:bg-[#1A150F] hover:text-stone-100"
            )}
          >
            <Home className="h-4 w-4 text-gold shrink-0" />
            <span>Home</span>
          </button>

          {/* History */}
          <button
            type="button"
            onClick={() => setShowHistoryDrawer(!showHistoryDrawer)}
            className={cn(
              "w-full flex items-center justify-between rounded-xl px-3 py-2 text-xs font-semibold transition-all text-left",
              showHistoryDrawer
                ? "bg-[#251D12] text-gold border border-gold/40 shadow-xs"
                : "text-stone-300 hover:bg-[#1A150F] hover:text-stone-100"
            )}
          >
            <span className="flex items-center gap-3">
              <Clock className="h-4 w-4 text-stone-400 shrink-0" />
              <span>History</span>
            </span>
            {conversations.length > 0 && (
              <span className="rounded-full bg-gold/15 text-gold text-[10px] px-1.5 py-0.2 font-mono">
                {conversations.length}
              </span>
            )}
          </button>

          {/* Bookmarks */}
          <button
            type="button"
            onClick={() => {
              onOpenPins();
              onClose();
            }}
            className="w-full flex items-center justify-between rounded-xl px-3 py-2 text-xs font-semibold text-stone-300 hover:bg-[#1A150F] hover:text-stone-100 transition-all text-left"
          >
            <span className="flex items-center gap-3">
              <Bookmark className="h-4 w-4 text-stone-400 shrink-0" />
              <span>Bookmarks</span>
            </span>
            {pinnedCount > 0 && (
              <span className="rounded-full bg-gold/15 text-gold text-[10px] px-1.5 py-0.2 font-mono">
                {pinnedCount}
              </span>
            )}
          </button>

          {/* Documents */}
          <button
            type="button"
            onClick={() => {
              onOpenDocs();
              onClose();
            }}
            className="w-full flex items-center justify-between rounded-xl px-3 py-2 text-xs font-semibold text-stone-300 hover:bg-[#1A150F] hover:text-stone-100 transition-all text-left"
          >
            <span className="flex items-center gap-3">
              <FileText className="h-4 w-4 text-stone-400 shrink-0" />
              <span>Documents</span>
            </span>
            {selectedDocsCount > 0 && (
              <span className="rounded-full bg-gold/15 text-gold text-[10px] px-1.5 py-0.2 font-mono">
                {selectedDocsCount}
              </span>
            )}
          </button>

          {/* Settings */}
          <button
            type="button"
            onClick={() => {
              if (onOpenSettings) onOpenSettings();
              onClose();
            }}
            className="w-full flex items-center gap-3 rounded-xl px-3 py-2 text-xs font-semibold text-stone-300 hover:bg-[#1A150F] hover:text-stone-100 transition-all text-left cursor-pointer"
          >
            <Settings className="h-4 w-4 text-stone-400 shrink-0" />
            <span>Settings</span>
          </button>
        </div>

        {/* ── SUGGESTED TOPICS Section ── */}
        <div className="relative z-10 mt-3 pt-3 border-t border-[#2C2114]/80 flex flex-col flex-1 min-h-0">
          <div className="flex items-center justify-between px-1 mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-gold/70">
              Suggested Topics
            </span>
            <span className="text-gold/40 text-[10px]">✦</span>
          </div>

          {/* Scrollable Topics List */}
          <div className="flex-1 overflow-y-auto scrollbar-thin space-y-1.5 pr-0.5 min-h-0">
            {showHistoryDrawer ? (
              /* Conversation History Drawer */
              <div className="space-y-1 animate-fade-in">
                {conversations.length === 0 ? (
                  <div className="py-6 text-center text-xs text-stone-500">
                    No past conversations yet
                  </div>
                ) : (
                  conversations.map((conv) => {
                    const isActive = conv.sessionId === activeSessionId;
                    return (
                      <div
                        key={conv.id}
                        onClick={() => handleSelectConversation(conv)}
                        className={cn(
                          "group relative flex items-center justify-between rounded-xl px-2.5 py-2 text-xs transition-all cursor-pointer",
                          isActive
                            ? "bg-gold/15 text-gold border border-gold/40"
                            : "text-stone-300 hover:bg-[#1A150F] hover:text-white border border-transparent"
                        )}
                      >
                        <div className="min-w-0 flex-1 pr-2">
                          <p className="truncate font-medium">{conv.title}</p>
                          <span className="text-[10px] text-stone-500 font-mono">
                            {formatTime(conv.createdAt)}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            dispatch(deleteConversation(conv.id));
                          }}
                          className="opacity-0 group-hover:opacity-100 p-1 text-stone-400 hover:text-red-400 transition-opacity"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                    );
                  })
                )}
              </div>
            ) : (
              SUGGESTED_TOPICS.map((topic) => {
                const Icon = topic.icon;
                return (
                  <button
                    key={topic.id}
                    type="button"
                    onClick={() => handlePickTopic(topic.prompt)}
                    className="w-full group flex items-center gap-2.5 rounded-xl border border-transparent hover:border-[#3C301D] bg-transparent hover:bg-[#16120C] p-2 text-left transition-all cursor-pointer"
                  >
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-gold/30 bg-[#1F1910] text-gold group-hover:border-gold/60 group-hover:scale-105 transition-all">
                      <Icon className="h-3.5 w-3.5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-heading text-[12.5px] font-semibold text-stone-200 group-hover:text-gold transition-colors truncate leading-tight">
                        {topic.titleKm}
                      </p>
                      <p className="text-[10.5px] font-sans text-stone-400 group-hover:text-stone-300 truncate leading-tight mt-0.5">
                        {topic.titleEn}
                      </p>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* ── Bottom Wisdom Card (ចេះ ឈ្នះ ងងឹត - Knowledge is Power) ── */}
        <div className="relative z-10 mt-3 pt-2 shrink-0">
          <div className="relative rounded-2xl border border-amber-600/40 bg-gradient-to-br from-[#1A140D] via-[#14100A] to-[#0D0A07] p-3 text-center shadow-lg shadow-black/60 overflow-hidden group">
            {/* Ornate Corner Elements */}
            <div className="absolute top-1.5 left-1.5 text-gold/60 pointer-events-none">
              <KbachCorner className="h-3.5 w-3.5" />
            </div>
            <div className="absolute top-1.5 right-1.5 rotate-90 text-gold/60 pointer-events-none">
              <KbachCorner className="h-3.5 w-3.5" />
            </div>
            <div className="absolute bottom-1.5 left-1.5 -rotate-90 text-gold/60 pointer-events-none">
              <KbachCorner className="h-3.5 w-3.5" />
            </div>
            <div className="absolute bottom-1.5 right-1.5 rotate-180 text-gold/60 pointer-events-none">
              <KbachCorner className="h-3.5 w-3.5" />
            </div>

            {/* Wisdom Content */}
            <p className="font-heading text-sm font-bold text-[#E5C058] tracking-normal pt-0.5">
              “ចេះ ឈ្នះ ងងឹត”
            </p>
            <p className="text-[11px] font-sans text-stone-400 font-normal mt-0.5">
              Knowledge is Power
            </p>
            <div className="mt-1.5 flex justify-center text-gold/70">
              <KbachLotus className="h-4 w-4" />
            </div>
          </div>
        </div>
      </aside>
    </>
  );
});
