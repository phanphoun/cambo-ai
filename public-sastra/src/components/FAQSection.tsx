import { useState } from "react";
import { ChevronDown, HelpCircle } from "lucide-react";
import { KhmerCardCorners } from "./KhmerOrnaments";
import { useLanguage } from "../i18n/LanguageContext";

const FAQS_KM = [
  {
    q: "តើ Sastra AI (សាស្ត្រា) គាំទ្រភាសាខ្មែរបានកម្រិតណា?",
    a: "Sastra AI ត្រូវបានរៀបចំឡើងជាពិសេសដោយផ្តោតលើវេយ្យាករណ៍ ពាក្យគន្លឹះរដ្ឋបាល បាលី-សំស្ក្រឹត និងការកាត់ពាក្យខ្មែរ (Zero-width space) យ៉ាងត្រឹមត្រូវ ១០០% ដោយគ្មានបញ្ហាអក្សរដាច់ ឬកំហុសការបកប្រែដូចម៉ូដែលបរទេសទូទៅឡើយ។",
  },
  {
    q: "តើខ្ញុំអាចប្រើប្រាស់ Sastra AI ដោយមិនចាំបាច់មានអ៊ីនធឺណិត (Offline) បានទេ?",
    a: "បាទ/ចាស! តាមរយៈម៉ូដែល Local Ollama Engine អ្នកអាចដំណើរការ AI លើម៉ាស៊ីនមេផ្ទាល់ខ្លួន (On-Premises Server) ដោយគ្មានទិន្នន័យណាមួយត្រូវបានបញ្ជូនចេញក្រៅស្ថាប័នឡើយ ស័ក្តិសមបំផុតសម្រាប់ក្រសួង ស្ថាប័នរដ្ឋ និងធនាគារ។",
  },
  {
    q: "តើការបង្កើតឯកសារ PDF & Word ដំណើរការយ៉ាងដូចម្តេច?",
    a: "នៅពេលអ្នកស្នើសុំឱ្យ AI បង្កើតរបាយការណ៍ ផែនការអាជីវកម្ម ឬលិខិតផ្លូវការ ប្រព័ន្ធនឹងចងក្រងទម្រង់ NotoSansKhmer TrueType រួមជាមួយតារាង និងក្បាលទំព័រពណ៌មាសស្វ័យប្រវត្តិតាមរយៈ ReportLab Compiler ដែលអ្នកអាចទាញយក (Export) ភ្លាមៗ។",
  },
  {
    q: "តើ Sastra AI គិតថ្លៃសេវាដែរឬទេ?",
    a: "Sastra AI ផ្តល់ជូនគណនី Guest & Member ដោយឥតគិតថ្លៃសម្រាប់សិស្ស និស្សិត និងអ្នកអភិវឌ្ឍន៍ទូទៅ ជាមួយនឹងការតភ្ជាប់ Google Gemini Flash និង Local Models។",
  },
  {
    q: "តើអ្នកអភិវឌ្ឍន៍អាចភ្ជាប់ API របស់ Sastra AI ចូលទៅក្នុងប្រព័ន្ធផ្ទាល់ខ្លួនបានទេ?",
    a: "បាន! ប្រព័ន្ធមានផ្តល់នូវ REST API ស្តង់ដារ (FastAPI SSE Streaming) ដែលគាំទ្រការតភ្ជាប់ជាមួយកម្មវិធីទូរស័ព្ទ (Flutter/React Native) គេហទំព័រ និងប្រព័ន្ធគ្រប់គ្រងសហគ្រាស (ERP)។",
  },
];

const FAQS_EN = [
  {
    q: "How accurate is Sastra AI with the Khmer language?",
    a: "Sastra AI is custom-engineered to handle complex Khmer grammar, zero-width spaces, formal administrative terminology, idioms, and Pali/Sanskrit roots with 100% syntactic precision, avoiding the translation errors common in generic foreign AI models.",
  },
  {
    q: "Can Sastra AI run completely offline without an internet connection?",
    a: "Yes! With the Local Ollama Engine, government ministries, banks, and enterprises can run models on local on-premises hardware with zero cloud token egress for air-gapped security.",
  },
  {
    q: "How does automated PDF & Word synthesis work?",
    a: "When you request a report, business proposal, or legal summary, Sastra AI compiles multi-page documents styled with NotoSansKhmer TrueType typography, gold headers, and clean tables via ReportLab, available for immediate download.",
  },
  {
    q: "Is Sastra AI free to use?",
    a: "Yes, Sastra AI provides free Guest and Member access for students, researchers, and developers, supporting Google Gemini Flash and local engine options.",
  },
  {
    q: "Can developers integrate Sastra AI into their own software?",
    a: "Yes! Sastra AI exposes standard FastAPI SSE streaming REST APIs that integrate seamlessly with mobile apps (Flutter, React Native), web applications, and enterprise systems.",
  },
];

export function FAQSection() {
  const { t, language } = useLanguage();
  const [openIdx, setOpenIdx] = useState<number | null>(0);
  const faqs = language === "km" ? FAQS_KM : FAQS_EN;

  return (
    <section id="faq" className="py-24 bg-[#080604] relative select-none">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center space-y-4 mb-16">
          <div className="inline-flex items-center gap-1.5 rounded-full border border-gold/40 bg-gold/10 px-3.5 py-1 text-xs font-semibold text-gold font-mono">
            <HelpCircle className="h-3.5 w-3.5" />
            <span>{t.faq.badge}</span>
          </div>
          <h2 className="font-heading text-2xl sm:text-4xl font-extrabold text-gold-gradient tracking-tight">
            {t.faq.title}
          </h2>
        </div>

        <div className="space-y-4">
          {faqs.map((faq, idx) => {
            const isOpen = openIdx === idx;
            return (
              <div
                key={idx}
                className="rounded-3xl border border-[#342718] bg-[#120E09]/95 overflow-hidden transition-all shadow-md hover:border-gold/50"
              >
                <button
                  onClick={() => setOpenIdx(isOpen ? null : idx)}
                  className="w-full flex items-center justify-between p-5 sm:p-6 text-left cursor-pointer hover:bg-[#18130D] transition-colors"
                >
                  <span className="font-heading font-bold text-sm sm:text-base text-stone-100 pr-4">
                    {faq.q}
                  </span>
                  <ChevronDown
                    className={`h-5 w-5 text-gold shrink-0 transition-transform duration-200 ${
                      isOpen ? "rotate-180" : ""
                    }`}
                  />
                </button>

                {isOpen && (
                  <div className="p-5 sm:p-6 pt-0 border-t border-[#261E13] text-xs sm:text-sm font-khmer text-stone-300 leading-relaxed bg-[#0E0B07] animate-fade-in">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

