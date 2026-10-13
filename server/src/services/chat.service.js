import mongoose from "mongoose";
import { Document } from "../models/Document.js";
import { CarePlan } from "../models/CarePlan.js";
import { ChatMessage } from "../models/ChatMessage.js";
import { ApiError } from "../utils/ApiError.js";
import { createAiProvider } from "../config/aiProvider.js";
import { getOwnedDocument } from "./ownership.service.js";
import {
  retrievePassagesFromDocument,
  buildClarificationContext,
  verifyChatCitations,
} from "./retrieval.service.js";
import {
  detectEmergencyUserMessage,
  buildEmergencyGuidance,
} from "./chat.mock.js";
import { validateChatAiResponse } from "../validators/chatResponse.validator.js";
import {
  mapSourceReferenceForApi,
  mapSourceReferenceFromApi,
} from "../utils/sourceReferences.js";

function assertDocumentReadyForChat(document) {
  if (document.status === "processing") {
    throw new ApiError(
      409,
      "DOCUMENT_PROCESSING",
      "The document is still processing. Please try again later."
    );
  }

  if (document.status === "failed") {
    throw new ApiError(
      422,
      "DOCUMENT_UNAVAILABLE",
      "The document failed processing and cannot be used for chat."
    );
  }

  const pages = document.extractedPages || [];

  if (!document.hasReadableText && pages.length === 0) {
    throw new ApiError(
      422,
      "DOCUMENT_NO_TEXT",
      "The document does not contain readable text for question answering."
    );
  }

  if (document.aiExtractionStatus === "processing") {
    throw new ApiError(
      409,
      "EXTRACTION_PROCESSING",
      "AI extraction is still in progress for this document."
    );
  }

  if (document.aiExtractionStatus === "failed") {
    throw new ApiError(
      422,
      "EXTRACTION_FAILED",
      "AI extraction failed for this document. Chat answers may be unavailable until extraction is retried."
    );
  }
}

async function loadDocumentForChat(userId, documentId) {
  assertObjectId(documentId);

  const document = await Document.findOne({
    _id: documentId,
    userId,
    deletedAt: null,
  }).select("+extractedPages");

  if (!document) {
    throw new ApiError(404, "NOT_FOUND", "Document not found.");
  }

  assertDocumentReadyForChat(document);
  return document;
}

function assertObjectId(value) {
  if (!mongoose.Types.ObjectId.isValid(value)) {
    throw new ApiError(400, "VALIDATION_ERROR", "Invalid documentId.");
  }
}

function sanitizeAnswerResponse(raw, sourcePages, retrievedPassages) {
  const validation = validateChatAiResponse(raw);

  if (!validation.valid) {
    return {
      answer:
        "I could not produce a safe answer from the discharge summary. Please confirm with a healthcare professional.",
      language: raw.language || "en",
      answerStatus: "error",
      citations: [],
      requiresProfessionalConfirmation: true,
      isEmergencyGuidance: false,
    };
  }

  let response = validation.value;

  const { verified, issues } = verifyChatCitations(
    response.citations,
    sourcePages,
    retrievedPassages
  );

  if (issues.length > 0 && response.answerStatus === "answered") {
    response = {
      ...response,
      citations: verified,
      answerStatus: verified.length > 0 ? "answered" : "insufficient_information",
      requiresProfessionalConfirmation: true,
    };
  } else {
    response.citations = verified;
  }

  if (
    response.answerStatus === "answered" &&
    response.citations.length === 0 &&
    !response.isEmergencyGuidance
  ) {
    response.answerStatus = "insufficient_information";
    response.requiresProfessionalConfirmation = true;
  }

  return response;
}

async function withTimeout(promise, timeoutMs, code, message) {
  let timer;

  try {
    return await Promise.race([
      promise,
      new Promise((_resolve, reject) => {
        timer = setTimeout(() => {
          reject(new ApiError(504, code, message));
        }, timeoutMs);
      }),
    ]);
  } finally {
    clearTimeout(timer);
  }
}

function mapMessageForApi(message) {
  return {
    id: message._id.toString(),
    documentId: message.documentId.toString(),
    carePlanId: message.carePlanId?.toString() ?? null,
    role: message.role,
    message: message.message,
    language: message.language,
    answerStatus: message.answerStatus,
    sourceReferences: (message.sourceReferences || []).map(mapSourceReferenceForApi),
    createdAt: message.createdAt,
  };
}

export function createChatService(config) {
  const aiProvider = createAiProvider(config);
  const maxMessageLength = config.chatMaxMessageLength || 2000;
  const maxRetrievalChars = config.chatMaxRetrievalChars || 12000;
  const maxPassages = config.chatMaxPassages || 8;
  const maxHistoryPerDocument = config.chatMaxHistoryMessages || 200;

  async function sendMessage(userId, { documentId, message, language }) {
    const document = await loadDocumentForChat(userId, documentId);
    const carePlan = document.activeCarePlanId
      ? await CarePlan.findOne({
          _id: document.activeCarePlanId,
          userId,
          isActive: true,
        })
      : null;

    const sourcePages = document.extractedPages || [];
    const retrieval = retrievePassagesFromDocument({
      pages: sourcePages,
      query: message,
      maxPassages,
      maxTotalChars: maxRetrievalChars,
    });

    const clarifications = buildClarificationContext(carePlan);

    const userRecord = await ChatMessage.create({
      userId,
      documentId: document._id,
      carePlanId: carePlan?._id ?? null,
      role: "user",
      message,
      language,
    });

    let aiResult;

    if (detectEmergencyUserMessage(message)) {
      aiResult = {
        data: buildEmergencyGuidance(language, config),
      };
    } else if (!retrieval.hasEvidence) {
      aiResult = {
        data: {
          answer:
            language === "hi"
              ? "चयनित डिस्चार्ज सारांश में इस प्रश्न के लिए पर्याप्त स्रोत पाठ नहीं मिला।"
              : "The selected discharge summary does not contain enough source text to answer this question.",
          language,
          answerStatus: "insufficient_information",
          citations: [],
          requiresProfessionalConfirmation: true,
          isEmergencyGuidance: false,
        },
      };
    } else {
      aiResult = await withTimeout(
        aiProvider.answerDocumentQuestion({
          message,
          language,
          passages: retrieval.passages,
          clarifications,
        }),
        config.aiTimeoutMs || 45000,
        "AI_TIMEOUT",
        "The AI provider timed out."
      );
    }

    const safeAnswer = sanitizeAnswerResponse(
      aiResult.data,
      sourcePages,
      retrieval.passages
    );

    const assistantRecord = await ChatMessage.create({
      userId,
      documentId: document._id,
      carePlanId: carePlan?._id ?? null,
      role: "assistant",
      message: safeAnswer.answer,
      language: safeAnswer.language,
      answerStatus: safeAnswer.answerStatus,
      sourceReferences: safeAnswer.citations.map(mapSourceReferenceFromApi),
    });

    await trimHistoryIfNeeded(userId, document._id, maxHistoryPerDocument);

    return {
      answer: safeAnswer.answer,
      language: safeAnswer.language,
      answerStatus: safeAnswer.answerStatus,
      citations: safeAnswer.citations.map(mapSourceReferenceForApi),
      requiresProfessionalConfirmation: safeAnswer.requiresProfessionalConfirmation,
      messageId: assistantRecord._id.toString(),
      userMessageId: userRecord._id.toString(),
    };
  }

  async function trimHistoryIfNeeded(userId, documentId, maxMessages) {
    const count = await ChatMessage.countDocuments({ userId, documentId });

    if (count <= maxMessages) {
      return;
    }

    const excess = count - maxMessages;
    const oldest = await ChatMessage.find({ userId, documentId })
      .sort({ createdAt: 1 })
      .limit(excess)
      .select("_id");

    await ChatMessage.deleteMany({ _id: { $in: oldest.map((item) => item._id) } });
  }

  async function getHistory(userId, { documentId, page = 1, limit = 50 }) {
    await getOwnedDocument(userId, documentId);

    const safeLimit = Math.min(Math.max(limit, 1), 100);
    const safePage = Math.max(page, 1);
    const skip = (safePage - 1) * safeLimit;

    const filter = { userId, documentId };

    const [items, total] = await Promise.all([
      ChatMessage.find(filter)
        .sort({ createdAt: 1 })
        .skip(skip)
        .limit(safeLimit)
        .select("+message"),
      ChatMessage.countDocuments(filter),
    ]);

    return {
      items: items.map(mapMessageForApi),
      pagination: {
        page: safePage,
        limit: safeLimit,
        total,
        totalPages: Math.ceil(total / safeLimit) || 1,
      },
    };
  }

  async function deleteHistory(userId, documentId) {
    await getOwnedDocument(userId, documentId);

    const result = await ChatMessage.deleteMany({ userId, documentId });

    return {
      documentId,
      deletedCount: result.deletedCount,
    };
  }

  return {
    sendMessage,
    getHistory,
    deleteHistory,
    maxMessageLength,
  };
}
