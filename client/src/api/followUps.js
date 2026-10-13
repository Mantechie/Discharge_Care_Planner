import { apiFetch } from "./http.js";

export function listFollowUps(query = {}, signal) {
  const params = new URLSearchParams();
  Object.entries(query).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      params.set(key, String(value));
    }
  });
  const suffix = params.toString() ? `?${params.toString()}` : "";
  return apiFetch(`/follow-ups${suffix}`, { signal }).then(
    (payload) => payload.data
  );
}

export function createFollowUp(body, signal) {
  return apiFetch("/follow-ups", {
    method: "POST",
    body,
    signal,
  }).then((payload) => payload.data);
}

export function updateFollowUp(followUpId, body, signal) {
  return apiFetch(`/follow-ups/${followUpId}`, {
    method: "PATCH",
    body,
    signal,
  }).then((payload) => payload.data);
}
