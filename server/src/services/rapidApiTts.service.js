import { ApiError } from "../utils/ApiError.js";

const TTS_URL = "https://open-ai-text-to-speech1.p.rapidapi.com/";
const TTS_HOST = "open-ai-text-to-speech1.p.rapidapi.com";

function ttsInstructions(language) {
  if (language === "hi") {
    return "Speak in clear Hindi suitable for caregivers. Do not add medical advice beyond the given text.";
  }
  return "Speak clearly and calmly for a caregiver audience. Do not add medical advice beyond the given text.";
}

function extractAudioBuffer(payload, contentType) {
  if (Buffer.isBuffer(payload)) {
    return payload;
  }
  if (payload instanceof ArrayBuffer) {
    return Buffer.from(payload);
  }
  if (typeof payload === "string" && contentType?.includes("audio")) {
    return Buffer.from(payload, "binary");
  }
  if (payload && typeof payload === "object") {
    const encoded =
      payload.audio ||
      payload.audioContent ||
      payload.data ||
      payload.result ||
      payload.speech;
    if (typeof encoded === "string") {
      return Buffer.from(encoded, "base64");
    }
  }
  return null;
}

export async function synthesizeRapidApiSpeech(
  { text, language = "en", voice = "alloy" },
  config
) {
  const apiKey = config.rapidApiKey;
  if (!apiKey) {
    throw new ApiError(
      503,
      "AI_CREDENTIALS_MISSING",
      "RapidAPI key is not configured on the server."
    );
  }

  const input = String(text || "").trim().slice(0, 4096);
  if (!input) {
    throw new ApiError(400, "VALIDATION_ERROR", "Text is required for speech synthesis.");
  }

  const response = await fetch(TTS_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-rapidapi-host": TTS_HOST,
      "x-rapidapi-key": apiKey,
    },
    body: JSON.stringify({
      model: "tts-1",
      input,
      instructions: ttsInstructions(language),
      voice: voice || "alloy",
    }),
  });

  const contentType = response.headers.get("content-type") || "";

  if (!response.ok) {
    let message = "Text-to-speech request failed.";
    try {
      const errorBody = await response.json();
      message = errorBody?.message || errorBody?.error || message;
    } catch {
      /* ignore */
    }
    throw new ApiError(
      response.status >= 500 ? 503 : response.status,
      "AI_PROVIDER_UNAVAILABLE",
      message
    );
  }

  if (contentType.includes("application/json")) {
    const json = await response.json();
    const buffer = extractAudioBuffer(json, contentType);
    if (!buffer?.length) {
      throw new ApiError(
        502,
        "AI_INVALID_RESPONSE",
        "TTS provider returned JSON without audio data."
      );
    }
    return { buffer, contentType: "audio/mpeg" };
  }

  const arrayBuffer = await response.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  if (!buffer.length) {
    throw new ApiError(502, "AI_INVALID_RESPONSE", "TTS provider returned empty audio.");
  }

  return {
    buffer,
    contentType: contentType.includes("audio") ? contentType : "audio/mpeg",
  };
}
