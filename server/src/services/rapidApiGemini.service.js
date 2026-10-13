import { ApiError } from "../utils/ApiError.js";

const GEMINI_URL = "https://gemini-api3.p.rapidapi.com/generate";
const GEMINI_HOST = "gemini-api3.p.rapidapi.com";

function extractGeneratedText(payload) {
  if (!payload || typeof payload !== "object") {
    return null;
  }
  const candidates = [
    payload.response,
    payload.result,
    payload.text,
    payload.output,
    payload.answer,
    payload.data?.text,
    payload.data?.response,
  ];
  for (const value of candidates) {
    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }
  }
  return null;
}

export async function generateRapidApiGeminiText(prompt, config) {
  const apiKey = config.rapidApiKey;
  if (!apiKey) {
    throw new ApiError(
      503,
      "AI_CREDENTIALS_MISSING",
      "RapidAPI key is not configured on the server."
    );
  }

  const response = await fetch(GEMINI_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-rapidapi-host": GEMINI_HOST,
      "x-rapidapi-key": apiKey,
    },
    body: JSON.stringify({ prompt: String(prompt || "").slice(0, config.aiMaxInputChars || 120000) }),
  });

  let payload = null;
  try {
    payload = await response.json();
  } catch {
    throw new ApiError(502, "AI_INVALID_JSON", "Gemini RapidAPI returned non-JSON.");
  }

  if (!response.ok) {
    const message =
      payload?.message || payload?.error || "Gemini RapidAPI request failed.";
    throw new ApiError(
      response.status >= 500 ? 503 : response.status,
      "AI_PROVIDER_UNAVAILABLE",
      message
    );
  }

  const text = extractGeneratedText(payload);
  if (!text) {
    throw new ApiError(
      502,
      "AI_INVALID_RESPONSE",
      "Gemini RapidAPI returned an empty response."
    );
  }

  return text;
}
