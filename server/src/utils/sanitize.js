export function sanitizeOriginalFilename(filename) {
  const base = String(filename || "upload")
    .replace(/[/\\]/g, "")
    .replace(/\.\./g, "")
    .trim();

  const sanitized = base.replace(/[^\w.\- ()]/gi, "_").slice(0, 255);

  return sanitized || "upload";
}
