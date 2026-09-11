import { ArrowRight, Play, Shield, Cpu, FileCheck } from "lucide-react";
import { KhmerLotusCrest, KhmerCardCorners, KhmerLotusMedallion } from "./KhmerOrnaments";
import { useLanguage } from "../i18n/LanguageContext";
import { HeroVisual } from "./HeroVisual";
import { useScrollReveal } from "../hooks/useScrollReveal";

export function Hero() {
  const { t } = useLanguage();

  return (
    <section className="relative pt-28 pb-20 sm:pt-36 sm:pb-28 overflow-hidden select-none">
      {/* Background effects */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] sm:w-[1000px] h-[500px] bg-gradient-to-tr from-gold/10 via-amber-500/8 to-transparent blur-3xl pointer-events-none rounded-full" />
      <div className="absolute top-20 right-0 w-96 h-96 bg-gold/5 blur-3xl pointer-events-none rounded-full" />

      {/* Subtle background silhouette */}
      <div
        className="absolute inset-0 bg-contain bg-center bg-no-repeat opacity-[0.03] pointer-events-none mix-blend-screen"
        style={{ backgroundImage: "url('/images/angkor-sunset-hero.png')" }}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-10 items-center">
          {/* Left column: Text content */}
          <div className="lg:col-span-6 space-y-8">
            {/* Royal Lotus Crest Crown */}
            <div className="flex justify-center lg:justify-start animate-fade-in-down">
              <KhmerLotusCrest className="h-10 sm:h-12 w-auto opacity-90" />
            </div>

            {/* Eyebrow Badge */}
            <div className="flex justify-center lg:justify-start animate-fade-in-up" style={{ animationDelay: "0.1s" }}>
              <div className="inline-flex items-center gap-2.5 rounded-full border border-gold/40 bg-gold/10 px-4 py-1.5 shadow-md shadow-gold/5">
                <span className="flex h-2 w-2 rounded-full bg-gold animate-pulse" />
                <span className="text-[11px] sm:text-xs font-semibold text-gold tracking-wide font-mono uppercase">
                  {t.hero.badge}
                </span>
              </div>
            </div>

            {/* Main headline */}
            <div className="space-y-4 animate-fade-in-up" style={{ animationDelay: "0.2s" }}>
              <h1 className="font-heading text-4xl sm:text-5xl lg:text-[3.5rem] font-bold text-stone-100 tracking-tight leading-[1.25] sm:leading-[1.2]">
                <span className="block">{t.hero.titleMain}</span>
                <span className="block mt-1 text-gold-gradient">{t.hero.titleSub}</span>
              </h1>

              <p className="text-sm sm:text-base text-stone-400 font-khmer leading-[1.8] max-w-2xl">
                {t.hero.subtitle}
              </p>
            </div>

            {/* Primary CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3.5 pt-2 font-khmer animate-fade-in-up" style={{ animationDelay: "0.3s" }}>
              <a
                href="http://localhost:5173/?auth=login"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 rounded-2xl bg-gradient-to-r from-gold via-amber-500 to-amber-700 px-7 py-3.5 text-sm font-bold text-black shadow-lg shadow-gold/20 hover:shadow-gold/30 hover:brightness-110 hover:translate-y-[-1px] active:translate-y-[0px] transition-all cursor-pointer"
              >
                <span>{t.hero.getStartedBtn}</span>
                <ArrowRight className="h-4 w-4 stroke-[3]" />
              </a>

              <a
                href="#demo"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-2xl border border-[#3C301D] bg-[#16120C]/80 hover:bg-[#1E1810] px-6 py-3.5 text-sm font-semibold text-stone-200 hover:text-gold hover:border-gold/40 transition-all cursor-pointer shadow-md backdrop-blur-sm"
              >
                <Play className="h-4 w-4 text-gold fill-gold" />
                <span>{t.hero.exploreDemoBtn}</span>
              </a>
            </div>

            {/* Trust Highlights */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 pt-2">
              {[
                { labelKm: t.hero.stat1Title, labelEn: "100% Native", desc: t.hero.stat1Desc, accent: "text-gold", delay: "0.4s" },
                { labelKm: t.hero.stat2Title, labelEn: "3 AI Tiers", desc: t.hero.stat2Desc, accent: "text-sky-400", delay: "0.5s" },
                { labelKm: t.hero.stat3Title, labelEn: "PDF & Word", desc: t.hero.stat3Desc, accent: "text-emerald-400", delay: "0.6s" },
                { labelKm: t.hero.stat4Title, labelEn: "Zero Egress", desc: t.hero.stat4Desc, accent: "text-purple-400", delay: "0.7s" },
              ].map((item, idx) => (
                <div
                  key={idx}
                  className="group rounded-2xl border border-[#342718] bg-[#120E09]/90 p-3.5 backdrop-blur-md hover:border-gold/40 hover:bg-[#18130C] transition-all duration-300 relative animate-fade-in-up"
                  style={{ animationDelay: item.delay }}
                >
                  <KhmerCardCorners size="w-3.5 h-3.5" opacity="opacity-25 group-hover:opacity-60 transition-opacity" />
                  <span className={`text-[10px] font-mono uppercase font-bold block mb-0.5 ${item.accent}`}>
                    {item.labelKm}
                  </span>
                  <span className="text-sm sm:text-base font-bold text-stone-100 font-mono tracking-tight">
                    {item.labelEn}
                  </span>
                  <p className="text-[10.5px] text-stone-500 mt-0.5 leading-snug">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Right column: Interactive AI Multi-Device Showcase */}
          <div className="lg:col-span-6 flex justify-center lg:justify-end w-full">
            <div className="relative w-full max-w-[540px] animate-fade-in" style={{ animationDelay: "0.2s" }}>
              <div className="absolute -inset-8 bg-gradient-to-tr from-gold/15 via-amber-500/10 to-transparent blur-3xl rounded-full pointer-events-none" />
              <HeroVisual />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
