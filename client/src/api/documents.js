import { STATUS_POLL_INTERVAL_MS, STATUS_POLL_MAX_ATTEMPTS } from "./config.js";
import { apiFetch, uploadDocumentMultipart } from "./http.js";

export function uploadDocument(file, options = {}) {
  return uploadDocumentMultipart(file, options);
}

export function fetchDocumentStatus(documentId, signal) {
  return apiFetch(`/documents/${documentId}/status`, { signal }).then(
    (payload) => payload.data
  );
}

export function fetchDocument(documentId, signal) {
  return apiFetch(`/documents/${documentId}`, { signal }).then(
    (payload) => payload.data
  );
}

export function deleteDocument(documentId, signal) {
  return apiFetch(`/documents/${documentId}`, { method: "DELETE", signal }).then(
    (payload) => payload.data
  );
}

const TERMINAL_STATUSES = new Set([
  "ready",
  "review_required",
  "failed",
]);

export function pollDocumentStatus(documentId, { signal, onUpdate } = {}) {
  return new Promise((resolve, reject) => {
    let attempts = 0;
    let timer = null;

    const cleanup = () => {
      if (timer) {
        clearTimeout(timer);
        timer = null;
      }
    };

    const fail = (error) => {
      cleanup();
      reject(error);
    };

    const tick = async () => {
      if (signal?.aborted) {
        fail(new DOMException("Aborted", "AbortError"));
        return;
      }

      attempts += 1;

      try {
        const status = await fetchDocumentStatus(documentId, signal);
        onUpdate?.(status);

        if (TERMINAL_STATUSES.has(status.status)) {
          cleanup();
          resolve(status);
          return;
        }

        if (status.status !== "processing" && status.status !== "uploaded") {
          cleanup();
          resolve(status);
          return;
        }

        if (attempts >= STATUS_POLL_MAX_ATTEMPTS) {
          fail(
            new Error("Processing is taking longer than expected. Try again later.")
          );
          return;
        }

        timer = setTimeout(tick, STATUS_POLL_INTERVAL_MS);
      } catch (error) {
        fail(error);
      }
    };

    signal?.addEventListener("abort", cleanup, { once: true });
    tick();
  });
}
