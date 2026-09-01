import { Layers } from "lucide-react";
import { KhmerCardCorners } from "./KhmerOrnaments";
import { useLanguage } from "../i18n/LanguageContext";

export function ArchitectureSection() {
  const { t, language } = useLanguage();

  const stack = [
    {
      label: language === "km" ? "ចំណុចប្រទាក់អ្នកប្រើ (Frontend)" : "Frontend Client",
      tech: "React 19 + TypeScript + Vite + TailwindCSS",
      desc: language === "km" ? "ចំណុចប្រទាក់រហ័ស ស្បែកខ្មៅមាសអភិជន និងពុម្ពអក្សរខ្មែរច្បាស់ត្រជាក់ភ្នែក" : "Ultra-responsive client with solid dark aesthetic and Khmer typography",
    },
    {
      label: language === "km" ? "ម៉ាស៊ីនមេ API ល្បឿនលឿន" : "High-Speed Async API",
      tech: "Python 3.11 + FastAPI + Uvicorn Async",
      desc: language === "km" ? "ច្រកបញ្ជូនទិន្នន័យ Streaming SSE ជាមួយនឹងប្រព័ន្ធផ្ទៀងផ្ទាត់ JWT Token" : "Low-latency streaming SSE endpoints with token authorization",
    },
    {
      label: language === "km" ? "ម៉ាស៊ីនចងក្រងឯកសារ" : "Document Compiler",
      tech: "ReportLab + NotoSansKhmer TrueType",
      desc: language === "km" ? "បង្កើតឯកសារ PDF & Word ពហុទំព័រ រួមជាមួយតារាង និងក្បាលទំព័រពណ៌មាស" : "Multi-page PDF and Docx document generation engine with custom tables",
    },
    {
      label: language === "km" ? "ស្វែងរកទិន្នន័យ (Vector RAG)" : "Vector Search (RAG)",
      tech: "Sentence-Transformers + Custom Vector Store",
      desc: language === "km" ? "ប្រព័ន្ធទាញយកទិន្នន័យផ្អែកលើបរិបទច្បាប់ និងឯកសាររដ្ឋកម្ពុជា" : "Contextual embedding retrieval grounded on local Cambodian datasets",
    },
    {
      label: language === "km" ? "ម៉ាស៊ីនសំឡេងអាន AI" : "Speech Synthesis Engine",
      tech: "Edge Neural TTS (Piseth & Sreymom)",
      desc: language === "km" ? "សំឡេងអានភាសាខ្មែរធម្មជាតិ អាចស្តាប់បានយ៉ាងរលូន" : "High-definition Khmer speech synthesis with natural cadence",
    },
    {
      label: language === "km" ? "ទិន្នន័យ & សុវត្ថិភាព" : "Relational Storage",
      tech: "PostgreSQL 16 + Async Session Store",
      desc: language === "km" ? "រក្សាទុកទិន្នន័យគណនី និងប្រវត្តិសន្ទនាដោយសុវត្ថិភាពខ្ពស់" : "Encrypted user sessions, conversation persistence and telemetry logs",
    },
  ];

  return (
    <section id="architecture" className="py-24 bg-[#0A0805] relative select-none border-t border-[#261E13]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto space-y-4 mb-16">
          <div className="inline-flex items-center gap-1.5 rounded-full border border-gold/40 bg-gold/10 px-3.5 py-1 text-xs font-semibold text-gold font-mono">
            <Layers className="h-3.5 w-3.5" />
            <span>{t.architecture.badge}</span>
          </div>
          <h2 className="font-heading text-2xl sm:text-4xl font-extrabold text-gold-gradient tracking-tight">
            {t.architecture.title}
          </h2>
          <p className="text-xs sm:text-sm text-stone-400 font-khmer leading-relaxed">
            {t.architecture.subtitle}
          </p>
        </div>

        {/* Stack Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {stack.map((item, i) => (
            <div key={i} className="rounded-3xl border border-[#342718] bg-[#120E09]/95 p-5 space-y-2 shadow-lg relative group hover:border-gold/50 transition-all">
              <KhmerCardCorners size="w-3.5 h-3.5" opacity="opacity-25 group-hover:opacity-65 transition-opacity" />

              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase font-mono font-bold text-gold/90 tracking-wider">
                  {item.label}
                </span>
                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              </div>
              <h4 className="text-sm font-bold text-stone-100 font-mono">
                {item.tech}
              </h4>
              <p className="text-xs text-stone-400 font-khmer leading-relaxed">
                {item.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

