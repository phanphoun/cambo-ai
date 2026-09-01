import { useState, type FormEvent } from "react";
import { Lock, Mail, Eye, EyeOff, ArrowRight, ShieldAlert, KeyRound, CheckCircle2, Sparkles } from "lucide-react";
import { KhmerLotusMedallion, KhmerLotusCrest, KhmerCardCorners } from "./Ornaments";
import { toast } from "react-hot-toast";

interface AdminAuthGateProps {
  onAuthenticated: (token: string, adminUser: any) => void;
}

export function AdminAuthGate({ onAuthenticated }: AdminAuthGateProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleAdminLogin = async (e: FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      toast.error("Please provide both admin email and password");
      return;
    }

    setIsLoading(true);
    try {
      const resp = await fetch("http://localhost:8000/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase(), password }),
      });

      if (!resp.ok) {
        const err = await resp.json().catch(() => ({}));
        throw new Error(err.detail || "Authentication failed");
      }

      const data = await resp.json();
      if (data.user?.role !== "admin") {
        throw new Error("Access Denied: You do not have Root Administrator credentials.");
      }

      localStorage.setItem("sastra_admin_token", data.access_token);
      localStorage.setItem("sastra_admin_user", JSON.stringify(data.user));
      toast.success(`Root Access Granted: Welcome, ${data.user.name}`);
      onAuthenticated(data.access_token, data.user);
    } catch (err: any) {
      toast.error(err.message || "Failed to authenticate as Admin");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen w-screen flex flex-col items-center justify-center bg-[#070503] text-stone-100 font-sans selection:bg-gold/30 selection:text-gold overflow-hidden select-none p-4">
      {/* Angkor Sanctuary Backdrop */}
      <div 
        className="absolute inset-0 bg-cover bg-center opacity-15 pointer-events-none mix-blend-luminosity scale-105 transition-transform duration-1000"
        style={{ backgroundImage: "url('/images/angkor-bayon-full-bg.png')" }}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-[#070503] via-[#070503]/80 to-[#070503]/90 pointer-events-none" />

      {/* Radiant Golden Glows */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[650px] h-[450px] bg-gradient-to-tr from-amber-600/15 via-gold/15 to-transparent blur-3xl pointer-events-none rounded-full" />
      <div className="absolute bottom-10 right-10 w-96 h-96 bg-rose-600/10 blur-3xl pointer-events-none rounded-full" />

      {/* Main Admin Lock Card */}
      <div className="relative w-full max-w-md rounded-3xl border border-[#4A3820] bg-[#120E09]/95 p-7 sm:p-9 shadow-2xl shadow-black backdrop-blur-2xl">
        {/* Khmer 4-Corner Ornaments */}
        <KhmerCardCorners size="w-6 h-6" opacity="opacity-80" />

        {/* Top Royal Khmer Crest */}
        <div className="flex justify-center -mt-3 mb-2">
          <KhmerLotusCrest className="h-7 w-auto" />
        </div>

        {/* Branding */}
        <div className="text-center space-y-3 pb-5 border-b border-[#2C2114]">
          <div className="relative mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-[#2D2111] via-[#1A140C] to-[#100C07] border border-gold/60 text-gold shadow-xl p-2.5">
            <KhmerLotusMedallion className="h-full w-full" />
            <div className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-rose-500 text-white shadow">
              <Lock className="h-3 w-3 stroke-[2.5]" />
            </div>
          </div>

          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-rose-500/15 border border-rose-500/40 px-3 py-0.5 text-[10px] font-mono font-bold text-rose-400">
              <ShieldAlert className="h-3.5 w-3.5" />
              <span>SOVEREIGN ROOT AUTHORITY</span>
            </div>
            <h1 className="font-heading font-bold text-xl sm:text-2xl text-gold-gradient tracking-tight">
              Sastra AI Admin Cockpit
            </h1>
            <p className="font-khmer text-xs text-gold/80 leading-relaxed">
              ផ្ទាំងបញ្ជាសុវត្ថិភាពខ្ពស់ សម្រាប់គ្រប់គ្រងម៉ូដែល AI និងគណនី
            </p>
          </div>
        </div>

        {/* Credentials Form */}
        <form onSubmit={handleAdminLogin} className="space-y-4 pt-5">
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-stone-300">
              Admin Email (អ៊ីមែលអ្នកគ្រប់គ្រង)
            </label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-500" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@gmail.com"
                className="w-full rounded-2xl border border-[#3C301D] bg-[#0E0C09] py-2.5 pl-10 pr-4 text-xs sm:text-sm text-stone-100 placeholder-stone-600 focus:border-gold focus:outline-none focus:ring-1 focus:ring-gold transition-all"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-stone-300">
              Security Password (ពាក្យសម្ងាត់សុវត្ថិភាព)
            </label>
            <div className="relative">
              <KeyRound className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-500" />
              <input
                type={showPassword ? "text" : "password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded-2xl border border-[#3C301D] bg-[#0E0C09] py-2.5 pl-10 pr-10 text-xs sm:text-sm text-stone-100 placeholder-stone-600 focus:border-gold focus:outline-none focus:ring-1 focus:ring-gold transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-stone-500 hover:text-stone-300 cursor-pointer"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-2 rounded-2xl border border-gold/70 bg-gradient-to-r from-[#D4AF37] via-[#C59B28] to-[#996B00] py-3 text-xs sm:text-sm font-bold text-black shadow-lg shadow-gold/25 hover:brightness-110 hover:scale-[1.01] active:scale-[0.99] transition-all cursor-pointer disabled:opacity-50"
          >
            <Sparkles className="h-4 w-4 stroke-[2.5]" />
            <span>{isLoading ? "Authenticating Sovereign Authority..." : "Unlock Admin Cockpit"}</span>
            <ArrowRight className="h-4 w-4 stroke-[3]" />
          </button>
        </form>

        <div className="mt-6 pt-4 border-t border-[#261E13] flex items-center justify-between text-[11px] text-stone-500 font-mono">
          <span className="flex items-center gap-1">
            <CheckCircle2 className="h-3 w-3 text-emerald-400" />
            Zero-Trust Vault
          </span>
          <a
            href="http://localhost:5173"
            className="text-gold/80 hover:text-gold hover:underline transition-colors"
          >
            ← Chat Portal
          </a>
        </div>
      </div>
    </div>
  );
}

