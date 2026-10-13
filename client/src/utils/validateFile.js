import {
  ACCEPTED_MIME_TYPES,
  MAX_FILE_SIZE_BYTES,
} from "../constants/upload.js";

export function validateSelectedFile(file) {
  if (!file) {
    return { valid: false, reason: "idle" };
  }

  if (file.size > MAX_FILE_SIZE_BYTES) {
    return { valid: false, reason: "file_too_large" };
  }

  const type = file.type?.toLowerCase() || "";
  const name = file.name?.toLowerCase() || "";
  const extensionOk =
    name.endsWith(".pdf") ||
    name.endsWith(".jpg") ||
    name.endsWith(".jpeg") ||
    name.endsWith(".png") ||
    (ACCEPTED_MIME_TYPES.includes("image/webp") && name.endsWith(".webp"));

  if (!ACCEPTED_MIME_TYPES.includes(type) && !extensionOk) {
    return { valid: false, reason: "unsupported_file" };
  }

  return { valid: true, reason: null };
}
