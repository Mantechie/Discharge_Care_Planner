const SIGNATURES = {
  pdf: [{ offset: 0, bytes: [0x25, 0x50, 0x44, 0x46] }],
  jpeg: [{ offset: 0, bytes: [0xff, 0xd8, 0xff] }],
  png: [{ offset: 0, bytes: [0x89, 0x50, 0x4e, 0x47] }],
  webp: [
    { offset: 0, bytes: [0x52, 0x49, 0x46, 0x46] },
    { offset: 8, bytes: [0x57, 0x45, 0x42, 0x50] },
  ],
};

function matchesSignature(buffer, rules) {
  return rules.every((rule) =>
    rule.bytes.every((byte, index) => buffer[rule.offset + index] === byte)
  );
}

export const SUPPORTED_MIME_TYPES = {
  pdf: "application/pdf",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
};

export function detectFileKind(buffer, { enableWebp = true } = {}) {
  if (!buffer || buffer.length < 12) {
    return null;
  }

  if (matchesSignature(buffer, SIGNATURES.pdf)) {
    return "pdf";
  }

  if (matchesSignature(buffer, SIGNATURES.jpeg)) {
    return "jpeg";
  }

  if (matchesSignature(buffer, SIGNATURES.png)) {
    return "png";
  }

  if (enableWebp && matchesSignature(buffer, SIGNATURES.webp)) {
    return "webp";
  }

  return null;
}

export function mimeTypeForKind(kind) {
  return SUPPORTED_MIME_TYPES[kind] || null;
}

export function isMeaningfulText(text, minChars) {
  const normalized = String(text || "")
    .replace(/\s+/g, " ")
    .trim();

  const alphanumeric = normalized.replace(/[^a-zA-Z0-9]/g, "");

  return alphanumeric.length >= minChars;
}
