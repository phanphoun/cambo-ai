import { memo, useState, useRef, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-hot-toast";
import {
  PanelLeft,
  PanelLeftClose,
  Bot,
  BookOpen,
  FileText,
  User,
  ChevronDown,
  LogOut,
  Settings,
  UserCheck,
  Shield,
  ExternalLink,
  Bell,
  Palette,
} from "lucide-react";
import { cn } from "../lib/utils";
import { setDirectoryOpen } from "../features/directory/directorySlice";
import { setAuthModalOpen, logout } from "../features/auth/authSlice";
import { KhmerProfileAvatar } from "./KhmerProfileAvatar";
import LanguageDropdown from "./LanguageDropdown";
import { useTranslation } from "../i18n/useTranslation";
import type { SettingsTab } from "./SettingsModal";
import type { RootState } from "../store";
import { setPanelOpen } from "../features/agent/agentSlice";

interface TopbarProps {
  onToggleMobileSidebar: () => void;
  onToggleCollapse: () => void;
  sidebarCollapsed: boolean;
  onOpenDocs: () => void;
  onOpenPins: () => void;
  onOpenSettings?: (tab?: SettingsTab) => void;
  onNewChat?: () => void;
}

export default memo(function Topbar({
  onToggleMobileSidebar,
  onToggleCollapse,
  sidebarCollapsed,
  onOpenDocs,
  onOpenSettings,
}: TopbarProps) {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const selectedDocsCount = useSelector((s: RootState) => s.documents.selected.length);
  const agentOpen = useSelector((s: RootState) => s.agent.open);
  const agentPending = useSelector((s: RootState) => s.agent.patchSummary?.pending ?? 0);
  const { user, isAuthenticated, isGuest } = useSelector((s: RootState) => s.auth);

  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    if (menuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [menuOpen]);

  return (
    <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center justify-between border-b border-[#2D2417] bg-[#0E0C09] px-3 sm:px-6 transition-all w-full max-w-full overflow-visible select-none shadow-md">
      {/* Left: Sidebar Toggle + Brand Identity */}
      <div className="flex items-center gap-2 sm:gap-3 min-w-0">
        <button
          type="button"
          onClick={() => {
            if (typeof window !== "undefined" && window.innerWidth < 768) {
              onToggleMobileSidebar();
            } else {
              onToggleCollapse();
            }
          }}
          className={cn(
            "h-8 w-8 items-center justify-center rounded-xl border border-[#3C301D] bg-[#16120C] text-gold/80 hover:text-gold hover:border-gold/60 hover:bg-[#1F1910] transition-all duration-300 shrink-0 shadow-xs cursor-pointer",
            sidebarCollapsed ? "flex opacity-100 scale-100" : "flex md:hidden opacity-0 scale-95 pointer-events-none md:pointer-events-auto",
          )}
          title={sidebarCollapsed ? "Expand sidebar (Ctrl+B)" : "Toggle sidebar"}
          aria-label={sidebarCollapsed ? "Expand sidebar" : "Toggle sidebar"}
        >
          {sidebarCollapsed ? (
            <PanelLeft className="h-4 w-4 text-gold" />
          ) : (
            <PanelLeftClose className="h-4 w-4 text-gold" />
          )}
        </button>

        {/* Brand Crest & Title - On mobile always, and on desktop when sidebar is collapsed */}
        <div
          className={cn(
            "items-center gap-2.5 shrink-0 transition-all duration-300 ease-in-out",
            sidebarCollapsed
              ? "flex opacity-100 translate-x-0"
              : "flex md:hidden opacity-0 -translate-x-2 pointer-events-none md:pointer-events-auto",
          )}
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-[#241D12] via-[#1A140D] to-[#100C08] text-gold shadow-md border border-gold/50 p-1 overflow-hidden">
            <img
              src="/images/khmer-assets/khmer-medallion-lotus-4.png"
              alt="Sastra AI Sacred Lotus"
              className="h-full w-full object-contain filter drop-shadow hover:rotate-45 transition-transform duration-500"
            />
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5 leading-none">
              <span className="font-heading font-bold text-sm sm:text-base text-gold tracking-normal">
                Sastra AI
              </span>
            </div>
            <span className="font-khmer text-[11px] text-gold/75 mt-0.5 leading-none">
              {t.common.tagline}
            </span>
          </div>
        </div>

        {/* Khmer Royal Art Ornament - On desktop when sidebar is open */}
        <div
          className={cn(
            "items-center gap-2 pl-2 select-none transition-all duration-300 ease-in-out",
            !sidebarCollapsed
              ? "hidden md:flex opacity-90 translate-x-0 hover:opacity-100 hover:scale-105"
              : "hidden opacity-0 translate-x-2 pointer-events-none",
          )}
        >
          <img
            src="/images/khmer-assets/khmer-crest-lotus-2.png"
            alt="Khmer Royal Lotus Pediment Crest"
            className="h-8 w-auto object-contain drop-shadow-[0_2px_10px_rgba(212,175,55,0.4)]"
          />
        </div>
      </div>

      {/* Right: Actions (Directory, Docs, Theme, Notifications, User Auth) */}
      <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
        {/* Directory Button */}
        <button
          type="button"
          onClick={() => dispatch(setDirectoryOpen(true))}
          className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-[#3C301D] bg-[#16120C] h-8 px-2.5 sm:px-3 text-xs font-medium text-stone-200 transition-all hover:border-gold/50 hover:text-gold shadow-xs cursor-pointer"
          title="Browse Tech Directory"
        >
          <BookOpen className="h-3.5 w-3.5 text-gold" />
          <span className="hidden md:inline">{t.topbar.directory}</span>
        </button>

        {/* AI Response Language Dropdown */}
        <LanguageDropdown size="sm" placement="bottom" />

        {/* Selected Docs Pill Indicator */}
        {selectedDocsCount > 0 && (
          <button
            type="button"
            onClick={onOpenDocs}
            className="flex items-center gap-1 rounded-full border border-gold/40 bg-gold/15 px-2.5 py-1 text-xs font-medium text-gold transition-all hover:bg-gold/25 cursor-pointer shadow-xs"
            title={`${selectedDocsCount} ${t.topbar.docsReferenced}`}
          >
            <FileText className="h-3.5 w-3.5 text-gold" />
            <span className="font-bold">{selectedDocsCount}</span>
            <span className="hidden sm:inline text-[10.5px]">{t.topbar.docs}</span>
          </button>
        )}

        {/* Agent Mode Button */}
        <button
          type="button"
          onClick={() => dispatch(setPanelOpen(!agentOpen))}
          className={`relative flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium transition-all cursor-pointer shadow-xs ${
            agentOpen
              ? "border-gold/60 bg-gold/25 text-gold"
              : "border-gold/30 bg-gold/10 text-gold hover:bg-gold/20"
          }`}
          title="SASTRA Agent — autonomous coding on your local project"
        >
          <Bot className="h-3.5 w-3.5" />
          <span className="hidden sm:inline text-[10.5px]">Agent</span>
          {agentPending > 0 && (
            <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-amber-500 px-1 text-[9px] font-bold text-slate-900">
              {agentPending}
            </span>
          )}
        </button>

        {/* Notifications Button */}
        <button
          type="button"
          onClick={() => toast(t.topbar.allSystemsNormal, { icon: "🔔" })}
          className="relative flex h-8 w-8 items-center justify-center rounded-xl text-stone-400 hover:text-gold hover:bg-[#1F1910] transition-colors cursor-pointer"
          title={t.topbar.notifications}
          aria-label={t.topbar.notifications}
        >
          <Bell className="h-4 w-4" />
          <span className="absolute top-1.5 right-1.5 h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />
        </button>

        {/* User Authentication Pill / Menu */}
        {isAuthenticated && user ? (
          <div ref={menuRef} className="relative">
            <button
              type="button"
              onClick={() => setMenuOpen((o) => !o)}
              className="flex items-center gap-2 rounded-full border border-gold/50 bg-[#16120C] p-1 sm:pl-1 sm:pr-3 sm:py-1 text-xs text-stone-200 cursor-pointer hover:border-gold hover:bg-[#1F1810] transition-all shadow-md group"
              title="User Account"
            >
              <KhmerProfileAvatar
                name={user.name}
                avatar={user.avatar}
                size="sm"
                role={user.role as "admin" | "user"}
                showCrown={user.role === "admin"}
                glow={true}
              />
              <span className="text-xs font-semibold text-stone-200 hidden sm:inline max-w-[90px] truncate group-hover:text-gold transition-colors">
                {user.name.split(" ")[0]}
              </span>
              <ChevronDown className="h-3 w-3 text-stone-400 hidden sm:inline group-hover:text-gold transition-colors" />
            </button>

            {/* 100% Solid Non-Transparent Profile Dropdown Menu */}
            {menuOpen && (
              <div className="absolute right-0 top-full mt-2 w-76 rounded-2xl border-2 border-[#523E1E] bg-[#16120C] p-3.5 shadow-2xl shadow-black animate-fade-in z-50">
                {/* User Info Header with Large Khmer Art Avatar */}
                <div className="flex items-center gap-3.5 pb-3 border-b border-[#2C2114] bg-[#16120C]">
                  <KhmerProfileAvatar
                    name={user.name}
                    avatar={user.avatar}
                    size="lg"
                    role={user.role as "admin" | "user"}
                    showCrown={user.role === "admin"}
                    showStatus={true}
                    isOnline={true}
                    glow={true}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="font-bold text-sm text-stone-100 truncate flex items-center gap-1.5">
                      <span>{user.name}</span>
                      {user.role === "admin" && <span title="Administrator">👑</span>}
                    </p>
                    <p className="text-[10.5px] text-stone-400 truncate font-mono mt-0.5">
                      {user.email}
                    </p>
                    <span className="inline-block mt-1.5 rounded-full bg-gold/15 px-2.5 py-0.5 text-[9.5px] font-bold text-gold border border-gold/40">
                      {isGuest ? t.common.guest : user.role === "admin" ? t.common.admin : t.common.member}
                    </span>
                  </div>
                </div>

                {/* Menu Items */}
                <div className="mt-2 space-y-1 bg-[#16120C]">
                  {/* Option 1: Profile */}
                  <button
                    type="button"
                    onClick={() => {
                      setMenuOpen(false);
                      if (onOpenSettings) onOpenSettings("profile");
                    }}
                    className="w-full flex items-center gap-2.5 rounded-xl px-2.5 py-2 text-xs text-stone-200 hover:bg-[#241D13] hover:text-gold transition-all text-left cursor-pointer"
                  >
                    <UserCheck className="h-4 w-4 text-gold" />
                    <span>{t.topbar.profile}</span>
                  </button>

                  {/* Option 2: Settings & Engine */}
                  <button
                    type="button"
                    onClick={() => {
                      setMenuOpen(false);
                      if (onOpenSettings) onOpenSettings("provider");
                    }}
                    className="w-full flex items-center gap-2.5 rounded-xl px-2.5 py-2 text-xs text-stone-200 hover:bg-[#241D13] hover:text-gold transition-all text-left cursor-pointer"
                  >
                    <Settings className="h-4 w-4 text-gold" />
                    <span>{t.topbar.settingsAndModels}</span>
                  </button>

                  {/* Option 3: Wallpaper & Theme */}
                  <button
                    type="button"
                    onClick={() => {
                      setMenuOpen(false);
                      if (onOpenSettings) onOpenSettings("appearance");
                    }}
                    className="w-full flex items-center gap-2.5 rounded-xl px-2.5 py-2 text-xs text-stone-200 hover:bg-[#241D13] hover:text-gold transition-all text-left cursor-pointer"
                  >
                    <Palette className="h-4 w-4 text-gold" />
                    <span>{t.settings.tabs.appearance}</span>
                  </button>

                  {/* Option: Admin Console (ONLY visible to user.role === "admin") */}
                  {user.role === "admin" && (
                    <a
                      href="http://localhost:5174"
                      target="_blank"
                      rel="noreferrer"
                      onClick={() => setMenuOpen(false)}
                      className="w-full flex items-center justify-between rounded-xl px-2.5 py-2 text-xs font-bold text-amber-400 bg-amber-500/10 hover:bg-amber-500/20 hover:text-amber-300 border border-amber-500/30 transition-all text-left cursor-pointer"
                    >
                      <div className="flex items-center gap-2.5">
                        <Shield className="h-4 w-4 text-amber-400" />
                        <span>{t.topbar.adminConsole}</span>
                      </div>
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  )}

                  {/* Option 4: Sign Out */}
                  <div className="pt-1 border-t border-[#2C2114]">
                    <button
                      type="button"
                      onClick={() => {
                        setMenuOpen(false);
                        dispatch(logout());
                        window.location.href = "http://localhost:5175";
                      }}
                      className="w-full flex items-center gap-2.5 rounded-xl px-2.5 py-2 text-xs text-rose-400 hover:bg-rose-500/15 transition-all text-left cursor-pointer"
                    >
                      <LogOut className="h-4 w-4" />
                      <span>{t.topbar.signOut}</span>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          <button
            type="button"
            onClick={() => dispatch(setAuthModalOpen(true))}
            className="flex items-center gap-1.5 h-8 rounded-full border border-gold/50 bg-gradient-to-r from-gold/20 via-gold/10 to-transparent px-3 text-xs font-semibold text-gold shadow-xs hover:border-gold hover:bg-gold/25 transition-all cursor-pointer"
            title="Sign In / Register"
          >
            <User className="h-3.5 w-3.5" />
            <span>{t.topbar.signIn}</span>
          </button>
        )}
      </div>
    </header>
  );
});
