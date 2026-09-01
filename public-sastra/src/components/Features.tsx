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
  const { t } = useLanguage();

  return (
    <section id="features" className="py-24 bg-[#080604] relative select-none">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4 mb-16">
          <div className="inline-flex items-center gap-2 rounded-full border border-gold/40 bg-gold/10 px-4 py-1 text-xs font-semibold text-gold font-mono">
            <Layers className="h-3.5 w-3.5" />
            <span>{t.features.badge}</span>
          </div>
          <h2 className="font-heading text-2xl sm:text-4xl font-extrabold text-gold-gradient tracking-tight">
            {t.features.title}
          </h2>
          <p className="text-xs sm:text-sm text-stone-400 font-khmer leading-relaxed">
            {t.features.subtitle}
          </p>
        </div>

        {/* Feature Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {t.features.items.map((f, i) => {
            const Icon = ICONS[i] || Sparkles;
            const badgeColor = BADGE_COLORS[i] || "border-gold/50 bg-gold/15 text-gold";
            return (
              <div
                key={i}
                className="relative rounded-3xl border border-[#342718] bg-[#120E09]/95 p-6 sm:p-7 space-y-4 hover:border-gold/60 hover:bg-[#18130C] transition-all duration-300 shadow-xl group"
              >
                <KhmerCardCorners size="w-4 h-4" opacity="opacity-30 group-hover:opacity-75 transition-opacity" />

                {/* Header Row */}
                <div className="flex items-center justify-between">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-gold/50 bg-gradient-to-br from-[#2D2111] via-[#1A140C] to-[#100C07] text-gold shadow-md group-hover:scale-110 transition-transform">
                    <Icon className="h-6 w-6" />
                  </div>
                  <span className={`rounded-full border px-2.5 py-0.5 text-[10px] font-mono font-bold ${badgeColor}`}>
                    {f.badge}
                  </span>
                </div>

                {/* Titles */}
                <div className="space-y-1 pt-1">
                  <h3 className="font-heading font-bold text-base sm:text-lg text-stone-100 group-hover:text-gold transition-colors">
                    {f.title}
                  </h3>
                </div>

                {/* Description */}
                <p className="text-xs text-stone-400 font-khmer leading-relaxed">
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

