import { useMemo } from "react";

type LineKind = "add" | "del" | "ctx" | "hunk" | "meta";

interface DiffLine {
  kind: LineKind;
  text: string;
  oldNo: number | null;
  newNo: number | null;
}

/**
 * Parse a unified diff into numbered lines.
 *
 * Line numbers are tracked from each `@@` hunk header so the reviewer can map a
 * change back to the real file — a diff without line numbers is much harder to
 * check against the source.
 */
function parseDiff(diff: string): DiffLine[] {
  const out: DiffLine[] = [];
  let oldNo = 0;
  let newNo = 0;

  for (const raw of diff.split("\n")) {
    if (raw.startsWith("--- ") || raw.startsWith("+++ ")) {
      out.push({ kind: "meta", text: raw, oldNo: null, newNo: null });
      continue;
    }
    const hunk = raw.match(/^@@ -(\d+)(?:,\d+)? \+(\d+)(?:,\d+)? @@/);
    if (hunk) {
      oldNo = parseInt(hunk[1], 10);
      newNo = parseInt(hunk[2], 10);
      out.push({ kind: "hunk", text: raw, oldNo: null, newNo: null });
      continue;
    }
    if (raw.startsWith("+")) {
      out.push({ kind: "add", text: raw.slice(1), oldNo: null, newNo: newNo++ });
    } else if (raw.startsWith("-")) {
      out.push({ kind: "del", text: raw.slice(1), oldNo: oldNo++, newNo: null });
    } else if (raw.startsWith("\\")) {
      out.push({ kind: "meta", text: raw, oldNo: null, newNo: null });
    } else {
      const text = raw.startsWith(" ") ? raw.slice(1) : raw;
      out.push({ kind: "ctx", text, oldNo: oldNo++, newNo: newNo++ });
    }
  }
  return out;
}

const ROW_STYLES: Record<LineKind, string> = {
  add: "bg-emerald-500/10 text-emerald-200",
  del: "bg-rose-500/10 text-rose-200",
  ctx: "text-slate-400",
  hunk: "bg-slate-700/40 text-slate-400 select-none",
  meta: "text-slate-600 select-none",
};

const MARKERS: Record<LineKind, string> = {
  add: "+",
  del: "-",
  ctx: " ",
  hunk: "",
  meta: "",
};

export default function DiffView({ diff }: { diff: string }) {
  const lines = useMemo(() => parseDiff(diff), [diff]);

  if (!diff.trim()) {
    return <p className="px-3 py-2 text-xs text-slate-500">(empty diff)</p>;
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-slate-700/60 bg-slate-900/70">
      <table className="w-full border-collapse font-mono text-[11px] leading-[1.6]">
        <tbody>
          {lines.map((line, i) => {
            if (line.kind === "meta") return null;
            return (
              <tr key={i} className={ROW_STYLES[line.kind]}>
                <td className="w-10 select-none border-r border-slate-700/50 px-2 text-right text-slate-600">
                  {line.oldNo ?? ""}
                </td>
                <td className="w-10 select-none border-r border-slate-700/50 px-2 text-right text-slate-600">
                  {line.newNo ?? ""}
                </td>
                <td className="w-4 select-none pl-2 text-center opacity-70">
                  {MARKERS[line.kind]}
                </td>
                <td className="whitespace-pre-wrap break-all py-[1px] pr-3">
                  {line.text || " "}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
