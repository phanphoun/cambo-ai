import { useState, type FormEvent } from "react";
import { Plus, Trash2, Cpu, Globe, Key, Zap, CheckCircle2, XCircle, X, Sparkles, Server, Eye, EyeOff, Clipboard, Edit3, Shield, Lock } from "lucide-react";
import { AdminApi } from "../services/api";
import { cn } from "../lib/utils";
import { toast } from "react-hot-toast";
import { KhmerCardCorners, KhmerCornerOrnament } from "./Ornaments";
import type { ProviderItem } from "../types";

interface ProvidersViewProps {
  providers: ProviderItem[];
  onRefresh: () => void;
}

export function ProvidersView({ providers, onRefresh }: ProvidersViewProps) {
  const [showModal, setShowModal] = useState(false);
  const [name, setName] = useState("");
  const [baseUrl, setBaseUrl] = useState("");
  const [model, setModel] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Key Update Modal State
  const [keyModalProvider, setKeyModalProvider] = useState<ProviderItem | null>(null);
  const [inputKey, setInputKey] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSavingKey, setIsSavingKey] = useState(false);

  const [testResults, setTestResults] = useState<Record<string, { status: string; latency_ms: number; message: string }>>({});
  const [testingId, setTestingId] = useState<string | null>(null);

  const handleAddProvider = async (e: FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await AdminApi.addProvider({
        name: name.trim(),
        base_url: baseUrl.trim(),
        model: model.trim(),
        api_key: apiKey.trim() || undefined,
        description: description.trim(),
      });
      toast.success(`Provider ${name} added!`);
      setShowModal(false);
      setName("");
      setBaseUrl("");
      setModel("");
      setApiKey("");
      setDescription("");
      onRefresh();
    } catch (err: any) {
      toast.error(err.message || "Failed to add provider");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateKeySubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!keyModalProvider) return;
    setIsSavingKey(true);
    try {
      await AdminApi.updateProviderKey(keyModalProvider.id, {
        api_key: inputKey.trim(),
      });
      toast.success(`API Key for ${keyModalProvider.name} updated!`);
      const targetId = keyModalProvider.id;
      setKeyModalProvider(null);
      setInputKey("");
      onRefresh();
      // Auto re-test connection
      handleTestConnection(targetId);
    } catch (err: any) {
      toast.error(err.message || "Failed to update API key");
    } finally {
      setIsSavingKey(false);
    }
  };

  const handlePasteKey = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        setInputKey(text.trim());
        toast.success("Pasted API key from clipboard!");
      }
    } catch {
      toast.error("Could not access clipboard");
    }
  };

  const handleTestConnection = async (provId: string) => {
    setTestingId(provId);
    try {
      const res = await AdminApi.testProvider(provId);
      setTestResults((prev) => ({ ...prev, [provId]: res }));
      toast.success(`Provider ${provId} online (${res.latency_ms}ms)`);
    } catch (err: any) {
      setTestResults((prev) => ({
        ...prev,
        [provId]: { status: "offline", latency_ms: 0, message: err.message || "Connection failed" },
      }));
      toast.error("Connection failed");
    } finally {
      setTestingId(null);
    }
  };

  const handleDeleteProvider = async (provId: string, provName: string) => {
    if (window.confirm(`Delete custom provider ${provName}?`)) {
      try {
        await AdminApi.deleteProvider(provId);
        toast.success(`Provider ${provName} deleted`);
        onRefresh();
      } catch (err: any) {
        toast.error(err.message || "Cannot delete system provider");
      }
    }
  };

  return (
    <div className="space-y-4 animate-fade-in select-none">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-[#2C2114] pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="font-heading text-base sm:text-lg font-bold text-gold-gradient">
              Active AI Providers & Model Endpoints
            </h2>
            <span className="rounded-full bg-gold/15 border border-gold/40 px-2 py-0.5 text-[10px] font-mono font-bold text-gold">
              {providers.length} Endpoints
            </span>
          </div>
          <p className="font-khmer text-xs text-gold/75 mt-0.5">
            គ្រប់គ្រងការតភ្ជាប់ម៉ូដែលបញ្ញាសិប្បនិម្មិត និងកែប្រែ API Key សម្ងាត់ (Gemini, MiniMax M3, Ollama Local, DeepSeek)
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 rounded-2xl bg-gradient-to-r from-gold via-amber-500 to-amber-700 px-4 py-2 text-xs font-bold text-black shadow-lg shadow-gold/20 hover:scale-[1.01] active:scale-[0.99] transition-all cursor-pointer shrink-0"
        >
          <Plus className="h-4 w-4 stroke-[3]" />
          <span>Add Custom Provider</span>
        </button>
      </div>

      {/* Grid of Providers */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {providers.map((p) => {
          const test = testResults[p.id];
          const isTesting = testingId === p.id;
          const isLocal = p.type === "local" || p.id.startsWith("ollama:");

          return (
            <div
              key={p.id}
              className="rounded-3xl border border-[#4A3820] bg-[#120E09]/95 p-5 flex flex-col justify-between shadow-xl space-y-4 relative group hover:border-gold/50 transition-all"
            >
              <KhmerCardCorners size="w-4 h-4" opacity="opacity-40 group-hover:opacity-80 transition-opacity" />

              <div>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-gold/60 bg-gradient-to-br from-[#2D2111] via-[#1A140C] to-[#100C07] text-gold shadow-md">
                      {isLocal ? <Cpu className="h-5 w-5" /> : <Sparkles className="h-5 w-5" />}
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-stone-100">{p.name}</h4>
                      <span className="text-[10.5px] font-mono text-gold/90 block font-semibold">{p.model}</span>
                    </div>
                  </div>

                  <span
                    className={cn(
                      "rounded-full px-2 py-0.5 text-[9.5px] font-mono font-bold uppercase border",
                      p.status === "active"
                        ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-400"
                        : "border-stone-500/40 bg-stone-500/10 text-stone-400"
                    )}
                  >
                    {p.status}
                  </span>
                </div>

                <p className="mt-3 text-xs text-stone-300/90 leading-relaxed font-sans">
                  {p.description || "Configured intelligence endpoint for Sastra AI pipeline."}
                </p>

                {/* Endpoint & Key Info Box */}
                <div className="mt-3 rounded-2xl border border-[#281E12] bg-[#0A0805] p-3 text-[11px] font-mono text-stone-400 space-y-2">
                  <div className="truncate flex items-center gap-1.5">
                    <Globe className="h-3.5 w-3.5 text-stone-500 shrink-0" />
                    <span className="truncate">{p.base_url}</span>
                  </div>

                  {/* Interactive API Key Badge with Quick Update Button */}
                  <div className="flex items-center justify-between gap-2 pt-1 border-t border-[#1C160E]">
                    <div className="flex items-center gap-1.5 text-stone-400 truncate">
                      <Key className="h-3.5 w-3.5 text-gold shrink-0" />
                      <span className="truncate text-[10.5px]">
                        {isLocal
                          ? "Offline Engine (No Key)"
                          : p.api_key_masked || (p.has_key ? "Key: ••••••••••••" : "API Key: Unset")}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setKeyModalProvider(p);
                        setInputKey("");
                        setShowPassword(false);
                      }}
                      className="inline-flex items-center gap-1 rounded-lg border border-gold/40 bg-gold/10 px-2 py-0.5 text-[10px] font-bold text-gold hover:bg-gold/25 hover:border-gold transition-all cursor-pointer shrink-0"
                    >
                      <Edit3 className="w-2.5 h-2.5" />
                      <span>{p.has_key ? "Update" : "Set Key"}</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Test Status Banner */}
              {test && (
                <div
                  className={cn(
                    "rounded-xl border p-2.5 text-[11px] flex items-center gap-2 animate-fade-in",
                    test.status === "online" || test.status === "healthy"
                      ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-400"
                      : "border-rose-500/40 bg-rose-500/10 text-rose-400"
                  )}
                >
                  {test.status === "online" || test.status === "healthy" ? (
                    <CheckCircle2 className="h-4 w-4 shrink-0" />
                  ) : (
                    <XCircle className="h-4 w-4 shrink-0" />
                  )}
                  <span className="flex-1 truncate">{test.message}</span>
                  <span className="font-mono font-bold shrink-0">{test.latency_ms}ms</span>
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center justify-between pt-3 border-t border-[#261E13]">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleTestConnection(p.id)}
                    disabled={isTesting}
                    className="flex items-center gap-1.5 rounded-xl border border-gold/40 bg-gold/10 px-3 py-1.5 text-xs font-semibold text-gold hover:bg-gold/20 hover:border-gold/60 transition-all cursor-pointer disabled:opacity-50"
                  >
                    <Zap className={cn("h-3.5 w-3.5", isTesting && "animate-spin")} />
                    <span>{isTesting ? "Testing..." : "Test Latency"}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setKeyModalProvider(p);
                      setInputKey("");
                      setShowPassword(false);
                    }}
                    className="flex items-center gap-1.5 rounded-xl border border-[#3D301E] bg-[#1A140D] px-3 py-1.5 text-xs font-semibold text-stone-300 hover:text-gold hover:border-gold/50 transition-all cursor-pointer"
                  >
                    <Key className="h-3.5 w-3.5 text-gold" />
                    <span>Key</span>
                  </button>
                </div>

                {p.type !== "builtin" && (
                  <button
                    type="button"
                    onClick={() => handleDeleteProvider(p.id, p.name)}
                    className="p-1.5 text-stone-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-all cursor-pointer"
                    title="Delete provider"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* ── ADD PROVIDER MODAL ── */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in select-none">
          <div className="w-full max-w-md rounded-3xl border border-[#4A3820] bg-[#14100B] p-6 shadow-2xl space-y-4 relative">
            <KhmerCardCorners size="w-5 h-5" opacity="opacity-70" />

            <div className="flex items-center justify-between pb-3 border-b border-[#2C2114]">
              <h3 className="font-heading text-base font-bold text-gold flex items-center gap-2">
                <Cpu className="h-4.5 w-4.5" />
                <span>Add AI Model Provider (បន្ថែមម៉ូដែល)</span>
              </h3>
              <button onClick={() => setShowModal(false)} className="text-stone-400 hover:text-stone-200 cursor-pointer">
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleAddProvider} className="space-y-3.5">
              <div>
                <label className="block text-[11px] font-semibold text-stone-300 mb-1">Provider Name (ឈ្មោះម៉ូដែល)</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  placeholder="e.g. DeepSeek-R1 Sovereign Engine"
                  className="w-full rounded-xl border border-[#3C301D] bg-[#0A0805] px-3.5 py-2 text-xs text-stone-100 placeholder-stone-600 focus:border-gold focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-stone-300 mb-1">Base Endpoint URL (អាសយដ្ឋាន API)</label>
                <input
                  type="url"
                  value={baseUrl}
                  onChange={(e) => setBaseUrl(e.target.value)}
                  required
                  placeholder="https://api.deepseek.com or http://localhost:11434"
                  className="w-full rounded-xl border border-[#3C301D] bg-[#0A0805] px-3.5 py-2 text-xs text-stone-100 placeholder-stone-600 focus:border-gold focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-stone-300 mb-1">Model Identifier (អត្តសញ្ញាណ Model ID)</label>
                <input
                  type="text"
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                  required
                  placeholder="deepseek-r1 / qwen2.5-coder / llama3.3"
                  className="w-full rounded-xl border border-[#3C301D] bg-[#0A0805] px-3.5 py-2 text-xs text-stone-100 placeholder-stone-600 focus:border-gold focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-stone-300 mb-1">API Key (Optional / គន្លឹះសម្ងាត់)</label>
                <input
                  type="password"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="sk-••••••••••••"
                  className="w-full rounded-xl border border-[#3C301D] bg-[#0A0805] px-3.5 py-2 text-xs text-stone-100 placeholder-stone-600 focus:border-gold focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-stone-300 mb-1">Description (ការពិពណ៌នា)</label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="High-throughput reasoning model for advanced tasks"
                  className="w-full rounded-xl border border-[#3C301D] bg-[#0A0805] px-3.5 py-2 text-xs text-stone-100 placeholder-stone-600 focus:border-gold focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#281E13]">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="rounded-xl border border-[#3C301D] bg-[#18130C] px-4 py-2 text-xs font-semibold text-stone-400 hover:text-stone-200 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="rounded-xl bg-gradient-to-r from-gold to-amber-600 px-5 py-2 text-xs font-bold text-black hover:brightness-110 transition-all cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? "Adding..." : "Save Provider"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── UPDATE API KEY MODAL ── */}
      {keyModalProvider && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in select-none">
          <div className="w-full max-w-md rounded-3xl border border-[#4A3820] bg-[#14100B] p-6 shadow-2xl space-y-4 relative">
            <KhmerCardCorners size="w-5 h-5" opacity="opacity-80" />

            <div className="flex items-center justify-between pb-3 border-b border-[#2C2114]">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gold/20 border border-gold/40 text-gold shadow-md">
                  <Key className="h-4.5 w-4.5" />
                </div>
                <div>
                  <h3 className="font-heading text-sm sm:text-base font-bold text-gold">
                    Update API Key (កែប្រែគន្លឹះសម្ងាត់)
                  </h3>
                  <span className="text-[10px] text-stone-400 font-mono">
                    Target: {keyModalProvider.name}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setKeyModalProvider(null)}
                className="text-stone-400 hover:text-stone-200 cursor-pointer p-1"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Provider Meta Summary */}
            <div className="rounded-2xl border border-[#2D2112] bg-[#0C0906] p-3 text-xs space-y-1.5 font-mono">
              <div className="flex items-center justify-between">
                <span className="text-stone-400">Model Endpoint:</span>
                <span className="text-gold font-bold">{keyModalProvider.model}</span>
              </div>
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-stone-400">Current Status:</span>
                <span className="text-emerald-400 font-semibold">{keyModalProvider.api_key_masked || "No key set"}</span>
              </div>
            </div>

            <form onSubmit={handleUpdateKeySubmit} className="space-y-4 pt-1">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-semibold text-stone-200">
                    New Secret API Key (លេខកូដសម្ងាត់ថ្មី)
                  </label>
                  <button
                    type="button"
                    onClick={handlePasteKey}
                    className="text-[10.5px] text-gold hover:text-amber-300 flex items-center gap-1 font-semibold cursor-pointer"
                  >
                    <Clipboard className="w-3 h-3" />
                    Paste
                  </button>
                </div>

                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={inputKey}
                    onChange={(e) => setInputKey(e.target.value)}
                    required
                    placeholder={
                      keyModalProvider.id === "gemini"
                        ? "AIzaSy..."
                        : keyModalProvider.id.includes("cloud")
                        ? "ollama-cloud-key / sk-..."
                        : "Enter provider API key"
                    }
                    className="w-full rounded-xl border border-[#3C301D] bg-[#080604] px-3.5 py-2.5 pr-10 text-xs text-stone-100 placeholder-stone-600 focus:border-gold focus:outline-none font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-2.5 text-stone-400 hover:text-gold cursor-pointer"
                    title={showPassword ? "Hide key" : "Show key"}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                <p className="mt-1.5 text-[10.5px] text-stone-400 leading-relaxed font-sans flex items-center gap-1">
                  <Shield className="w-3 h-3 text-gold shrink-0" />
                  Key is securely persisted to backend <code className="text-gold font-mono">.env</code> and hot-reloaded across all services.
                </p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#281E13]">
                <button
                  type="button"
                  onClick={() => setKeyModalProvider(null)}
                  className="rounded-xl border border-[#3C301D] bg-[#18130C] px-4 py-2 text-xs font-semibold text-stone-400 hover:text-stone-200 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingKey || !inputKey.trim()}
                  className="rounded-xl bg-gradient-to-r from-gold via-amber-500 to-amber-700 px-5 py-2 text-xs font-bold text-black hover:brightness-110 transition-all cursor-pointer shadow-lg shadow-gold/15 disabled:opacity-50 flex items-center gap-1.5"
                >
                  <Lock className="w-3.5 h-3.5" />
                  <span>{isSavingKey ? "Saving & Testing..." : "Save & Activate Key"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}


