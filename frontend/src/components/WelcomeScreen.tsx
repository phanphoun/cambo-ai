import { useState, useEffect } from "react";
import {
  Building2,
  CreditCard,
  GraduationCap,
  Lightbulb,
  Rocket,
  Search,
  ShieldCheck,
  Smartphone,
  Wifi,
  Bot,
  Sparkles,
  ArrowRight,
} from "lucide-react";
import { cn } from "../lib/utils";

interface Suggestion {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  prompt: string;
  category: string;
}

const SUGGESTIONS: Suggestion[] = [
  {
    icon: Building2,
    label: "Phnom Penh tech scene",
    prompt: "Tell me about the tech scene in Phnom Penh",
    category: "Ecosystem",
  },
  {
    icon: Rocket,
    label: "Top Khmer startups",
    prompt: "What are the top tech startups in Cambodia?",
    category: "Ecosystem",
  },
  {
    icon: GraduationCap,
    label: "Tech education in KH",
    prompt: "What are the best universities to study tech in Cambodia?",
    category: "Ecosystem",
  },
  {
    icon: CreditCard,
    label: "Cambodia fintech",
    prompt: "Tell me about fintech in Cambodia (ABA, Wing, Pi Pay, Bakong)",
    category: "Industry",
  },
  {
    icon: Smartphone,
    label: "Local apps & platforms",
    prompt: "What popular apps are made by Cambodian companies?",
    category: "Industry",
  },
  {
    icon: ShieldCheck,
    label: "Cybersecurity in KH",
    prompt: "Tell me about cybersecurity companies and initiatives in Cambodia",
    category: "Industry",
  },
  {
    icon: Bot,
    label: "Explain AI agents",
    prompt: "Explain AI agents in simple terms",
    category: "AI & Tech",
  },
  {
    icon: Search,
    label: "What is RAG?",
    prompt: "What is RAG in AI and how does it work?",
    category: "AI & Tech",
  },
  {
    icon: Wifi,
    label: "Internet & telcos",
    prompt: "Who are the main internet and telecom providers in Cambodia?",
    category: "AI & Tech",
  },
  {
    icon: Lightbulb,
    label: "Co-working spaces",
    prompt: "List the best co-working spaces and tech hubs in Phnom Penh",
    category: "Ecosystem",
  },
];

const TIPS = [
  "Try asking in Khmer (ភាសាខ្មែរ)",
  "Use /code to write code",
  "Use /translate for translations",
  "Press Ctrl+B to toggle sidebar",
  "Pin important responses for later",
  "Press ? for keyboard shortcuts",
];

interface WelcomeScreenProps {
  onPick: (prompt: string) => void;
}

export default function WelcomeScreen({ onPick }: WelcomeScreenProps) {
  const categories = Array.from(new Set(SUGGESTIONS.map((s) => s.category)));
  const [currentTip, setCurrentTip] = useState(0);

  // Rotate tips
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTip((prev) => (prev + 1) % TIPS.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="mx-auto max-w-3xl pt-6 sm:pt-12 pb-6 animate-fade-in">
      {/* Hero */}
      <div className="text-center">
        <div className="relative inline-flex">
          {/* Glow effect */}
          <div className="absolute inset-0 rounded-full bg-gradient-to-br from-indigo-500/30 via-violet-500/20 to-emerald-500/30 blur-3xl" />
          <div className="relative inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 via-violet-500 to-emerald-500 shadow-lg shadow-indigo-500/30 glow-soft sm:h-20 sm:w-20">
            <span className="text-4xl sm:text-5xl" aria-hidden>
              🇰🇭
            </span>
          </div>
        </div>

        <h1 className="mt-5 bg-gradient-to-br from-foreground via-foreground to-muted-foreground bg-clip-text text-3xl font-bold text-transparent sm:text-4xl">
          How can I help you today?
        </h1>
        <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground sm:text-base">
          Ask about Cambodia&apos;s tech scene, AI, startups, fintech, or anything
          else. I&apos;m tuned to{" "}
          <span className="font-medium text-foreground">Cambodia-first</span>.
        </p>

        {/* Value props */}
        <div className="mt-6 flex flex-wrap items-center justify-center gap-2 text-[11px] text-muted-foreground">
          <Pill icon={Sparkles}>Cambodia-tuned</Pill>
          <Pill icon={Bot}>Powered by Gemini</Pill>
          <Pill icon={ShieldCheck}>Private & ephemeral</Pill>
        </div>

        {/* Rotating tips */}
        <div className="mt-4 flex items-center justify-center gap-2 text-xs text-muted-foreground/70">
          <span className="inline-block h-1.5 w-1.5 rounded-full bg-primary/50" />
          <span className="transition-all duration-500" key={currentTip}>
            💡 {TIPS[currentTip]}
          </span>
        </div>
      </div>

      {/* Categorized suggestions */}
      <div className="mt-8 space-y-5">
        {categories.map((cat, ci) => (
          <section key={cat} className="animate-slide-up" style={{ animationDelay: `${ci * 80}ms` }}>
            <h2 className="mb-2.5 flex items-center gap-2 px-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70">
              <span>{cat}</span>
              <span className="h-px flex-1 bg-border" aria-hidden />
            </h2>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {SUGGESTIONS.filter((s) => s.category === cat).map((s) => {
                const Icon = s.icon;
                return (
                  <button
                    key={s.prompt}
                    onClick={() => onPick(s.prompt)}
                    className={cn(
                      "group flex items-center gap-3 rounded-xl border bg-card px-3.5 py-3",
                      "text-left text-sm text-foreground",
                      "transition-all duration-200",
                      "border-border hover:-translate-y-0.5 hover:border-primary/60 hover:bg-secondary hover:shadow-md hover:shadow-primary/5",
                    )}
                  >
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-secondary/80 transition-transform group-hover:scale-110 group-hover:bg-primary/10">
                      <Icon className="h-3.5 w-3.5 text-primary" />
                    </div>
                    <span className="flex-1 truncate">{s.label}</span>
                    <ArrowRight className="h-3.5 w-3.5 shrink-0 -translate-x-1 text-muted-foreground opacity-0 transition-all group-hover:translate-x-0 group-hover:opacity-100" />
                  </button>
                );
              })}
            </div>
          </section>
        ))}
      </div>

      {/* Tip footer */}
      <div className="mt-8 rounded-xl border border-dashed border-border bg-gradient-to-r from-primary/5 to-emerald-500/5 px-4 py-3 text-center text-xs text-muted-foreground">
        💡 Tip: ask in <span className="font-medium text-foreground">Khmer</span>{" "}
        (ភាសាខ្មែរ) — I&apos;ll respond in your language.
      </div>
    </div>
  );
}

function Pill({
  icon: Icon,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
}) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-secondary/60 px-2.5 py-1">
      <Icon className="h-3 w-3 text-primary" />
      <span>{children}</span>
    </span>
  );
}
