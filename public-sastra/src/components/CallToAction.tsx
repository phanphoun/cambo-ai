import { ArrowRight, Sparkles } from "lucide-react";
import { KhmerLotusMedallion, KhmerLotusCrest, KhmerCardCorners } from "./KhmerOrnaments";
import { useLanguage } from "../i18n/LanguageContext";

export function CallToAction() {
  const { t } = useLanguage();

  return (
    <section className="py-24 relative select-none overflow-hidden bg-[#080604]">
      {/* Ambient background glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[350px] bg-gradient-to-r from-gold/15 via-amber-600/10 to-transparent blur-3xl pointer-events-none rounded-full" />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="relative rounded-3xl border-2 border-gold/70 bg-gradient-to-b from-[#1E170F] via-[#14100C] to-[#0D0A07] p-8 sm:p-14 text-center space-y-7 shadow-2xl shadow-black glow-gold-lg">
          {/* Corner Elements */}
          <KhmerCardCorners size="w-6 h-6" opacity="opacity-60" />

          {/* Top Crest */}
          <div className="flex justify-center -mb-2">
            <KhmerLotusCrest className="h-10 sm:h-12 w-auto opacity-95" />
          </div>

          <div className="flex justify-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-gradient-to-br from-[#2D2111] via-[#1A140C] to-[#100C07] border border-gold/60 text-gold shadow-xl p-2">
              <KhmerLotusMedallion className="h-full w-full" glow />
            </div>
          </div>

          <div className="space-y-3 max-w-3xl mx-auto">
            <h2 className="font-heading text-2xl sm:text-4xl lg:text-5xl font-extrabold text-gold-gradient tracking-tight leading-[1.3] whitespace-pre-line">
              {t.cta.title}
            </h2>
            <p className="text-xs sm:text-base text-stone-300 font-khmer max-w-2xl mx-auto leading-relaxed">
              {t.cta.subtitle}
            </p>
          </div>

          {/* Action CTA */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
            <a
              href="http://localhost:5173/?auth=login"
              className="w-full sm:w-auto flex items-center justify-center gap-2.5 rounded-2xl border-2 border-gold/80 bg-gradient-to-r from-gold via-amber-500 to-amber-700 px-10 py-4 text-base font-extrabold text-black shadow-2xl shadow-gold/30 hover:brightness-110 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer glow-gold-lg font-khmer"
            >
              <span>{t.cta.button}</span>
              <ArrowRight className="h-4 w-4 stroke-[3]" />
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}

