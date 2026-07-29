import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  Menu,
  PanelLeftClose,
  PanelLeftOpen,
  Sparkles,
  Share2,
  Cpu,
  Cloud,
  Keyboard,
  Sun,
  Moon,
} from "lucide-react";
import { Button } from "./ui/button";
import { cn } from "../lib/utils";
import { toggleTheme } from "../features/theme/themeSlice";
import ShareMenu from "../features/share/ShareMenu";
import type { RootState } from "../store";

interface TopbarProps {
  onMenu: () => void;
  onToggleSidebar: () => void;
  sidebarVisible: boolean;
  backendOnline: boolean;
}

const MODE_ICONS: Record<string, string> = {
  chat: "💬",
  translate: "🌐",
  search: "🔍",
  code: "💻",
};

const MODE_LABELS: Record<string, string> = {
  chat: "Chat",
  translate: "Translate",
  search: "Search",
  code: "Code",
};

export default function Topbar({
  onMenu,
  onToggleSidebar,
  sidebarVisible,
  backendOnline,
}: TopbarProps) {
  const dispatch = useDispatch();
  const currentMode = useSelector((s: RootState) => s.modes.current);
  const currentProvider = useSelector((s: RootState) => s.provider.current);
  const currentTheme = useSelector((s: RootState) => s.theme.current);
  const [shareOpen, setShareOpen] = useState(false);

  return (
    <header
      className={cn(
        "sticky top-0 z-10 flex items-center gap-2 border-b",
        "bg-background/80 px-3 py-2.5 backdrop-blur supports-[backdrop-filter]:bg-background/60",
        "sm:gap-3 sm:px-5",
        "border-border",
      )}
    >
      {/* Mobile menu */}
      <Button
        variant="ghost"
        size="icon"
        onClick={onMenu}
        className="md:hidden"
        aria-label="Open menu"
      >
        <Menu className="h-5 w-5" />
      </Button>

      {/* Sidebar toggle */}
      <Button
        variant="ghost"
        size="icon"
        onClick={onToggleSidebar}
        className="hidden md:inline-flex h-8 w-8"
        aria-label={sidebarVisible ? "Hide sidebar" : "Show sidebar"}
        title={`${sidebarVisible ? "Hide" : "Show"} sidebar (Ctrl+B)`}
      >
        {sidebarVisible ? (
          <PanelLeftClose className="h-4 w-4" />
        ) : (
          <PanelLeftOpen className="h-4 w-4" />
        )}
      </Button>

      {/* Logo & mode badge */}
      <div className="flex flex-1 items-center gap-2 min-w-0">
        <span className="text-lg sm:text-xl" aria-hidden>
          🇰🇭
        </span>
        <h1 className="truncate text-sm font-semibold sm:text-base">
          CAMBO AI
        </h1>
        <span className="inline-flex items-center gap-1 rounded-full bg-secondary/80 px-2.5 py-0.5 text-[11px] font-medium text-muted-foreground shadow-sm">
          <span className="text-xs leading-none">
            {MODE_ICONS[currentMode] || "💬"}
          </span>
          <span className="hidden xs:inline">
            {MODE_LABELS[currentMode] || "Chat"}
          </span>
        </span>
      </div>

      <div className="flex items-center gap-1 sm:gap-1.5">
        {/* Theme toggle */}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => dispatch(toggleTheme())}
          className="h-8 w-8"
          aria-label={
            currentTheme === "dark" ? "Switch to light mode" : "Switch to dark mode"
          }
          title={
            currentTheme === "dark" ? "Light mode" : "Dark mode"
          }
        >
          {currentTheme === "dark" ? (
            <Sun className="h-4 w-4 text-amber-400" />
          ) : (
            <Moon className="h-4 w-4 text-indigo-500" />
          )}
        </Button>

        {/* Keyboard shortcuts hint */}
        <Button
          variant="ghost"
          size="icon"
          className="hidden h-8 w-8 sm:inline-flex"
          aria-label="Keyboard shortcuts"
          title="Keyboard shortcuts (Ctrl+/)"
        >
          <Keyboard className="h-4 w-4" />
        </Button>

        {/* Share button */}
        <div className="relative">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShareOpen(!shareOpen)}
            className="h-8 w-8"
            aria-label="Share conversation"
            title="Share & Export"
          >
            <Share2 className="h-4 w-4" />
          </Button>
          <ShareMenu open={shareOpen} onClose={() => setShareOpen(false)} />
        </div>

        {/* Provider badge */}
        <div className="hidden items-center gap-1.5 rounded-full border border-border bg-secondary/60 px-2.5 py-1 text-[11px] font-medium text-muted-foreground sm:flex">
          {currentProvider === "ollama" && <Cpu className="h-3 w-3 text-primary" />}
          {currentProvider === "ollama-cloud" && <Cloud className="h-3 w-3 text-primary" />}
          {currentProvider === "gemini" && <Sparkles className="h-3 w-3 text-primary" />}
          <span className="hidden sm:inline">
            {currentProvider === "ollama" && "Ollama (Local)"}
            {currentProvider === "ollama-cloud" && "Ollama Cloud"}
            {currentProvider === "gemini" && "Gemini 3 Flash"}
          </span>
        </div>

        {/* Connection status */}
        <div
          className={cn(
            "flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium transition-colors",
            "border border-border/50",
            backendOnline
              ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
              : "bg-destructive/10 text-destructive",
          )}
          title={backendOnline ? "Backend connected" : "Backend unreachable"}
        >
          <span className="relative flex h-2 w-2">
            {backendOnline && (
              <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75 animate-pulse-dot" />
            )}
            <span
              className={cn(
                "relative inline-flex h-2 w-2 rounded-full",
                backendOnline ? "bg-emerald-500" : "bg-destructive",
              )}
            />
          </span>
          <span className="hidden xs:inline">
            {backendOnline ? "Online" : "Offline"}
          </span>
        </div>
      </div>
    </header>
  );
}
