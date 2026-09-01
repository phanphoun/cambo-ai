import { Landmark, CreditCard, Scale, GraduationCap, Building2, Stethoscope } from "lucide-react";
import { KhmerCardCorners } from "./KhmerOrnaments";
import { useLanguage } from "../i18n/LanguageContext";

const ICONS = [Landmark, CreditCard, Scale, GraduationCap, Building2, Stethoscope];

const CASES_KM = [
  {
    category: "រាជរដ្ឋាភិបាល & រដ្ឋបាលសាធារណៈ",
    categoryEn: "Government & Public Administration",
    description: "ចងក្រងសេចក្តីព្រាងលិខិតផ្លូវការ សេចក្តីសង្ខេបព្រះរាជក្រម និងលិខិតរដ្ឋបាលតាមទម្រង់ឋានានុក្រមផ្លូវការ។",
    tags: ["វិភាគប្រកាស", "ព្រាងលិខិតផ្លូវការ", "បកប្រែទ្វេភាសា"],
  },
  {
    category: "ធនាគារ & ហិរញ្ញវត្ថុ (Fintech & KHQR)",
    categoryEn: "Banking, NBC Bakong & KHQR",
    description: "បង្កើតកូដតភ្ជាប់ Bakong KHQR API, វិភាគប្រតិបត្តិការមិនប្រក្រតី និងចងក្រងរបាយការណ៍វាយតម្លៃឥណទាន។",
    tags: ["Bakong EMVCo", "KHQR Pay Gateway", "Financial RAG"],
  },
  {
    category: "ច្បាប់ & នីតិសាស្ត្រកម្ពុជា",
    categoryEn: "Legal & Regulatory Compliance",
    description: "ផ្ទៀងផ្ទាត់មាត្រាច្បាប់ឆ្លងកាត់ក្រមរដ្ឋប្បវេណី ក្រមព្រហ្មទណ្ឌ ច្បាប់ការងារ និងច្បាប់វិនិយោគ។",
    tags: ["ច្បាប់ការងារ", "គម្រោងវិនិយោគ QIP", "ពិនិត្យកិច្ចសន្យា"],
  },
  {
    category: "ការអប់រំ & ការស្រាវជ្រាវវប្បធម៌",
    categoryEn: "Higher Education & Cultural Heritage",
    description: "គាំទ្រនិស្សិត និងអ្នកស្រាវជ្រាវក្នុងការសិក្សាឬសគល់ពាក្យបាលី-សំស្ក្រឹត ប្រវត្តិសាស្ត្រអង្គរ និងមុខវិជ្ជា STEM។",
    tags: ["អក្សរសាស្ត្រខ្មែរ", "បង្រៀន STEM", "ទម្រង់និក្ខេបបទ"],
  },
  {
    category: "សហគ្រាសធុនតូច & មធ្យម (SME)",
    categoryEn: "Enterprise & SME Digital Operations",
    description: "បង្កើតយុទ្ធសាស្ត្រទីផ្សារ ឆ្លើយតបអតិថិជន និងរៀបចំផែនការអាជីវកម្មពហុទំព័រដោយស្វ័យប្រវត្តិ។",
    tags: ["ផែនការអាជីវកម្ម", "អនុលោមភាពពន្ធ", "សេវាអតិថិជន"],
  },
  {
    category: "សុខាភិបាល & ការថែទាំសុខភាព",
    categoryEn: "Public Health & Medical Information",
    description: "បកប្រែពាក្យវេជ្ជសាស្ត្រជាភាសាខ្មែរងាយយល់ និងសង្ខេបគោលការណ៍ណែនាំសុខភាពសាធារណៈ។",
    tags: ["ពាក្យបច្ចេកទេសពេទ្យ", "ការណែនាំអ្នកជំងឺ", "សុខភាពសាធារណៈ"],
  },
];

const CASES_EN = [
  {
    category: "Government & Public Administration",
    categoryEn: "រាជរដ្ឋាភិបាល & រដ្ឋបាលសាធារណៈ",
    description: "Automate administrative drafts, royal decree summaries, and official letter composition in proper formal Khmer honorific style.",
    tags: ["Prakas Analysis", "Official Letter Drafts", "Bilingual Translation"],
  },
  {
    category: "Banking, NBC Bakong & KHQR",
    categoryEn: "ធនាគារ & ហិរញ្ញវត្ថុ (Fintech & KHQR)",
    description: "Generate compliant Bakong API payload integration code, analyze transaction anomalies, and synthesize loan appraisal reports.",
    tags: ["Bakong EMVCo", "KHQR Pay Gateway", "Financial RAG"],
  },
  {
    category: "Legal & Regulatory Compliance",
    categoryEn: "ច្បាប់ & នីតិសាស្ត្រកម្ពុជា",
    description: "Instant cross-referencing across the Civil Code, Criminal Code, Labor Law, and Commercial Enterprise Law with chapter citations.",
    tags: ["Labor Law", "Investment QIP", "Contract Review"],
  },
  {
    category: "Higher Education & Cultural Heritage",
    categoryEn: "ការអប់រំ & ការស្រាវជ្រាវវប្បធម៌",
    description: "Assist university students and researchers in Pali/Sanskrit etymology, Angkorian history, and STEM subject tutoring in Khmer.",
    tags: ["Khmer Literature", "STEM Tutoring", "Thesis Formatting"],
  },
  {
    category: "Enterprise & SME Digital Operations",
    categoryEn: "សហគ្រាសធុនតូច & មធ្យម (SME)",
    description: "Create marketing strategies, customer support responses, inventory analytics, and automated multi-page business plans.",
    tags: ["Business Plans", "Tax Compliance", "Customer Care"],
  },
  {
    category: "Public Health & Medical Information",
    categoryEn: "សុខាភិបាល & ការថែទាំសុខភាព",
    description: "Translate medical terms into patient-friendly Khmer advice, analyze symptoms, and summarize public health guidelines.",
    tags: ["Medical Terminology", "Patient Guides", "Health Protocols"],
  },
];

export function UseCases() {
  const { t, language } = useLanguage();
  const cases = language === "km" ? CASES_KM : CASES_EN;

  return (
    <section id="use-cases" className="py-24 bg-[#080604] relative select-none">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto space-y-4 mb-16">
          <div className="inline-flex items-center gap-1.5 rounded-full border border-gold/40 bg-gold/10 px-3.5 py-1 text-xs font-semibold text-gold font-mono">
            <Building2 className="h-3.5 w-3.5" />
            <span>{t.useCases.badge}</span>
          </div>
          <h2 className="font-heading text-2xl sm:text-4xl font-extrabold text-gold-gradient tracking-tight">
            {t.useCases.title}
          </h2>
          <p className="text-xs sm:text-sm text-stone-400 font-khmer leading-relaxed">
            {t.useCases.subtitle}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {cases.map((uc, i) => {
            const Icon = ICONS[i] || Building2;
            return (
              <div
                key={i}
                className="rounded-3xl border border-[#342718] bg-[#120E09]/95 p-6 space-y-4 shadow-lg hover:border-gold/60 hover:bg-[#18130C] transition-all group relative"
              >
                <KhmerCardCorners size="w-4 h-4" opacity="opacity-30 group-hover:opacity-75 transition-opacity" />

                <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-gold/50 bg-gradient-to-br from-[#2D2111] via-[#1A140C] to-[#100C07] text-gold shadow-md group-hover:scale-105 transition-transform">
                  <Icon className="h-6 w-6" />
                </div>

                <div className="space-y-1">
                  <h3 className="font-heading font-bold text-base text-stone-100 group-hover:text-gold transition-colors">
                    {uc.category}
                  </h3>
                  <h4 className="font-sans font-semibold text-xs text-gold/80">
                    {uc.categoryEn}
                  </h4>
                </div>

                <p className="text-xs text-stone-400 font-khmer leading-relaxed">
                  {uc.description}
                </p>

                <div className="flex flex-wrap gap-1.5 pt-2 border-t border-[#261E13]">
                  {uc.tags.map((t) => (
                    <span key={t} className="rounded-md bg-[#1D160E] border border-gold/20 px-2 py-0.5 text-[10px] text-gold/90 font-mono">
                      {t}
                    </span>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

