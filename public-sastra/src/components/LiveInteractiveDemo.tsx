import { useState, useEffect, useRef } from "react";
import {
  Sparkles,
  FileText,
  Download,
  ArrowRight,
  ExternalLink,
  Copy,
  CheckCircle2,
  Volume2,
  VolumeX,
  Play,
  Pause,
  RotateCcw,
  SkipBack,
  SkipForward,
  Maximize2,
  Minimize2,
  Tv,
  Film,
  Zap,
} from "lucide-react";
import { KhmerLotusMedallion, KhmerCardCorners } from "./KhmerOrnaments";
import { useLanguage } from "../i18n/LanguageContext";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface Chapter {
  id: string;
  tagKm: string;
  tagEn: string;
  titleKm: string;
  titleEn: string;
  promptKm: string;
  promptEn: string;
  responseKm: string;
  responseEn: string;
  docTitle?: string;
  docPages?: number;
  model: string;
}

const CHAPTERS: Chapter[] = [
  {
    id: "legal-doc",
    tagKm: "🎬 វគ្គ ១៖ ច្បាប់វិនិយោគកម្ពុជា & បង្កើត PDF",
    tagEn: "🎬 Scene 1: Cambodian Investment Law & PDF",
    titleKm: "ការវិភាគក្រមច្បាប់វិនិយោគ និងចងក្រងឯកសារ PDF ស្វ័យប្រវត្តិ",
    titleEn: "Regulatory Legal Analysis & Automated PDF Synthesis",
    promptKm: "សូមបង្កើតរបាយការណ៍សង្ខេបអំពី «ច្បាប់ស្តីពីការវិនិយោគនៃព្រះរាជាណាចក្រកម្ពុជា» ជាមួយនឹងតារាងប្រៀបធៀបការលើកទឹកចិត្តពន្ធជាទម្រង់ PDF",
    promptEn: "Please draft an executive summary of the \x27Law on Investment of the Kingdom of Cambodia\x27 with a tax incentive comparison table in downloadable PDF format.",
    responseKm: `### របាយការណ៍វិភាគ៖ ច្បាប់ស្តីពីការវិនិយោគថ្មីនៃព្រះរាជាណាចក្រកម្ពុជា (ច្បាប់ឆ្នាំ២០២១)\n\n**សេចក្តីសង្ខេបប្រតិបត្តិ (Executive Summary)**\nច្បាប់ស្តីពីការវិនិយោគថ្មី បានបង្កើតក្របខ័ណ្ឌគតិយុត្តដ៏ទាក់ទាញបំផុតនៅតំបន់អាស៊ីអាគ្នេយ៍ ដើម្បីជំរុញឧស្សាហកម្មបច្ចេកវិទ្យាខ្ពស់ និងឌីជីថលូបនីយកម្ម។\n\n#### តារាងប្រៀបធៀបការលើកទឹកចិត្តពន្ធលើប្រាក់ចំណូល (Tax Incentives)\n| ប្រភេទគម្រោង (QIP) | រយៈពេលលើកលែងពន្ធ | ការលើកលែងពន្ធនាំចូល |\n| :--- | :--- | :--- |\n| **វិស័យបច្ចេកវិទ្យា & ឌីជីថល** | រហូតដល់ ៩ ឆ្នាំ | ១០០% គ្រឿងចក្រ & វត្ថុធាតុដើម |\n| **កសិ-ឧស្សាហកម្មកែច្នៃ** | ៦ ទៅ ៩ ឆ្នាំ | លើកលែងពន្ធគយ និងអាករ |\n| **សហគ្រាសធុនតូច & មធ្យម (SME)** | ៣ ទៅ ៦ ឆ្នាំ | គាំទ្រការបណ្តុះបណ្តាលវិជ្ជាជីវៈ |\n\n✅ *ឯកសារ PDF & Word ត្រូវបានបង្កើតដោយស្វ័យប្រវត្តិតាមរយៈ ReportLab ជាមួយនឹងពុម្ពអក្សរ NotoSansKhmer និងតារាងស្តង់ដារ!*`,
    responseEn: `### Analysis Report: Cambodia\x27s New Law on Investment (2021)\n\n**Executive Summary**\nThe new investment law creates one of the most attractive regulatory frameworks in Southeast Asia to stimulate high-tech industries and digital transformation.\n\n#### Profit Tax Exemption Comparison Table (Tax Incentives)\n| Project Type (QIP) | Income Tax Exemption Period | Customs Import Exemption |\n| :--- | :--- | :--- |\n| **High-Tech & Digital Sectors** | Up to 9 Years | 100% Production Machinery & Raw Materials |\n| **Agro-Industrial Processing** | 6 to 9 Years | Full Customs Duty & Special Tax Waiver |\n| **Small & Medium Enterprises (SMEs)** | 3 to 6 Years | Vocational Training Subsidies |\n\n✅ *PDF & Word documents generated automatically via ReportLab with NotoSansKhmer typography!*`,
    docTitle: "របាយការណ៍វិភាគច្បាប់វិនិយោគកម្ពុជា.pdf",
    docPages: 4,
    model: "Gemini 3.7 Flash · Khmer RAG",
  },
  {
    id: "fintech-bakong",
    tagKm: "🎬 វគ្គ ២៖ ការតភ្ជាប់ Bakong KHQR Open API",
    tagEn: "🎬 Scene 2: Bakong KHQR & OpenAPI Architecture",
    titleKm: "ការសរសេរកូដតភ្ជាប់ប្រព័ន្ធទូទាត់បាគង KHQR របស់ធនាគារជាតិ",
    titleEn: "National Bank of Cambodia Bakong KHQR Integration Code",
    promptKm: "តើអ្នកអភិវឌ្ឍន៍ Fintech នៅភ្នំពេញអាចភ្ជាប់ NBC Bakong KHQR Open API ជាមួយប្រព័ន្ធ FastAPI យ៉ាងដូចម្តេច?",
    promptEn: "How can Fintech developers in Phnom Penh integrate NBC Bakong KHQR Open API with a FastAPI backend?",
    responseKm: `### ការណែនាំអំពីការភ្ជាប់ NBC Bakong KHQR Payment Gateway\n\nដើម្បីបង្កើត Payload ទូទាត់ប្រាក់ KHQR ស្តង់ដារ EMVCo សម្រាប់អាជីវករនៅកម្ពុជា៖\n\n\`\`\`python\nfrom fastapi import FastAPI\nimport hashlib, hmac\n\napp = FastAPI(title="Bakong Payment Gateway")\n\n@app.post("/api/khqr/generate")\nasync def generate_khqr(amount_khr: int, bill_number: str):\n    payload = {\n        "bakong_account": "sastra_tech@nbc",\n        "currency": "KHR",\n        "amount": amount_khr,\n        "bill_no": bill_number,\n        "crc": "0x4F2A"\n    }\n    return {"status": "success", "khqr_string": "00020101021229370016bakong@nbc..."}\n\`\`\`\n\n💡 **ចំណាំ**៖ Sastra AI ផ្តល់នូវកូដគំរូតភ្ជាប់ស្តង់ដារ EMVCo នៃធនាគារជាតិនៃកម្ពុជា ព្រមទាំងការផ្ទៀងផ្ទាត់ Webhook ប្រកបដោយសុវត្ថិភាពខ្ពស់។`,
    responseEn: `### NBC Bakong KHQR Payment Gateway Integration Guide\n\nTo generate an EMVCo-compliant KHQR payment payload for Cambodian merchants:\n\n\`\`\`python\nfrom fastapi import FastAPI\nimport hashlib, hmac\n\napp = FastAPI(title="Bakong Payment Gateway")\n\n@app.post("/api/khqr/generate")\nasync def generate_khqr(amount_khr: int, bill_number: str):\n    payload = {\n        "bakong_account": "sastra_tech@nbc",\n        "currency": "KHR",\n        "amount": amount_khr,\n        "bill_no": bill_number,\n        "crc": "0x4F2A"\n    }\n    return {"status": "success", "khqr_string": "00020101021229370016bakong@nbc..."}\n\`\`\`\n\n💡 **Note**: Sastra AI provides production-ready NBC EMVCo integration code with secure HMAC webhook signature verification.`,
    docTitle: "Bakong_KHQR_Integration_Guide.pdf",
    docPages: 2,
    model: "MiniMax M3 · Cloud Reasoning",
  },
  {
    id: "history-angkor",
    tagKm: "🎬 វគ្គ ៣៖ ប្រវត្តិសាស្ត្រអង្គរ & បាលី-សំស្ក្រឹត",
    tagEn: "🎬 Scene 3: Khmer History & Sanskrit Heritage",
    titleKm: "ការស្រាវជ្រាវប្រវត្តិសាស្ត្រ និងសិលាចារឹកខ្មែរបុរាណ",
    titleEn: "Ancient Khmer History & Inscription Heritage Research",
    promptKm: "រៀបរាប់អំពីប្រវត្តិ និងស្ថាបត្យកម្មប្រាសាទបាយ័ន ក្នុងរាជ្យព្រះបាទជ័យវរ្ម័នទី៧",
    promptEn: "Describe the history and architectural symbolism of Bayon Temple during the reign of King Jayavarman VII.",
    responseKm: `### ប្រាសាទបាយ័ន៖ មហាសោភ័ណភាពនៃសិល្បៈបាយ័ន\n\n**ប្រាសាទបាយ័ន (Bayon Temple)** ត្រូវបានកសាងឡើងនៅចុងសតវត្សរ៍ទី១២ និងដើមសតវត្សរ៍ទី១៣ ក្នុងរជ្ជកាល **ព្រះបាទជ័យវរ្ម័នទី៧** ស្ថិតនៅចំកណ្តាលនៃរាជធានីអង្គរធំ។\n\n#### លក្ខណៈស្ថាបត្យកម្មដ៏ពិសិដ្ឋ\n1. **កំពូលព្រហ្មមុខបួន**៖ មានប្រាង្គចំនួន ៥៤ ដែលមានព្រះភក្ត្រញញឹមដ៏ល្បីល្បាញ (*ស្នាមញញឹមបាយ័ន*) តំណាងឱ្យព្រហ្មវិហារធម៌ទាំងបួន (មេត្តា ករុណា មុទិតា ឧបេក្ខា)។\n2. **ចម្លាក់ថែវបាតក្រោម**៖ ឆ្លុះបញ្ចាំងពីជីវភាពរស់នៅប្រចាំថ្ងៃរបស់ប្រជាជនខ្មែរនាសម័យអង្គរ និងចម្បាំងជើងទឹក-ជើងគោកជាមួយកងទ័ពចាម។\n\n*«វិជ្ជាជាប្រទីបបំភ្លឺផ្លូវ វប្បធម៌ជាគ្រឹះនៃជាតិ»*`,
    responseEn: `### Bayon Temple: The Pinnacle of Angkorian Sacred Architecture\n\n**Bayon Temple** was constructed in the late 12th and early 13th centuries during the reign of **King Jayavarman VII**, standing at the spiritual epicenter of Angkor Thom.\n\n#### Sacred Architectural Features\n1. **54 Four-Faced Towers**: Famous smiling faces (*The Smile of Bayon*) symbolizing the Four Brahma-Viharas (Loving-kindness, Compassion, Sympathetic Joy, and Equanimity).\n2. **Outer Bas-Reliefs**: Vividly depicting daily Khmer market life, feasts, and historic naval battles against the Cham forces.\n\n*«Wisdom illuminates the path; culture is the foundation of the nation.»*`,
    docTitle: "ឯកសារស្រាវជ្រាវ_ប្រាសាទបាយ័ន.pdf",
    docPages: 6,
    model: "Ollama Gemma 4 · 100% Offline",
  },
];

const CHAPTER_DURATION = 14; // seconds per chapter
const TOTAL_DURATION = CHAPTER_DURATION * CHAPTERS.length; // 42 seconds total video

const DEMO_TOKEN_REGEX = new RegExp(
  [
    "(#[^\\n]*|\\/\\/[^\\n]*)",
    "(f\"(?:\\\\.|[^\"\\\\])*\"|f'(?:\\\\.|[^'\\\\])*')",
    "(\"(?:\\\\.|[^\"\\\\])*\"|'(?:\\\\.|[^'\\\\])*'|`(?:\\\\.|[^`\\\\])*`)",
    "(@[a-zA-Z_]\\w*(?:\\.[a-zA-Z_]\\w*)*)",
    "(\\b(?:def|class|function|return|async|await|yield|lambda|const|let|var|import|from|export|default|type|interface|enum|extends|implements)\\b)",
    "(\\b(?:if|elif|else|for|while|try|except|finally|with|as|raise|throw|catch|break|continue|pass|case|switch|match|in|is|not|and|or)\\b)",
    "(\\b(?:True|False|true|false|None|null|undefined|NaN|Infinity)\\b)",
    "(\\b(?:print|input|len|range|enumerate|zip|map|filter|sum|min|max|sorted|reversed|abs|round|open|type|isinstance|int|float|str|bool|list|dict|set|tuple|console|log|warn|error|info|require|setTimeout|setInterval|fetch|JSON|Math|FastAPI)\\b)",
    "(\\b(?:pip|npm|npx|yarn|pnpm|bun|node|python|python3|git|docker|curl|wget|mkdir|cd|ls|cat|chmod|sudo|grep|find|bash|sh|uv)\\b)",
    "(?:\\$\\d+(?:\\.\\d+)?|\\b\\d+(?:\\.\\d+)?\\b|0x[0-9a-fA-F]+)",
    "(?:\\+=|-=|\\*=|\\/=|%=|\\*\\*=|\\/\\/=|==|!=|<=|>=|=>|->|\\*\\*|\\/\\/|\\+|-|\\*|\\/|%|=|&|\\||\\^|~|<|>|!)",
    "([{}])",
    "([\\[\\]])",
    "([()])",
    "([,;:])",
  ].join("|"),
  "gi"
);

function highlightDemoTokens(code: string) {
  const lines = code.split("\n");
  return lines.map((line, lineIdx) => {
    const trimmed = line.trim();
    if (trimmed.startsWith("#") || trimmed.startsWith("//") || trimmed.startsWith("--")) {
      return (
        <span key={lineIdx} className="text-[#8B949E] italic block font-khmer">
          {line || " "}
        </span>
      );
    }

    const parts: React.ReactNode[] = [];
    let lastIndex = 0;
    let match: RegExpExecArray | null;
    DEMO_TOKEN_REGEX.lastIndex = 0;

    while ((match = DEMO_TOKEN_REGEX.exec(line)) !== null) {
      if (match.index > lastIndex) {
        parts.push(
          <span key={`txt-${lastIndex}`} className="text-[#E6EDF3]">
            {line.substring(lastIndex, match.index)}
          </span>
        );
      }
      const token = match[0];
      const key = `tok-${match.index}`;

      if (token.startsWith("#") || token.startsWith("//")) {
        parts.push(<span key={key} className="text-[#8B949E] italic font-khmer">{token}</span>);
      } else if (token.startsWith('"') || token.startsWith("'") || token.startsWith("`")) {
        parts.push(<span key={key} className="text-[#98C379]">{token}</span>);
      } else if (token.startsWith("@")) {
        parts.push(<span key={key} className="text-[#61AFEF] font-semibold">{token}</span>);
      } else if (/^(?:\$\d+(?:\.\d+)?|\d+(?:\.\d+)?|0x[0-9a-fA-F]+)$/.test(token)) {
        parts.push(<span key={key} className="text-[#D19A66] font-semibold">{token}</span>);
      } else if (/^(def|class|function|return|async|await|const|let|var|import|from|export|default)$/i.test(token)) {
        parts.push(<span key={key} className="text-[#C678DD] font-semibold">{token}</span>);
      } else if (/^(if|else|elif|for|while|try|except|finally|with|as|in|is|not|and|or)$/i.test(token)) {
        parts.push(<span key={key} className="text-[#E5C07B] font-bold">{token}</span>);
      } else if (/^(True|False|true|false|None|null)$/i.test(token)) {
        parts.push(<span key={key} className="text-[#E06C75] font-semibold">{token}</span>);
      } else if (/^(print|FastAPI|hashlib|hmac|app|dict|str|int|float|list|bool)$/i.test(token)) {
        parts.push(<span key={key} className="text-[#61AFEF] font-semibold">{token}</span>);
      } else if (/^(?:\+=|-=|\*=|\/=|%=|\*\*=|==|!=|<=|>=|=>|->|\*\*|\+|\-|\*|\/|%|=|&|\||\^|~|<|>|!)$/.test(token)) {
        parts.push(<span key={key} className="text-[#56B6C2] font-semibold">{token}</span>);
      } else if (token === "{" || token === "}") {
        parts.push(<span key={key} className="text-[#56B6C2] font-bold">{token}</span>);
      } else if (token === "[" || token === "]") {
        parts.push(<span key={key} className="text-[#C678DD] font-bold">{token}</span>);
      } else if (token === "(" || token === ")") {
        parts.push(<span key={key} className="text-[#E5C07B] font-bold">{token}</span>);
      } else if (/^[,;:]$/.test(token)) {
        parts.push(<span key={key} className="text-[#94A3B8]">{token}</span>);
      } else {
        parts.push(<span key={key} className="text-[#E6EDF3]">{token}</span>);
      }
      lastIndex = DEMO_TOKEN_REGEX.lastIndex;
    }

    if (lastIndex < line.length) {
      parts.push(
        <span key={`rem-${lastIndex}`} className="text-[#E6EDF3]">
          {line.substring(lastIndex)}
        </span>
      );
    }

    return (
      <span key={lineIdx} className="block">
        {parts.length > 0 ? parts : " "}
      </span>
    );
  });
}

function DemoCodeBlock({ code, language }: { code: string; language: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard?.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="relative my-3 overflow-hidden rounded-2xl border border-white/10 bg-black/40 backdrop-blur-xl shadow-xl shadow-black/40 transition-all hover:border-white/20">
      {/* Header Bar */}
      <div className="flex items-center justify-between border-b border-white/10 bg-white/[0.04] backdrop-blur-md px-4 py-2">
        <div className="flex items-center gap-2">
          {/* macOS 3-dot window controls */}
          <div className="flex items-center gap-1.5 mr-1">
            <span className="h-2.5 w-2.5 rounded-full bg-[#FF5F56]/90 border border-[#E0443E]/60 shadow-sm" />
            <span className="h-2.5 w-2.5 rounded-full bg-[#FFBD2E]/90 border border-[#DEA123]/60 shadow-sm" />
            <span className="h-2.5 w-2.5 rounded-full bg-[#27C93F]/90 border border-[#1AAB29]/60 shadow-sm" />
          </div>
          <span className="font-mono text-[10.5px] font-bold text-amber-300 uppercase tracking-wider pl-1">
            {language || "code"}
          </span>
        </div>
        <button
          type="button"
          onClick={handleCopy}
          className="inline-flex items-center gap-1.5 rounded-lg border border-white/15 bg-white/[0.06] hover:bg-white/[0.14] px-2.5 py-0.5 text-[10.5px] font-semibold text-stone-200 backdrop-blur-sm transition-all hover:text-white cursor-pointer active:scale-95"
          title="Copy code"
        >
          {copied ? (
            <>
              <CheckCircle2 className="h-3 w-3 text-emerald-400" />
              <span className="text-emerald-400 font-semibold">Copied!</span>
            </>
          ) : (
            <>
              <Copy className="h-3 w-3" />
              <span>Copy</span>
            </>
          )}
        </button>
      </div>

      {/* Code Text */}
      <pre className="!my-0 !border-0 !rounded-none overflow-x-auto p-4 font-mono text-[12px] leading-relaxed bg-transparent text-[#E6EDF3] scrollbar-thin selection:bg-amber-500/30">
        <code className="!bg-transparent !p-0 !text-[#E6EDF3] font-mono">
          {highlightDemoTokens(code)}
        </code>
      </pre>
    </div>
  );
}

export function LiveInteractiveDemo() {
  const { language } = useLanguage();
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1);
  const [theaterMode, setTheaterMode] = useState(false);
  const [copied, setCopied] = useState(false);

  // Compute active chapter index based on currentTime
  const currentChapterIndex = Math.min(
    Math.floor(currentTime / CHAPTER_DURATION),
    CHAPTERS.length - 1
  );
  const currentChapter = CHAPTERS[currentChapterIndex];

  // Local phase inside the active chapter (0 to 14s)
  const localTime = currentTime % CHAPTER_DURATION;

  // Video phase breakdown:
  // 0s - 3.5s: User typing prompt
  // 3.5s - 5.0s: AI scanning & RAG grounding
  // 5.0s - 12.0s: AI response streaming
  // 12.0s - 14.0s: PDF synthesized document badge glowing
  const isTypingUser = localTime < 3.5;
  const isScanning = localTime >= 3.5 && localTime < 5.0;
  const isStreamingAi = localTime >= 5.0;
  const isDocReady = localTime >= 11.5;

  // Typewriter calculations
  const fullPrompt = language === "km" ? currentChapter.promptKm : currentChapter.promptEn;
  const fullResponse = language === "km" ? currentChapter.responseKm : currentChapter.responseEn;

  // Progressive text for prompt
  const userTextSlice = isTypingUser
    ? fullPrompt.slice(0, Math.floor((localTime / 3.5) * fullPrompt.length))
    : fullPrompt;

  // Progressive text for AI response
  const aiTextSlice = isStreamingAi
    ? fullResponse.slice(0, Math.floor(Math.min((localTime - 5.0) / 6.0, 1) * fullResponse.length))
    : "";

  // Main Video Playback Ticker
  useEffect(() => {
    if (!isPlaying) return;

    const intervalMs = 100;
    const interval = setInterval(() => {
      setCurrentTime((prev) => {
        const next = prev + (intervalMs / 1000) * playbackSpeed;
        if (next >= TOTAL_DURATION) {
          return 0; // Loop seamlessly back to beginning
        }
        return next;
      });
    }, intervalMs);

    return () => clearInterval(interval);
  }, [isPlaying, playbackSpeed]);

  // Jump to specific chapter
  const jumpToChapter = (index: number) => {
    setCurrentTime(index * CHAPTER_DURATION);
    setIsPlaying(true);
  };

  // Jump to specific second on timeline
  const handleScrubberClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const pct = Math.max(0, Math.min(clickX / rect.width, 1));
    setCurrentTime(pct * TOTAL_DURATION);
  };

  const handleCopy = () => {
    navigator.clipboard?.writeText(fullResponse);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Format seconds to mm:ss
  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  return (
    <section
      id="demo"
      className={`py-20 sm:py-24 bg-[#080604] relative select-none border-y border-[#261E13] overflow-hidden transition-all duration-500 ${
        theaterMode ? "fixed inset-0 z-50 overflow-y-auto py-8 bg-black/95" : ""
      }`}
    >
      {/* Cinematic Ambient Studio Lights */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] sm:w-[1200px] h-[550px] bg-gradient-to-tr from-gold/15 via-amber-500/10 to-transparent blur-3xl pointer-events-none rounded-full" />
      <div className="absolute bottom-10 right-10 w-96 h-96 bg-amber-600/10 blur-3xl pointer-events-none rounded-full" />

      <div
        className={`mx-auto px-4 sm:px-6 lg:px-8 relative z-10 ${
          theaterMode ? "max-w-6xl" : "max-w-7xl"
        }`}
      >
        {/* Section Header */}
        {!theaterMode && (
          <div className="text-center max-w-3xl mx-auto space-y-3 mb-10">
            <div className="inline-flex items-center gap-2 rounded-full border border-gold/40 bg-gold/10 px-4 py-1.5 text-[11px] font-semibold text-gold font-mono shadow-sm">
              <Film className="h-3.5 w-3.5 text-gold animate-pulse" />
              <span>
                {language === "km"
                  ? "វីដេអូបង្ហាញសមត្ថភាពផ្ទាល់ (OFFICIAL 4K VIDEO DEMO)"
                  : "OFFICIAL 4K INTERACTIVE VIDEO DEMO"}
              </span>
            </div>

            <h2 className="font-heading text-3xl sm:text-5xl font-extrabold text-gold-gradient tracking-tight leading-tight">
              {language === "km"
                ? "ទស្សនាវីដេអូបង្ហាញសមត្ថភាព សាស្ត្រា AI"
                : "Watch Sastra AI in Action"}
            </h2>

            <p className="text-xs sm:text-sm text-stone-400 font-khmer leading-relaxed max-w-2xl mx-auto">
              {language === "km"
                ? "ទស្សនាការវិភាគច្បាប់ ការសរសេរកូដ និងការចងក្រងឯកសារ PDF ស្វ័យប្រវត្តិក្នងពេលជាក់ស្តែង ជាមួយម៉ាស៊ីន AI អធិបតេយ្យភាពកម្ពុជា។"
                : "Experience real-time legal RAG, NBC Bakong payment architecture, and document synthesis powered by Cambodia\x27s sovereign AI."}
            </p>
          </div>
        )}

        {/* ── VIDEO CHAPTER SELECTOR PILLS (TOP) ── */}
        <div className="flex items-center justify-center gap-2.5 flex-wrap mb-6">
          {CHAPTERS.map((ch, idx) => {
            const isCur = currentChapterIndex === idx;
            return (
              <button
                key={ch.id}
                type="button"
                onClick={() => jumpToChapter(idx)}
                className={`group relative rounded-2xl px-4 sm:px-5 py-2.5 text-xs sm:text-[13px] font-semibold font-khmer transition-all duration-300 cursor-pointer border flex items-center gap-2 ${
                  isCur
                    ? "border-gold bg-gradient-to-r from-gold/25 via-amber-500/20 to-gold/25 text-gold shadow-lg shadow-gold/25 scale-[1.03] ring-1 ring-gold/60 font-bold"
                    : "border-[#3A2D19] bg-[#14100C]/90 text-stone-400 hover:text-stone-100 hover:border-gold/50 hover:bg-[#1C160F]"
                }`}
              >
                {isCur && (
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-500 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
                  </span>
                )}
                <span>{language === "km" ? ch.tagKm : ch.tagEn}</span>
                <span className="text-[10px] font-mono text-stone-500 group-hover:text-stone-300">
                  [{idx * 14}s]
                </span>
              </button>
            );
          })}
        </div>

        {/* ═════════════════════════════════════════════════════════════ */}
        {/* ── CINEMA-GRADE VIDEO PLAYER CONTAINER ──                     */}
        {/* ═════════════════════════════════════════════════════════════ */}
        <div className="relative max-w-5xl mx-auto rounded-[32px] border-2 border-gold/40 bg-[#120E09] shadow-[0_30px_90px_-20px_rgba(0,0,0,0.95)] overflow-hidden backdrop-blur-2xl">
          <KhmerCardCorners size="w-5 h-5" opacity="opacity-50" />

          {/* ── VIDEO PLAYER HEADER BAR ── */}
          <div className="flex flex-wrap items-center justify-between border-b border-[#2C2114] bg-[#18120B] px-4 sm:px-6 py-3 gap-2">
            {/* Left: Recording Indicator & Title */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-rose-500/15 border border-rose-500/40 text-[10.5px] font-mono text-rose-400 font-bold">
                <span className="h-2 w-2 rounded-full bg-rose-500 animate-pulse" />
                <span>REC • LIVE DEMO</span>
              </div>

              <div className="h-4 w-px bg-[#2F2113] hidden sm:block" />

              <span className="text-xs font-mono font-bold text-stone-200 hidden sm:inline">
                Sastra AI — Sovereign Demo Reel
              </span>
            </div>

            {/* Right: Quality Tags & Chat Portal Link */}
            <div className="flex items-center gap-2.5 text-[10.5px] font-mono">
              <span className="px-2 py-0.5 rounded-md bg-gold/15 border border-gold/30 text-gold font-bold">
                4K HDR · 60 FPS
              </span>

              <span className="hidden md:inline text-stone-400">
                {currentChapter.model}
              </span>

              <a
                href="http://localhost:5173/?auth=login"
                className="inline-flex items-center gap-1 text-gold hover:text-amber-300 font-semibold transition-colors cursor-pointer group ml-1"
              >
                <span>Launch App</span>
                <ExternalLink className="h-3 w-3 group-hover:translate-x-0.5 transition-transform" />
              </a>
            </div>
          </div>

          {/* ── VIDEO SCREEN DISPLAY AREA ── */}
          <div
            onClick={() => setIsPlaying(!isPlaying)}
            className="relative p-5 sm:p-8 min-h-[440px] sm:min-h-[480px] flex flex-col justify-between bg-gradient-to-b from-[#14100C] via-[#0F0C08] to-[#0A0805] cursor-pointer group/screen overflow-hidden"
          >
            {/* Subtle Screen Scanline Glare */}
            <div className="pointer-events-none absolute inset-0 bg-radial from-transparent via-transparent to-black/40" />

            {/* Subtle Watermark in Corner */}
            <div className="pointer-events-none absolute bottom-4 right-5 text-[10px] font-mono text-stone-600/40 uppercase tracking-widest z-10">
              SASTRA AI • OFFICIAL 4K DEMO
            </div>

            {/* Big Central Play/Pause Overlay When Paused */}
            {!isPlaying && (
              <div className="absolute inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-30 animate-fade-in">
                <div className="flex flex-col items-center gap-3 p-6 rounded-3xl bg-[#1A140D]/95 border-2 border-gold/60 shadow-2xl shadow-gold/30 text-center transform scale-105 transition-all">
                  <div className="h-16 w-16 rounded-full bg-gradient-to-tr from-gold to-amber-500 text-black flex items-center justify-center shadow-lg shadow-gold/40">
                    <Play className="h-8 w-8 fill-black ml-1" />
                  </div>
                  <h4 className="text-sm sm:text-base font-bold text-stone-100 font-heading">
                    {language === "km" ? "ចុចដើម្បីបន្តទស្សនា (Click to Play)" : "Video Paused • Click to Resume"}
                  </h4>
                  <p className="text-xs text-stone-400 font-khmer max-w-xs">
                    {language === "km"
                      ? "ទស្សនាការវិភាគ និងការចងក្រងឯកសារផ្ទាល់"
                      : "Watch real-time Khmer intelligence walkthrough"}
                  </p>
                </div>
              </div>
            )}

            {/* ── VIDEO CONTENT FEED (CHAT STREAM RECORDING) ── */}
            <div className="space-y-6 relative z-10">
              {/* 1. User Message (Appearing in Real-time) */}
              <div className="flex items-start justify-end gap-3 animate-slide-in-right">
                <div className="max-w-[85%] sm:max-w-[80%] rounded-2xl rounded-tr-xs border border-gold/40 bg-gradient-to-br from-[#2E2010] to-[#1C140A] p-4 sm:p-5 text-xs sm:text-[14px] text-stone-100 font-khmer shadow-xl text-right leading-[1.8]">
                  <p>
                    {userTextSlice}
                    {isTypingUser && (
                      <span className="inline-block w-2 h-4 bg-gold ml-1 animate-pulse" />
                    )}
                  </p>
                </div>
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-gold via-amber-600 to-amber-800 text-black font-extrabold text-xs shadow-md">
                  YOU
                </div>
              </div>

              {/* 2. Neural RAG Scanning Sweep Bar */}
              {isScanning && (
                <div className="flex items-center gap-3 py-3 px-5 rounded-2xl bg-[#1A130A] border border-gold/50 w-fit animate-fade-in shadow-xl mx-auto sm:mx-0">
                  <span className="relative flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-gold opacity-80"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-gold"></span>
                  </span>
                  <div className="flex items-center gap-2">
                    <Zap className="h-4 w-4 text-gold animate-bounce" />
                    <span className="text-xs font-khmer text-gold font-semibold">
                      {language === "km"
                        ? "សាស្ត្រា AI កំពុងស្កេន និងទាញយកទិន្នន័យពី Cambodia Sovereign RAG..."
                        : "Sastra AI Grounding: Querying Cambodian Sovereign Knowledge Base..."}
                    </span>
                  </div>
                </div>
              )}

              {/* 3. AI Assistant Response Message */}
              {isStreamingAi && (
                <div className="flex items-start gap-3 animate-fade-in">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#1E170F] border border-gold/60 text-gold shadow-md p-1 mt-1">
                    <KhmerLotusMedallion className="h-full w-full" glow />
                  </div>

                  <div className="flex-1 space-y-3 min-w-0">
                    <div className="rounded-2xl rounded-tl-xs border border-[#3E2C19] bg-[#18120B]/95 p-5 sm:p-6 text-xs sm:text-[13.5px] text-stone-200 font-khmer leading-relaxed shadow-2xl relative">
                      {/* Sub-header inside message */}
                      <div className="flex items-center justify-between pb-3 mb-3 border-b border-[#2C1F12] text-[11px] font-mono">
                        <span className="text-gold font-bold flex items-center gap-1.5">
                          <Sparkles className="h-3.5 w-3.5 text-gold" />
                          <span>សាស្ត្រា AI · Sovereign Intelligence Engine</span>
                        </span>

                        <span className="text-emerald-400 font-mono">
                          ● Streaming 60 FPS
                        </span>
                      </div>

                      {/* Markdown rendered response */}
                      <ReactMarkdown
                        remarkPlugins={[remarkGfm]}
                        components={{
                          h3: ({ children }) => (
                            <h3 className="text-sm sm:text-base font-bold text-gold mb-2.5 mt-2 font-heading">
                              {children}
                            </h3>
                          ),
                          h4: ({ children }) => (
                            <h4 className="text-xs sm:text-sm font-semibold text-stone-100 mt-3 mb-1.5 font-heading">
                              {children}
                            </h4>
                          ),
                          p: ({ children }) => (
                            <p className="mb-2.5 last:mb-0 text-stone-300 leading-[1.8]">{children}</p>
                          ),
                          strong: ({ children }) => (
                            <strong className="text-stone-100 font-bold text-gold-light">{children}</strong>
                          ),
                          table: ({ children }) => (
                            <div className="overflow-x-auto mt-3 mb-3 rounded-xl border border-[#3C301D] shadow-sm">
                              <table className="min-w-full text-left border-collapse">{children}</table>
                            </div>
                          ),
                          thead: ({ children }) => (
                            <thead className="bg-[#241A0E] text-gold text-xs">{children}</thead>
                          ),
                          tbody: ({ children }) => (
                            <tbody className="divide-y divide-[#2C2114] text-xs">{children}</tbody>
                          ),
                          tr: ({ children }) => (
                            <tr className="even:bg-[#130F0A] hover:bg-[#1C160F] transition-colors">{children}</tr>
                          ),
                          th: ({ children }) => (
                            <th className="px-3.5 py-2.5 text-[11px] font-bold border border-[#3C301D] text-amber-300">
                              {children}
                            </th>
                          ),
                          td: ({ children }) => (
                            <td className="px-3.5 py-2 text-[11.5px] text-stone-200 border border-[#3C301D] font-khmer">
                              {children}
                            </td>
                          ),
                          code: ({ children, className }) => {
                            const codeStr = String(children).replace(/\n$/, "");
                            const isBlock = className?.includes("language-") || codeStr.includes("\n");
                            const langMatch = /language-(\w+)/.exec(className || "");
                            if (isBlock) {
                              return (
                                <DemoCodeBlock
                                  code={codeStr}
                                  language={langMatch?.[1] || "python"}
                                />
                              );
                            }
                            return (
                              <code className="rounded-md border border-white/15 bg-white/[0.06] backdrop-blur-sm px-1.5 py-0.5 text-[11px] text-amber-300 font-mono font-semibold">
                                {children}
                              </code>
                            );
                          },
                        }}
                      >
                        {aiTextSlice}
                      </ReactMarkdown>

                      {/* 4. Synthesized PDF / Document Card Callout */}
                      {isDocReady && currentChapter.docTitle && (
                        <div className="mt-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border-2 border-gold/70 bg-gradient-to-r from-gold/20 via-[#261B0E] to-gold/15 p-4 shadow-xl shadow-gold/20 animate-scale-in">
                          <div className="flex items-center gap-3">
                            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gold/25 text-gold border border-gold/60 shadow-md">
                              <FileText className="h-6 w-6" />
                            </div>
                            <div>
                              <p className="font-bold text-xs sm:text-sm text-stone-100 font-mono">
                                {currentChapter.docTitle}
                              </p>
                              <p className="text-[10.5px] text-gold font-mono mt-0.5">
                                {currentChapter.docPages} Pages • Synthesized via ReportLab UTF-8
                              </p>
                            </div>
                          </div>

                          <a
                            href="http://localhost:5173/?auth=login"
                            onClick={(e) => e.stopPropagation()}
                            className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-gold via-amber-500 to-amber-600 px-5 py-2.5 text-xs sm:text-sm font-extrabold text-black hover:brightness-110 shadow-md shadow-gold/30 cursor-pointer transition-all shrink-0 font-khmer"
                          >
                            <Download className="h-4 w-4 stroke-[3]" />
                            <span>ទាញយកឯកសារ (Download PDF)</span>
                          </a>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* ═════════════════════════════════════════════════════════════ */}
          {/* ── VIDEO PLAYER TIMELINE SCRUBBER & CONTROLS ──               */}
          {/* ═════════════════════════════════════════════════════════════ */}
          <div className="border-t border-[#2C2114] bg-[#140F0A] p-3 sm:p-4 space-y-3">
            {/* 3-Chapter Timeline Segment Scrubber */}
            <div
              onClick={handleScrubberClick}
              className="group/scrub relative h-3 w-full rounded-full bg-[#241B10] cursor-pointer overflow-hidden flex"
            >
              {CHAPTERS.map((ch, idx) => {
                const segStart = idx * CHAPTER_DURATION;
                const segElapsed = Math.max(0, Math.min(currentTime - segStart, CHAPTER_DURATION));
                const segPct = (segElapsed / CHAPTER_DURATION) * 100;

                return (
                  <div
                    key={ch.id}
                    className="relative flex-1 h-full border-r border-[#140F0A] last:border-r-0 bg-[#251B10]"
                  >
                    {/* Fill */}
                    <div
                      className="h-full bg-gradient-to-r from-amber-500 to-gold transition-all duration-100"
                      style={{ width: `${segPct}%` }}
                    />
                  </div>
                );
              })}
            </div>

            {/* Video Player Action Bar Controls */}
            <div className="flex flex-wrap items-center justify-between gap-3 text-stone-300">
              {/* Left Controls: Play, Prev, Next, Replay, Time */}
              <div className="flex items-center gap-2 sm:gap-3">
                <button
                  type="button"
                  onClick={() => setIsPlaying(!isPlaying)}
                  className="h-9 w-9 rounded-xl bg-gold text-black flex items-center justify-center hover:brightness-110 shadow-sm cursor-pointer transition-all"
                  title={isPlaying ? "Pause Video" : "Play Video"}
                >
                  {isPlaying ? (
                    <Pause className="h-4 w-4 fill-black" />
                  ) : (
                    <Play className="h-4 w-4 fill-black ml-0.5" />
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    const prevIdx = (currentChapterIndex - 1 + CHAPTERS.length) % CHAPTERS.length;
                    jumpToChapter(prevIdx);
                  }}
                  className="h-8 w-8 rounded-lg bg-[#1D160E] border border-[#302316] text-stone-400 hover:text-gold flex items-center justify-center cursor-pointer transition-all"
                  title="Previous Scene"
                >
                  <SkipBack className="h-4 w-4" />
                </button>

                <button
                  type="button"
                  onClick={() => {
                    const nextIdx = (currentChapterIndex + 1) % CHAPTERS.length;
                    jumpToChapter(nextIdx);
                  }}
                  className="h-8 w-8 rounded-lg bg-[#1D160E] border border-[#302316] text-stone-400 hover:text-gold flex items-center justify-center cursor-pointer transition-all"
                  title="Next Scene"
                >
                  <SkipForward className="h-4 w-4" />
                </button>

                <button
                  type="button"
                  onClick={() => jumpToChapter(currentChapterIndex)}
                  className="h-8 w-8 rounded-lg bg-[#1D160E] border border-[#302316] text-stone-400 hover:text-gold flex items-center justify-center cursor-pointer transition-all"
                  title="Replay Scene"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                </button>

                {/* Time Display */}
                <div className="text-xs font-mono text-stone-400 ml-1">
                  <span className="text-gold font-bold">{formatTime(currentTime)}</span>
                  <span className="text-stone-600"> / </span>
                  <span>{formatTime(TOTAL_DURATION)}</span>
                </div>
              </div>

              {/* Center Chapter Title */}
              <div className="hidden lg:flex items-center gap-2 text-xs font-khmer text-stone-300">
                <span className="px-2.5 py-0.5 rounded-full bg-gold/15 border border-gold/30 text-gold font-bold text-[11px]">
                  Scene {currentChapterIndex + 1}/{CHAPTERS.length}
                </span>
                <span className="font-semibold text-stone-200 truncate max-w-xs">
                  {language === "km" ? currentChapter.titleKm : currentChapter.titleEn}
                </span>
              </div>

              {/* Right Controls: Audio Narration, Speed, Fullscreen */}
              <div className="flex items-center gap-2 sm:gap-2.5">
                {/* Audio Narration Toggle */}
                <button
                  type="button"
                  onClick={() => setIsMuted(!isMuted)}
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-mono transition-all cursor-pointer ${
                    !isMuted
                      ? "bg-emerald-500/15 border-emerald-500/40 text-emerald-400"
                      : "bg-[#18120B] border-[#302316] text-stone-500"
                  }`}
                  title={isMuted ? "Unmute Voice Narration" : "Mute Voice Narration"}
                >
                  {!isMuted ? (
                    <>
                      <Volume2 className="h-3.5 w-3.5" />
                      <span className="hidden sm:inline">Voice: On</span>
                    </>
                  ) : (
                    <>
                      <VolumeX className="h-3.5 w-3.5" />
                      <span className="hidden sm:inline">Voice: Off</span>
                    </>
                  )}
                </button>

                {/* Speed Multiplier Button */}
                <button
                  type="button"
                  onClick={() => {
                    const speeds = [1, 1.25, 1.5, 2];
                    const next = speeds[(speeds.indexOf(playbackSpeed) + 1) % speeds.length];
                    setPlaybackSpeed(next);
                  }}
                  className="px-2 py-1 rounded-lg bg-[#1D160E] border border-[#302316] text-[11px] font-mono font-bold text-gold hover:border-gold/50 cursor-pointer"
                  title="Playback Speed"
                >
                  {playbackSpeed}x
                </button>

                {/* Theater / Fullscreen Toggle */}
                <button
                  type="button"
                  onClick={() => setTheaterMode(!theaterMode)}
                  className="h-8 w-8 rounded-lg bg-[#1D160E] border border-[#302316] text-stone-400 hover:text-gold flex items-center justify-center cursor-pointer transition-all"
                  title={theaterMode ? "Exit Theater Mode" : "Theater View"}
                >
                  {theaterMode ? (
                    <Minimize2 className="h-3.5 w-3.5" />
                  ) : (
                    <Maximize2 className="h-3.5 w-3.5" />
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
