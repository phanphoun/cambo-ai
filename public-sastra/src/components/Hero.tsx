import { ArrowRight, Play, Sparkles, Shield, Cpu, FileCheck } from "lucide-react";
import { KhmerLotusCrest, KhmerCardCorners, KhmerLotusMedallion } from "./KhmerOrnaments";
import { useLanguage } from "../i18n/LanguageContext";

export function Hero() {
  const { t } = useLanguage();

  return (
    <section className="relative pt-32 pb-20 sm:pt-40 sm:pb-28 overflow-hidden select-none">
      {/* Background Angkor Sanctuary Glows & Silhouette */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] sm:w-[950px] h-[450px] bg-gradient-to-tr from-gold/15 via-amber-500/10 to-transparent blur-3xl pointer-events-none rounded-full" />
      <div className="absolute top-20 right-10 w-72 h-72 bg-gold/5 blur-2xl pointer-events-none rounded-full" />

      {/* Subtle Angkor Bayon Silhouette in Background */}
      <div 
        className="absolute inset-0 bg-contain bg-center bg-no-repeat opacity-[0.035] pointer-events-none mix-blend-screen"
        style={{ backgroundImage: "url('/images/angkor-sunset-hero.png')" }}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center max-w-4xl mx-auto space-y-6">
          {/* Royal Lotus Crest Crown */}
          <div className="flex justify-center -mb-2">
            <KhmerLotusCrest className="h-10 sm:h-12 w-auto opacity-90 animate-fade-in" />
          </div>

          {/* Eyebrow Badge */}
          <div className="inline-flex items-center gap-2 rounded-full border border-gold/40 bg-gold/10 px-4 py-1.5 shadow-md shadow-gold/5 animate-fade-in">
            <span className="flex h-2 w-2 rounded-full bg-gold animate-ping" />
            <span className="text-[11px] sm:text-xs font-semibold text-gold tracking-wide font-mono">
              {t.hero.badge}
            </span>
          </div>

          {/* Bilingual Main Headline */}
          <div className="space-y-3">
            <h1 className="font-heading text-3xl sm:text-5xl lg:text-6xl font-extrabold text-gold-gradient tracking-tight leading-[1.3] sm:leading-[1.25]">
              {t.hero.titleMain} <br className="hidden sm:inline" />
              {t.hero.titleSub}
            </h1>
          </div>

          {/* Subtitle */}
          <p className="text-sm sm:text-base text-stone-300 font-khmer max-w-2xl mx-auto leading-relaxed">
            {t.hero.subtitle}
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 pt-4 font-khmer">
            <a
              href="http://localhost:5173/?auth=login"
              className="w-full sm:w-auto flex items-center justify-center gap-2.5 rounded-2xl border-2 border-gold/80 bg-gradient-to-r from-gold via-amber-500 to-amber-700 px-8 py-3.5 text-sm font-extrabold text-black shadow-xl shadow-gold/25 hover:brightness-110 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer glow-gold-lg"
            >
              <span>{t.hero.getStartedBtn}</span>
              <ArrowRight className="h-4 w-4 stroke-[3]" />
            </a>

            <a
              href="#demo"
              className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-2xl border border-[#3C301D] bg-[#16120C] px-6 py-3.5 text-sm font-semibold text-stone-200 hover:text-gold hover:border-gold/50 transition-all cursor-pointer shadow-md"
            >
              <Play className="h-4 w-4 text-gold fill-gold" />
              <span>{t.hero.exploreDemoBtn}</span>
            </a>
          </div>

          {/* Quick Trust Highlights with Khmer Card Corners */}
          <div className="pt-8 grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 max-w-3xl mx-auto text-left">
            <div className="rounded-2xl border border-[#342718] bg-[#120E09]/90 p-3.5 backdrop-blur-md relative group hover:border-gold/50 transition-all">
              <KhmerCardCorners size="w-3.5 h-3.5" opacity="opacity-30 group-hover:opacity-70 transition-opacity" />
              <span className="text-[10px] text-gold font-mono uppercase font-bold block">{t.hero.stat1Title}</span>
              <span className="text-base sm:text-lg font-bold text-stone-100 font-mono">100% Native</span>
              <p className="text-[11px] text-stone-400 mt-0.5">{t.hero.stat1Desc}</p>
            </div>

            <div className="rounded-2xl border border-[#342718] bg-[#120E09]/90 p-3.5 backdrop-blur-md relative group hover:border-sky-500/50 transition-all">
              <KhmerCardCorners size="w-3.5 h-3.5" opacity="opacity-30 group-hover:opacity-70 transition-opacity" />
              <span className="text-[10px] text-sky-400 font-mono uppercase font-bold block">{t.hero.stat2Title}</span>
              <span className="text-base sm:text-lg font-bold text-stone-100 font-mono">3 AI Tiers</span>
              <p className="text-[11px] text-stone-400 mt-0.5">{t.hero.stat2Desc}</p>
            </div>

            <div className="rounded-2xl border border-[#342718] bg-[#120E09]/90 p-3.5 backdrop-blur-md relative group hover:border-emerald-500/50 transition-all">
              <KhmerCardCorners size="w-3.5 h-3.5" opacity="opacity-30 group-hover:opacity-70 transition-opacity" />
              <span className="text-[10px] text-emerald-400 font-mono uppercase font-bold block">{t.hero.stat3Title}</span>
              <span className="text-base sm:text-lg font-bold text-stone-100 font-mono">PDF & Word</span>
              <p className="text-[11px] text-stone-400 mt-0.5">{t.hero.stat3Desc}</p>
            </div>

            <div className="rounded-2xl border border-[#342718] bg-[#120E09]/90 p-3.5 backdrop-blur-md relative group hover:border-purple-500/50 transition-all">
              <KhmerCardCorners size="w-3.5 h-3.5" opacity="opacity-30 group-hover:opacity-70 transition-opacity" />
              <span className="text-[10px] text-purple-400 font-mono uppercase font-bold block">{t.hero.stat4Title}</span>
              <span className="text-base sm:text-lg font-bold text-stone-100 font-mono">Zero Egress</span>
              <p className="text-[11px] text-stone-400 mt-0.5">{t.hero.stat4Desc}</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

