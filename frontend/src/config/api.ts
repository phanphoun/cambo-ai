/**
 * Dynamic API Base URL resolution.
 * Automatically adapts to the current host (localhost or local network IP like 192.168.x.x)
 * so that both local desktop and mobile/LAN testing work seamlessly without hardcoded IP breakage.
 */

export function getApiBase(): string {
  const envBase = (import.meta as any).env?.VITE_API_BASE;

  if (typeof window !== "undefined" && window.location?.hostname) {
    const host = window.location.hostname;
    const protocol = window.location.protocol;

    if (envBase && typeof envBase === "string" && envBase.trim() !== "") {
      try {
        const parsed = new URL(envBase);
        // If envBase points to a stale IP or localhost while user is accessing over LAN,
        // or envBase has old 172.16.1.129 while user is on localhost:
        const isLoopbackOrStale =
          parsed.hostname === "localhost" ||
          parsed.hostname === "127.0.0.1" ||
          parsed.hostname === "172.16.1.129";

        if (isLoopbackOrStale && host !== "localhost" && host !== "127.0.0.1") {
          return `${protocol}//${host}:8001`;
        }

        if ((host === "localhost" || host === "127.0.0.1") && parsed.hostname === "172.16.1.129") {
          return `${protocol}//${host}:8001`;
        }

        return envBase.replace(/\/+$/, "");
      } catch {
        // fallback
      }
    }

    return `${protocol}//${host}:8001`;
  }

  return envBase || "http://localhost:8001";
}

export const API_BASE = getApiBase();
