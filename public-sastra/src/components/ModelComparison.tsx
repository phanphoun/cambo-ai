import { Check, X, Sparkles, Cloud, Cpu, ArrowRight } from "lucide-react";
import { KhmerCardCorners } from "./KhmerOrnaments";
import { useLanguage } from "../i18n/LanguageContext";
import { useScrollReveal } from "../hooks/useScrollReveal";

export function ModelComparison() {
  const { t, language } = useLanguage();
  const { ref, visible } = useScrollReveal();

  const models = [
    {
      name: "Gemini 3.7 Flash",
      badge: language === "km" ? "ណែនាំ · ល្បឿនលឿនបំផុត" : "Recommended · Ultra Fast",
      badgeColor: "border-gold/50 bg-gold/15 text-gold",
      icon: Sparkles,
      idealFor: language === "km"
        ? "សំណួរទូទៅប្រចាំថ្ងៃ, វិភាគរូបភាព & ឯកសារ, បកប្រែភាសាខ្មែររហ័ស និងស្វែងរកទិន្នន័យលើបណ្តាញ Web។"
        : "Everyday inquiries, multimodal photo/chart analysis, instant Khmer translation & web search.",
      latency: language === "km" ? "លឿនបំផុត (~180ms TTFT)" : "Super Fast (~180ms TTFT)",
      multimodal: true,
      webGrounding: true,
      offline: false,
      context: "1,000,000 Tokens",
      privacy: language === "km" ? "Cloud TLS 1.3 ស្តង់ដារ" : "Standard Cloud TLS 1.3",
      featured: true,
    },
    {
      name: "MiniMax M3 / Cloud",
      badge: language === "km" ? "ការគិតស៊ីជម្រៅ" : "Cloud Reasoning",
      badgeColor: "border-sky-500/50 bg-sky-500/15 text-sky-400",
      icon: Cloud,
      idealFor: language === "km"
        ? "សរសេរកូដ Full-Stack, វិភាគក្រមច្បាប់ស្មុគស្មាញ និងដំណើរការទិន្នន័យឯកសារធំៗ។"
        : "Complex software architecture, full-stack code synthesis, deep legal analysis & large datasets.",
      latency: language === "km" ? "រហ័ស (~450ms TTFT)" : "Fast (~450ms TTFT)",
      multimodal: true,
      webGrounding: true,
      offline: false,
      context: "200,000 Tokens",
      privacy: language === "km" ? "Accelerated Cloud Enclave" : "Accelerated Cloud Enclave",
      featured: false,
    },
    {
      name: "Ollama (Local Engine)",
      badge: language === "km" ? "១០០% Offline ក្នុងស្រុក" : "100% Sovereign Offline",
      badgeColor: "border-emerald-500/50 bg-emerald-500/15 text-emerald-400",
      icon: Cpu,
      idealFor: language === "km"
        ? "ឯកសារសម្ងាត់រាជរដ្ឋាភិបាល, ប្រព័ន្ធស្នូលធនាគារ និងបរិស្ថានគ្មានអ៊ីនធឺណិត (Air-Gapped)។"
        : "Classified government documents, banking core integrations, zero-internet air-gapped security.",
      latency: language === "km" ? "អាស្រ័យលើ GPU ក្នុងស្រុក" : "GPU Dependent (Local)",
      multimodal: false,
      webGrounding: false,
      offline: true,
      context: "32,000 - 128,000 Tokens",
      privacy: language === "km" ? "១០០% Zero Cloud Egress" : "100% Zero Cloud Egress",
      featured: false,
    },
  ];

  return (
    <section id="models" className="py-24 bg-[#0A0805] relative select-none border-t border-[#261E13]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div ref={ref} className={`text-center max-w-3xl mx-auto space-y-4 mb-16 transition-all duration-700 ${visible ? 'animate-fade-in-up' : 'opacity-0 translate-y-4'}`}>
          <div className="inline-flex items-center gap-1.5 rounded-full border border-gold/40 bg-gold/10 px-3.5 py-1 text-xs font-semibold text-gold font-mono">
            <Cpu className="h-3.5 w-3.5" />
            <span>{t.models.badge}</span>
          </div>
          <h2 className="font-heading text-2xl sm:text-4xl font-extrabold text-gold-gradient tracking-tight">
            {t.models.title}
          </h2>
          <p className="text-xs sm:text-sm text-stone-400 font-khmer leading-relaxed">
            {t.models.subtitle}
          </p>
        </div>

        {/* Model Cards Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {models.map((m, idx) => {
            const Icon = m.icon;
            const base = visible ? "animate-fade-in-up" : "opacity-0 translate-y-4";
            return (
              <div
                key={idx}
                className={`rounded-3xl p-6 sm:p-7 flex flex-col justify-between space-y-6 shadow-xl transition-all relative group ${base} ${
                  m.featured
                    ? "border-2 border-gold/70 bg-[#15100A] glow-gold"
                    : "border border-[#3A2D1A] bg-[#120E09] hover:border-gold/50"
                }`}
                style={visible ? { animationDelay: `${idx * 0.12}s` } : undefined}
              >
                <KhmerCardCorners size="w-4 h-4" opacity={m.featured ? "opacity-60" : "opacity-30 group-hover:opacity-60 transition-opacity"} />

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-gold/50 bg-gradient-to-br from-[#2D2111] via-[#1A140C] to-[#100C07] text-gold shadow-md">
                      <Icon className="h-6 w-6" />
                    </div>
                    <span className={`rounded-full border px-2.5 py-0.5 text-[10px] font-mono font-bold ${m.badgeColor}`}>
                      {m.badge}
                    </span>
                  </div>

                  <div>
                    <h3 className="text-lg font-bold text-stone-100 group-hover:text-gold transition-colors font-sans">
                      {m.name}
                    </h3>
                    <p className="text-xs text-stone-400 mt-1 font-khmer leading-relaxed">
                      {m.idealFor}
                    </p>
                  </div>

                  {/* Feature Breakdown Table */}
                  <div className="space-y-2.5 pt-3 border-t border-[#281E13] text-xs font-sans">
                    <div className="flex items-center justify-between">
                      <span className="text-stone-400 font-khmer">{t.models.latencyLabel}</span>
                      <span className="font-mono text-stone-200 font-semibold">{m.latency}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-stone-400 font-khmer">{t.models.multimodalLabel}</span>
                      <span className="font-semibold text-emerald-400 flex items-center gap-1">
                        {m.multimodal ? <Check className="h-4 w-4 stroke-[3]" /> : <X className="h-4 w-4 text-stone-500" />}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-stone-400 font-khmer">{t.models.webGroundingLabel}</span>
                      <span className="font-semibold text-emerald-400 flex items-center gap-1">
                        {m.webGrounding ? <Check className="h-4 w-4 stroke-[3]" /> : <X className="h-4 w-4 text-stone-500" />}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-stone-400 font-khmer">{t.models.offlineLabel}</span>
                      <span className="font-semibold text-emerald-400 flex items-center gap-1">
                        {m.offline ? <Check className="h-4 w-4 stroke-[3]" /> : <X className="h-4 w-4 text-stone-500" />}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-stone-400 font-khmer">{t.models.contextLabel}</span>
                      <span className="font-mono text-gold font-semibold">{m.context}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-stone-400 font-khmer">{t.models.privacyLabel}</span>
                      <span className="font-mono text-stone-200">{m.privacy}</span>
                    </div>
                  </div>
                </div>

                <a
                  href="http://localhost:5173/?auth=login"
                  className={`flex items-center justify-center gap-2 rounded-2xl py-2.5 text-xs font-bold transition-all cursor-pointer shadow-xs font-khmer ${
                    m.featured
                      ? "bg-gradient-to-r from-gold to-amber-600 text-black hover:brightness-110"
                      : "border border-gold/40 bg-gold/10 text-gold hover:bg-gold hover:text-black"
                  }`}
                >
                  <span>{t.models.selectBtn}</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </a>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
