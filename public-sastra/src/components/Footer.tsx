import { KhmerLotusMedallion } from "./KhmerOrnaments";
import { Heart } from "lucide-react";
import { useLanguage } from "../i18n/LanguageContext";

export function Footer() {
  const { t } = useLanguage();

  return (
    <footer className="border-t border-[#261E13] bg-[#070503] text-stone-400 text-xs select-none relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
          {/* Col 1 */}
          <div className="space-y-3">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-gradient-to-br from-[#2D2111] via-[#1A140C] to-[#100C07] text-gold border border-gold/60 p-1 shadow-md">
                <KhmerLotusMedallion className="h-full w-full" glow />
              </div>
              <span className="font-heading font-bold text-sm text-gold-gradient tracking-tight">
                SASTRA AI
              </span>
            </div>
            <p className="text-[11px] text-stone-400 font-khmer leading-relaxed">
              {t.footer.description}
            </p>
          </div>

          {/* Col 2 */}
          <div className="space-y-2.5">
            <span className="text-[11px] uppercase font-mono font-bold text-gold/90">{t.footer.platformServices}</span>
            <ul className="space-y-1.5 text-stone-400 text-xs font-khmer">
              <li><a href="http://localhost:5173/?auth=login" className="hover:text-gold transition-colors">{t.footer.chatAssistant}</a></li>
              <li><a href="#features" className="hover:text-gold transition-colors">{t.footer.capabilities}</a></li>
              <li><a href="#models" className="hover:text-gold transition-colors">{t.footer.aiModels}</a></li>
            </ul>
          </div>

          {/* Col 3 */}
          <div className="space-y-2.5">
            <span className="text-[11px] uppercase font-mono font-bold text-gold/90">{t.footer.aiTechnologies}</span>
            <ul className="space-y-1.5 text-stone-400 text-xs font-sans">
              <li><span>Google Gemini 3.7 Flash</span></li>
              <li><span>MiniMax M3 Cloud Engine</span></li>
              <li><span>Ollama Qwen 2.5 Offline</span></li>
              <li><span>ReportLab TrueType UTF-8</span></li>
            </ul>
          </div>

          {/* Col 4 */}
          <div className="space-y-2.5">
            <span className="text-[11px] uppercase font-mono font-bold text-gold/90">{t.footer.sovereignty}</span>
            <p className="text-[11px] text-stone-400 font-khmer leading-relaxed">
              {t.footer.sovereigntyDesc}
            </p>
          </div>
        </div>

        <div className="pt-6 border-t border-[#1C160F] flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-stone-500">
          <p>{t.footer.copyright}</p>
          <p className="flex items-center gap-1 font-khmer">
            <span>{t.footer.madeWithLove}</span>
            <Heart className="h-3 w-3 text-rose-500 fill-rose-500 inline" />
          </p>
        </div>
      </div>
    </footer>
  );
}

