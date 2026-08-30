import { Activity, Users, Cpu, Terminal, Shield, Sparkles, X, ChevronRight } from "lucide-react";
import { cn } from "../lib/utils";
import { KhmerCornerOrnament } from "./Ornaments";

interface SidebarProps {
  activeTab: "telemetry" | "users" | "providers" | "logs";
  onSelectTab: (tab: "telemetry" | "users" | "providers" | "logs") => void;
  userCount: number;
  providerCount: number;
  isMobileOpen?: boolean;
  onCloseMobile?: () => void;
}

export function Sidebar({
  activeTab,
  onSelectTab,
  userCount,
  providerCount,
  isMobileOpen,
  onCloseMobile,
}: SidebarProps) {
  const tabs = [
    {
      id: "telemetry" as const,
      label: "Telemetry & Health",
      sub: "ប្រព័ន្ធវិភាគទិន្នន័យ (Live)",
      icon: Activity,
    },
    {
      id: "users" as const,
      label: "User Management",
      sub: "គ្រប់គ្រងអ្នកប្រើប្រាស់ & Roles",
      icon: Users,
      badge: userCount,
    },
    {
      id: "providers" as const,
      label: "AI Model Hub",
      sub: "ម៉ូដែល & LLM Endpoints",
      icon: Cpu,
      badge: providerCount,
    },
    {
      id: "logs" as const,
      label: "Activity Audit Logs",
      sub: "កំណត់ត្រាសកម្មភាព Trace",
      icon: Terminal,
    },
  ];

  const sidebarContent = (
    <div className="flex h-full flex-col justify-between p-4 select-none">
      <div className="space-y-1.5">
        {/* Module Header with Kbach Accent */}
        <div className="flex items-center justify-between px-2 py-1.5 mb-2 border-b border-[#2A2014] pb-2.5">
          <span className="text-[10px] font-bold uppercase tracking-widest text-gold/70 font-mono flex items-center gap-1.5">
            <Shield className="h-3.5 w-3.5 text-gold" />
            <span>SOVEREIGN MODULES</span>
          </span>
          {onCloseMobile && (
            <button
              onClick={onCloseMobile}
              className="md:hidden flex h-7 w-7 items-center justify-center rounded-lg border border-[#3C301D] bg-[#16120C] text-stone-400 hover:text-gold"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Tab Buttons */}
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const active = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => {
                onSelectTab(tab.id);
                if (onCloseMobile) onCloseMobile();
              }}
              className={cn(
                "w-full flex items-center gap-3 rounded-2xl p-3 text-left transition-all cursor-pointer group relative overflow-hidden",
                active
                  ? "bg-gradient-to-r from-gold/25 via-[#221A10] to-[#120E08] text-gold border border-gold/60 shadow-lg shadow-gold/10"
                  : "text-stone-400 hover:text-stone-100 hover:bg-[#16120C] border border-transparent"
              )}
            >
              {active && (
                <div className="absolute top-1 right-1 opacity-40 pointer-events-none">
                  <KhmerCornerOrnament position="top-right" className="w-3.5 h-3.5" />
                </div>
              )}

              <div
                className={cn(
                  "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border transition-all",
                  active
                    ? "border-gold bg-gold/20 text-gold shadow-xs"
                    : "border-[#2E2314] bg-[#120E09] text-stone-400 group-hover:border-gold/40 group-hover:text-stone-200"
                )}
              >
                <Icon className="h-4.5 w-4.5" />
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold truncate block">{tab.label}</span>
                  {tab.badge !== undefined && (
                    <span
                      className={cn(
                        "ml-2 rounded-full px-1.5 py-0.2 text-[9.5px] font-mono shrink-0 border",
                        active
                          ? "bg-gold/25 border-gold/50 text-gold font-bold"
                          : "bg-[#18130C] border-[#3C301D] text-stone-400"
                      )}
                    >
                      {tab.badge}
                    </span>
                  )}
                </div>
                <span className="font-khmer text-[10px] text-stone-500 block truncate group-hover:text-stone-400">
                  {tab.sub}
                </span>
              </div>

              {active && <ChevronRight className="h-3.5 w-3.5 text-gold shrink-0 opacity-70" />}
            </button>
          );
        })}
      </div>

      {/* Footer System Status */}
      <div className="pt-4 border-t border-[#261E13] text-[11px] text-stone-400 font-mono space-y-2 px-2 bg-[#0E0C09]/50 rounded-2xl p-2.5">
        <div className="flex justify-between items-center">
          <span className="text-stone-500 text-[10px] uppercase">Engine</span>
          <span className="text-gold font-semibold flex items-center gap-1">
            <Sparkles className="h-3 w-3" /> Sastra 2.5
          </span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-stone-500 text-[10px] uppercase">API Gateway</span>
          <span className="text-emerald-400 font-semibold flex items-center gap-1">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Port :8000
          </span>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Persistent Sidebar */}
      <aside className="w-64 shrink-0 border-r border-[#342718] bg-[#0E0C09]/95 hidden md:flex flex-col select-none">
        {sidebarContent}
      </aside>

      {/* Mobile Drawer Overlay */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-40 md:hidden flex">
          <div className="fixed inset-0 bg-black/80 backdrop-blur-xs" onClick={onCloseMobile} />
          <div className="relative w-72 max-w-[80vw] h-full bg-[#120E09] border-r border-[#4A3820] shadow-2xl z-50 animate-fade-in">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
}

