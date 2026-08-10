function normalizeApiBaseUrl(raw: string | undefined): string {
  const base = (raw ?? "").trim().replace(/\/+$/, "");
  if (!base) return "";
  if (base.endsWith("/api/admin")) return base;
  if (base.endsWith("/api")) return `${base}/admin`;
  return `${base}/api/admin`;
}

export const API_BASE_URL = normalizeApiBaseUrl(import.meta.env.VITE_API_BASE_URL);
