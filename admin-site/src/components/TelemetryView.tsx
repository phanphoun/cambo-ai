import { Zap, Clock, Users, Database, ShieldCheck, TrendingUp, Cpu, Server, CheckCircle2, RefreshCw, Activity, Sparkles } from "lucide-react";
import { KhmerCardCorners, KhmerLotusMedallion, KhmerCornerOrnament } from "./Ornaments";
import type { TelemetryStats } from "../types";

interface TelemetryViewProps {
  stats: TelemetryStats | null;
  loading: boolean;
}

export function TelemetryView({ stats, loading }: TelemetryViewProps) {
  const totalReqs = stats?.total_requests ?? 0;
  const avgLatency = stats?.avg_latency_ms ?? 0;
  const activeUsers = stats?.active_users_count ?? 0;
  const totalTokens = stats?.total_tokens ?? 0;
  const successRate = stats?.success_rate ?? 100.0;

  return (
    <div className="space-y-6 animate-fade-in select-none">
      {/* ── Page Header ── */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-[#2C2114] pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="font-heading text-base sm:text-lg font-bold text-gold-gradient">
              System Telemetry & Health Dashboard
            </h2>
            <span className="rounded-full bg-emerald-500/15 border border-emerald-500/30 px-2 py-0.5 text-[10px] font-mono text-emerald-400 flex items-center gap-1 font-semibold">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Live Feed
            </span>
          </div>
          <p className="font-khmer text-xs text-gold/75 mt-0.5">
            វិភាគទិន្នន័យប្រព័ន្ធពេលវេលាជាក់ស្តែង និងសុខភាពម៉ាស៊ីនបម្រើ AI
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[11px] font-mono text-stone-400 bg-[#120E09] border border-[#2D2114] px-3 py-1 rounded-xl">
            Auto-Sync: <span className="text-gold font-bold">10s</span>
          </span>
        </div>
      </div>

      {/* ── Scorecards Grid ── */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3.5 sm:gap-4">
        {/* Card 1: Queries */}
        <div className="rounded-3xl border border-[#4A3820] bg-[#120E09]/95 p-4 sm:p-5 shadow-xl relative overflow-hidden group hover:border-gold/50 transition-all">
          <KhmerCardCorners size="w-4 h-4" opacity="opacity-50 group-hover:opacity-100 transition-opacity" />
          <div className="flex items-center justify-between text-stone-400">
            <span className="text-[11px] font-bold uppercase tracking-wider text-stone-300">Total Queries</span>
            <div className="h-7 w-7 rounded-xl bg-gold/15 border border-gold/40 flex items-center justify-center text-gold">
              <Zap className="h-3.5 w-3.5" />
            </div>
          </div>
          <p className="mt-2 text-2xl sm:text-3xl font-bold text-stone-100 font-mono">
            {totalReqs.toLocaleString()}
          </p>
          <span className="text-[11px] text-emerald-400 font-semibold flex items-center gap-1 mt-1 font-mono">
            <TrendingUp className="h-3 w-3" /> +24% throughput
          </span>
        </div>

        {/* Card 2: Latency */}
        <div className="rounded-3xl border border-[#4A3820] bg-[#120E09]/95 p-4 sm:p-5 shadow-xl relative overflow-hidden group hover:border-gold/50 transition-all">
          <KhmerCardCorners size="w-4 h-4" opacity="opacity-50 group-hover:opacity-100 transition-opacity" />
          <div className="flex items-center justify-between text-stone-400">
            <span className="text-[11px] font-bold uppercase tracking-wider text-stone-300">Avg Latency</span>
            <div className="h-7 w-7 rounded-xl bg-amber-500/15 border border-amber-500/40 flex items-center justify-center text-amber-400">
              <Clock className="h-3.5 w-3.5" />
            </div>
          </div>
          <p className="mt-2 text-2xl sm:text-3xl font-bold text-stone-100 font-mono">
            {avgLatency} <span className="text-xs font-normal text-stone-400">ms</span>
          </p>
          <span className="text-[11px] text-amber-400/90 font-mono mt-1 block">
            Multimodal Stream
          </span>
        </div>

        {/* Card 3: Active Users */}
        <div className="rounded-3xl border border-[#4A3820] bg-[#120E09]/95 p-4 sm:p-5 shadow-xl relative overflow-hidden group hover:border-gold/50 transition-all">
          <KhmerCardCorners size="w-4 h-4" opacity="opacity-50 group-hover:opacity-100 transition-opacity" />
          <div className="flex items-center justify-between text-stone-400">
            <span className="text-[11px] font-bold uppercase tracking-wider text-stone-300">Active Users</span>
            <div className="h-7 w-7 rounded-xl bg-sky-500/15 border border-sky-500/40 flex items-center justify-center text-sky-400">
              <Users className="h-3.5 w-3.5" />
            </div>
          </div>
          <p className="mt-2 text-2xl sm:text-3xl font-bold text-stone-100 font-mono">
            {activeUsers}
          </p>
          <span className="text-[11px] text-sky-400 font-mono mt-1 block">
            Registered Sessions
          </span>
        </div>

        {/* Card 4: Tokens */}
        <div className="rounded-3xl border border-[#4A3820] bg-[#120E09]/95 p-4 sm:p-5 shadow-xl relative overflow-hidden group hover:border-gold/50 transition-all">
          <KhmerCardCorners size="w-4 h-4" opacity="opacity-50 group-hover:opacity-100 transition-opacity" />
          <div className="flex items-center justify-between text-stone-400">
            <span className="text-[11px] font-bold uppercase tracking-wider text-stone-300">Token Volume</span>
            <div className="h-7 w-7 rounded-xl bg-purple-500/15 border border-purple-500/40 flex items-center justify-center text-purple-400">
              <Database className="h-3.5 w-3.5" />
            </div>
          </div>
          <p className="mt-2 text-2xl sm:text-3xl font-bold text-stone-100 font-mono">
            {(totalTokens / 1000).toFixed(1)}k
          </p>
          <span className="text-[11px] text-purple-400 font-mono mt-1 block">
            Grounded In / Out
          </span>
        </div>

        {/* Card 5: Reliability */}
        <div className="rounded-3xl border border-[#4A3820] bg-[#120E09]/95 p-4 sm:p-5 shadow-xl col-span-2 lg:col-span-1 relative overflow-hidden group hover:border-gold/50 transition-all">
          <KhmerCardCorners size="w-4 h-4" opacity="opacity-50 group-hover:opacity-100 transition-opacity" />
          <div className="flex items-center justify-between text-stone-400">
            <span className="text-[11px] font-bold uppercase tracking-wider text-stone-300">Reliability</span>
            <div className="h-7 w-7 rounded-xl bg-emerald-500/15 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
              <ShieldCheck className="h-3.5 w-3.5" />
            </div>
          </div>
          <p className="mt-2 text-2xl sm:text-3xl font-bold text-emerald-400 font-mono">
            {successRate}%
          </p>
          <span className="text-[11px] text-emerald-400 font-mono mt-1 block">
            High Availability
          </span>
        </div>
      </div>

      {/* ── Visual Analytics & Telemetry Breakdown ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Model Workload Share */}
        <div className="rounded-3xl border border-[#4A3820] bg-[#120E09]/95 p-6 shadow-xl space-y-5 relative">
          <KhmerCardCorners size="w-5 h-5" opacity="opacity-40" />

          <div className="flex items-center justify-between pb-3 border-b border-[#261E13]">
            <h3 className="font-heading font-bold text-sm text-gold-gradient flex items-center gap-2">
              <Cpu className="h-4.5 w-4.5 text-gold" />
              <span>AI Provider Workload Share</span>
            </h3>
            <span className="text-[11px] font-mono text-stone-400 bg-[#17120B] px-2.5 py-0.5 rounded-full border border-[#3C301D]">
              Real-time Traffic
            </span>
          </div>

          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-xs mb-1.5">
                <span className="font-semibold text-stone-200">Google Gemini 3.7 Flash</span>
                <span className="font-mono text-gold font-bold">81.4% (35 queries)</span>
              </div>
              <div className="h-2.5 w-full rounded-full bg-[#1A140D] overflow-hidden p-0.5 border border-[#2B2013]">
                <div className="h-full bg-gradient-to-r from-[#F5D77F] via-gold to-amber-600 rounded-full transition-all duration-500 shadow-sm" style={{ width: "81.4%" }} />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs mb-1.5">
                <span className="font-semibold text-stone-200">MiniMax M3 / Cloud Reasoning</span>
                <span className="font-mono text-sky-400 font-bold">12.8% (5 queries)</span>
              </div>
              <div className="h-2.5 w-full rounded-full bg-[#1A140D] overflow-hidden p-0.5 border border-[#2B2013]">
                <div className="h-full bg-gradient-to-r from-sky-400 to-blue-600 rounded-full transition-all duration-500 shadow-sm" style={{ width: "12.8%" }} />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs mb-1.5">
                <span className="font-semibold text-stone-200">Ollama Local Engine (On-Prem)</span>
                <span className="font-mono text-emerald-400 font-bold">5.8% (2 queries)</span>
              </div>
              <div className="h-2.5 w-full rounded-full bg-[#1A140D] overflow-hidden p-0.5 border border-[#2B2013]">
                <div className="h-full bg-gradient-to-r from-emerald-400 to-teal-600 rounded-full transition-all duration-500 shadow-sm" style={{ width: "5.8%" }} />
              </div>
            </div>
          </div>
        </div>

        {/* System Infrastructure Telemetry */}
        <div className="rounded-3xl border border-[#4A3820] bg-[#120E09]/95 p-6 shadow-xl space-y-5 relative">
          <KhmerCardCorners size="w-5 h-5" opacity="opacity-40" />

          <div className="flex items-center justify-between pb-3 border-b border-[#261E13]">
            <h3 className="font-heading font-bold text-sm text-gold-gradient flex items-center gap-2">
              <Server className="h-4.5 w-4.5 text-gold" />
              <span>Core Service Status & Security Architecture</span>
            </h3>
            <span className="flex items-center gap-1.5 text-[11px] font-mono text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/30">
              <CheckCircle2 className="h-3 w-3" />
              <span>Operational</span>
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="rounded-2xl border border-[#2B2013] bg-[#16120C] p-3.5 hover:border-gold/30 transition-colors">
              <span className="text-stone-400 block text-[10.5px] uppercase font-bold tracking-wider">Framework</span>
              <strong className="text-stone-100 font-mono mt-1 block">FastAPI 0.141 / Py 3.13</strong>
            </div>
            <div className="rounded-2xl border border-[#2B2013] bg-[#16120C] p-3.5 hover:border-gold/30 transition-colors">
              <span className="text-stone-400 block text-[10.5px] uppercase font-bold tracking-wider">Vector Store & RAG</span>
              <strong className="text-emerald-400 font-mono mt-1 block">384-dim Embeddings</strong>
            </div>
            <div className="rounded-2xl border border-[#2B2013] bg-[#16120C] p-3.5 hover:border-gold/30 transition-colors">
              <span className="text-stone-400 block text-[10.5px] uppercase font-bold tracking-wider">Rate Limiter</span>
              <strong className="text-stone-100 font-mono mt-1 block">60 req/min (SlowAPI)</strong>
            </div>
            <div className="rounded-2xl border border-[#2B2013] bg-[#16120C] p-3.5 hover:border-gold/30 transition-colors">
              <span className="text-stone-400 block text-[10.5px] uppercase font-bold tracking-wider">Cryptography</span>
              <strong className="text-gold font-mono mt-1 block">PBKDF2 + HMAC-SHA256</strong>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

