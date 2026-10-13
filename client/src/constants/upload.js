import {
  ENABLE_WEBP_UPLOADS,
  MAX_FILE_SIZE_BYTES,
} from "../api/config.js";

export { MAX_FILE_SIZE_BYTES };

const BASE_MIME_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/png",
];

export const ACCEPTED_MIME_TYPES = ENABLE_WEBP_UPLOADS
  ? [...BASE_MIME_TYPES, "image/webp"]
  : BASE_MIME_TYPES;

export const ACCEPTED_EXTENSIONS_LABEL = ENABLE_WEBP_UPLOADS
  ? "PDF, JPG, PNG, or WebP"
  : "PDF, JPG, or PNG";

export const WORKFLOW_STATES = {
  IDLE: "idle",
  FILE_READY: "file_ready",
  UPLOADING: "uploading",
  UPLOADED: "uploaded",
  PROCESSING: "processing",
  REVIEW_REQUIRED: "review_required",
  READY_FOR_RESULTS: "ready_for_results",
  PROCESSING_FAILED: "processing_failed",
  UNSUPPORTED_FILE: "unsupported_file",
  FILE_TOO_LARGE: "file_too_large",
  SESSION_EXPIRED: "session_expired",
  PREVIEW_DASHBOARD: "preview_dashboard",
  NO_EXTRACTION: "no_extraction",
  UNCLEAR_EXTRACTION: "unclear_extraction",
};
