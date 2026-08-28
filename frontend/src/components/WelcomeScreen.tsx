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
  BookOpen,
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
    icon: BookOpen,
    label: "Co-working spaces",
    prompt: "List the best co-working spaces and tech hubs in Phnom Penh",
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
];

interface WelcomeScreenProps {
  onPick: (prompt: string) => void;
}

export default function WelcomeScreen({ onPick }: WelcomeScreenProps) {
  const categories = Array.from(new Set(SUGGESTIONS.map((s) => s.category)));

  return (
    <div className="relative mx-auto max-w-4xl pt-8 sm:pt-16 pb-6 animate-fade-in">
      {/* Faint Angkor Wat watermark */}
      <div
        className="absolute -right-8 top-4 pointer-events-none select-none opacity-[0.04]"
        aria-hidden="true"
      >
        <svg
          width="400"
          height="400"
          viewBox="0 0 24 24"
          fill="currentColor"
          className="text-foreground"
        >
          <path d="M12 2L2 22h20L12 2zm0 4l6 14H6l6-14z" />
        </svg>
      </div>

      {/* Hero */}
      <div className="text-center relative">
        <div className="inline-flex items-center justify-center h-16 w-16 rounded-2xl bg-secondary mb-5">
          <span className="text-4xl" aria-hidden>
            🇰🇭
          </span>
        </div>

        <h1 className="text-3xl font-bold text-foreground sm:text-4xl">
          Your AI assistant for everything{" "}
          <span className="text-primary">Cambodia-first</span>
        </h1>
        <p className="mx-auto mt-3 max-w-lg text-sm text-muted-foreground sm:text-base">
          Ask about Cambodia&apos;s tech scene, AI, startups, fintech, or anything else.
        </p>

        {/* Value props */}
        <div className="mt-6 flex flex-wrap items-center justify-center gap-2 text-[11px] text-muted-foreground">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-secondary/60 px-2.5 py-1">
            <Sparkles className="h-3 w-3 text-primary" />
            <span>Cambodia-tuned</span>
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-secondary/60 px-2.5 py-1">
            <Bot className="h-3 w-3 text-primary" />
            <span>Powered by Gemini</span>
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-secondary/60 px-2.5 py-1">
            <ShieldCheck className="h-3 w-3 text-primary" />
            <span>Private & ephemeral</span>
          </span>
        </div>

        {/* Tip */}
        <div className="mt-4 flex items-center justify-center gap-2 text-xs text-muted-foreground">
          <Lightbulb className="h-3.5 w-3.5" />
          <span>
            Tip: ask in Khmer (ភាសាខ្មែរ) — I&apos;ll respond in your language.
          </span>
        </div>
      </div>

      {/* Categorized suggestions */}
      <div className="mt-10 space-y-6">
        {categories.map((cat) => (
          <section key={cat}>
            <h2 className="mb-3 px-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70">
              {cat}
            </h2>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {SUGGESTIONS.filter((s) => s.category === cat).map((s) => {
                const Icon = s.icon;
                return (
                  <button
                    key={s.prompt}
                    onClick={() => onPick(s.prompt)}
                    className={cn(
                      "group flex items-center gap-3 rounded-xl border border-border bg-card px-3.5 py-3",
                      "text-left text-sm text-foreground",
                      "transition-all duration-200",
                      "hover:-translate-y-0.5 hover:border-primary/60 hover:bg-secondary hover:shadow-md hover:shadow-primary/5",
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
    </div>
  );
}
