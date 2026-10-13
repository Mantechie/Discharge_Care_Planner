import { speechLanguageCode } from "../utils/chatPresentation.js";
import { TTS_PROVIDER, USE_LOCAL_DATA } from "../api/config.js";
import { fetchServerTtsAudio } from "../api/tts.js";

let speaking = false;
let onSpeakingChange = null;
let currentAudio = null;
let currentObjectUrl = null;

export function setSpeechStateListener(listener) {
  onSpeakingChange = listener;
}

function notifySpeaking(next) {
  speaking = next;
  onSpeakingChange?.(speaking);
}

export function isSpeaking() {
  return speaking;
}

function useRapidApiTts() {
  return TTS_PROVIDER === "rapidapi" && !USE_LOCAL_DATA;
}

export function getSpeechSynthesis() {
  if (typeof window === "undefined") {
    return null;
  }
  return window.speechSynthesis ?? null;
}

export function listVoices() {
  const synth = getSpeechSynthesis();
  if (!synth) {
    return [];
  }
  return synth.getVoices() || [];
}

export function hasVoiceForLanguage(language) {
  if (useRapidApiTts()) {
    return true;
  }
  const prefix = language === "hi" ? "hi" : "en";
  return listVoices().some((voice) => voice.lang?.toLowerCase().startsWith(prefix));
}

export function getSpeechSupport(language = "en") {
  if (useRapidApiTts()) {
    return { supported: true, voiceAvailable: true, provider: "rapidapi" };
  }

  const synth = getSpeechSynthesis();
  if (!synth || typeof window.SpeechSynthesisUtterance === "undefined") {
    return { supported: false, voiceAvailable: false, provider: "browser" };
  }
  return {
    supported: true,
    voiceAvailable: hasVoiceForLanguage(language),
    provider: "browser",
  };
}

function pickVoice(language) {
  const voices = listVoices();
  const langCode = speechLanguageCode(language).toLowerCase();
  const prefix = language === "hi" ? "hi" : "en";
  return (
    voices.find((v) => v.lang?.toLowerCase() === langCode) ||
    voices.find((v) => v.lang?.toLowerCase().startsWith(prefix)) ||
    null
  );
}

function clearAudioPlayback() {
  if (currentAudio) {
    currentAudio.pause();
    currentAudio.src = "";
    currentAudio = null;
  }
  if (currentObjectUrl) {
    URL.revokeObjectURL(currentObjectUrl);
    currentObjectUrl = null;
  }
}

export function stopSpeaking() {
  clearAudioPlayback();
  const synth = getSpeechSynthesis();
  if (synth) {
    synth.cancel();
  }
  notifySpeaking(false);
}

async function speakWithRapidApi(text, language) {
  const blob = await fetchServerTtsAudio(text, { language });
  clearAudioPlayback();
  currentObjectUrl = URL.createObjectURL(blob);
  currentAudio = new Audio(currentObjectUrl);

  return new Promise((resolve) => {
    currentAudio.onended = () => {
      notifySpeaking(false);
      clearAudioPlayback();
      resolve(true);
    };
    currentAudio.onerror = () => {
      notifySpeaking(false);
      clearAudioPlayback();
      resolve(false);
    };
    notifySpeaking(true);
    currentAudio.play().catch(() => {
      notifySpeaking(false);
      resolve(false);
    });
  });
}

function speakWithBrowser(text, language) {
  const trimmed = text?.trim();
  const synth = getSpeechSynthesis();
  if (!trimmed || !synth || typeof window.SpeechSynthesisUtterance === "undefined") {
    return false;
  }

  stopSpeaking();

  const utterance = new SpeechSynthesisUtterance(trimmed);
  utterance.lang = speechLanguageCode(language);
  const voice = pickVoice(language);
  if (voice) {
    utterance.voice = voice;
  }

  utterance.onend = () => notifySpeaking(false);
  utterance.onerror = () => notifySpeaking(false);

  notifySpeaking(true);
  synth.speak(utterance);
  return true;
}

/**
 * Speak visible on-screen text only.
 * @returns {Promise<boolean>}
 */
export async function speakText(text, language = "en") {
  const trimmed = text?.trim();
  if (!trimmed) {
    return false;
  }

  if (useRapidApiTts()) {
    try {
      return await speakWithRapidApi(trimmed, language);
    } catch {
      return speakWithBrowser(trimmed, language);
    }
  }

  return speakWithBrowser(trimmed, language);
}
