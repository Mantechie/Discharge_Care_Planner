import { apiFetch } from "./http.js";

export function listTasks(query = {}, signal) {
  const params = new URLSearchParams();
  Object.entries(query).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      params.set(key, String(value));
    }
  });
  const suffix = params.toString() ? `?${params.toString()}` : "";
  return apiFetch(`/tasks${suffix}`, { signal }).then((payload) => payload.data);
}

export function createTask(body, signal) {
  return apiFetch("/tasks", {
    method: "POST",
    body,
    signal,
  }).then((payload) => payload.data);
}

export function updateTask(taskId, body, signal) {
  return apiFetch(`/tasks/${taskId}`, {
    method: "PATCH",
    body,
    signal,
  }).then((payload) => payload.data);
}
