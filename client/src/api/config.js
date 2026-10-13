function parsePositiveInt(value, fallback) {
  const parsed = Number.parseInt(value ?? "", 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

/** When true, all data lives in browser memory — no MongoDB or server required. */
export const USE_LOCAL_DATA =
  (import.meta.env.VITE_USE_LOCAL_DATA ?? "true").toLowerCase() === "true";

/** browser (default) or rapidapi (server proxy — never put RapidAPI keys in the client). */
export const TTS_PROVIDER = (
  import.meta.env.VITE_TTS_PROVIDER || "browser"
).toLowerCase();

const rawBase = (import.meta.env.VITE_API_BASE_URL || "").trim();

export const API_BASE_URL = rawBase
  ? `${rawBase.replace(/\/$/, "")}/api/v1`
  : "/api/v1";

export const MAX_FILE_SIZE_BYTES =
  parsePositiveInt(import.meta.env.VITE_MAX_FILE_SIZE_MB, 10) * 1024 * 1024;

export const ENABLE_WEBP_UPLOADS =
  (import.meta.env.VITE_ENABLE_WEBP_UPLOADS || "true").toLowerCase() === "true";

export const STATUS_POLL_INTERVAL_MS = 2000;
export const STATUS_POLL_MAX_ATTEMPTS = 90;
