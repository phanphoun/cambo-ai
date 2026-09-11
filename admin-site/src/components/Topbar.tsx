import { RefreshCw, ExternalLink, Menu, Sparkles, LogOut, ShieldCheck } from "lucide-react";
import { KhmerLotusMedallion } from "./Ornaments";
import { cn } from "../lib/utils";

interface TopbarProps {
  onRefreshAll: () => void;
  isRefreshing: boolean;
  onSignOut?: () => void;
  onToggleMobileSidebar?: () => void;
}

export function Topbar({ onRefreshAll, isRefreshing, onSignOut, onToggleMobileSidebar }: TopbarProps) {
  return (
    <header className="flex h-16 shrink-0 items-center justify-between border-b border-[#342718] bg-[#0E0C09]/95 px-3 sm:px-8 backdrop-blur-2xl z-30 select-none shadow-lg shadow-black/40">
      <div className="flex items-center gap-3">
        {/* Mobile Menu Toggle Button */}
        {onToggleMobileSidebar && (
          <button
            onClick={onToggleMobileSidebar}
            className="flex md:hidden h-9 w-9 items-center justify-center rounded-xl border border-[#3C301D] bg-[#16120C] text-gold hover:bg-[#201910] transition-colors"
            aria-label="Toggle Navigation Menu"
          >
            <Menu className="h-5 w-5" />
          </button>
        )}

        {/* Logo & Khmer Medallion */}
        <div className="flex h-10 w-10 sm:h-11 sm:w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-[#2D2111] via-[#1A140C] to-[#100C07] border border-gold/60 text-gold shadow-md shadow-black/90 p-1.5 shrink-0">
          <KhmerLotusMedallion className="h-full w-full" />
        </div>

        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-heading font-bold text-sm sm:text-base text-gold-gradient tracking-tight">
              Sastra AI Admin
            </h1>
            <span className="hidden sm:inline-flex items-center gap-1 rounded-md bg-gold/15 border border-gold/40 px-1.5 py-0.5 font-mono text-[9px] font-bold text-gold shadow-xs">
              <Sparkles className="h-2.5 w-2.5" />
              SOVEREIGN ROOT
            </span>
          </div>
          <p className="font-khmer text-[11px] text-gold/75 leading-tight hidden xs:block">
            ផ្ទាំងគ្រប់គ្រងរាជរដ្ឋបាល AI ម៉ូដែល និងទិន្នន័យ Telemetry
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-2.5">
        {/* Refresh Data Button */}
        <button
          onClick={onRefreshAll}
          disabled={isRefreshing}
          className="flex items-center gap-1.5 rounded-xl border border-[#3C301D] bg-[#16120C] px-3 py-1.5 text-xs font-semibold text-stone-300 hover:text-gold hover:border-gold/60 hover:bg-[#1E170F] transition-all cursor-pointer shadow-xs disabled:opacity-50"
          title="Refresh telemetry & data"
        >
          <RefreshCw className={cn("h-3.5 w-3.5 text-gold", isRefreshing && "animate-spin")} />
          <span className="hidden md:inline">Sync Data</span>
        </button>

        {/* User Chat App Link */}
        <a
          href={typeof window !== "undefined" ? `${window.location.protocol}//${window.location.hostname}:5173` : "http://localhost:5173"}
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-1.5 rounded-xl border border-gold/40 bg-gold/15 px-3 py-1.5 text-xs font-semibold text-gold hover:bg-gold/25 transition-all shadow-xs"
          title="Open User Chat Portal"
        >
          <span className="hidden sm:inline">User Chat</span>
          <span className="sm:hidden">Chat</span>
          <ExternalLink className="h-3 w-3" />
        </a>

        {/* Live Cockpit Pill */}
        <div className="hidden lg:flex items-center gap-1.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1.5 text-[11px] font-mono font-semibold text-emerald-400">
          <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>Active Cockpit</span>
        </div>

        {/* Sign Out Button */}
        <button
          onClick={() => {
            try {
              localStorage.removeItem("sastra_admin_token");
              localStorage.removeItem("sastra_admin_user");
              localStorage.removeItem("sastra_auth_token");
              localStorage.removeItem("sastra_auth_user");
            } catch {}
            if (onSignOut) {
              onSignOut();
            } else {
              window.location.href = "http://localhost:5175";
            }
          }}
          className="flex items-center gap-1.5 rounded-xl border border-rose-500/40 bg-rose-500/10 px-2.5 sm:px-3 py-1.5 text-xs font-semibold text-rose-400 hover:bg-rose-500/20 transition-all cursor-pointer shadow-xs"
          title="Sign out of root admin session"
        >
          <LogOut className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Sign Out</span>
        </button>
      </div>
    </header>
  );
}

