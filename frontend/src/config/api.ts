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
    const isPrivateOrLocal =
      host === "localhost" ||
      host === "127.0.0.1" ||
      /^(192\.168\.|10\.|172\.(1[6-9]|2[0-9]|3[0-1])\.|.*\.local$)/.test(host);

    if (envBase && typeof envBase === "string" && envBase.trim() !== "") {
      try {
        const parsed = new URL(envBase);
        const isLoopbackOrStale =
          parsed.hostname === "localhost" ||
          parsed.hostname === "127.0.0.1" ||
          parsed.hostname === "172.16.1.129";

        // LAN mobile/desktop cross-testing: only map host:8001 if host is local/private IP
        if (isLoopbackOrStale && isPrivateOrLocal && host !== "localhost" && host !== "127.0.0.1") {
          return `${protocol}//${host}:8001`;
        }

        if ((host === "localhost" || host === "127.0.0.1") && parsed.hostname === "172.16.1.129") {
          return `${protocol}//${host}:8001`;
        }

        // Valid external or explicitly configured URL
        if (!isLoopbackOrStale || isPrivateOrLocal) {
          return envBase.replace(/\/+$/, "");
        }
      } catch {
        // fallback
      }
    }

    // Default for local development
    if (isPrivateOrLocal) {
      return `${protocol}//${host}:8001`;
    }
  }

  return envBase || "";
}

export const API_BASE = getApiBase();
