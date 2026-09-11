import {
  Sparkles,
  Cpu,
  FileText,
  Volume2,
  Lock,
  Layers,
  Database,
} from "lucide-react";
import { KhmerCardCorners } from "./KhmerOrnaments";
import { useLanguage } from "../i18n/LanguageContext";
import { useScrollReveal } from "../hooks/useScrollReveal";

const ICONS = [Sparkles, Cpu, FileText, Database, Volume2, Lock];
const BADGE_COLORS = [
  "border-gold/50 bg-gold/15 text-gold",
  "border-sky-500/50 bg-sky-500/15 text-sky-400",
  "border-emerald-500/50 bg-emerald-500/15 text-emerald-400",
  "border-amber-500/50 bg-amber-500/15 text-amber-400",
  "border-purple-500/50 bg-purple-500/15 text-purple-400",
  "border-rose-500/50 bg-rose-500/15 text-rose-400",
];

export function Features() {
  const { t, language } = useLanguage();
  const { ref, visible } = useScrollReveal();

  // Duplicate items twice to ensure continuous, seamless infinite loop
  const duplicatedItems = [...t.features.items, ...t.features.items];

  return (
    <section id="features" className="py-24 bg-[#080604] relative select-none overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div
          ref={ref}
          className={`text-center max-w-3xl mx-auto space-y-4 mb-10 transition-all duration-700 ${
            visible ? "animate-fade-in-up" : "opacity-0 translate-y-4"
          }`}
        >
          <div className="inline-flex items-center gap-2 rounded-full border border-gold/40 bg-gold/10 px-4 py-1 text-[11px] font-semibold text-gold font-mono">
            <Layers className="h-3.5 w-3.5" />
            <span>{t.features.badge}</span>
          </div>
          <h2 className="font-heading text-3xl sm:text-4xl font-bold text-gold-gradient tracking-tight">
            {t.features.title}
          </h2>
          <p className="text-sm text-stone-400 font-khmer leading-[1.8]">
            {t.features.subtitle}
          </p>

          {/* Live Scroll / Hover Hint */}
          <div className="pt-2 flex justify-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#332616] bg-[#120E09]/80 px-3.5 py-1 text-[11px] text-stone-400 font-khmer shadow-sm backdrop-blur-md">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-gold opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-gold"></span>
              </span>
              <span>
                {language === "km"
                  ? "រមូរស្វ័យប្រវត្តិពីស្ដាំទៅឆ្វេង • ដាក់កណ្ដុរ (Hover) ដើម្បីផ្អាកអាន"
                  : "Auto-scrolling Right to Left • Hover card to pause reading"}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 1 Row Continuous Horizontal Marquee */}
      <div className="relative w-full overflow-hidden marquee-container py-3">
        {/* Left & Right Cinematic Vignette Fades */}
        <div className="pointer-events-none absolute left-0 top-0 bottom-0 w-16 sm:w-32 md:w-48 bg-gradient-to-r from-[#080604] via-[#080604]/80 to-transparent z-20" />
        <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-16 sm:w-32 md:w-48 bg-gradient-to-l from-[#080604] via-[#080604]/80 to-transparent z-20" />

        {/* Animated Marquee Track */}
        <div className="animate-marquee-left flex gap-6 px-4">
          {duplicatedItems.map((f, idx) => {
            const origIdx = idx % t.features.items.length;
            const Icon = ICONS[origIdx] || Sparkles;
            const badgeColor = BADGE_COLORS[origIdx] || "border-gold/50 bg-gold/15 text-gold";

            return (
              <div
                key={idx}
                className="group relative w-[340px] sm:w-[400px] md:w-[440px] h-[265px] sm:h-[285px] shrink-0 rounded-3xl border border-[#342718] bg-[#120E09]/95 p-6 sm:p-7 flex flex-col justify-between hover:border-gold/80 hover:bg-[#18130C] hover:scale-[1.02] hover:shadow-2xl hover:shadow-gold/15 transition-all duration-300 shadow-xl cursor-pointer"
              >
                <KhmerCardCorners
                  size="w-4 h-4"
                  opacity="opacity-30 group-hover:opacity-85 transition-opacity"
                />

                {/* Top Section: Icon & Badge */}
                <div>
                  <div className="flex items-center justify-between">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-gold/50 bg-gradient-to-br from-[#2D2111] via-[#1A140C] to-[#100C07] text-gold shadow-md group-hover:scale-110 group-hover:shadow-gold/20 transition-all">
                      <Icon className="h-6 w-6" />
                    </div>
                    <span
                      className={`rounded-full border px-2.5 py-1 text-[10px] font-mono font-bold ${badgeColor}`}
                    >
                      {f.badge}
                    </span>
                  </div>

                  {/* Title */}
                  <div className="mt-4">
                    <h3 className="font-heading font-bold text-base sm:text-lg text-stone-100 group-hover:text-gold transition-colors leading-snug">
                      {f.title}
                    </h3>
                  </div>
                </div>

                {/* Description */}
                <p className="text-xs sm:text-[13px] text-stone-400 font-khmer leading-[1.8] line-clamp-3">
                  {f.desc}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
