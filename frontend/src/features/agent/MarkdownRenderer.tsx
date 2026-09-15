import { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkBreaks from "remark-breaks";
import { Check, Copy } from "lucide-react";

interface CodeBlockProps {
  inline?: boolean;
  className?: string;
  children?: React.ReactNode;
}

function CodeBlock({ inline, className, children }: CodeBlockProps) {
  const [copied, setCopied] = useState(false);
  const text = String(children || "").replace(/\n$/, "");
  const match = /language-(\w+)/.exec(className || "");

  if (inline) {
    return (
      <code className="rounded border border-gold/25 bg-gold/10 px-1.5 py-0.5 font-mono text-[11px] text-amber-200">
        {children}
      </code>
    );
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="relative my-2.5 overflow-hidden rounded-lg border border-slate-700/80 bg-slate-950/80 shadow-md">
      <div className="flex items-center justify-between border-b border-slate-800 bg-slate-900/90 px-3 py-1 text-[10px] text-slate-400">
        <span className="font-mono lowercase text-gold">{match ? match[1] : "code"}</span>
        <button
          type="button"
          onClick={handleCopy}
          className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] text-slate-400 transition hover:bg-slate-800 hover:text-slate-200"
          title="Copy code"
        >
          {copied ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
          <span>{copied ? "Copied" : "Copy"}</span>
        </button>
      </div>
      <pre className="max-h-80 overflow-x-auto p-3 font-mono text-[11px] leading-relaxed text-slate-200">
        <code>{text}</code>
      </pre>
    </div>
  );
}

export default function MarkdownRenderer({
  content,
  className = "",
}: {
  content: string;
  className?: string;
}) {
  return (
    <div className={`markdown prose prose-invert max-w-none text-xs leading-relaxed text-slate-200 ${className}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkBreaks]}
        components={{
          h1: ({ children }) => (
            <h1 className="mb-2 mt-4 flex items-center gap-2 border-b border-slate-700/60 pb-1.5 font-heading text-sm font-bold text-gold first:mt-0">
              {children}
            </h1>
          ),
          h2: ({ children }) => (
            <h2 className="mb-2 mt-3.5 flex items-center gap-2 font-heading text-xs font-semibold text-amber-300 first:mt-0">
              {children}
            </h2>
          ),
          h3: ({ children }) => (
            <h3 className="mb-1.5 mt-3 font-heading text-xs font-medium text-amber-200 first:mt-0">
              {children}
            </h3>
          ),
          p: ({ children }) => (
            <p className="my-1.5 text-xs leading-relaxed text-slate-300 first:mt-0 last:mb-0">
              {children}
            </p>
          ),
          ul: ({ children }) => (
            <ul className="my-2 ml-4 list-disc space-y-1 text-xs text-slate-300 marker:text-gold">
              {children}
            </ul>
          ),
          ol: ({ children }) => (
            <ol className="my-2 ml-4 list-decimal space-y-1 text-xs text-slate-300 marker:text-gold">
              {children}
            </ol>
          ),
          li: ({ children }) => <li className="leading-relaxed">{children}</li>,
          strong: ({ children }) => <strong className="font-semibold text-slate-100">{children}</strong>,
          em: ({ children }) => <em className="italic text-slate-300">{children}</em>,
          blockquote: ({ children }) => (
            <blockquote className="my-2 rounded-r border-l-2 border-gold/70 bg-gold/5 px-3 py-1.5 text-xs italic text-amber-200/90">
              {children}
            </blockquote>
          ),
          hr: () => <hr className="my-3 border-t border-slate-700/60" />,
          table: ({ children }) => (
            <div className="my-2.5 overflow-x-auto rounded-lg border border-slate-700/80 bg-slate-900/60">
              <table className="w-full border-collapse text-left text-[11px]">{children}</table>
            </div>
          ),
          th: ({ children }) => (
            <th className="border-b border-slate-700 bg-slate-800/80 px-3 py-1.5 font-semibold text-gold">
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td className="border-b border-slate-800/60 px-3 py-1.5 text-slate-300">
              {children}
            </td>
          ),
          code: CodeBlock,
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
