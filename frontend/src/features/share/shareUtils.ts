import type { Message } from "../../types/chat";

function compress(data: string): string {
  try {
    return btoa(encodeURIComponent(data));
  } catch {
    return "";
  }
}

function decompress(data: string): string {
  try {
    return decodeURIComponent(atob(data));
  } catch {
    return "";
  }
}

export function encodeConversation(messages: Message[]): string {
  const data = JSON.stringify(
    messages.map((m) => ({ r: m.role, c: m.content })),
  );
  return compress(data);
}

export function decodeConversation(hash: string): Pick<Message, "role" | "content">[] | null {
  try {
    const raw = decompress(hash);
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed;
    return null;
  } catch {
    return null;
  }
}

export function buildShareUrl(messages: Message[]): string {
  const data = encodeConversation(messages);
  const url = new URL(window.location.href);
  url.searchParams.set("conv", data);
  return url.toString();
}

export function formatTranscript(messages: Message[]): string {
  return messages
    .map((m) => {
      const role = m.role === "user" ? "You" : "Sastra AI";
      return `**${role}** [${new Date(m.timestamp).toLocaleString()}]\n${m.content}\n`;
    })
    .join("\n---\n");
}

export function downloadAsFile(content: string, filename: string) {
  const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.style.position = "fixed";
    ta.style.opacity = "0";
    document.body.appendChild(ta);
    ta.select();
    try {
      document.execCommand("copy");
      return true;
    } catch {
      return false;
    } finally {
      document.body.removeChild(ta);
    }
  }
}

export function generateQrCodeUrl(text: string, size = 200): string {
  return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(text)}`;
}
