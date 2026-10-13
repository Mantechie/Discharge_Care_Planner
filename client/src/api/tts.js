import { API_BASE_URL } from "./config.js";
import { getAccessToken } from "../session/accessTokenStore.js";
import { parseApiError, ApiClientError } from "./errors.js";

export async function fetchServerTtsAudio(text, { language = "en", voice = "alloy" } = {}) {
  const token = getAccessToken();
  const response = await fetch(`${API_BASE_URL}/tts/speak`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ text, language, voice }),
    credentials: "omit",
  });

  if (!response.ok) {
    let payload = null;
    try {
      payload = await response.json();
    } catch {
      /* binary error body */
    }
    throw parseApiError(payload, response.status);
  }

  const blob = await response.blob();
  if (!blob.size) {
    throw new ApiClientError("Empty audio response.", { code: "AI_INVALID_RESPONSE" });
  }
  return blob;
}
