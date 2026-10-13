import { useEffect, useState } from "react";
import {
  getSpeechSupport,
  isSpeaking,
  speakText,
  stopSpeaking,
} from "../../speech/textToSpeech.js";
import { useTranslation } from "../../i18n/LanguageProvider.jsx";

export function ReadAloudButton({ text, language }) {
  const { t, locale } = useTranslation();
  const speechLang = language || locale;
  const [speaking, setSpeaking] = useState(false);
  const support = getSpeechSupport(speechLang);

  useEffect(() => {
    const interval = setInterval(() => setSpeaking(isSpeaking()), 200);
    return () => clearInterval(interval);
  }, []);

  if (!text?.trim()) {
    return null;
  }

  if (!support.supported) {
    return (
      <p className="mt-2 text-xs text-slate-500" role="status">
        {t("speech.unsupported")}
      </p>
    );
  }

  async function handleClick() {
    if (speaking) {
      stopSpeaking();
      return;
    }
    await speakText(text, speechLang);
  }

  return (
    <div className="mt-2 flex flex-wrap items-center gap-2">
      <button
        type="button"
        className="text-xs font-semibold text-teal-800 underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600"
        onClick={handleClick}
        aria-pressed={speaking}
      >
        {speaking ? t("speech.stop") : t("speech.readAloud")}
      </button>
      {!support.voiceAvailable ? (
        <span className="text-xs text-slate-500" role="status">
          {t("speech.noVoice", {
            language: speechLang === "hi" ? t("app.language.hi") : t("app.language.en"),
          })}
        </span>
      ) : null}
    </div>
  );
}
