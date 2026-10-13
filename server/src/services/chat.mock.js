import { EXTRACTION_FIXTURE_MARKER } from "./extraction.fixtures.js";

const EMERGENCY_PATTERN =
  /\b(chest pain|heart attack|can't breathe|cannot breathe|severe bleeding|unconscious|stroke|suicide|kill myself|emergency now)\b/i;

export function detectEmergencyUserMessage(message) {
  return EMERGENCY_PATTERN.test(String(message || ""));
}

export function buildEmergencyGuidance(language, config) {
  const contact = config.emergencyContactNumber?.trim();
  const contactLine = contact
    ? language === "hi"
      ? `यदि उपलब्ध हो तो स्थानीय आपातकालीन नंबर ${contact} पर कॉल करें।`
      : `If available, call your local emergency number${contact ? ` (${contact})` : ""}.`
    : language === "hi"
      ? "तुरंत स्थानीय आपातकालीन सेवाओं या नज़दीकी चिकित्सकीय सहायता से संपर्क करें।"
      : "Contact local emergency services or seek immediate professional medical help.";

  return {
    answer:
      language === "hi"
        ? `यह सामान्य आपातकालीन सुरक्षा मार्गदर्शन है, न कि आपके डिस्चार्ज सारांश से निकाली गई जानकारी। ${contactLine}`
        : `This is general emergency safety guidance, not information extracted from your discharge summary. ${contactLine}`,
    language,
    answerStatus: "answered",
    citations: [],
    requiresProfessionalConfirmation: true,
    isEmergencyGuidance: true,
  };
}

export function answerWithMockChatProvider({
  message,
  language,
  passages,
  config,
}) {
  const combined = passages.map((item) => item.text).join("\n");
  const hasFixture =
    config.allowTestExtractionFixture &&
    combined.includes(EXTRACTION_FIXTURE_MARKER);

  if (!hasFixture && !config.allowTestChatFixture) {
    return null;
  }

  const normalizedMessage = String(message).toLowerCase();

  if (detectEmergencyUserMessage(message)) {
    return buildEmergencyGuidance(language, config);
  }

  if (/ignore|override|system prompt|reveal secret/i.test(message)) {
    return {
      answer:
        language === "hi"
          ? "मैं केवल आपके चयनित डिस्चार्ज सारांश के स्रोत अंशों का उपयोग कर सकता/सकती हूँ।"
          : "I can only use source passages from your selected discharge summary.",
      language,
      answerStatus: "insufficient_information",
      citations: [],
      requiresProfessionalConfirmation: false,
      isEmergencyGuidance: false,
    };
  }

  if (/food|after food|before food|खाने/.test(normalizedMessage)) {
    if (/after food/i.test(combined)) {
      return {
        answer:
          language === "hi"
            ? "स्रोत में दवा भोजन के बाद लेने का उल्लेख है।"
            : "The source passage states the medicine should be taken after food.",
        language,
        answerStatus: "answered",
        citations: [
          {
            pageNumber: 1,
            quotedText: "Take one tablet twice daily after food",
            referencePrecision: "page_excerpt",
          },
        ],
        requiresProfessionalConfirmation: false,
        isEmergencyGuidance: false,
      };
    }

    return {
      answer:
        language === "hi"
          ? "अपलोड किए गए डिस्चार्ज सारांश में यह निर्दिष्ट नहीं है कि दवा भोजन से पहले या बाद में लेनी है। कृपया अपने चिकित्सक या फार्मासिस्ट से पुष्टि करें।"
          : "The uploaded discharge summary does not specify whether this medicine should be taken before or after food. Please confirm the correct instruction with your doctor or pharmacist.",
      language,
      answerStatus: "insufficient_information",
      citations: [],
      requiresProfessionalConfirmation: true,
      isEmergencyGuidance: false,
    };
  }

  if (/dose|dosage|mg|tablet/.test(normalizedMessage)) {
    if (/one tablet/i.test(combined)) {
      return {
        answer:
          language === "hi"
            ? "स्रोत में खुराक 'one tablet' का उल्लेख है।"
            : "The source mentions the dose as 'one tablet'.",
        language,
        answerStatus: "answered",
        citations: [
          {
            pageNumber: 1,
            quotedText: "Take one tablet twice daily after food",
            referencePrecision: "page_excerpt",
          },
        ],
        requiresProfessionalConfirmation: false,
        isEmergencyGuidance: false,
      };
    }

    return {
      answer:
        language === "hi"
          ? "डिस्चार्ज सारांश में स्पष्ट खुराक नहीं दी गई है। कृपया स्वास्थ्य पेशेवर से पुष्टि करें।"
          : "The discharge summary does not establish a clear dose. Please confirm with a healthcare professional.",
      language,
      answerStatus: "insufficient_information",
      citations: [],
      requiresProfessionalConfirmation: true,
      isEmergencyGuidance: false,
    };
  }

  if (/time|8\s*am|clock|समय/.test(normalizedMessage)) {
    return {
      answer:
        language === "hi"
          ? "डिस्चार्ज सारांश 'twice daily' कहता है लेकिन सटीक समय निर्दिष्ट नहीं करता। कृपया अपने स्वास्थ्य पेशेवर से समय की पुष्टि करें।"
          : "The discharge summary says 'twice daily' but does not specify exact clock times. Please confirm the appropriate schedule with your healthcare professional.",
      language,
      answerStatus: "insufficient_information",
      citations: [
        {
          pageNumber: 1,
          quotedText: "Take one tablet twice daily after food",
          referencePrecision: "page_excerpt",
        },
      ],
      requiresProfessionalConfirmation: true,
      isEmergencyGuidance: false,
    };
  }

  if (/warning|fever/.test(normalizedMessage)) {
    if (/fever persists/i.test(combined)) {
      return {
        answer:
          language === "hi"
            ? "स्रोत में बुखार बने रहने पर वापस आने का उल्लेख है।"
            : "The source mentions returning if fever persists.",
        language,
        answerStatus: "answered",
        citations: [
          {
            pageNumber: 1,
            quotedText: "Return if fever persists.",
            referencePrecision: "page_excerpt",
          },
        ],
        requiresProfessionalConfirmation: false,
        isEmergencyGuidance: false,
      };
    }
  }

  if (/conflict|conflicting|8\s*am.*8\s*pm/i.test(normalizedMessage)) {
    return {
      answer:
        language === "hi"
          ? "दस्तावेज़ में संभावित रूप से विरोधाभासी निर्देश हो सकते हैं। कृपया योग्य स्वास्थ्य पेशेवर से स्पष्टीकरण लें।"
          : "The document may contain conflicting instructions. Please clarify with a qualified healthcare professional.",
      language,
      answerStatus: "clarification_required",
      citations: [],
      requiresProfessionalConfirmation: true,
      isEmergencyGuidance: false,
    };
  }

  return {
    answer:
      language === "hi"
        ? "चयनित डिस्चार्ज सारांश में इस प्रश्न का उत्तर देने के लिए पर्याप्त जानकारी नहीं है।"
        : "The selected discharge summary does not contain enough information to answer this question.",
    language,
    answerStatus: "insufficient_information",
    citations: [],
    requiresProfessionalConfirmation: true,
    isEmergencyGuidance: false,
  };
}
