import { useState, useEffect } from "react";
import { ArrowRight, Menu, X, ChevronDown } from "lucide-react";
import { KhmerLotusMedallion } from "./KhmerOrnaments";
import { useLanguage } from "../i18n/LanguageContext";
import { useScrollReveal } from "../hooks/useScrollReveal";

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [langMenuOpen, setLangMenuOpen] = useState(false);
  const { language, setLanguage, t } = useLanguage();
  const { ref, visible } = useScrollReveal();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <nav
      ref={ref}
      className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 select-none ${
        scrolled
          ? "bg-[#0A0805]/95 border-b border-[#3C2D18] backdrop-blur-xl shadow-2xl shadow-black/80"
          : "bg-transparent"
      } ${visible ? "animate-fade-in-down" : "opacity-0"}`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          {/* Logo */}
          <a href="#" className="flex items-center gap-3 group">
            <div className="flex h-10 w-10 sm:h-11 sm:w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-[#2D2111] via-[#1A140C] to-[#100C07] border border-gold/60 text-gold shadow-lg shadow-black/80 p-1 group-hover:scale-105 transition-all">
              <KhmerLotusMedallion className="h-full w-full" glow />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-heading font-bold text-base sm:text-xl text-gold-gradient tracking-tight">
                  SASTRA AI
                </span>
                <span className="font-khmer font-bold text-xs sm:text-sm text-gold/90">
                  (សាស្ត្រា)
                </span>
              </div>
              <p className="text-[10px] text-stone-500 font-mono tracking-wider">
                {t.nav.tagline}
              </p>
            </div>
          </a>

          {/* Desktop Nav Links */}
          <div className="hidden lg:flex items-center gap-7 text-[13px] font-semibold text-stone-300 font-khmer">
            {[
              { href: "#features", label: t.nav.capabilities },
              { href: "#models", label: t.nav.aiEngine },
              { href: "#demo", label: t.nav.interactiveDemo },
              { href: "#use-cases", label: t.nav.useCases },
              { href: "#architecture", label: t.nav.architecture },
              { href: "#faq", label: t.nav.faq },
            ].map((item, idx) => (
              <a
                key={item.href}
                href={item.href}
                className="hover:text-gold transition-colors"
                style={{ animation: visible ? `fadeIn 0.5s cubic-bezier(0.16,1,0.3,1) ${0.1 + idx * 0.04}s forwards` : undefined }}
              >
                {item.label}
              </a>
            ))}
          </div>

          {/* CTA & Language Selector Group */}
          <div className="hidden sm:flex items-center gap-3">
            {/* Language Switcher Pill */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setLangMenuOpen(!langMenuOpen)}
                className="flex items-center gap-1.5 rounded-2xl border border-[#3C301D] bg-[#16120C] px-3.5 py-2 text-xs font-semibold text-stone-200 hover:border-gold/50 hover:text-gold transition-all cursor-pointer shadow-xs"
              >
                <span className="text-sm">{language === "km" ? "🇰🇭" : "🇬🇧"}</span>
                <span className="font-sans font-bold">{language === "km" ? "ភាសាខ្មែរ" : "English"}</span>
                <ChevronDown className="h-3.5 w-3.5 opacity-60" />
              </button>

              {langMenuOpen && (
                <div className="absolute right-0 mt-2 w-40 rounded-2xl border border-[#3C301D] bg-[#14100C] p-1.5 shadow-2xl shadow-black z-30 animate-fade-in font-sans">
                  <button
                    type="button"
                    onClick={() => {
                      setLanguage("km");
                      setLangMenuOpen(false);
                    }}
                    className={`w-full flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold text-left cursor-pointer transition-colors ${
                      language === "km" ? "bg-gold/20 text-gold" : "text-stone-300 hover:bg-[#1F1911]"
                    }`}
                  >
                    <span className="text-sm">🇰🇭</span>
                    <span>ភាសាខ្មែរ (KM)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setLanguage("en");
                      setLangMenuOpen(false);
                    }}
                    className={`w-full flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold text-left cursor-pointer transition-colors ${
                      language === "en" ? "bg-gold/20 text-gold" : "text-stone-300 hover:bg-[#1F1911]"
                    }`}
                  >
                    <span className="text-sm">🇬🇧</span>
                    <span>English (EN)</span>
                  </button>
                </div>
              )}
            </div>

            {/* MAIN GET STARTED BUTTON */}
            <a
              href="http://localhost:5173/?auth=login"
              className="flex items-center gap-2 rounded-2xl border border-gold/60 bg-gradient-to-r from-gold via-amber-500 to-amber-700 px-5 py-2.5 text-xs font-bold text-black shadow-lg shadow-gold/20 hover:shadow-gold/30 hover:brightness-110 hover:translate-y-[-1px] active:translate-y-[0px] transition-all cursor-pointer animate-fade-in-up"
              style={{ animationDelay: "0.15s" }}
            >
              <span>{t.nav.getStarted}</span>
              <ArrowRight className="h-3.5 w-3.5 stroke-[3]" />
            </a>
          </div>

          {/* Mobile menu trigger */}
          <div className="sm:hidden flex items-center gap-2">
            <button
              type="button"
              onClick={() => setLanguage(language === "km" ? "en" : "km")}
              className="flex items-center gap-1 rounded-xl border border-[#3C301D] bg-[#14100C] px-2.5 py-1.5 text-xs font-semibold text-gold cursor-pointer"
            >
              <span>{language === "km" ? "🇰🇭 KM" : "🇬🇧 EN"}</span>
            </button>

            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#3C301D] bg-[#14100C] text-stone-400 hover:text-gold cursor-pointer"
              aria-label="Toggle menu"
            >
              {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Dropdown */}
      {mobileOpen && (
        <div className="sm:hidden border-b border-[#3C2D18] bg-[#0E0C09] px-4 py-5 space-y-4 animate-fade-in shadow-2xl">
          <div className="flex flex-col space-y-3 text-xs font-semibold text-stone-300 font-khmer">
            <a href="#features" onClick={() => setMobileOpen(false)} className="hover:text-gold py-1">
              {t.nav.capabilities}
            </a>
            <a href="#models" onClick={() => setMobileOpen(false)} className="hover:text-gold py-1">
              {t.nav.aiEngine}
            </a>
            <a href="#demo" onClick={() => setMobileOpen(false)} className="hover:text-gold py-1">
              {t.nav.interactiveDemo}
            </a>
            <a href="#use-cases" onClick={() => setMobileOpen(false)} className="hover:text-gold py-1">
              {t.nav.useCases}
            </a>
            <a href="#architecture" onClick={() => setMobileOpen(false)} className="hover:text-gold py-1">
              {t.nav.architecture}
            </a>
            <a href="#faq" onClick={() => setMobileOpen(false)} className="hover:text-gold py-1">
              {t.nav.faq}
            </a>
          </div>

          <div className="pt-3 border-t border-[#261E13] flex flex-col gap-2.5">
            <a
              href="http://localhost:5173/?auth=login"
              className="flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-gold via-amber-500 to-amber-700 py-2.5 text-xs font-bold text-black shadow-md"
            >
              <span>{t.nav.launchApp}</span>
              <ArrowRight className="h-3.5 w-3.5 stroke-[3]" />
            </a>
          </div>
        </div>
      )}
    </nav>
  );
}
