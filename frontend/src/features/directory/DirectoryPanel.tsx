import { useState, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  X,
  Search,
  ExternalLink,
  MapPin,
  Building2,
  Sparkles,
  Rocket,
  ShoppingCart,
  Landmark,
  GraduationCap,
  Palette,
  Factory,
  Truck,
  Radio,
  ShieldCheck,
  Layers,
} from "lucide-react";
import { setDirectoryOpen, setDirectorySearch } from "./directorySlice";
import {
  companies,
  DIRECTORY_SECTORS,
  DIRECTORY_CATEGORIES,
  type Company,
  type SectorDefinition,
  getCompanyPrompt,
} from "../../data/cambodia-tech-directory";
import { KbachCorner } from "../../components/KhmerOrnaments";
import type { RootState } from "../../store";
import { cn } from "../../lib/utils";
import { useTranslation } from "../../i18n/useTranslation";

function getSectorIcon(iconName: string) {
  switch (iconName) {
    case "Rocket":
      return Rocket;
    case "ShoppingCart":
      return ShoppingCart;
    case "Landmark":
      return Landmark;
    case "GraduationCap":
      return GraduationCap;
    case "Palette":
      return Palette;
    case "Factory":
      return Factory;
    case "Truck":
      return Truck;
    case "Radio":
      return Radio;
    case "ShieldCheck":
      return ShieldCheck;
    default:
      return Building2;
  }
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

export default function DirectoryPanel() {
  const dispatch = useDispatch();
  const { t } = useTranslation();
  const { open, search } = useSelector((s: RootState) => s.directory);
  const [selectedCategory, setSelectedCategory] = useState<string>("All Sectors");

  const filteredCompanies = useMemo(() => {
    if (!search.trim()) return companies;
    const q = search.toLowerCase();
    return companies.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        (c.khmerName && c.khmerName.toLowerCase().includes(q)) ||
        c.description.toLowerCase().includes(q) ||
        c.tags.some((t) => t.toLowerCase().includes(q)) ||
        c.category.toLowerCase().includes(q) ||
        c.location.toLowerCase().includes(q),
    );
  }, [search]);

  // Grouped companies by sector
  const sectorsWithCompanies = useMemo(() => {
    return DIRECTORY_SECTORS.map((sec) => {
      const items = filteredCompanies.filter((c) => c.category === sec.name);
      return {
        ...sec,
        items,
      };
    }).filter((sec) => {
      if (selectedCategory === "All Sectors") {
        return sec.items.length > 0;
      }
      return sec.name === selectedCategory;
    });
  }, [filteredCompanies, selectedCategory]);

  const totalVisible = useMemo(() => {
    return sectorsWithCompanies.reduce((acc, sec) => acc + sec.items.length, 0);
  }, [sectorsWithCompanies]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 animate-fade-in select-none">
      {/* Dark backdrop */}
      <div
        className="absolute inset-0 bg-black/85 backdrop-blur-md"
        onClick={() => dispatch(setDirectoryOpen(false))}
        aria-hidden="true"
      />

      {/* Main Wide Modal Box */}
      <div className="relative z-10 flex h-[92vh] w-full max-w-7xl flex-col rounded-3xl border border-[#4A3820] bg-[#110E0A]/98 shadow-2xl shadow-black/95 backdrop-blur-2xl overflow-hidden">
        {/* Ornate Corner Elements */}
        <div className="absolute top-2 left-2 text-gold/30 pointer-events-none">
          <KbachCorner className="h-5 w-5" />
        </div>
        <div className="absolute top-2 right-2 rotate-90 text-gold/30 pointer-events-none">
          <KbachCorner className="h-5 w-5" />
        </div>

        {/* ── Top Header Section ── */}
        <div className="flex flex-col gap-3.5 border-b border-[#2C2114] p-4 sm:p-5 bg-gradient-to-b from-[#18130B] to-[#120E09] shrink-0">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-[#2D2111] to-[#161108] border border-gold/50 text-gold shadow-md">
                <Layers className="h-5.5 w-5.5" />
              </div>
              <div>
                <h2 className="font-heading text-base sm:text-lg font-bold text-[#E5C058] tracking-normal flex items-center gap-2">
                  <span>{t.directory.title}</span>
                </h2>
                <p className="text-xs text-stone-400 font-sans mt-0.5">
                  {t.directory.subtitle} — <strong className="text-gold">{companies.length}</strong> organizations across <strong className="text-gold">{DIRECTORY_SECTORS.length}</strong> sectors
                </p>
              </div>
            </div>

            <button
              onClick={() => dispatch(setDirectoryOpen(false))}
              className="flex h-8 w-8 items-center justify-center rounded-xl border border-[#3C301D] bg-[#16120C] text-stone-400 hover:text-gold hover:border-gold/60 transition-all cursor-pointer"
              aria-label={t.directory.close}
              title={t.directory.close}
            >
              <X className="h-4.5 w-4.5" />
            </button>
          </div>

          {/* Search Bar + Live Count */}
          <div className="relative flex items-center">
            <div className="relative flex-1 flex items-center gap-2.5 rounded-2xl border border-[#3C301D] bg-[#0A0805] px-3.5 py-1.5 shadow-inner focus-within:border-gold/70 focus-within:ring-1 focus-within:ring-gold/30 transition-all">
              <Search className="h-4 w-4 shrink-0 text-gold/80" />
              <input
                type="text"
                value={search}
                onChange={(e) => dispatch(setDirectorySearch(e.target.value))}
                placeholder={t.directory.searchPlaceholder}
                className="flex-1 bg-transparent py-1.5 text-xs sm:text-sm font-khmer text-stone-100 outline-none placeholder:font-khmer placeholder:text-stone-500"
                autoFocus
              />
              {search && (
                <button
                  onClick={() => dispatch(setDirectorySearch(""))}
                  className="shrink-0 text-stone-400 hover:text-stone-200 p-1 rounded-lg hover:bg-stone-800"
                  aria-label="Clear search"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Sector Navigation Filter Tabs (Clean Scrollbar Hidden) */}
          <div className="flex items-center gap-2 overflow-x-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden pt-1">
            {DIRECTORY_CATEGORIES.map((cat) => {
              const active = selectedCategory === cat;
              const sectorDef = DIRECTORY_SECTORS.find((s) => s.name === cat);
              const count =
                cat === "All Sectors"
                  ? companies.length
                  : companies.filter((c) => c.category === cat).length;
              const IconComp = sectorDef ? getSectorIcon(sectorDef.iconName) : Layers;
              const label = cat === "All Sectors" ? t.directory.allSectors : cat;

              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategory(cat)}
                  className={cn(
                    "flex shrink-0 items-center gap-2 rounded-xl px-3 py-1.5 text-xs font-semibold transition-all cursor-pointer",
                    active
                      ? "bg-gradient-to-r from-gold/25 via-gold/15 to-transparent text-gold border border-gold/70 shadow-sm"
                      : "bg-[#18130C]/80 text-stone-400 border border-[#2F2415] hover:text-stone-200 hover:border-gold/40 hover:bg-[#201910]",
                  )}
                >
                  <IconComp className={cn("h-3.5 w-3.5 shrink-0", active ? "text-gold" : "text-stone-400")} />
                  <span>{label}</span>
                  <span
                    className={cn(
                      "rounded-full px-1.5 py-0.2 text-[10px] font-mono",
                      active
                        ? "bg-gold/30 text-gold font-bold"
                        : "bg-[#251C11] text-stone-400",
                    )}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Scrollable Organizations Cards Grid ── */}
        <div className="flex-1 overflow-y-auto scrollbar-thin p-4 sm:p-6 space-y-8">
          {sectorsWithCompanies.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-stone-400">
              <Search className="h-10 w-10 mb-3 opacity-30 text-gold" />
              <p className="text-base font-khmer font-bold text-stone-300">
                {t.directory.noResults}
              </p>
            </div>
          ) : (
            sectorsWithCompanies.map((sec) => (
              <SectorSection key={sec.id} sector={sec} />
            ))
          )}
        </div>

        {/* ── Footer Status Bar ── */}
        <div className="border-t border-[#2C2114] px-5 py-3 text-xs text-stone-400 flex items-center justify-between bg-[#120E09] shrink-0 font-sans">
          <div className="flex items-center gap-2">
            <span className="flex h-2 w-2 rounded-full bg-emerald-500 shadow-sm" />
            <span>
              Displaying <strong className="text-gold">{totalVisible}</strong> organizations across{" "}
              <strong className="text-gold">{sectorsWithCompanies.length}</strong> sectors
            </span>
          </div>
          <span className="hidden sm:inline text-stone-400 text-[11px]">
            Sastra AI Cambodia Knowledge Directory
          </span>
        </div>
      </div>
    </div>
  );
}

function SectorSection({
  sector,
}: {
  sector: SectorDefinition & { items: Company[] };
}) {
  const IconComp = getSectorIcon(sector.iconName);

  return (
    <section className="space-y-3.5">
      {/* Sector Header Banner */}
      <div className="flex items-center justify-between gap-3 border-b border-[#2C2114] pb-2.5">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#221A10] border border-gold/40 text-gold shadow-xs">
            <IconComp className="h-4 w-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm sm:text-base font-bold text-stone-100 font-sans">
                {sector.name}
              </h3>
              <span className="font-khmer text-xs sm:text-sm text-gold/90 font-medium">
                ({sector.khmerName})
              </span>
            </div>
            <p className="text-xs text-stone-400 font-sans hidden sm:block mt-0.5">
              {sector.description}
            </p>
          </div>
        </div>

        <span className="rounded-full bg-[#1F180F] border border-[#3C2E1A] px-3 py-0.5 text-xs font-mono text-gold font-semibold">
          {sector.items.length} {sector.items.length === 1 ? "org" : "orgs"}
        </span>
      </div>

      {/* Company Cards Grid for this Sector */}
      <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
        {sector.items.map((company) => (
          <CompanyCard key={company.id} company={company} />
        ))}
      </div>
    </section>
  );
}

function CompanyCard({ company }: { company: Company }) {
  const dispatch = useDispatch();
  const initials = getInitials(company.name);

  function handleAsk(e?: React.MouseEvent) {
    if (e) {
      e.stopPropagation();
    }
    const prompt = getCompanyPrompt(company);
    dispatch(setDirectoryOpen(false));
    setTimeout(() => {
      window.dispatchEvent(
        new CustomEvent("cambo-ask", { detail: { prompt } }),
      );
    }, 200);
  }

  return (
    <div
      onClick={handleAsk}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          handleAsk();
        }
      }}
      className="group relative flex flex-col justify-between rounded-2xl border border-[#342718]/80 bg-gradient-to-b from-[#18130C]/95 to-[#100D08]/95 p-4 transition-all duration-300 hover:border-gold/70 hover:bg-[#1E170F] hover:shadow-2xl hover:shadow-black/70 hover:-translate-y-1 cursor-pointer select-none"
    >
      <div>
        {/* Card Header: Avatar Monogram + Title + Action Buttons */}
        <div className="flex items-start justify-between gap-2.5">
          <div className="flex items-start gap-3 min-w-0 flex-1">
            {/* Monogram Badge */}
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-gold/40 bg-gradient-to-br from-[#291F11] to-[#171109] text-gold font-bold font-mono text-xs shadow-inner group-hover:border-gold/70 group-hover:scale-105 transition-all">
              {initials}
            </div>

            {/* Title & Khmer Subtitle */}
            <div className="min-w-0 flex-1">
              <h4 className="truncate text-sm font-bold text-stone-100 group-hover:text-gold transition-colors">
                {company.name}
              </h4>
              {company.khmerName && (
                <p className="truncate font-khmer text-xs font-semibold text-gold/85 mt-0.5">
                  {company.khmerName}
                </p>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div
            className="flex items-center gap-1.5 shrink-0"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={handleAsk}
              className="flex items-center gap-1.5 px-2 py-1 rounded-lg border border-gold/40 bg-gold/10 text-gold transition-all hover:bg-gold/25 hover:border-gold/70 hover:scale-105 active:scale-95 shadow-sm"
              title={`សួរ Sastra AI អំពី ${company.khmerName || company.name}`}
              aria-label={`សួរ Sastra AI អំពី ${company.khmerName || company.name}`}
            >
              <Sparkles className="h-3.5 w-3.5 text-gold animate-pulse" />
              <span className="text-[11px] font-khmer font-semibold hidden sm:inline text-gold">
                សួរ AI
              </span>
            </button>

            {company.website && (
              <a
                href={company.website}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="flex h-7.5 w-7.5 items-center justify-center rounded-lg border border-[#3C301D] bg-[#16120C] text-stone-400 transition-all hover:bg-[#221A10] hover:text-gold hover:border-gold/50"
                title={`Visit website: ${company.website}`}
              >
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            )}
          </div>
        </div>

        {/* Description */}
        <p className="mt-3 line-clamp-3 text-xs text-stone-300/90 leading-relaxed font-sans">
          {company.description}
        </p>
      </div>

      {/* Metadata Badges & Tags */}
      <div className="mt-3.5 pt-3 border-t border-[#261C10] space-y-2">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="inline-flex items-center gap-1 rounded-md bg-[#1F180E] border border-[#362A19] px-2 py-0.5 text-[10px] font-mono text-stone-300">
            <MapPin className="h-2.5 w-2.5 text-gold/70" />
            {company.location}
          </span>
          <span className="inline-flex items-center rounded-md bg-gold/10 border border-gold/30 px-2 py-0.5 text-[10px] font-semibold text-gold">
            {company.category}
          </span>
          {company.founded && (
            <span className="text-[10px] font-mono text-stone-400">
              Est. {company.founded}
            </span>
          )}
        </div>

        {company.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {company.tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="rounded bg-[#120E09] border border-[#2B2013] px-1.5 py-0.5 text-[9px] font-mono text-stone-400"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

