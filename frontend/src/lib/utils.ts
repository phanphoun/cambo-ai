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
 * so remark-math and rehype-katex render them cleanly and accurately.
 */
export function preprocessLaTeX(content: string): string {
  if (!content) return "";

  // Split by fenced code blocks (```...```) so code blocks are never modified
  const parts = content.split(/(```[\s\S]*?```)/g);

  return parts
    .map((part, index) => {
      // Code blocks (odd indices) remain untouched
      if (index % 2 === 1) return part;

      let processed = part;

      // 1. Normalize LaTeX display math \[ ... \] to display blocks $$\n...\n$$
      processed = processed.replace(/\\\[([\s\S]*?)\\\]/g, (_, math) => {
        return `\n\n$$\n${math.trim()}\n$$\n\n`;
      });

      // 2. Normalize LaTeX inline math \( ... \) to $...$
      processed = processed.replace(/\\\(([\s\S]*?)\\\)/g, (_, math) => {
        return `$${math.trim()}$`;
      });

      // 3. Wrap bare LaTeX environments (\begin{aligned} ... \end{aligned}) not already enclosed in $$
      processed = processed.replace(
        /(?<!\$\$[^\n]*)\\begin\{(aligned|align\*?|equation\*?|cases|matrix|pmatrix|bmatrix|vmatrix|Vmatrix|gather\*?)\}([\s\S]*?)\\end\{\1\}(?![^\n]*\$\$)/g,
        (match) => `\n\n$$\n${match.trim()}\n$$\n\n`
      );

      // 4. Ensure standalone single-line $$...$$ on its own line is formatted with newlines $$\n...\n$$
      // This guarantees remark-math parses it as a displayMode block with proper centering and sizing
      const lines = processed.split("\n");
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

      return resultLines.join("\n");
    })
    .join("");
}
