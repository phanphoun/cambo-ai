import { useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { X, Upload, FileText, Link2, Trash2, Check, Loader2 } from "lucide-react";
import { toast } from "react-hot-toast";
import {
  useListDocumentsQuery,
  useUploadDocumentMutation,
  useIngestUrlMutation,
  useDeleteDocumentMutation,
} from "../chat/chatApi";
import {
  toggleDocumentSelected,
} from "./documentsSlice";
import type { RootState } from "../../store";
import { useTranslation } from "../../i18n/useTranslation";

function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / 1024 / 1024).toFixed(1)} MB`;
}

export default function DocumentsPanel({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const dispatch = useDispatch();
  const { t } = useTranslation();
  const { data: docs, refetch } = useListDocumentsQuery();
  const docsList = docs ?? [];
  const [uploadDoc, { isLoading: uploading }] = useUploadDocumentMutation();
  const [ingestUrl, { isLoading: ingesting }] = useIngestUrlMutation();
  const [deleteDoc] = useDeleteDocumentMutation();
  const selected = useSelector((s: RootState) => s.documents.selected);
  const fileRef = useRef<HTMLInputElement>(null);
  const [url, setUrl] = useState("");

  if (!open) return null;

  async function onFiles(files: FileList | null) {
    if (!files?.length) return;
    for (const f of Array.from(files)) {
      try {
        await uploadDoc({ file: f, name: f.name }).unwrap();
        toast.success(`Added ${f.name}`);
      } catch {
        toast.error(`Failed to add ${f.name}`);
      }
    }
    refetch();
  }

  async function onIngestUrl() {
    const u = url.trim();
    if (!u) return;
    try {
      await ingestUrl({ url: u }).unwrap();
      toast.success("Added from URL");
      setUrl("");
      refetch();
    } catch {
      toast.error("Failed to ingest URL");
    }
  }

  async function onDelete(id: string) {
    try {
      await deleteDoc(id).unwrap();
      toast.success("Document removed");
      refetch();
    } catch {
      toast.error("Failed to delete");
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative z-10 flex h-[80vh] w-full max-w-2xl flex-col rounded-2xl border border-border bg-card shadow-2xl">
        {/* Header */}
        <div className="flex items-center gap-3 border-b border-border p-4">
          <div className="flex flex-1 items-center gap-2 rounded-xl border border-border bg-background px-3">
            <Upload className="h-4 w-4 shrink-0 text-muted-foreground" />
            <span className="py-2.5 text-sm text-muted-foreground">
              {t.documentsModal.subtitle}
            </span>
          </div>
          <button
            onClick={onClose}
            className="shrink-0 rounded-lg p-2 text-muted-foreground hover:bg-secondary hover:text-foreground"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Upload row */}
        <div className="flex items-center gap-2 border-b border-border p-4">
          <button
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-60"
          >
            {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
            {t.documentsModal.upload}
          </button>
          <input
            ref={fileRef}
            type="file"
            accept=".pdf,.txt,.md,text/plain,application/pdf"
            multiple
            hidden
            onChange={(e) => {
              onFiles(e.target.files);
              e.target.value = "";
            }}
          />
          <div className="flex flex-1 items-center gap-2">
            <Link2 className="h-4 w-4 shrink-0 text-muted-foreground" />
            <input
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://example.com/doc"
              className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary/60"
            />
            <button
              onClick={onIngestUrl}
              disabled={ingesting || !url.trim()}
              className="rounded-lg border border-border px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:border-primary/50 hover:text-foreground disabled:opacity-50"
            >
              {ingesting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Add URL"}
            </button>
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto scrollbar-thin p-4">
          {docsList.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <FileText className="mb-2 h-8 w-8 opacity-50" />
              <p className="text-sm">{t.documentsModal.noDocs}</p>
            </div>
          ) : (
            <div className="space-y-2">
              {docsList.map((d) => {
                const isSel = selected.includes(d.id);
                return (
                  <div
                    key={d.id}
                    className={cn(
                      "flex items-center gap-3 rounded-xl border p-3 transition-colors",
                      isSel ? "border-primary/60 bg-primary/5" : "border-border bg-background",
                    )}
                  >
                    <FileText className="h-5 w-5 shrink-0 text-muted-foreground" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{d.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {d.source_type} · {d.chunks} chunks · {formatBytes(d.size_bytes)}
                      </p>
                    </div>
                    <button
                      onClick={() => dispatch(toggleDocumentSelected(d.id))}
                      className={cn(
                        "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border transition-colors",
                        isSel
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-border text-muted-foreground hover:border-primary/50",
                      )}
                      title={t.documentsModal.selectForChat}
                    >
                      <Check className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => onDelete(d.id)}
                      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-border text-muted-foreground transition-colors hover:border-destructive/50 hover:text-destructive"
                      title="Delete document"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-border px-4 py-2.5 text-[11px] text-muted-foreground">
          {selected.length > 0
            ? `${selected.length} document(s) selected for grounding`
            : "Select documents to ground your next question in them"}
        </div>
      </div>
    </div>
  );
}

function cn(...classes: (string | false | null | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}
