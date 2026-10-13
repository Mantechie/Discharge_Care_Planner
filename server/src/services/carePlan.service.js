import { Document } from "../models/Document.js";
import { CarePlan } from "../models/CarePlan.js";
import { ApiError } from "../utils/ApiError.js";
import mongoose from "mongoose";
import {
  buildCarePlanPresentation,
  buildExtractedSnapshot,
} from "../utils/carePlanPresentation.js";
import { createExtractionService } from "./extraction.service.js";
import { validateExtraction } from "./validation.service.js";

const ACTIVE_AI_EXTRACTIONS = new Set();

function mapValidationIssueForPersistence(issue) {
  return {
    ...issue,
    sourceReferences: (issue.sourceReferences || []).map((reference) => ({
      page: reference.pageNumber ?? reference.page ?? null,
      quotedText: reference.quotedText ?? null,
      startOffset: reference.startOffset ?? null,
      endOffset: reference.endOffset ?? null,
      referencePrecision: reference.referencePrecision ?? "unavailable",
    })),
  };
}

function mapClarifications(extractedData, validationIssues) {
  const clarifications = [...(extractedData.clarifications || [])];

  for (const issue of validationIssues) {
    if (issue.code === "CLARIFICATION_REQUIRED") {
      continue;
    }

    if (issue.requiresProfessionalConfirmation) {
      clarifications.push({
        field: issue.field,
        question: `Please confirm: ${issue.reason}`,
        reason: issue.reason,
        sourceReferences: issue.sourceReferences || [],
        requiresProfessionalConfirmation: true,
        reviewPriority: issue.reviewPriority || "high",
        status: "open",
      });
    }
  }

  return clarifications;
}

export function createCarePlanService(config) {
  const extractionService = createExtractionService(config);

  function toCarePlanResponse(carePlan, options = {}) {
    return buildCarePlanPresentation(carePlan, options);
  }

  async function getOwnedDocumentForExtraction(userId, documentId) {
    const document = await Document.findOne({
      _id: documentId,
      userId,
      deletedAt: null,
    }).select("+extractedText +extractedPages");

    if (!document) {
      throw new ApiError(404, "NOT_FOUND", "Document not found.");
    }

    if (!document.hasReadableText) {
      throw new ApiError(
        422,
        "SOURCE_TEXT_UNAVAILABLE",
        "Readable extracted text is required before AI extraction."
      );
    }

    return document;
  }

  async function archiveActivePlans(documentId) {
    await CarePlan.updateMany(
      { documentId, isActive: true },
      { $set: { isActive: false, status: "archived" } }
    );
  }

  async function runExtractionForDocument(userId, documentId, { regenerate = false } = {}) {
    const lockKey = `${userId}:${documentId}`;

    if (ACTIVE_AI_EXTRACTIONS.has(lockKey)) {
      throw new ApiError(
        409,
        "EXTRACTION_IN_PROGRESS",
        "Extraction is already in progress for this document."
      );
    }

    ACTIVE_AI_EXTRACTIONS.add(lockKey);

    try {
      const document = await getOwnedDocumentForExtraction(userId, documentId);
      document.aiExtractionStatus = "processing";
      await document.save();

      let sourcePages = (document.extractedPages || []).map((page) => ({
        pageNumber: page.pageNumber,
        text: page.text || "",
      }));

      if (!sourcePages.length && document.extractedText) {
        sourcePages = [{ pageNumber: 1, text: document.extractedText }];
      }

      const { extractedData, provenance } =
        await extractionService.extractStructuredInstructions({
          pages: sourcePages,
          language: config.defaultLanguage,
          documentMetadata: {
            documentId: document._id.toString(),
            extractionMethod: document.extractionMethod,
          },
        });

      const validation = validateExtraction({
        extractedData,
        sourcePages,
      });

      const nextVersion =
        (await CarePlan.countDocuments({ documentId: document._id })) + 1;

      if (regenerate) {
        await archiveActivePlans(document._id);
      } else {
        const existingActive = await CarePlan.findOne({
          documentId: document._id,
          isActive: true,
        });

        if (existingActive) {
          throw new ApiError(
            409,
            "CARE_PLAN_EXISTS",
            "An active care plan already exists for this document."
          );
        }
      }

      const clarifications = mapClarifications(
        extractedData,
        validation.issues
      );

      const planPayload = {
        userId,
        documentId: document._id,
        status: validation.readinessStatus,
        language: extractedData.language || config.defaultLanguage,
        summary: extractedData.summary || "",
        medications: extractedData.medications,
        dailyInstructionItems: extractedData.dailyInstructions.map((item) => ({
          instruction: item.instruction,
          sourceReferences: item.sourceReferences,
          reviewStatus: item.reviewStatus,
          clarificationReason: item.clarificationReason,
        })),
        warningSignItems: extractedData.warningSigns.map((item) => ({
          description: item.description,
          sourceReferences: item.sourceReferences,
          reviewStatus: item.reviewStatus,
        })),
        followUpItems: extractedData.followUps.map((item) => ({
          description: item.description,
          date: item.date,
          time: item.time,
          location: item.location,
          sourceReferences: item.sourceReferences,
          reviewStatus: item.reviewStatus,
        })),
        dailyInstructions: extractedData.dailyInstructions.map(
          (item) => item.instruction
        ),
        warningSigns: extractedData.warningSigns.map((item) => item.description),
        followUps: extractedData.followUps.map((item) => item.description),
        clarifications: clarifications.map((item) => ({
          ...item,
          status: item.status || "open",
          reviewPriority: item.reviewPriority || "normal",
        })),
        validationIssues: validation.issues.map(mapValidationIssueForPersistence),
        extractionProvenance: {
          provider: provenance.provider,
          model: provenance.model,
          extractedAt: new Date(),
          validatedAt: new Date(),
          sourceExtractionMethod: document.extractionMethod,
          extractionVersion: nextVersion,
        },
        isActive: true,
      };

      planPayload.extractedSnapshot = buildExtractedSnapshot(planPayload);

      const carePlan = await CarePlan.create(planPayload);

      document.aiExtractionStatus = "completed";
      document.activeCarePlanId = carePlan._id;
      if (document.status === "ready") {
        document.status = validation.readinessStatus === "review_required"
          ? "review_required"
          : document.status;
      }
      await document.save();

      return {
        carePlan,
        validation,
        provenance,
      };
    } catch (error) {
      await Document.updateOne(
        { _id: documentId, userId },
        {
          $set: {
            aiExtractionStatus:
              error instanceof ApiError &&
              ["AI_PROVIDER_UNAVAILABLE", "AI_CREDENTIALS_MISSING"].includes(
                error.code
              )
                ? "unavailable"
                : "failed",
          },
        }
      );

      throw error;
    } finally {
      ACTIVE_AI_EXTRACTIONS.delete(lockKey);
    }
  }

  async function getExtractionResult(userId, documentId) {
    const document = await getOwnedDocumentForExtraction(userId, documentId);
    const carePlan = await CarePlan.findOne({
      documentId: document._id,
      userId,
      isActive: true,
    });

    if (!carePlan) {
      throw new ApiError(404, "NOT_FOUND", "Extraction result not found.");
    }

    return {
      documentId: document._id.toString(),
      aiExtractionStatus: document.aiExtractionStatus,
      carePlanId: carePlan._id.toString(),
      extraction: toCarePlanResponse(carePlan),
      validationIssues: carePlan.validationIssues,
    };
  }

  async function getCarePlanById(userId, carePlanId, { includeSnapshot = false } = {}) {
    if (!mongoose.Types.ObjectId.isValid(carePlanId)) {
      throw new ApiError(404, "NOT_FOUND", "Care plan not found.");
    }

    let query = CarePlan.findOne({
      _id: carePlanId,
      userId,
    });

    if (includeSnapshot) {
      query = query.select("+extractedSnapshot");
    }

    const carePlan = await query;

    if (!carePlan) {
      throw new ApiError(404, "NOT_FOUND", "Care plan not found.");
    }

    return carePlan;
  }

  async function listCarePlans(userId, { page = 1, limit = 20, status, documentId } = {}) {
    const safePage = Math.max(page, 1);
    const safeLimit = Math.min(Math.max(limit, 1), 100);
    const skip = (safePage - 1) * safeLimit;
    const filter = { userId, isActive: true };

    if (status) {
      filter.status = status;
    }

    if (documentId) {
      if (!mongoose.Types.ObjectId.isValid(documentId)) {
        throw new ApiError(400, "VALIDATION_ERROR", "Invalid documentId.");
      }
      filter.documentId = documentId;
    }

    const [items, total] = await Promise.all([
      CarePlan.find(filter).sort({ updatedAt: -1 }).skip(skip).limit(safeLimit),
      CarePlan.countDocuments(filter),
    ]);

    return {
      items: items.map((item) => toCarePlanResponse(item)),
      pagination: {
        page: safePage,
        limit: safeLimit,
        total,
        totalPages: Math.ceil(total / safeLimit) || 1,
      },
    };
  }

  async function patchCarePlan(userId, carePlanId, patch) {
    const carePlan = await getCarePlanById(userId, carePlanId);

    if (patch.summary !== undefined) {
      carePlan.caregiverEdits = carePlan.caregiverEdits || {};
      carePlan.caregiverEdits.summary = {
        value: patch.summary,
        updatedAt: new Date(),
      };
    }

    if (patch.caregiverReviewNote !== undefined) {
      carePlan.caregiverReviewNote = patch.caregiverReviewNote;
    }

    if (patch.medicationEdits?.length) {
      carePlan.caregiverEdits = carePlan.caregiverEdits || { medications: [] };
      const edits = carePlan.caregiverEdits.medications || [];

      for (const medicationEdit of patch.medicationEdits) {
        const medication = carePlan.medications.id(medicationEdit.medicationId);

        if (!medication) {
          throw new ApiError(404, "NOT_FOUND", "Medication not found on care plan.");
        }

        let existing = edits.find(
          (item) => item.medicationId.toString() === medicationEdit.medicationId
        );

        if (!existing) {
          existing = { medicationId: medication._id, dose: null, frequency: null, timing: null, notes: null };
          edits.push(existing);
        }

        for (const field of ["dose", "frequency", "timing", "notes"]) {
          if (medicationEdit[field] !== undefined) {
            existing[field] = {
              value: medicationEdit[field],
              updatedAt: new Date(),
            };
          }
        }
      }

      carePlan.caregiverEdits.medications = edits;
      carePlan.markModified("caregiverEdits");
    }

    if (patch.status) {
      if (patch.status === "ready") {
        const openClarifications = (carePlan.clarifications || []).filter(
          (item) => item.status === "open"
        );

        if (openClarifications.length > 0) {
          throw new ApiError(
            422,
            "CLARIFICATIONS_OPEN",
            "Open clarification issues must be resolved before marking the plan ready."
          );
        }
      }

      carePlan.status = patch.status;
    }

    await carePlan.save();
    return carePlan;
  }

  async function reviewCarePlan(userId, carePlanId, { note } = {}) {
    const carePlan = await getCarePlanById(userId, carePlanId);
    carePlan.reviewedByUserAt = new Date();
    carePlan.caregiverReviewNote = note || carePlan.caregiverReviewNote;

    if (carePlan.status === "review_required") {
      const openClarifications = (carePlan.clarifications || []).filter(
        (item) => item.status === "open" && item.requiresProfessionalConfirmation
      );

      if (openClarifications.length === 0) {
        carePlan.status = "draft";
      }
    }

    await carePlan.save();

    return {
      carePlan,
      review: {
        reviewedByUserAt: carePlan.reviewedByUserAt,
        caregiverReviewRecorded: true,
        clinicallyVerified: false,
        message:
          "Caregiver review recorded. This does not represent clinical approval.",
      },
    };
  }

  async function getClarifications(userId, carePlanId) {
    const carePlan = await getCarePlanById(userId, carePlanId);

    return (carePlan.clarifications || []).map((item) => ({
      id: item._id.toString(),
      field: item.field,
      question: item.question,
      reason: item.reason,
      status: item.status,
      reviewPriority: item.reviewPriority,
      requiresProfessionalConfirmation: item.requiresProfessionalConfirmation,
      sourceReferences: item.sourceReferences,
      resolvedAt: item.resolvedAt,
      resolutionHistory: item.resolutionHistory,
    }));
  }

  async function resolveClarification(
    userId,
    carePlanId,
    clarificationId,
    resolution
  ) {
    const carePlan = await getCarePlanById(userId, carePlanId);
    const clarification = carePlan.clarifications.id(clarificationId);

    if (!clarification) {
      throw new ApiError(404, "NOT_FOUND", "Clarification not found.");
    }

    if (
      clarification.requiresProfessionalConfirmation &&
      resolution.status === "resolved" &&
      !resolution.resolutionNote?.trim()
    ) {
      throw new ApiError(
        422,
        "CLARIFICATION_RESOLUTION_REQUIRED",
        "A documented resolution note is required for this clarification."
      );
    }

    clarification.status = resolution.status;
    clarification.resolvedAt = resolution.status === "open" ? null : new Date();
    clarification.resolutionHistory = clarification.resolutionHistory || [];
    clarification.resolutionHistory.push({
      status: resolution.status,
      resolutionNote: resolution.resolutionNote || null,
      confirmedWithProfessionalOn: resolution.confirmedWithProfessionalOn || null,
      confirmationSource: resolution.confirmationSource || null,
      recordedAt: new Date(),
    });

    await carePlan.save();
    return clarification;
  }

  return {
    runExtractionForDocument,
    getExtractionResult,
    getCarePlanById,
    listCarePlans,
    patchCarePlan,
    reviewCarePlan,
    getClarifications,
    resolveClarification,
    toCarePlanResponse,
  };
}
