import { apiFetch } from "./http.js";

export function listCarePlans(query = {}, signal) {
  const params = new URLSearchParams();
  Object.entries(query).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      params.set(key, String(value));
    }
  });
  const suffix = params.toString() ? `?${params.toString()}` : "";
  return apiFetch(`/care-plans${suffix}`, { signal }).then(
    (payload) => payload.data
  );
}

export function fetchCarePlan(carePlanId, signal) {
  return apiFetch(`/care-plans/${carePlanId}`, { signal }).then(
    (payload) => payload.data
  );
}

export function fetchCarePlanClarifications(carePlanId, signal) {
  return apiFetch(`/care-plans/${carePlanId}/clarifications`, { signal }).then(
    (payload) => payload.data
  );
}

export function patchCarePlan(carePlanId, body, signal) {
  return apiFetch(`/care-plans/${carePlanId}`, {
    method: "PATCH",
    body,
    signal,
  }).then((payload) => payload.data);
}

export function recordCarePlanReview(carePlanId, { note }, signal) {
  return apiFetch(`/care-plans/${carePlanId}/review`, {
    method: "POST",
    body: { note },
    signal,
  }).then((payload) => payload);
}

export function resolveClarification(
  carePlanId,
  clarificationId,
  body,
  signal
) {
  return apiFetch(
    `/care-plans/${carePlanId}/clarifications/${clarificationId}`,
    {
      method: "PATCH",
      body,
      signal,
    }
  ).then((payload) => payload.data);
}
