import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatTime(iso: string): string {
  try {
    return new Date(iso).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "";
  }
}

/**
 * Preprocess markdown content to normalize LaTeX math expressions and block environments
 * so remark-math and rehype-katex render them cleanly and accurately without breaking
 * existing inline or display math expressions.
 */
export function preprocessLaTeX(content: string): string {
  if (!content) return "";

  // 1. Protect fenced multi-line code blocks first (never touch them)
  const codeBlocks: string[] = [];
  let text = content.replace(/(```[\s\S]*?```|~~~[\s\S]*?~~~)/g, (match) => {
    codeBlocks.push(match);
    return `@@CODE_BLOCK_${codeBlocks.length - 1}@@`;
  });

  // 2. Unwrap backticks accidentally placed around LaTeX math expressions
  // e.g. `$v = \frac{d}{t}$` -> $v = \frac{d}{t}$
  // e.g. `$$v = \frac{d}{t}$$` -> $$v = \frac{d}{t}$$
  text = text.replace(/`(\${1,2}[\s\S]*?\${1,2})`/g, "$1");
  // Also unwrap inline code containing bare LaTeX commands without dollar signs
  // e.g. `\frac{d}{t}` -> $\frac{d}{t}$
  text = text.replace(
    /`(\\(?:frac|sqrt|begin|cases|mathbf|vec|times|sum|int|alpha|beta|gamma|pm|infty|approx|ne|le|ge)[^`\n]*)`/g,
    "$$$1$$",
  );

  // 3. Protect remaining normal inline code blocks
  text = text.replace(/(`[^`\n]+`)/g, (match) => {
    codeBlocks.push(match);
    return `@@CODE_BLOCK_${codeBlocks.length - 1}@@`;
  });

  // 4. Normalize LaTeX display math \[ ... \] to display blocks $$ ... $$
  text = text.replace(/\\\[([\s\S]*?)\\\]/g, (_, math) => {
    return `\n\n$$\n${math.trim()}\n$$\n\n`;
  });

  // 5. Normalize LaTeX inline math \( ... \) to $ ... $
  text = text.replace(/\\\(([\s\S]*?)\\\)/g, (_, math) => {
    return `$${math.trim()}$`;
  });

  // 6. Protect existing $$...$$ and $...$ math blocks before processing bare LaTeX environments
  const mathBlocks: string[] = [];

  // Protect $$...$$ first (can span multiple lines)
  text = text.replace(/\$\$([\s\S]*?)\$\$/g, (match) => {
    mathBlocks.push(match);
    return `@@MATH_BLOCK_${mathBlocks.length - 1}@@`;
  });

  // Protect $...$ (inline math: starts with $, non-space, ends with non-space, $)
  // Note: remark-math allows inline math across newlines as long as no blank lines exist inside
  text = text.replace(/(?<!\\)\$(?!\s)([\s\S]*?)(?<!\s|\$)\$/g, (match) => {
    if (!match.includes("\n\n")) {
      mathBlocks.push(match);
      return `@@MATH_BLOCK_${mathBlocks.length - 1}@@`;
    }
    return match;
  });

  // 5. Any remaining \begin{env}...\end{env} is truly BARE (not enclosed in $ or $$)
  const envRegex =
    /\\begin\{(aligned|align\*?|equation\*?|cases|matrix|pmatrix|bmatrix|vmatrix|Vmatrix|gather\*?|split|subarray)\}([\s\S]*?)\\end\{\1\}/g;
  text = text.replace(envRegex, (match) => {
    return `$$\n${match.trim()}\n$$`;
  });

  // 6. Restore protected math blocks
  text = text.replace(/@@MATH_BLOCK_(\d+)@@/g, (_, idx) => mathBlocks[Number(idx)]);

  // 7. Ensure standalone single-line $$...$$ on its own line is formatted with newlines $$\n...\n$$
  // This guarantees remark-math parses it as a displayMode block with proper centering and sizing
  const lines = text.split("\n");
  const resultLines: string[] = [];

  for (const line of lines) {
    const match = line.match(/^[ \t]*\$\$([^\n]+?)\$\$[ \t]*$/);
    if (match) {
      resultLines.push("");
      resultLines.push("$$");
      resultLines.push(match[1].trim());
      resultLines.push("$$");
      resultLines.push("");
    } else {
      resultLines.push(line);
    }
  }
  text = resultLines.join("\n");

  // 8. Restore code blocks
  text = text.replace(/@@CODE_BLOCK_(\d+)@@/g, (_, idx) => codeBlocks[Number(idx)]);

  return text;
}
