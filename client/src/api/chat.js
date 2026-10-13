import { apiFetch } from "./http.js";

export function sendChatMessage({ documentId, message, language }, signal) {
  return apiFetch("/chat", {
    method: "POST",
    body: { documentId, message, language },
    signal,
  }).then((payload) => payload.data);
}

export function fetchChatHistory(documentId, { page = 1, limit = 50 } = {}, signal) {
  const params = new URLSearchParams({
    documentId,
    page: String(page),
    limit: String(limit),
  });
  return apiFetch(`/chat/history?${params.toString()}`, { signal }).then(
    (payload) => payload.data
  );
}

export function deleteChatHistory(documentId, signal) {
  const params = new URLSearchParams({ documentId });
  return apiFetch(`/chat/history?${params.toString()}`, {
    method: "DELETE",
    signal,
  }).then((payload) => payload.data);
}
