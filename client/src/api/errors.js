export class ApiClientError extends Error {
  constructor(message, { code, status, requestId } = {}) {
    super(message);
    this.name = "ApiClientError";
    this.code = code;
    this.status = status;
    this.requestId = requestId;
  }
}

export function parseApiError(payload, status) {
  const error = payload?.error;
  return new ApiClientError(error?.message || "Request failed.", {
    code: error?.code || "REQUEST_FAILED",
    status,
    requestId: payload?.requestId,
  });
}

export function errorMessageKey(error) {
  if (!(error instanceof ApiClientError)) {
    if (error?.name === "AbortError") {
      return "errors.cancelled";
    }
    return "errors.generic";
  }

  const code = error.code || "REQUEST_FAILED";
  const known = [
    "UNAUTHORIZED",
    "FILE_TOO_LARGE",
    "UNSUPPORTED_MEDIA_TYPE",
    "FILE_REQUIRED",
    "EMPTY_FILE",
    "INVALID_UPLOAD",
    "DOCUMENT_BUSY",
    "SOURCE_TEXT_UNAVAILABLE",
    "EXTRACTION_IN_PROGRESS",
    "CLARIFICATIONS_OPEN",
    "CLARIFICATION_RESOLUTION_REQUIRED",
    "DOCUMENT_PROCESSING",
    "DOCUMENT_UNAVAILABLE",
    "DOCUMENT_NO_TEXT",
    "EXTRACTION_PROCESSING",
    "EXTRACTION_FAILED",
    "AI_PROVIDER_UNAVAILABLE",
    "AI_CREDENTIALS_MISSING",
    "AI_TIMEOUT",
    "REQUEST_FAILED",
  ];

  if (known.includes(code)) {
    return `errors.${code}`;
  }
  return null;
}

/**
 * @param {unknown} error
 * @param {(key: string) => string} [translate]
 */
export function userFacingMessage(error, translate) {
  if (!(error instanceof ApiClientError)) {
    if (error?.name === "AbortError") {
      return translate ? translate("errors.cancelled") : "The request was cancelled.";
    }
    return translate
      ? translate("errors.generic")
      : "Something went wrong. Check your connection and try again.";
  }

  const key = errorMessageKey(error);
  if (key && translate) {
    return translate(key);
  }

  switch (error.code) {
    case "UNAUTHORIZED":
      return "Your session expired. Upload again to start a new secure session.";
    case "FILE_TOO_LARGE":
      return "This file exceeds the server size limit.";
    case "UNSUPPORTED_MEDIA_TYPE":
      return "This file type is not supported.";
    case "FILE_REQUIRED":
      return "Choose a file before uploading.";
    case "EMPTY_FILE":
      return "The selected file is empty.";
    case "INVALID_UPLOAD":
      return "The upload could not be processed. Try again with a different file.";
    case "DOCUMENT_BUSY":
      return "This document is still processing. Please wait.";
    case "SOURCE_TEXT_UNAVAILABLE":
      return "Readable text is required before structured extraction.";
    case "EXTRACTION_IN_PROGRESS":
      return "Extraction is already running for this document.";
    case "CLARIFICATIONS_OPEN":
      return "Resolve open clarifications before marking the plan ready.";
    case "CLARIFICATION_RESOLUTION_REQUIRED":
      return "A documented resolution note is required for this clarification.";
    case "DOCUMENT_PROCESSING":
      return "Your document is still processing. Try chat again shortly.";
    case "DOCUMENT_UNAVAILABLE":
    case "DOCUMENT_NO_TEXT":
      return "This document cannot be used for chat yet.";
    case "EXTRACTION_PROCESSING":
      return "Extraction is still running. Try chat again later.";
    case "EXTRACTION_FAILED":
      return "Extraction failed for this document. Chat may be unavailable.";
    case "AI_PROVIDER_UNAVAILABLE":
    case "AI_CREDENTIALS_MISSING":
      return "The question service is unavailable. No answer was generated.";
    case "AI_TIMEOUT":
      return "The question timed out. Please try again.";
    default:
      return error.message || "Request failed.";
  }
}
