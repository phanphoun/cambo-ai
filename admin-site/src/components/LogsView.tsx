import { useState } from "react";
import { Search, Trash2, Terminal, ShieldAlert, Sparkles, Filter, Clock } from "lucide-react";
import { AdminApi } from "../services/api";
import { formatTime, cn } from "../lib/utils";
import { toast } from "react-hot-toast";
import { KhmerCardCorners } from "./Ornaments";
import type { ActivityLogItem } from "../types";

interface LogsViewProps {
  logs: ActivityLogItem[];
  onRefresh: () => void;
}

export function LogsView({ logs, onRefresh }: LogsViewProps) {
  const [filter, setFilter] = useState("");

  const filteredLogs = logs.filter(
    (l) =>
      l.action.toLowerCase().includes(filter.toLowerCase()) ||
      l.user.toLowerCase().includes(filter.toLowerCase()) ||
      l.provider.toLowerCase().includes(filter.toLowerCase())
  );

  const handleClearLogs = async () => {
    if (window.confirm("តើអ្នកពិតជាចង់សម្អាតកំណត់ត្រាសកម្មភាពទាំងអស់មែនទេ? (Clear all activity logs)")) {
      try {
        await AdminApi.clearLogs();
        toast.success("Telemetry logs cleared");
        onRefresh();
      } catch (err: any) {
        toast.error(err.message || "Failed to clear logs");
      }
    }
  };

  return (
    <div className="space-y-4 animate-fade-in select-none">
      {/* Top Header & Search */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-[#2C2114] pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="font-heading text-base sm:text-lg font-bold text-gold-gradient flex items-center gap-2">
              <Terminal className="h-4.5 w-4.5 text-gold" />
              <span>Real-Time Activity Audit Logs</span>
            </h2>
            <span className="rounded-full bg-gold/15 border border-gold/40 px-2 py-0.5 text-[10px] font-mono font-bold text-gold">
              {logs.length} Events
            </span>
          </div>
          <p className="font-khmer text-xs text-gold/75 mt-0.5">
            កំណត់ត្រាសវនកម្មពេលវេលាជាក់ស្តែងនៃការហៅទូរស័ព្ទ API និងអន្តរកម្មអ្នកប្រើប្រាស់
          </p>
        </div>

        <button
          onClick={handleClearLogs}
          className="flex items-center gap-1.5 rounded-2xl border border-rose-500/40 bg-rose-500/10 px-3.5 py-2 text-xs font-semibold text-rose-400 hover:bg-rose-500/20 hover:border-rose-500/60 transition-all cursor-pointer shrink-0"
        >
          <Trash2 className="h-4 w-4" />
          <span>Clear Logs</span>
        </button>
      </div>

      {/* Filter bar */}
      <div className="relative w-full max-w-md">
        <Search className="absolute left-3.5 top-2.5 h-4 w-4 text-stone-400" />
        <input
          type="text"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          placeholder="ស្វែងរកតាម Event, អ្នកប្រើប្រាស់ ឬ Engine..."
          className="w-full rounded-2xl border border-[#3C301D] bg-[#120F0B] pl-10 pr-3 py-2 text-xs text-stone-100 placeholder:text-stone-600 focus:border-gold/70 focus:outline-none transition-colors"
        />
      </div>

      {/* Logs Table */}
      <div className="rounded-3xl border border-[#4A3820] bg-[#120E09]/95 overflow-hidden shadow-xl relative">
        <KhmerCardCorners size="w-5 h-5" opacity="opacity-35" />

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="border-b border-[#2C2114] bg-[#16120C] text-[11px] font-bold text-gold uppercase tracking-wider font-heading">
              <tr>
                <th className="px-5 py-3.5">Timestamp (ពេលវេលា)</th>
                <th className="px-5 py-3.5">Action Event (ព្រឹត្តិការណ៍)</th>
                <th className="px-5 py-3.5">User (អ្នកប្រើប្រាស់)</th>
                <th className="px-5 py-3.5">AI Engine (ម៉ាស៊ីន)</th>
                <th className="px-5 py-3.5">Response Latency (រយៈពេល)</th>
                <th className="px-5 py-3.5 text-right">HTTP Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#241B11]">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center text-stone-500 font-khmer">
                    មិនទាន់មានកំណត់ត្រាសកម្មភាពណាមួយត្រូវបានកត់ត្រានៅឡើយទេ។
                  </td>
                </tr>
              ) : (
                filteredLogs.map((l) => (
                  <tr key={l.id} className="hover:bg-[#18130D]/80 transition-colors">
                    <td className="px-5 py-3 text-stone-400 font-mono text-[11px] flex items-center gap-1.5">
                      <Clock className="h-3 w-3 text-stone-500" />
                      <span>{formatTime(l.timestamp)}</span>
                    </td>
                    <td className="px-5 py-3 font-semibold text-stone-200">{l.action}</td>
                    <td className="px-5 py-3 text-stone-300 font-sans">{l.user}</td>
                    <td className="px-5 py-3">
                      <span className="rounded bg-gold/15 border border-gold/30 px-2 py-0.5 text-[10.5px] font-bold text-gold inline-block">
                        {l.provider}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-amber-400 font-bold">{l.latency_ms}ms</td>
                    <td className="px-5 py-3 text-right">
                      <span
                        className={cn(
                          "rounded-md px-2 py-0.5 text-[10px] font-bold inline-block border",
                          l.status_code < 400
                            ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30"
                            : "bg-rose-500/15 text-rose-400 border-rose-500/30"
                        )}
                      >
                        {l.status_code}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

