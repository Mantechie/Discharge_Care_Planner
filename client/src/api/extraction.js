import { API_BASE_URL, USE_LOCAL_DATA } from "./config.js";
import { localFetchDocumentFileBlob } from "../localSession/localApi.js";
import { apiFetch } from "./http.js";
import { getAccessToken } from "../session/accessTokenStore.js";
import { parseApiError } from "./errors.js";

export function fetchDocumentSource(documentId, signal) {
  return apiFetch(`/documents/${documentId}/source`, { signal }).then(
    (payload) => payload.data
  );
}

export function fetchExtraction(documentId, signal) {
  return apiFetch(`/documents/${documentId}/extraction`, { signal }).then(
    (payload) => payload.data
  );
}

export function runStructuredExtraction(documentId, signal) {
  return apiFetch(`/documents/${documentId}/extract`, {
    method: "POST",
    signal,
  }).then((payload) => payload.data);
}

export function reprocessStructuredExtraction(documentId, signal) {
  return apiFetch(`/documents/${documentId}/reprocess-extraction`, {
    method: "POST",
    signal,
  }).then((payload) => payload.data);
}

export async function fetchDocumentFileBlob(documentId, signal) {
  if (USE_LOCAL_DATA) {
    if (signal?.aborted) {
      throw new DOMException("Aborted", "AbortError");
    }
    return localFetchDocumentFileBlob(documentId);
  }

  const token = getAccessToken();
  const response = await fetch(`${API_BASE_URL}/documents/${documentId}/file`, {
    method: "GET",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    signal,
    credentials: "omit",
  });

  const contentType = response.headers.get("content-type") || "application/octet-stream";

  if (!response.ok) {
    let payload = null;
    try {
      payload = await response.json();
    } catch {
      // ignore
    }
    throw parseApiError(payload, response.status);
  }

  const blob = await response.blob();
  return { blob, contentType };
}
