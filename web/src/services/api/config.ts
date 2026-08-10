function normalizeApiBaseUrl(raw: string | undefined): string {
  const fallback = import.meta.env.PROD
    ? "https://binotto-api.onrender.com/api/admin"
    : "http://127.0.0.1:8000/api/admin";

  const base = (raw ?? "").trim().replace(/\/+$/, "") || fallback;

  if (base.endsWith("/api/admin")) return base;
  if (base.endsWith("/api")) return `${base}/admin`;
  return `${base}/api/admin`;
}

export const API_BASE_URL = normalizeApiBaseUrl(import.meta.env.VITE_API_BASE_URL);
