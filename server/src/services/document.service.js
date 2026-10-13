import { createHash } from "node:crypto";
import fs from "node:fs/promises";
import mongoose from "mongoose";
import { Document } from "../models/Document.js";
import { CarePlan } from "../models/CarePlan.js";
import { Task } from "../models/Task.js";
import { FollowUp } from "../models/FollowUp.js";
import { ChatMessage } from "../models/ChatMessage.js";
import { ApiError } from "../utils/ApiError.js";
import { isMeaningfulText } from "../utils/fileValidation.js";
import { sanitizeOriginalFilename } from "../utils/sanitize.js";
import { createStorageService } from "./storage.service.js";
import { extractPdfText } from "./pdf.service.js";
import {
  isOcrAvailable,
  runOcrOnImageFile,
  runOcrOnPdfPages,
} from "./ocr.service.js";

const ACTIVE_PROCESSING = new Set();

function withTimeout(promise, timeoutMs) {
  return Promise.race([
    promise,
    new Promise((_, reject) => {
      setTimeout(() => reject(new Error("PROCESSING_TIMEOUT")), timeoutMs);
    }),
  ]);
}

function buildExtractedPages(pdfPages, source) {
  return pdfPages.map((page) => ({
    pageNumber: page.pageNumber,
    text: page.text || "",
    extractionSource: source,
  }));
}

function computeChecksum(buffer) {
  return createHash("sha256").update(buffer).digest("hex");
}

export function createDocumentService(config) {
  const storage = createStorageService(config);

  function toPublicDocument(document) {
    return {
      id: document._id.toString(),
      originalFilename: document.originalFilename,
      mimeType: document.mimeType,
      fileSize: document.fileSize,
      status: document.status,
      extractionMethod: document.extractionMethod,
      pageCount: document.pageCount ?? 0,
      hasReadableText: Boolean(document.hasReadableText),
      processingErrors: document.processingErrors || [],
      createdAt: document.createdAt,
      updatedAt: document.updatedAt,
    };
  }

  async function getOwnedDocumentRecord(userId, documentId, { includePrivate = false } = {}) {
    if (!mongoose.Types.ObjectId.isValid(documentId)) {
      throw new ApiError(404, "NOT_FOUND", "Document not found.");
    }

    let query = Document.findOne({
      _id: documentId,
      userId,
      deletedAt: null,
    });

    if (!includePrivate) {
      query = query.select("-storageKey -extractedText -extractedPages");
    }

    const document = await query;

    if (!document) {
      throw new ApiError(404, "NOT_FOUND", "Document not found.");
    }

    return document;
  }

  async function runExtractionPipeline({ absolutePath, kind }) {
    const errors = [];
    const warnings = [];

    if (kind === "pdf") {
      const pdfResult = await extractPdfText(absolutePath);

      if (pdfResult.error === "PDF_ENCRYPTED") {
        return {
          status: "failed",
          extractionMethod: null,
          extractedText: "",
          extractedPages: [],
          pageCount: pdfResult.pageCount || 0,
          hasReadableText: false,
          processingErrors: ["PDF_ENCRYPTED"],
        };
      }

      if (pdfResult.error === "PDF_PARSE_FAILED") {
        return {
          status: "failed",
          extractionMethod: null,
          extractedText: "",
          extractedPages: [],
          pageCount: 0,
          hasReadableText: false,
          processingErrors: ["PDF_PARSE_FAILED"],
        };
      }

      const pdfPages = buildExtractedPages(pdfResult.pages, "pdf_text");
      const pdfTextMeaningful = isMeaningfulText(
        pdfResult.text,
        config.minReadableTextChars
      );

      if (pdfTextMeaningful) {
        return {
          status: "ready",
          extractionMethod: "pdf_text",
          extractedText: pdfResult.text,
          extractedPages: pdfPages,
          pageCount: pdfResult.pageCount,
          hasReadableText: true,
          processingErrors: errors,
          warnings,
        };
      }

      if (await isOcrAvailable(config)) {
        const ocrResult = await runOcrOnPdfPages(absolutePath, config);

        if (!ocrResult.available) {
          return {
            status: "review_required",
            extractionMethod: pdfResult.text ? "pdf_text" : null,
            extractedText: pdfResult.text || "",
            extractedPages: pdfPages,
            pageCount: pdfResult.pageCount,
            hasReadableText: false,
            processingErrors: ["OCR_NOT_CONFIGURED", "INSUFFICIENT_PDF_TEXT"],
          };
        }

        if (ocrResult.error) {
          errors.push(ocrResult.error);
        }

        const ocrPages = buildExtractedPages(ocrResult.pages, "ocr");
        const mergedPages = pdfPages.length > 0 ? mergePageTexts(pdfPages, ocrPages) : ocrPages;
        const mergedText = mergedPages.map((page) => page.text).join("\n\n");
        const readable = isMeaningfulText(mergedText, config.minReadableTextChars);

        return {
          status: readable ? "ready" : "review_required",
          extractionMethod: pdfResult.text ? "mixed" : "ocr",
          extractedText: mergedText,
          extractedPages: mergedPages,
          pageCount: Math.max(pdfResult.pageCount, mergedPages.length),
          hasReadableText: readable,
          processingErrors: readable ? errors : [...errors, "INSUFFICIENT_READABLE_TEXT"],
          warnings: ocrResult.warnings || [],
        };
      }

      return {
        status: "review_required",
        extractionMethod: pdfResult.text ? "pdf_text" : null,
        extractedText: pdfResult.text || "",
        extractedPages: pdfPages,
        pageCount: pdfResult.pageCount,
        hasReadableText: false,
        processingErrors: ["INSUFFICIENT_PDF_TEXT", "OCR_NOT_CONFIGURED"],
      };
    }

    const ocrResult = await runOcrOnImageFile(absolutePath, config, 1);

    if (!ocrResult.available) {
      return {
        status: "review_required",
        extractionMethod: null,
        extractedText: "",
        extractedPages: [],
        pageCount: 1,
        hasReadableText: false,
        processingErrors: ["OCR_NOT_CONFIGURED"],
      };
    }

    if (ocrResult.error) {
      return {
        status: "review_required",
        extractionMethod: "ocr",
        extractedText: ocrResult.text || "",
        extractedPages: buildExtractedPages(ocrResult.pages, "ocr"),
        pageCount: 1,
        hasReadableText: false,
        processingErrors: [ocrResult.error],
        warnings: ocrResult.warnings || [],
      };
    }

    const readable = isMeaningfulText(ocrResult.text, config.minReadableTextChars);

    return {
      status: readable ? "ready" : "review_required",
      extractionMethod: "ocr",
      extractedText: ocrResult.text,
      extractedPages: buildExtractedPages(ocrResult.pages, "ocr"),
      pageCount: 1,
      hasReadableText: readable,
      processingErrors: readable ? [] : ["INSUFFICIENT_READABLE_TEXT"],
      warnings: ocrResult.warnings || [],
    };
  }

  function mergePageTexts(pdfPages, ocrPages) {
    const byPage = new Map();

    for (const page of pdfPages) {
      byPage.set(page.pageNumber, { ...page });
    }

    for (const page of ocrPages) {
      const existing = byPage.get(page.pageNumber);

      if (!existing || !isMeaningfulText(existing.text, 10)) {
        byPage.set(page.pageNumber, {
          pageNumber: page.pageNumber,
          text: page.text,
          extractionSource: "ocr",
        });
      } else if (page.text) {
        byPage.set(page.pageNumber, {
          pageNumber: page.pageNumber,
          text: `${existing.text}\n${page.text}`.trim(),
          extractionSource: "ocr",
        });
      }
    }

    return [...byPage.values()].sort((a, b) => a.pageNumber - b.pageNumber);
  }

  async function processDocumentRecord(documentId, userId) {
    const lockKey = documentId.toString();

    if (ACTIVE_PROCESSING.has(lockKey)) {
      return;
    }

    ACTIVE_PROCESSING.add(lockKey);

    try {
      const document = await Document.findOne({
        _id: documentId,
        userId,
        deletedAt: null,
      }).select("+storageKey");

      if (!document) {
        return;
      }

      document.status = "processing";
      document.processingErrors = [];
      await document.save();

      const absolutePath = storage.resolveAbsolutePath(document.storageKey);
      const kind = document.mimeType === "application/pdf"
        ? "pdf"
        : "image";

      const extraction = await withTimeout(
        runExtractionPipeline({ absolutePath, kind }),
        config.processingTimeoutMs
      );

      document.status = extraction.status;
      document.extractionMethod = extraction.extractionMethod;
      document.extractedText = extraction.extractedText;
      document.extractedPages = extraction.extractedPages;
      document.pageCount = extraction.pageCount;
      document.hasReadableText = extraction.hasReadableText;
      document.processingErrors = extraction.processingErrors;

      await document.save();
    } catch (error) {
      const document = await Document.findById(documentId).select("+storageKey");

      if (document) {
        document.status = error.message === "PROCESSING_TIMEOUT" ? "review_required" : "failed";
        document.processingErrors = [
          error.message === "PROCESSING_TIMEOUT"
            ? "PROCESSING_TIMEOUT"
            : "PROCESSING_FAILED",
        ];
        await document.save();
      }
    } finally {
      ACTIVE_PROCESSING.delete(lockKey);
    }
  }

  async function uploadDocument({
    userId,
    tempFilePath,
    originalFilename,
    detectedKind,
    mimeType,
    fileSize,
    fileBuffer,
  }) {
    const storageKey = storage.generateStorageKey(userId);
    let document;

    try {
      await storage.moveTempFile(tempFilePath, storageKey);

      document = await Document.create({
        userId,
        originalFilename: sanitizeOriginalFilename(originalFilename),
        mimeType,
        fileSize,
        storageKey,
        checksum: computeChecksum(fileBuffer),
        status: "processing",
      });
    } catch (error) {
      if (storageKey && (await storage.exists(storageKey))) {
        await storage.deleteObject(storageKey);
      }

      throw error;
    }

    await processDocumentRecord(document._id, userId);

    const refreshed = await getOwnedDocumentRecord(userId, document._id.toString());
    return refreshed;
  }

  async function listDocuments(userId, { page = 1, limit = 20 }) {
    const safePage = Math.max(1, page);
    const safeLimit = Math.min(Math.max(limit, 1), 100);
    const skip = (safePage - 1) * safeLimit;

    const [items, total] = await Promise.all([
      Document.find({ userId, deletedAt: null })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(safeLimit)
        .select("-storageKey -extractedText -extractedPages"),
      Document.countDocuments({ userId, deletedAt: null }),
    ]);

    return {
      items: items.map(toPublicDocument),
      pagination: {
        page: safePage,
        limit: safeLimit,
        total,
        totalPages: Math.ceil(total / safeLimit) || 1,
      },
    };
  }

  async function getDocumentStatus(userId, documentId) {
    const document = await getOwnedDocumentRecord(userId, documentId);

    return {
      id: document._id.toString(),
      status: document.status,
      extractionMethod: document.extractionMethod,
      pageCount: document.pageCount ?? 0,
      hasReadableText: Boolean(document.hasReadableText),
      processingErrors: document.processingErrors || [],
      canReprocess: document.status !== "processing",
      canRetry: ["failed", "review_required"].includes(document.status),
    };
  }

  async function getDocumentSource(userId, documentId) {
    const document = await Document.findOne({
      _id: documentId,
      userId,
      deletedAt: null,
    }).select("+extractedText +extractedPages");

    if (!document) {
      throw new ApiError(404, "NOT_FOUND", "Document not found.");
    }

    return {
      id: document._id.toString(),
      text: document.extractedText || "",
      pages: (document.extractedPages || []).map((page) => ({
        pageNumber: page.pageNumber,
        text: page.text,
        extractionSource: page.extractionSource,
      })),
      pageCount: document.pageCount ?? 0,
      hasReadableText: Boolean(document.hasReadableText),
      extractionMethod: document.extractionMethod,
      status: document.status,
    };
  }

  async function getDocumentFileStream(userId, documentId) {
    const document = await Document.findOne({
      _id: documentId,
      userId,
      deletedAt: null,
    }).select("+storageKey");

    if (!document) {
      throw new ApiError(404, "NOT_FOUND", "Document not found.");
    }

    const stream = storage.createReadStreamForKey(document.storageKey);

    return {
      stream,
      mimeType: document.mimeType,
      originalFilename: document.originalFilename,
      fileSize: document.fileSize,
    };
  }

  async function reprocessDocument(userId, documentId) {
    const document = await Document.findOne({
      _id: documentId,
      userId,
      deletedAt: null,
    }).select("+storageKey");

    if (!document) {
      throw new ApiError(404, "NOT_FOUND", "Document not found.");
    }

    if (document.status === "processing") {
      throw new ApiError(409, "DOCUMENT_BUSY", "Document is already processing.");
    }

    if (!(await storage.exists(document.storageKey))) {
      throw new ApiError(422, "SOURCE_FILE_MISSING", "Original file is unavailable.");
    }

    await processDocumentRecord(document._id, userId);

    return getOwnedDocumentRecord(userId, documentId);
  }

  async function deleteDocument(userId, documentId) {
    const document = await Document.findOne({
      _id: documentId,
      userId,
      deletedAt: null,
    }).select("+storageKey +extractedText +extractedPages");

    if (!document) {
      throw new ApiError(404, "NOT_FOUND", "Document not found.");
    }

    const storageResult = await storage.deleteObject(document.storageKey);

    document.deletedAt = new Date();
    document.extractedText = null;
    document.extractedPages = [];
    document.status = "failed";
    document.processingErrors = ["DOCUMENT_DELETED"];
    await document.save();

    await Promise.all([
      CarePlan.deleteMany({ userId, documentId: document._id }),
      Task.deleteMany({ userId, documentId: document._id }),
      FollowUp.deleteMany({ userId, documentId: document._id }),
      ChatMessage.deleteMany({ userId, documentId: document._id }),
    ]);

    return {
      id: document._id.toString(),
      deletedAt: document.deletedAt,
      storageDeleted: storageResult.deleted,
      storageDeleteWarning: storageResult.deleted ? null : storageResult.reason,
    };
  }

  return {
    storage,
    toPublicDocument,
    uploadDocument,
    listDocuments,
    getOwnedDocumentRecord,
    getDocumentStatus,
    getDocumentSource,
    getDocumentFileStream,
    reprocessDocument,
    deleteDocument,
    processDocumentRecord,
  };
}
