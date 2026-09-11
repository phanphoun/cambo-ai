import { memo } from "react";
import { useSelector } from "react-redux";
import {
  Languages,
  BookOpen,
  Code2,
  TrendingUp,
  ArrowRight,
  Flame,
  Landmark,
  Scale,
  FileText,
  Lightbulb,
} from "lucide-react";
import { KhmerAngkorCrest } from "./KhmerOrnaments";
import type { RootState } from "../store";
import { useTranslation } from "../i18n/useTranslation";

const HERO_CARD_CONFIGS = [
  {
    id: "angkor" as const,
    imgSrc: "/images/cards/card-angkor.png",
    icon: KhmerAngkorCrest,
  },
  {
    id: "language" as const,
    imgSrc: "/images/cards/card-language.png",
    icon: Languages,
  },
  {
    id: "history" as const,
    imgSrc: "/images/cards/card-history.png",
    icon: BookOpen,
  },
  {
    id: "tech" as const,
    imgSrc: "/images/cards/card-tech.png",
    icon: Code2,
  },
  {
    id: "economy" as const,
    imgSrc: "/images/cards/card-economy.png",
    icon: TrendingUp,
  },
];

const SUGGESTED_QUICK_PILL_CONFIGS = [
  {
    key: "popular" as const,
    icon: Flame,
    active: true,
  },
  {
    key: "angkor" as const,
    icon: Landmark,
  },
  {
    key: "laws" as const,
    icon: Scale,
  },
  {
    key: "policies" as const,
    icon: FileText,
  },
  {
    key: "startup" as const,
    icon: Lightbulb,
  },
  {
    key: "python" as const,
    icon: Code2,
  },
];

interface WelcomeScreenProps {
  onPick: (prompt: string) => void;
}

export default memo(function WelcomeScreen({ onPick }: WelcomeScreenProps) {
  const { t } = useTranslation();
  const currentUser = useSelector((s: RootState) => s.auth.user);
  const displayName = currentUser?.name?.split(" ")[0] || "Admin";

  return (
    <div className="relative mx-auto w-full max-w-7xl px-3 sm:px-6 pt-2 sm:pt-4 pb-6 animate-fade-in flex flex-col items-center justify-center select-none overflow-hidden">
      {/* ── Asset 5: Vertical Golden Naga Pillars on Side Flanks ── */}
      <div className="hidden xl:block absolute -left-4 top-1/2 -translate-y-1/2 pointer-events-none opacity-40 hover:opacity-75 transition-opacity duration-700 z-0">
        <img
          src="/images/khmer-assets/khmer-naga-pillar-5.png"
          alt="Khmer Naga Left Pillar"
          className="h-[480px] w-auto object-contain drop-shadow-[0_0_20px_rgba(212,175,55,0.3)]"
        />
      </div>
      <div className="hidden xl:block absolute -right-4 top-1/2 -translate-y-1/2 pointer-events-none opacity-40 hover:opacity-75 transition-opacity duration-700 z-0">
        <img
          src="/images/khmer-assets/khmer-naga-pillar-5.png"
          alt="Khmer Naga Right Pillar"
          className="h-[480px] w-auto object-contain drop-shadow-[0_0_20px_rgba(212,175,55,0.3)] -scale-x-100"
        />
      </div>

      {/* ── Asset 6: Grand Angkor Wat Silhouette Pedestal Monument ── */}
      <div className="relative z-10 flex flex-col items-center justify-center mb-1">
        <img
          src="/images/khmer-assets/khmer-angkor-monument-6.png"
          alt="Angkor Wat Monument"
          className="h-16 sm:h-20 md:h-24 w-auto object-contain drop-shadow-[0_8px_24px_rgba(212,175,55,0.45)] hover:scale-105 transition-transform duration-500"
        />
      </div>

      {/* ── 2. Greeting & Grand Header with Asset 4 Lotus Medallion & Asset 2 Crest ── */}
      <div className="relative z-10 text-center space-y-2 max-w-3xl mx-auto">
        <h3 className="font-heading text-sm sm:text-base font-semibold text-stone-200 flex items-center justify-center gap-2">
          <span>{t.welcome.greeting} {displayName}!</span>
          <span>👋</span>
        </h3>

        <h1 className="font-heading text-[26px] sm:text-[32px] lg:text-[40px] font-bold text-stone-100 tracking-normal leading-[1.3]">
          {t.welcome.headlineStart}{" "}
          <span className="font-heading text-transparent bg-clip-text bg-gradient-to-b from-[#FFF2B2] via-[#E5C058] to-[#B88E1B] inline-block drop-shadow-[0_2px_14px_rgba(212,175,55,0.45)]">
            {t.welcome.headlineHighlight}
          </span>
        </h1>

        <p className="font-khmer text-xs sm:text-sm text-stone-400 font-normal leading-[1.75]">
          {t.welcome.subtitle}
        </p>

        {/* ── Asset 2: Royal Golden Lotus Pediment Crest ── */}
        <div className="flex justify-center pt-1">
          <img
            src="/images/khmer-assets/khmer-crest-lotus-2.png"
            alt="Khmer Royal Lotus Crest"
            className="h-6 sm:h-8 w-auto object-contain drop-shadow-[0_2px_12px_rgba(212,175,55,0.4)]"
          />
        </div>
      </div>

      {/* ── 3. The 5 Rich Hero Cards with Asset 1 Corner Filigree & Asset 4 Medallions ── */}
      <div className="relative z-10 w-full grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3.5 sm:gap-4 mt-6 max-w-6.5xl">
        {HERO_CARD_CONFIGS.map((cfg) => {
          const Icon = cfg.icon;
          const card = t.welcome.cards[cfg.id];
          return (
            <div
              key={cfg.id}
              onClick={() => onPick(card.prompt)}
              className="group relative flex flex-col justify-between rounded-2xl border-2 border-[#4A381C] bg-[#120E0A]/95 hover:border-gold hover:bg-[#1A140D] hover:scale-[1.03] active:scale-[0.98] transition-all duration-300 shadow-xl shadow-black/90 backdrop-blur-md overflow-hidden cursor-pointer p-0"
            >
              {/* Asset 1: Kbach Golden Filigree in Top Corners */}
              <img
                src="/images/khmer-assets/khmer-corner-1.png"
                alt="Khmer Corner Decor"
                className="absolute top-0 left-0 h-9 w-9 object-contain pointer-events-none z-20 opacity-80 group-hover:opacity-100 group-hover:scale-110 transition-all drop-shadow-[0_0_6px_rgba(212,175,55,0.4)]"
              />
              <img
                src="/images/khmer-assets/khmer-corner-1.png"
                alt="Khmer Corner Decor"
                className="absolute top-0 right-0 h-9 w-9 object-contain pointer-events-none z-20 opacity-80 group-hover:opacity-100 group-hover:scale-110 transition-all -scale-x-100 drop-shadow-[0_0_6px_rgba(212,175,55,0.4)]"
              />

              {/* Card Banner Image Thumbnail */}
              <div className="relative h-28 w-full overflow-hidden bg-stone-900 border-b border-[#342615]">
                <img
                  src={cfg.imgSrc}
                  alt={card.title}
                  className="h-full w-full object-cover object-center group-hover:scale-110 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#120E0A] via-transparent to-black/30" />

                {/* Badge Tag in Top Right */}
                <span className="absolute top-2.5 right-2.5 rounded-full border border-gold/50 bg-black/80 px-2.5 py-0.5 text-[9.5px] font-sans font-bold text-gold backdrop-blur-xs shadow-md z-10 tracking-wide">
                  {card.badge}
                </span>

                {/* Center Circular Medallion Emblem with Asset 4 / Icon */}
                <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 flex h-10 w-10 items-center justify-center rounded-full border-2 border-gold bg-[#15100A] text-gold shadow-[0_0_12px_rgba(212,175,55,0.5)] group-hover:scale-115 transition-transform z-10 overflow-hidden p-0.5">
                  <img
                    src="/images/khmer-assets/khmer-medallion-lotus-4.png"
                    alt="Lotus Emblem"
                    className="absolute inset-0 h-full w-full object-contain opacity-90 group-hover:rotate-45 transition-transform duration-500"
                  />
                  <Icon className="relative z-10 h-4 w-4 drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)]" />
                </div>
              </div>

              {/* Card Content */}
              <div className="p-4 pt-6 text-center flex flex-col justify-between flex-1 space-y-2">
                <div className="space-y-0.5">
                  <h4 className="font-heading font-semibold text-[14.5px] text-stone-100 group-hover:text-gold transition-colors leading-snug">
                    {card.title}
                  </h4>
                  <p className="text-[11px] font-sans text-stone-400 font-medium tracking-wide">
                    {card.subtitle}
                  </p>
                </div>

                <p className="font-khmer text-xs text-stone-400 font-normal leading-[1.7] line-clamp-2">
                  {card.desc}
                </p>

                {/* Circular Arrow Button at bottom */}
                <div className="pt-2 flex justify-center">
                  <div className="flex h-7 w-7 items-center justify-center rounded-full border border-[#453621] bg-[#18130C] text-gold group-hover:border-gold group-hover:bg-gold group-hover:text-black transition-all shadow-xs">
                    <ArrowRight className="h-3.5 w-3.5 stroke-[2.5]" />
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── 4. Quick Suggested Topic Filter Pills ── */}
      <div className="relative z-10 w-full flex items-center justify-center gap-2 flex-wrap mt-6 max-w-4xl">
        {SUGGESTED_QUICK_PILL_CONFIGS.map((pillCfg) => {
          const Icon = pillCfg.icon;
          const pill = t.welcome.pills[pillCfg.key];
          return (
            <button
              key={pillCfg.key}
              type="button"
              onClick={() => onPick(pill.prompt)}
              className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-khmer font-medium transition-all duration-200 border cursor-pointer ${
                pillCfg.active
                  ? "border-gold/70 bg-gradient-to-r from-amber-600/25 to-gold/25 text-gold shadow-md shadow-gold/15"
                  : "border-[#3E2F1A] bg-[#14100C]/85 text-stone-300 hover:border-gold/60 hover:text-gold hover:bg-[#1E1710]"
              }`}
            >
              <Icon className={`h-3.5 w-3.5 ${pillCfg.active ? "text-amber-400 fill-amber-400/20" : "text-gold/80"}`} />
              <span>{pill.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
});
