export const SUGGESTED_QUESTIONS = {
  en: [
    "What medicines are mentioned in my discharge summary?",
    "Should any medicine be taken with or after food?",
    "What warning signs should I watch for?",
    "Are any follow-up appointments documented?",
  ],
  hi: [
    "डिस्चार्ज सारांश में कौन सी दवाएँ लिखी हैं?",
    "क्या किसी दवा को भोजन के साथ या बाद में लेना है?",
    "किन चेतावनी संकेतों पर ध्यान देना चाहिए?",
    "क्या कोई फॉलो-अप अपॉइंटमेंट लिखी है?",
  ],
};

export function isChatAvailableForDocument(documentRecord) {
  if (!documentRecord?.id) {
    return false;
  }

  if (documentRecord.status === "processing" || documentRecord.status === "failed") {
    return false;
  }

  if (!documentRecord.hasReadableText) {
    return false;
  }

  return true;
}

export function mapHistoryToThread(items) {
  if (!Array.isArray(items)) {
    return [];
  }

  return items.map((item) => ({
    id: item.id,
    role: item.role,
    text: item.message,
    language: item.language || "en",
    answerStatus: item.answerStatus || null,
    citations: item.sourceReferences || [],
    createdAt: item.createdAt,
  }));
}

export function mapAssistantResponse(data) {
  return {
    id: data.messageId,
    role: "assistant",
    text: data.answer,
    language: data.language || "en",
    answerStatus: data.answerStatus,
    citations: data.citations || [],
    requiresProfessionalConfirmation: Boolean(data.requiresProfessionalConfirmation),
  };
}

export function answerStatusLabel(status, translate) {
  if (translate) {
    const key = `chat.answer.${status}`;
    const translated = translate(key);
    if (translated && !translated.startsWith("[")) {
      return translated;
    }
  }
  switch (status) {
    case "answered":
      return "Answered from document";
    case "insufficient_information":
      return "Not enough information in document";
    case "error":
      return "Could not generate a safe answer";
    default:
      return status || "";
  }
}

export function getSuggestedQuestions(translate) {
  if (!translate) {
    return SUGGESTED_QUESTIONS.en;
  }
  return [
    translate("chat.suggested.medicines"),
    translate("chat.suggested.food"),
    translate("chat.suggested.warnings"),
    translate("chat.suggested.followups"),
  ];
}

export function speechLanguageCode(language) {
  return language === "hi" ? "hi-IN" : "en-IN";
}
