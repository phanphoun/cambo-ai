import { useState, useEffect, useCallback } from "react";
import { Toaster, toast } from "react-hot-toast";
import { Topbar } from "./components/Topbar";
import { Sidebar } from "./components/Sidebar";
import { TelemetryView } from "./components/TelemetryView";
import { UsersView } from "./components/UsersView";
import { ProvidersView } from "./components/ProvidersView";
import { LogsView } from "./components/LogsView";
import { AdminAuthGate } from "./components/AdminAuthGate";
import { AdminApi } from "./services/api";
import type { UserItem, ProviderItem, TelemetryStats, ActivityLogItem } from "./types";

export default function App() {
  const [adminToken, setAdminToken] = useState<string | null>(() => {
    try {
      const tok = localStorage.getItem("sastra_admin_token");
      const userJson = localStorage.getItem("sastra_admin_user");
      if (tok && userJson) {
        const u = JSON.parse(userJson);
        if (u?.role === "admin") return tok;
      }
    } catch {}
    return null;
  });

  const [activeTab, setActiveTab] = useState<"telemetry" | "users" | "providers" | "logs">("telemetry");
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  const [stats, setStats] = useState<TelemetryStats | null>(null);
  const [users, setUsers] = useState<UserItem[]>([]);
  const [providers, setProviders] = useState<ProviderItem[]>([]);
  const [logs, setLogs] = useState<ActivityLogItem[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchData = useCallback(async () => {
    if (!adminToken) return;
    setIsRefreshing(true);
    try {
      const [s, u, p, l] = await Promise.allSettled([
        AdminApi.getStats(),
        AdminApi.getUsers(),
        AdminApi.getProviders(),
        AdminApi.getLogs({ limit: 100 }),
      ]);

      if (s.status === "fulfilled") setStats(s.value);
      else console.error("Admin telemetry error:", s.reason);

      if (u.status === "fulfilled") setUsers(u.value);
      else console.error("Admin users error:", u.reason);

      if (p.status === "fulfilled") setProviders(p.value);
      else console.error("Admin providers error:", p.reason);

      if (l.status === "fulfilled") setLogs(l.value);
      else console.error("Admin logs error:", l.reason);

      if (s.status === "rejected" && u.status === "rejected") {
        toast.error("Failed to connect to backend API");
      }
    } finally {
      setIsRefreshing(false);
    }
  }, [adminToken]);

  useEffect(() => {
    if (!adminToken) return;
    fetchData();
    // Auto-refresh telemetry every 10 seconds
    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
  }, [fetchData, adminToken]);

  // Protected Admin Route: If not logged in as Admin, lock with AdminAuthGate
  if (!adminToken) {
    return (
      <div className="min-h-screen w-screen bg-[#070503]">
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: "#16120C",
              color: "#E5C058",
              border: "1px solid #4A3820",
              fontSize: "12px",
              boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.8)",
            },
          }}
        />
        <AdminAuthGate onAuthenticated={(token) => setAdminToken(token)} />
      </div>
    );
  }

  return (
    <div className="relative flex h-screen w-screen flex-col bg-[#080604] text-stone-100 font-sans select-none overflow-hidden">
      {/* Ambient Angkor Backdrop Texture */}
      <div 
        className="absolute inset-0 bg-cover bg-center opacity-[0.035] pointer-events-none mix-blend-luminosity"
        style={{ backgroundImage: "url('/images/angkor-bayon-full-bg.png')" }}
      />

      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: "#16120C",
            color: "#E5C058",
            border: "1px solid #4A3820",
            fontSize: "12px",
            boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.8)",
          },
        }}
      />

      {/* Top Header */}
      <Topbar
        onRefreshAll={fetchData}
        isRefreshing={isRefreshing}
        onSignOut={() => setAdminToken(null)}
        onToggleMobileSidebar={() => setIsMobileSidebarOpen((prev) => !prev)}
      />

      {/* Workspace Body */}
      <div className="flex flex-1 min-h-0 overflow-hidden relative z-10">
        {/* Navigation Sidebar */}
        <Sidebar
          activeTab={activeTab}
          onSelectTab={setActiveTab}
          userCount={users.length}
          providerCount={providers.length}
          isMobileOpen={isMobileSidebarOpen}
          onCloseMobile={() => setIsMobileSidebarOpen(false)}
        />

        {/* Dynamic Main Views */}
        <main className="flex-1 overflow-y-auto scrollbar-thin p-3.5 sm:p-6 lg:p-8 space-y-6">
          {activeTab === "telemetry" && (
            <TelemetryView stats={stats} loading={isRefreshing} />
          )}

          {activeTab === "users" && (
            <UsersView users={users} onRefresh={fetchData} />
          )}

          {activeTab === "providers" && (
            <ProvidersView providers={providers} onRefresh={fetchData} />
          )}

          {activeTab === "logs" && (
            <LogsView logs={logs} onRefresh={fetchData} />
          )}
        </main>
      </div>
    </div>
  );
}

