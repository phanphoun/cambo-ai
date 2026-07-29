import { useState } from "react";
import { useSelector } from "react-redux";
import {
  Share2,
  Link,
  QrCode,
  ClipboardCopy,
  Download,
  Check,
  X,
} from "lucide-react";
import { toast } from "react-hot-toast";
import {
  buildShareUrl,
  formatTranscript,
  copyToClipboard,
  downloadAsFile,
  generateQrCodeUrl,
} from "./shareUtils";
import { cn } from "../../lib/utils";
import type { RootState } from "../../store";

interface ShareMenuProps {
  open: boolean;
  onClose: () => void;
}

export default function ShareMenu({ open, onClose }: ShareMenuProps) {
  const messages = useSelector((s: RootState) => s.chat.messages);
  const [copied, setCopied] = useState(false);
  const [showQr, setShowQr] = useState(false);

  if (!open) return null;

  const hasMessages = messages.length > 0;
  const shareUrl = hasMessages ? buildShareUrl(messages) : "";
  const transcript = hasMessages ? formatTranscript(messages) : "";

  async function handleCopyLink() {
    if (!shareUrl) return;
    const ok = await copyToClipboard(shareUrl);
    if (ok) {
      setCopied(true);
      toast.success("Share link copied!", { duration: 2000 });
      setTimeout(() => setCopied(false), 2000);
    } else {
      toast.error("Failed to copy link");
    }
  }

  async function handleCopyTranscript() {
    if (!transcript) return;
    const ok = await copyToClipboard(transcript);
    if (ok) {
      toast.success("Transcript copied!", { duration: 2000 });
    } else {
      toast.error("Failed to copy transcript");
    }
  }

  function handleDownloadMarkdown() {
    const md = messages
      .map((m) => {
        const role = m.role === "user" ? "## You" : "## CAMBO AI";
        return `${role}\n> ${new Date(m.timestamp).toLocaleString()}\n\n${m.content}\n`;
      })
      .join("\n---\n");
    downloadAsFile(
      `# CAMBO AI Conversation\n\n${md}`,
      `cambo-conversation-${Date.now()}.md`,
    );
    toast.success("Downloaded as .md", { duration: 2000 });
  }

  function handleDownloadTxt() {
    downloadAsFile(transcript, `cambo-conversation-${Date.now()}.txt`);
    toast.success("Downloaded as .txt", { duration: 2000 });
  }

  const actions = [
    {
      label: "Copy share link",
      desc: "Share conversation via URL",
      icon: copied ? Check : Link,
      onClick: handleCopyLink,
      disabled: !hasMessages,
      className: copied ? "text-emerald-400" : "",
    },
    {
      label: "QR code",
      desc: "Generate QR for this conversation",
      icon: QrCode,
      onClick: () => setShowQr(!showQr),
      disabled: !hasMessages,
    },
    {
      label: "Copy transcript",
      desc: "Full conversation to clipboard",
      icon: ClipboardCopy,
      onClick: handleCopyTranscript,
      disabled: !hasMessages,
    },
    {
      label: "Download .md",
      desc: "Save as Markdown file",
      icon: Download,
      onClick: handleDownloadMarkdown,
      disabled: !hasMessages,
    },
    {
      label: "Download .txt",
      desc: "Save as plain text file",
      icon: Download,
      onClick: handleDownloadTxt,
      disabled: !hasMessages,
    },
  ];

  return (
    <div className="absolute bottom-full right-0 z-50 mb-2 w-72">
      <div className="rounded-xl border border-border bg-card shadow-xl">
        <div className="flex items-center justify-between border-b border-border px-3 py-2.5">
          <div className="flex items-center gap-2 text-sm font-medium">
            <Share2 className="h-4 w-4" />
            Share & Export
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-muted-foreground hover:bg-secondary hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {!hasMessages && (
          <p className="px-3 py-4 text-center text-xs text-muted-foreground">
            No messages to share yet
          </p>
        )}

        <div className="p-1.5">
          {actions.map((action) => {
            const Icon = action.icon;
            return (
              <button
                key={action.label}
                type="button"
                onClick={action.onClick}
                disabled={action.disabled}
                className={cn(
                  "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm transition-colors",
                  "hover:bg-secondary",
                  action.disabled
                    ? "cursor-not-allowed opacity-40"
                    : "cursor-pointer",
                  action.className,
                )}
              >
                <Icon className="h-4 w-4 shrink-0" />
                <div className="min-w-0 flex-1">
                  <span className="block">{action.label}</span>
                  <span className="block text-[10px] text-muted-foreground">
                    {action.desc}
                  </span>
                </div>
              </button>
            );
          })}
        </div>

        {showQr && hasMessages && (
          <div className="border-t border-border p-4">
            <img
              src={generateQrCodeUrl(shareUrl)}
              alt="QR Code for this conversation"
              className="mx-auto h-40 w-40 rounded-lg"
            />
            <p className="mt-2 text-center text-[10px] text-muted-foreground">
              Scan to open this conversation
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
