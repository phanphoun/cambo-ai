import { useState, useEffect, useRef } from "react";
import {
  Monitor,
  Smartphone,
  Sparkles,
  Send,
  User,
  ArrowRight,
  Volume2,
  FileText,
  Zap,
  Play,
  Copy,
  Download,
  Lock,
  Compass,
  CheckCircle2,
} from "lucide-react";
import { KhmerCardCorners } from "./KhmerOrnaments";
import { useLanguage } from "../i18n/LanguageContext";

type SceneMode = "computer" | "phone" | "sandbox";

interface QuickPrompt {
  id: string;
  icon: string;
  titleKm: string;
  titleEn: string;
  queryKm: string;
  queryEn: string;
  answerKm: string;
  answerEn: string;
  docTitle: string;
}

const SAMPLE_PROMPTS: QuickPrompt[] = [
  {
    id: "legal",
    icon: "⚖️",
    titleKm: "ច្បាប់វិនិយោគ",
    titleEn: "Investment Law",
    queryKm: "សូមជួយវិភាគច្បាប់ស្ដីពីវិនិយោគថ្មី និងការលើកទឹកចិត្តពន្ធដារសម្រាប់សហគ្រាស",
    queryEn: "Please analyze Cambodia\x27s new investment law and tax incentives for enterprises",
    answerKm: "ផ្អែកលើច្បាប់ស្ដីពីការវិនិយោគថ្មី (QIP) សហគ្រាសមានសិទ្ធិទទួលបានការលើកលែងពន្ធលើប្រាក់ចំណូលរយៈពេល ៣ ទៅ ៩ ឆ្នាំ ព្រមទាំងការលើកលែងពន្ធគយ ១០០% លើការនាំចូលឧបករណ៍ផលិតកម្ម។",
    answerEn: "Under Cambodia\x27s Investment Law, Qualified Investment Projects (QIP) receive 3 to 9 years of income tax exemption, plus 100% duty exemptions on imported production equipment.",
    docTitle: "សេចក្តីសង្ខេប_ច្បាប់វិនិយោគ_២០២៦.docx",
  },
  {
    id: "heritage",
    icon: "🏛️",
    titleKm: "ប្រវត្តិអង្គរវត្ត",
    titleEn: "Angkor History",
    queryKm: "សាស្ត្រា AI តើប្រាសាទអង្គរវត្តសាងសង់ក្នុងរជ្ជកាលស្តេចណា និងមានអត្ថន័យដូចម្តេច?",
    queryEn: "Sastra AI, which King built Angkor Wat and what is its spiritual significance?",
    answerKm: "ប្រាសាទអង្គរវត្តត្រូវបានកសាងឡើងក្នុងសតវត្សរ៍ទី ១២ ក្នុងរជ្ជកាលព្រះបាទសូរ្យវរ្ម័នទី ២ (Suryavarman II) ដោយដើមឡើយឧទ្ទិសថ្វាយព្រះវិស្ណុ ជានិមិត្តរូបនៃភ្នំព្រះសុមេរុ។",
    answerEn: "Angkor Wat was constructed in the early 12th century by King Suryavarman II, originally dedicated to Lord Vishnu as the earthly representation of Mount Meru.",
    docTitle: "ឯកសារស្រាវជ្រាវ_ប្រវត្តិសាស្ត្រអង្គរ.pdf",
  },
  {
    id: "business",
    icon: "📊",
    titleKm: "របាយការណ៍អាជីវកម្ម",
    titleEn: "Business Report",
    queryKm: "សូមរៀបចំគម្រោងផែនការយុទ្ធសាស្ត្រឌីជីថលសម្រាប់ក្រុមហ៊ុន Fintech នៅភ្នំពេញ",
    queryEn: "Draft a digital strategic roadmap for a Fintech company expanding in Phnom Penh",
    answerKm: "យុទ្ធសាស្ត្ររួមមាន៖ ការតភ្ជាប់ប្រព័ន្ធទូទាត់បាគង (Bakong KHQR), ការអនុវត្តសន្តិសុខទិន្នន័យស្របតាមធនាគារជាតិ និងការដាក់ឱ្យប្រើប្រាស់ AI Customer Service ជាភាសាខ្មែរ។",
    answerEn: "Key pillars include: Bakong KHQR payment rails integration, National Bank cybersecurity compliance, and 24/7 native Khmer conversational AI customer support.",
    docTitle: "ផែនការយុទ្ធសាស្ត្រ_Fintech_PhnomPenh.docx",
  },
];

export function HeroVisual() {
  const { language } = useLanguage();
  const [scene, setScene] = useState<SceneMode>("computer");
  const [isPaused, setIsPaused] = useState(false);
  const [progress, setProgress] = useState(0);

  // Selected sample prompt in sandbox mode
  const [selectedPrompt, setSelectedPrompt] = useState<QuickPrompt>(SAMPLE_PROMPTS[0]);

  // Computer Scene Typewriter
  const [computerUserTyped, setComputerUserTyped] = useState("");
  const [computerAiTyped, setComputerAiTyped] = useState("");
  const [computerAiStarted, setComputerAiStarted] = useState(false);

  // Phone Scene Typewriter
  const [phoneUserTyped, setPhoneUserTyped] = useState("");
  const [phoneAiTyped, setPhoneAiTyped] = useState("");
  const [phoneAiStarted, setPhoneAiStarted] = useState(false);

  // Sandbox Typewriter
  const [sandboxAiTyped, setSandboxAiTyped] = useState("");
  const [copied, setCopied] = useState(false);

  const sceneDuration = 7000;
  const startTimeRef = useRef<number>(Date.now());

  // Current prompts based on language
  const prompt1 = SAMPLE_PROMPTS[0];
  const prompt2 = SAMPLE_PROMPTS[1];

  const computerUserPrompt = language === "km" ? prompt1.queryKm : prompt1.queryEn;
  const computerAiResponse = language === "km" ? prompt1.answerKm : prompt1.answerEn;

  const phoneUserPrompt = language === "km" ? prompt2.queryKm : prompt2.queryEn;
  const phoneAiResponse = language === "km" ? prompt2.answerKm : prompt2.answerEn;

  // Typewriter for Computer
  useEffect(() => {
    let cancel = false;
    if (scene === "computer") {
      setComputerUserTyped("");
      setComputerAiTyped("");
      setComputerAiStarted(false);

      let uIdx = 0;
      const uInterval = setInterval(() => {
        if (cancel) return;
        uIdx++;
        setComputerUserTyped(computerUserPrompt.slice(0, uIdx));
        if (uIdx >= computerUserPrompt.length) {
          clearInterval(uInterval);
          setTimeout(() => {
            if (cancel) return;
            setComputerAiStarted(true);
            let aIdx = 0;
            const aInterval = setInterval(() => {
              if (cancel) return;
              aIdx += 2;
              setComputerAiTyped(computerAiResponse.slice(0, aIdx));
              if (aIdx >= computerAiResponse.length) {
                clearInterval(aInterval);
              }
            }, 25);
          }, 350);
        }
      }, 28);

      return () => {
        cancel = true;
        clearInterval(uInterval);
      };
    }
  }, [scene, language, computerUserPrompt, computerAiResponse]);

  // Typewriter for Phone
  useEffect(() => {
    let cancel = false;
    if (scene === "phone") {
      setPhoneUserTyped("");
      setPhoneAiTyped("");
      setPhoneAiStarted(false);

      let uIdx = 0;
      const uInterval = setInterval(() => {
        if (cancel) return;
        uIdx++;
        setPhoneUserTyped(phoneUserPrompt.slice(0, uIdx));
        if (uIdx >= phoneUserPrompt.length) {
          clearInterval(uInterval);
          setTimeout(() => {
            if (cancel) return;
            setPhoneAiStarted(true);
            let aIdx = 0;
            const aInterval = setInterval(() => {
              if (cancel) return;
              aIdx += 2;
              setPhoneAiTyped(phoneAiResponse.slice(0, aIdx));
              if (aIdx >= phoneAiResponse.length) {
                clearInterval(aInterval);
              }
            }, 28);
          }, 350);
        }
      }, 28);

      return () => {
        cancel = true;
        clearInterval(uInterval);
      };
    }
  }, [scene, language, phoneUserPrompt, phoneAiResponse]);

  // Typewriter for Sandbox
  useEffect(() => {
    let cancel = false;
    if (scene === "sandbox") {
      setSandboxAiTyped("");
      const fullText = language === "km" ? selectedPrompt.answerKm : selectedPrompt.answerEn;
      let idx = 0;
      const interval = setInterval(() => {
        if (cancel) return;
        idx += 3;
        setSandboxAiTyped(fullText.slice(0, idx));
        if (idx >= fullText.length) {
          clearInterval(interval);
        }
      }, 20);

      return () => {
        cancel = true;
        clearInterval(interval);
      };
    }
  }, [scene, selectedPrompt, language]);

  // Scene Carousel Auto-Loop Timer
  useEffect(() => {
    startTimeRef.current = Date.now();
    setProgress(0);

    const interval = setInterval(() => {
      if (isPaused) return;

      const elapsed = Date.now() - startTimeRef.current;
      const pct = Math.min((elapsed / sceneDuration) * 100, 100);
      setProgress(pct);

      if (elapsed >= sceneDuration) {
        startTimeRef.current = Date.now();
        setProgress(0);
        setScene((prev) => {
          if (prev === "computer") return "phone";
          if (prev === "phone") return "sandbox";
          return "computer";
        });
      }
    }, 50);

    return () => clearInterval(interval);
  }, [scene, isPaused, sceneDuration]);

  const handleCopy = () => {
    const text = language === "km" ? selectedPrompt.answerKm : selectedPrompt.answerEn;
    navigator.clipboard?.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      className="relative w-full select-none"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* ═════════════════════════════════════════════════════════════ */}
      {/* UNIFIED HARDWARE WORKSTATION FRAME                           */}
      {/* ═════════════════════════════════════════════════════════════ */}
      <div className="relative rounded-[28px] border-2 border-[#382817] bg-[#120E09]/95 shadow-[0_25px_60px_-15px_rgba(229,192,88,0.22)] backdrop-blur-2xl overflow-hidden transition-all duration-300">
        <KhmerCardCorners size="w-4 h-4" opacity="opacity-40" />

        {/* ── TOP INTEGRATED CHASSIS BEZEL & SWITCHER ── */}
        <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 border-b border-[#2B1F12] bg-[#17120B]">
          {/* Left: Window Dots & Brand Identity */}
          <div className="flex items-center gap-2.5">
            <div className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-[#E05252]/85 border border-[#E05252]" />
              <span className="h-2.5 w-2.5 rounded-full bg-[#E5B546]/85 border border-[#E5B546]" />
              <span className="h-2.5 w-2.5 rounded-full bg-[#3FB950]/85 border border-[#3FB950]" />
            </div>

            <div className="h-4 w-px bg-[#2F2113] hidden sm:block" />

            <div className="flex items-center gap-1.5">
              <span className="flex h-5 w-5 items-center justify-center rounded-md bg-gold/20 text-gold text-[10px] font-bold font-mono">
                S
              </span>
              <span className="text-xs font-bold text-stone-200 font-heading hidden sm:inline">
                Sastra Sovereign Studio
              </span>
            </div>
          </div>

          {/* Center: Integrated Device Mode Switcher Tabs */}
          <div className="flex items-center gap-1 p-0.5 rounded-xl bg-[#0D0A06] border border-[#2B1D0F]">
            <button
              type="button"
              onClick={() => {
                setScene("computer");
                startTimeRef.current = Date.now();
                setProgress(0);
              }}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                scene === "computer"
                  ? "bg-gold text-black shadow-sm font-bold"
                  : "text-stone-400 hover:text-stone-200"
              }`}
            >
              <Monitor className="h-3 w-3" />
              <span>{language === "km" ? "កុំព្យូទ័រ" : "Computer"}</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setScene("phone");
                startTimeRef.current = Date.now();
                setProgress(0);
              }}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                scene === "phone"
                  ? "bg-gold text-black shadow-sm font-bold"
                  : "text-stone-400 hover:text-stone-200"
              }`}
            >
              <Smartphone className="h-3 w-3" />
              <span>{language === "km" ? "ទូរស័ព្ទ" : "Phone"}</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setScene("sandbox");
                startTimeRef.current = Date.now();
                setProgress(0);
              }}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                scene === "sandbox"
                  ? "bg-gradient-to-r from-gold to-amber-500 text-black shadow-sm font-bold"
                  : "text-amber-400 hover:text-gold"
              }`}
            >
              <Zap className="h-3 w-3" />
              <span>{language === "km" ? "សាកល្បង" : "Playground"}</span>
            </button>
          </div>

          {/* Right: Auto Progress Bar Indicator */}
          <div className="hidden md:flex items-center gap-2 text-[10px] font-mono text-stone-400">
            <div className="w-10 h-1 bg-[#261B0E] rounded-full overflow-hidden">
              <div
                className="h-full bg-gold transition-all duration-75"
                style={{ width: `${progress}%` }}
              />
            </div>
            <span className="text-gold/80">{isPaused ? "Paused" : "Auto"}</span>
          </div>
        </div>

        {/* ── INNER SCREEN DISPLAY ── */}
        <div className="p-4 sm:p-5 min-h-[385px] sm:min-h-[415px] flex flex-col justify-between bg-gradient-to-b from-[#100C07] to-[#0A0704] relative">
          {/* Subtle Screen Ambient Vignette */}
          <div className="pointer-events-none absolute inset-0 bg-radial from-transparent via-transparent to-black/30" />

          {/* ═══════════════════════════════════════════════════════════ */}
          {/* SCENE 1: COMPUTER WORKSPACE PRO                             */}
          {/* ═══════════════════════════════════════════════════════════ */}
          {scene === "computer" && (
            <div className="space-y-4 animate-fade-in flex-1 flex flex-col justify-between">
              {/* Browser Header Bar */}
              <div className="flex items-center justify-between gap-2 p-2 rounded-xl bg-[#140F09] border border-[#2B1F11] text-[11px] font-mono">
                <div className="flex items-center gap-2 text-stone-400 truncate">
                  <Lock className="h-3 w-3 text-gold shrink-0" />
                  <span className="text-stone-300">sastra.ai</span>
                  <span className="text-stone-600">/</span>
                  <span className="text-stone-400 truncate">workspace/khmer-legal-rag</span>
                </div>
                <span className="px-2 py-0.5 rounded-md bg-gold/10 border border-gold/30 text-[10px] text-gold shrink-0">
                  Gemini 3.7 + MiniMax
                </span>
              </div>

              {/* Chat Message Stream */}
              <div className="space-y-3 flex-1 flex flex-col justify-center">
                {/* User Message */}
                <div className="flex items-start justify-end gap-2.5 pl-8">
                  <div className="rounded-2xl rounded-tr-xs bg-gradient-to-br from-[#2D2010] to-[#1C140A] border border-gold/40 px-3.5 py-2.5 text-stone-100 shadow-md max-w-[90%] text-right">
                    <p className="font-khmer text-xs sm:text-[13px] leading-[1.75] text-stone-100">
                      {computerUserTyped}
                      {computerUserTyped.length < computerUserPrompt.length && (
                        <span className="inline-block w-1.5 h-3.5 bg-gold ml-1 animate-pulse" />
                      )}
                    </p>
                  </div>
                  <div className="flex h-7 w-7 items-center justify-center rounded-xl bg-gold/20 border border-gold/40 text-gold shrink-0 mt-0.5">
                    <User className="h-4 w-4" />
                  </div>
                </div>

                {/* AI Response */}
                <div className="flex items-start gap-2.5 pr-4">
                  <div className="flex h-7 w-7 items-center justify-center rounded-xl bg-gradient-to-br from-gold via-amber-600 to-amber-800 text-black font-bold shrink-0 shadow-sm mt-0.5">
                    <span className="text-xs font-mono font-extrabold">S</span>
                  </div>

                  <div className="flex-1 space-y-2">
                    <div className="rounded-2xl rounded-tl-xs bg-[#16110A] border border-[#302213] p-3.5 text-stone-200 shadow-md">
                      <div className="flex items-center justify-between text-[10.5px] text-stone-400 font-mono pb-1.5 mb-1.5 border-b border-[#251A0E]">
                        <span className="text-gold font-semibold flex items-center gap-1.5">
                          <Sparkles className="h-3 w-3 text-gold" />
                          <span>សាស្ត្រា AI (Sovereign Engine)</span>
                        </span>
                        <span className="text-emerald-400">100% Khmer Verified</span>
                      </div>

                      {computerAiStarted ? (
                        <p className="font-khmer text-xs sm:text-[13px] leading-[1.8] text-stone-200">
                          {computerAiTyped}
                          {computerAiTyped.length < computerAiResponse.length && (
                            <span className="inline-block w-1.5 h-3.5 bg-gold ml-1 animate-pulse" />
                          )}
                        </p>
                      ) : (
                        <div className="flex items-center gap-1.5 py-1 text-xs text-stone-400 font-mono">
                          <span className="h-1.5 w-1.5 rounded-full bg-gold animate-bounce" />
                          <span
                            className="h-1.5 w-1.5 rounded-full bg-gold animate-bounce"
                            style={{ animationDelay: "0.15s" }}
                          />
                          <span
                            className="h-1.5 w-1.5 rounded-full bg-gold animate-bounce"
                            style={{ animationDelay: "0.3s" }}
                          />
                          <span className="text-[11px] ml-1 text-gold/80 font-khmer">
                            កំពុងវិភាគទិន្នន័យច្បាប់កម្ពុជា...
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Document Card */}
                    {computerAiTyped.length > 40 && (
                      <div className="flex items-center justify-between rounded-xl border border-[#362716] bg-[#120E08] px-3.5 py-2 text-xs animate-scale-in">
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-emerald-400 shrink-0" />
                          <span className="font-mono text-[11px] text-stone-200 truncate max-w-[220px]">
                            {prompt1.docTitle}
                          </span>
                        </div>
                        <span className="rounded-md bg-emerald-500/15 border border-emerald-500/30 px-2 py-0.5 text-[10px] font-mono text-emerald-400 font-bold">
                          Ready • Word Export
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Bottom Interactive Command Bar */}
              <div className="pt-2 border-t border-[#261B0E] flex items-center justify-between gap-2 px-3 py-2 rounded-xl bg-[#0D0A06] border border-[#2B1F11]">
                <span className="text-xs font-khmer text-stone-500 truncate">
                  {language === "km"
                    ? "សួរអ្វីមួយទៅកាន់ សាស្ត្រា AI (ឧ. ច្បាប់, សេចក្តីព្រាង, បច្ចេកវិទ្យា)..."
                    : "Ask Sastra AI anything in Khmer or English..."}
                </span>
                <div className="h-6 w-6 rounded-lg bg-gold/15 border border-gold/30 flex items-center justify-center text-gold shrink-0">
                  <Send className="h-3 w-3" />
                </div>
              </div>
            </div>
          )}

          {/* ═══════════════════════════════════════════════════════════ */}
          {/* SCENE 2: PHONE VOICE ASSISTANT (TITANIUM MOBILE FRAME)       */}
          {/* ═══════════════════════════════════════════════════════════ */}
          {scene === "phone" && (
            <div className="mx-auto w-full max-w-[370px] rounded-[36px] border-[5px] border-[#362615] bg-[#0E0A06] p-3.5 shadow-2xl shadow-gold/25 animate-fade-in flex flex-col justify-between min-h-[385px]">
              {/* Dynamic Island Header */}
              <div>
                <div className="flex items-center justify-between text-[10px] font-mono text-stone-400 px-3 pt-0.5 pb-2">
                  <span>9:41</span>
                  {/* Dynamic Island Wave Bar */}
                  <div className="h-5 px-2.5 rounded-full bg-black border border-stone-800 flex items-center justify-center gap-1.5 shadow-inner">
                    <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="text-[9px] text-stone-300 font-mono">SASTRA VOICE</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span>5G</span>
                    <span className="h-2 w-3 rounded-xs border border-stone-400 inline-block" />
                  </div>
                </div>

                {/* Persona Header */}
                <div className="flex items-center justify-between pb-2 border-b border-[#251A0E] px-1">
                  <div className="flex items-center gap-2">
                    <div className="h-6 w-6 rounded-lg bg-gold/20 border border-gold/40 flex items-center justify-center text-gold font-bold text-xs">
                      S
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-stone-100 font-heading">
                        សាស្ត្រា AI Mobile
                      </h4>
                      <p className="text-[9.5px] text-amber-400 font-mono">
                        Voice: km-KH-PisethNeural
                      </p>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded-full bg-gold/15 text-[9px] font-mono text-gold border border-gold/30">
                    Natural TTS
                  </span>
                </div>
              </div>

              {/* Chat Messages */}
              <div className="space-y-2.5 py-2">
                {/* User Voice */}
                <div className="flex justify-end pl-6">
                  <div className="rounded-2xl rounded-tr-xs bg-gradient-to-br from-[#2D2111] to-[#1C150B] border border-gold/40 p-2.5 shadow-md max-w-[90%]">
                    <div className="flex items-center justify-end gap-1.5 text-[9.5px] text-gold font-mono pb-1 mb-1 border-b border-gold/20">
                      <Volume2 className="h-3 w-3" />
                      <span>សំឡេងសួរ (Voice Input)</span>
                    </div>
                    <p className="font-khmer text-xs leading-[1.75] text-stone-100 text-right">
                      {phoneUserTyped}
                      {phoneUserTyped.length < phoneUserPrompt.length && (
                        <span className="inline-block w-1 h-3 bg-gold ml-0.5 animate-pulse" />
                      )}
                    </p>
                  </div>
                </div>

                {/* AI Audio Response */}
                <div className="flex justify-start pr-4">
                  <div className="rounded-2xl rounded-tl-xs bg-[#16110A] border border-[#322314] p-3 shadow-md w-full">
                    <div className="flex items-center justify-between text-[9.5px] text-stone-400 font-mono pb-1 mb-1.5 border-b border-[#261A0D]">
                      <span className="text-gold font-semibold">លោកគ្រូ ពិសិដ្ឋ (Senior Educator)</span>
                      <span className="text-emerald-400">Audio Playing</span>
                    </div>

                    {phoneAiStarted ? (
                      <>
                        <p className="font-khmer text-xs leading-[1.8] text-stone-200">
                          {phoneAiTyped}
                          {phoneAiTyped.length < phoneAiResponse.length && (
                            <span className="inline-block w-1 h-3 bg-gold ml-0.5 animate-pulse" />
                          )}
                        </p>

                        {/* Animated Equalizer Sound Bar */}
                        <div className="mt-2.5 p-2 rounded-xl bg-[#0D0A06] border border-[#2B1D0E] flex items-center justify-between gap-2">
                          <div className="h-6 w-6 rounded-full bg-gold text-black flex items-center justify-center shrink-0 shadow-sm">
                            <Play className="h-3 w-3 fill-black ml-0.5" />
                          </div>
                          {/* Animated Bars */}
                          <div className="flex items-center gap-1 flex-1 h-4">
                            {[35, 75, 50, 95, 60, 85, 45, 90, 70, 55, 80, 65, 40].map((h, i) => (
                              <span
                                key={i}
                                className="w-1 bg-gold/80 rounded-full animate-pulse"
                                style={{
                                  height: `${h}%`,
                                  animationDuration: `${0.5 + (i % 4) * 0.15}s`,
                                }}
                              />
                            ))}
                          </div>
                          <span className="text-[10px] font-mono text-gold">0:14 / 0:38</span>
                        </div>
                      </>
                    ) : (
                      <div className="flex items-center gap-2 py-1 text-xs text-stone-400 font-khmer">
                        <span className="h-1.5 w-1.5 rounded-full bg-gold animate-bounce" />
                        <span
                          className="h-1.5 w-1.5 rounded-full bg-gold animate-bounce"
                          style={{ animationDelay: "0.15s" }}
                        />
                        <span className="text-[11px] text-stone-400">កំពុងបង្កើតសំឡេង...</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Bottom Home Indicator Bar */}
              <div className="pt-1 flex justify-center">
                <div className="h-1 w-24 rounded-full bg-stone-700/60" />
              </div>
            </div>
          )}

          {/* ═══════════════════════════════════════════════════════════ */}
          {/* SCENE 3: INTERACTIVE AI PLAYGROUND (LIVE PROMPT SANDBOX)    */}
          {/* ═══════════════════════════════════════════════════════════ */}
          {scene === "sandbox" && (
            <div className="space-y-3.5 animate-fade-in flex-1 flex flex-col justify-between">
              {/* Header */}
              <div>
                <div className="flex items-center justify-between pb-2 border-b border-[#2B1F12]">
                  <div className="flex items-center gap-2">
                    <Compass className="h-4 w-4 text-gold" />
                    <span className="text-xs font-bold text-stone-200 font-heading">
                      {language === "km"
                        ? "សាកល្បងសួរសំណួរផ្ទាល់ (Interactive Sandbox)"
                        : "Instant AI Playground • Click any prompt:"}
                    </span>
                  </div>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-[10px] font-mono text-emerald-400 font-bold">
                    ● Live Sandbox
                  </span>
                </div>

                {/* 3 Clickable Quick Prompt Chips */}
                <div className="grid grid-cols-3 gap-1.5 pt-2.5">
                  {SAMPLE_PROMPTS.map((p) => {
                    const isCur = selectedPrompt.id === p.id;
                    return (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => setSelectedPrompt(p)}
                        className={`p-2 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                          isCur
                            ? "border-gold bg-[#241A0E] text-gold shadow-md shadow-gold/20 scale-[1.02]"
                            : "border-[#2E2012] bg-[#120E09] text-stone-400 hover:border-gold/50 hover:bg-[#1A130C]"
                        }`}
                      >
                        <span className="text-sm">{p.icon}</span>
                        <span className="text-[11px] font-bold truncate mt-1 block font-khmer">
                          {language === "km" ? p.titleKm : p.titleEn}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Dynamic Answer Box */}
              <div className="rounded-2xl border border-[#342415] bg-[#140F09] p-3.5 shadow-md flex-1 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between text-[11px] font-mono pb-1.5 mb-2 border-b border-[#251A0F]">
                    <span className="text-gold flex items-center gap-1.5 font-bold">
                      <span>{selectedPrompt.icon}</span>
                      <span className="font-khmer">
                        {language === "km" ? selectedPrompt.titleKm : selectedPrompt.titleEn}
                      </span>
                    </span>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={handleCopy}
                        className="inline-flex items-center gap-1 text-[10px] text-stone-400 hover:text-gold cursor-pointer"
                      >
                        {copied ? (
                          <>
                            <CheckCircle2 className="h-3 w-3 text-emerald-400" />
                            <span className="text-emerald-400">Copied!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="h-3 w-3" />
                            <span>Copy</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  <p className="font-khmer text-xs sm:text-[13px] leading-[1.8] text-stone-200">
                    {sandboxAiTyped}
                  </p>
                </div>

                {/* Document Pill in Sandbox */}
                <div className="mt-2.5 pt-2 border-t border-[#23170D] flex items-center justify-between text-[11px]">
                  <div className="flex items-center gap-1.5 text-stone-300 font-mono text-[10.5px]">
                    <FileText className="h-3.5 w-3.5 text-emerald-400" />
                    <span className="truncate max-w-[200px]">{selectedPrompt.docTitle}</span>
                  </div>
                  <span className="text-gold font-mono text-[10px]">100% Native Script</span>
                </div>
              </div>

              {/* Complementary Value Link */}
              <div className="pt-1 flex items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-1.5 text-stone-400 text-[11px] font-mono">
                  <span className="h-1.5 w-1.5 rounded-full bg-gold" />
                  <span>No credit card required</span>
                </div>

                <a
                  href="http://localhost:5173/?auth=login"
                  className="inline-flex items-center gap-1.5 font-bold text-gold hover:text-amber-300 transition-colors font-mono text-xs cursor-pointer group"
                >
                  <span>Open Full Chat Workspace</span>
                  <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform" />
                </a>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
