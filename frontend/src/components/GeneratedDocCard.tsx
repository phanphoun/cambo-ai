import { useState } from "react";
import { FileText, Download, Check, FileSpreadsheet, FileCode, Loader2 } from "lucide-react";
import { cn } from "../lib/utils";
import { API_BASE } from "../config/api";

interface GeneratedDocMeta {
  title: string;
  format: string;
  filename: string;
  size: string;
  downloadUrl: string;
  docId: string;
}

export function parseGeneratedDoc(content: string): { cleanContent: string; docMeta: GeneratedDocMeta | null } {
  const match = content.match(/\[DOCUMENT_GENERATED\]([\s\S]*?)\[\/DOCUMENT_GENERATED\]/);
  if (!match) {
    return { cleanContent: content, docMeta: null };
  }

  const rawBlock = match[1];
  const title = (rawBlock.match(/Title:\s*(.+)/i) || [])[1]?.trim() || "Generated Document";
  const format = (rawBlock.match(/Format:\s*(.+)/i) || [])[1]?.trim() || "PDF";
  const filename = (rawBlock.match(/Filename:\s*(.+)/i) || [])[1]?.trim() || "document.pdf";
  const size = (rawBlock.match(/Size:\s*(.+)/i) || [])[1]?.trim() || "Unknown size";
  const downloadUrl = (rawBlock.match(/Download URL:\s*(.+)/i) || [])[1]?.trim() || "";
  const docId = (rawBlock.match(/Document ID:\s*(.+)/i) || [])[1]?.trim() || "";

  // Replace block with clean text
  const cleanContent = content.replace(/\[DOCUMENT_GENERATED\][\s\S]*?\[\/DOCUMENT_GENERATED\]/g, "").trim();

  return {
    cleanContent,
    docMeta: {
      title,
      format,
      filename,
      size,
      downloadUrl,
      docId,
    },
  };
}

export function GeneratedDocCard({ doc }: { doc: GeneratedDocMeta }) {
  const [downloading, setDownloading] = useState(false);
  const [downloaded, setDownloaded] = useState(false);

  const handleDownload = async () => {
    setDownloading(true);
    try {
      // Direct browser download
      const link = document.createElement("a");
      link.href = `${API_BASE}${doc.downloadUrl}`;
      link.setAttribute("download", doc.filename);
      link.setAttribute("target", "_blank");
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setDownloaded(true);
      setTimeout(() => setDownloaded(false), 3000);
    } catch (err) {
      console.error("Download failed", err);
    } finally {
      setDownloading(false);
    }
  };

  const isPdf = doc.format.toUpperCase() === "PDF";
  const isDocx = doc.format.toUpperCase().includes("DOC");
  const isCsv = doc.format.toUpperCase().includes("CSV");

  return (
    <div className="my-4 overflow-hidden rounded-2xl border border-[#483B24] bg-gradient-to-br from-[#1A140E] via-[#140F0A] to-[#0D0A06] p-4 shadow-2xl transition-all hover:border-gold/60">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3.5 min-w-0">
          <div
            className={cn(
              "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border shadow-inner",
              isPdf
                ? "border-rose-500/40 bg-rose-500/10 text-rose-400"
                : isDocx
                ? "border-sky-500/40 bg-sky-500/10 text-sky-400"
                : isCsv
                ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-400"
                : "border-gold/40 bg-gold/10 text-gold",
            )}
          >
            {isCsv ? (
              <FileSpreadsheet className="h-5 w-5" />
            ) : isDocx ? (
              <FileText className="h-5 w-5" />
            ) : isPdf ? (
              <FileText className="h-5 w-5" />
            ) : (
              <FileCode className="h-5 w-5" />
            )}
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span
                className={cn(
                  "rounded-md px-1.5 py-0.5 text-[9px] font-mono font-bold uppercase tracking-wider",
                  isPdf
                    ? "bg-rose-500/20 text-rose-300"
                    : isDocx
                    ? "bg-sky-500/20 text-sky-300"
                    : isCsv
                    ? "bg-emerald-500/20 text-emerald-300"
                    : "bg-gold/20 text-gold",
                )}
              >
                {doc.format}
              </span>
              <span className="text-[11px] font-mono text-stone-400">{doc.size}</span>
            </div>
            <h4 className="mt-1 font-bold text-sm text-stone-100 truncate">{doc.title}</h4>
            <p className="text-xs font-mono text-stone-400 truncate">{doc.filename}</p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleDownload}
          disabled={downloading}
          className={cn(
            "flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition-all shadow-lg cursor-pointer shrink-0 w-full sm:w-auto justify-center",
            downloaded
              ? "bg-emerald-500 text-black shadow-emerald-500/20"
              : "bg-gradient-to-r from-gold via-amber-500 to-amber-700 text-black hover:scale-[1.02] shadow-gold/20",
          )}
        >
          {downloading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : downloaded ? (
            <Check className="h-4 w-4 stroke-[3]" />
          ) : (
            <Download className="h-4 w-4 stroke-[2.5]" />
          )}
          <span>{downloaded ? "Downloaded!" : `Download ${doc.format}`}</span>
        </button>
      </div>
    </div>
  );
}
