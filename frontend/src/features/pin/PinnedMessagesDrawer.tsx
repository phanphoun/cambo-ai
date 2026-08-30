import { useDispatch, useSelector } from "react-redux";
import { Pin, X, Trash2 } from "lucide-react";
import { removePin } from "./pinSlice";
import { cn, formatTime } from "../../lib/utils";
import type { RootState } from "../../store";

interface PinnedMessagesDrawerProps {
  open: boolean;
  onClose: () => void;
}

export default function PinnedMessagesDrawer({
  open,
  onClose,
}: PinnedMessagesDrawerProps) {
  const dispatch = useDispatch();
  const pinned = useSelector((s: RootState) => s.pin.pinned);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
        aria-hidden="true"
      />
      <aside
        className={cn(
          "relative z-10 flex h-full w-full max-w-md flex-col border-l border-border bg-card shadow-2xl animate-slide-in",
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-4 py-3.5">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Pin className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-foreground">
                Pinned Messages
              </h2>
              <p className="text-[11px] text-muted-foreground">
                {pinned.length} saved message{pinned.length === 1 ? "" : "s"}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
            aria-label="Close drawer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 scrollbar-thin space-y-3">
          {pinned.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center text-muted-foreground">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-secondary/80 text-muted-foreground/60 mb-3">
                <Pin className="h-6 w-6" />
              </div>
              <p className="text-sm font-medium text-foreground">
                No pinned messages yet
              </p>
              <p className="mt-1 text-xs text-muted-foreground/70 max-w-[220px]">
                Click the pin icon on any assistant response to keep it handy here.
              </p>
            </div>
          ) : (
            pinned.map((m) => (
              <div
                key={m.timestamp}
                className="group relative rounded-xl border border-border/70 bg-background/80 p-3.5 transition-all hover:border-primary/40 hover:shadow-sm"
              >
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <span className="inline-flex items-center gap-1 rounded-md bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">
                    {m.role === "user" ? "You" : "SASTRA AI"}
                  </span>
                  <span className="text-[10px] text-muted-foreground tabular-nums">
                    {formatTime(m.timestamp)}
                  </span>
                </div>
                <p className="text-xs text-foreground/90 leading-relaxed whitespace-pre-wrap line-clamp-6">
                  {m.content}
                </p>
                <div className="mt-2.5 flex items-center justify-end gap-1.5 pt-2 border-t border-border/40">
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(m.content);
                    }}
                    className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11px] text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                    title="Copy content"
                  >
                    Copy
                  </button>
                  <button
                    type="button"
                    onClick={() => dispatch(removePin(m.timestamp))}
                    className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11px] text-destructive/80 transition-colors hover:bg-destructive/10 hover:text-destructive"
                    title="Unpin"
                  >
                    <Trash2 className="h-3 w-3" />
                    Unpin
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </aside>
    </div>
  );
}
