import { useState } from "react";
import { Sparkles, FileText, Download, ArrowRight, ExternalLink } from "lucide-react";
import { KhmerLotusMedallion, KhmerCardCorners } from "./KhmerOrnaments";
import { useLanguage } from "../i18n/LanguageContext";

export function LiveInteractiveDemo() {
  const { t } = useLanguage();
  const [selectedId, setSelectedId] = useState<string>("legal-doc");

  const samples = t.demo.samples;
  const current = samples.find((s) => s.id === selectedId) || samples[0];

  return (
    <section id="demo" className="py-20 bg-[#0C0906] relative select-none border-y border-[#261E13]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto space-y-3 mb-12">
          <div className="inline-flex items-center gap-1.5 rounded-full border border-gold/40 bg-gold/10 px-3.5 py-1 text-[11px] font-semibold text-gold font-mono">
            <Sparkles className="h-3.5 w-3.5" />
            <span>{t.demo.badge}</span>
          </div>
          <h2 className="font-heading text-2xl sm:text-4xl font-extrabold text-gold-gradient tracking-tight">
            {t.demo.title}
          </h2>
          <p className="text-xs sm:text-sm text-stone-400 font-khmer">
            {t.demo.subtitle}
          </p>
        </div>

        {/* Prompt Selector Pills */}
        <div className="flex items-center justify-center gap-2 flex-wrap mb-8">
          {samples.map((sample) => (
            <button
              key={sample.id}
              onClick={() => setSelectedId(sample.id)}
              className={`rounded-2xl px-4 py-2 text-xs font-semibold font-khmer transition-all cursor-pointer border ${
                selectedId === sample.id
                  ? "border-gold bg-gold/20 text-gold shadow-md shadow-gold/10 scale-105"
                  : "border-[#3A2D19] bg-[#14100C] text-stone-400 hover:text-stone-200 hover:border-gold/40"
              }`}
            >
              {sample.tag}
            </button>
          ))}
        </div>

        {/* Live Interactive Chat Preview Window */}
        <div className="max-w-4xl mx-auto rounded-3xl border-2 border-[#523E1E] bg-[#14100C] shadow-2xl shadow-black overflow-hidden relative">
          <KhmerCardCorners size="w-5 h-5" opacity="opacity-50" />

          {/* Mock Window Topbar */}
          <div className="flex items-center justify-between border-b border-[#2C2114] bg-[#1A140E] px-4 py-3">
            <div className="flex items-center gap-2">
              <div className="flex h-3 w-3 rounded-full bg-rose-500/80" />
              <div className="flex h-3 w-3 rounded-full bg-amber-500/80" />
              <div className="flex h-3 w-3 rounded-full bg-emerald-500/80" />
              <span className="text-[11px] font-mono text-stone-400 ml-2">
                {t.demo.terminalTitle}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <span className="rounded-full bg-gold/15 border border-gold/40 px-2.5 py-0.5 text-[10px] font-mono font-bold text-gold">
                {current.model}
              </span>
              <a
                href="http://localhost:5173/?auth=login"
                className="text-[11px] text-gold hover:underline flex items-center gap-1 font-semibold"
              >
                <span>{t.demo.launchInPortal}</span>
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          </div>

          {/* Chat Stream Body */}
          <div className="p-5 sm:p-7 space-y-5 bg-gradient-to-b from-[#14100C] to-[#0E0C09]">
            {/* User Message */}
            <div className="flex items-start justify-end gap-3 animate-fade-in">
              <div className="max-w-[85%] rounded-2xl border border-gold/30 bg-[#241A0E] p-4 text-xs sm:text-sm text-stone-100 font-khmer shadow-md text-right">
                {current.prompt}
              </div>
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-gold to-amber-700 text-black font-bold text-xs shadow-md">
                {t.demo.you}
              </div>
            </div>

            {/* AI Assistant Message */}
            <div className="flex items-start gap-3 animate-fade-in">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[#1E170F] border border-gold/60 text-gold shadow-md p-1">
                <KhmerLotusMedallion className="h-full w-full" glow />
              </div>
              <div className="flex-1 space-y-3 min-w-0">
                <div className="rounded-2xl border border-[#342718] bg-[#17120B] p-5 text-xs sm:text-sm text-stone-200 font-khmer leading-relaxed whitespace-pre-wrap shadow-lg">
                  {current.response}

                  {/* Document Card Preview if applicable */}
                  {current.docTitle && (
                    <div className="mt-4 flex items-center justify-between rounded-2xl border border-gold/40 bg-gold/10 p-3.5 shadow-sm">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gold/20 text-gold border border-gold/50">
                          <FileText className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="font-bold text-xs text-stone-100">{current.docTitle}</p>
                          <p className="text-[10px] text-gold font-mono">{current.docPages} Pages • ReportLab TrueType UTF-8</p>
                        </div>
                      </div>
                      <a
                        href="http://localhost:5173/?auth=login"
                        className="flex items-center gap-1 rounded-xl bg-gold px-3.5 py-1.5 text-xs font-bold text-black hover:brightness-110 shadow-xs cursor-pointer"
                      >
                        <Download className="h-3.5 w-3.5 stroke-[2.5]" />
                        <span>{t.demo.exportDoc}</span>
                      </a>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Action Footer */}
          <div className="border-t border-[#2C2114] bg-[#110D08] px-5 py-3.5 flex items-center justify-between">
            <span className="text-[11px] text-stone-500 font-mono">
              {t.demo.footerNote}
            </span>
            <a
              href="http://localhost:5173/?auth=login"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-gold hover:text-gold-light font-khmer"
            >
              <span>{t.demo.tryInChat}</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}

