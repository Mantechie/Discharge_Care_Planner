import { createAiProvider } from "../config/aiProvider.js";
import { validateExtractionOutput } from "../validators/extraction.validator.js";
import { ApiError } from "../utils/ApiError.js";
import { mapSourceReferenceFromApi } from "../utils/sourceReferences.js";

function normalizePages(extractedPages) {
  return (extractedPages || []).map((page) => ({
    pageNumber: page.pageNumber ?? page.page,
    text: page.text || "",
  }));
}

function enforceInputLimits(pages, config) {
  const maxPages = config.aiMaxPages;
  const maxChars = config.aiMaxInputChars;

  if (pages.length > maxPages) {
    throw new ApiError(
      422,
      "SOURCE_TOO_LARGE",
      "The document exceeds the configured page limit for AI extraction."
    );
  }

  const totalChars = pages.reduce((sum, page) => sum + page.text.length, 0);

  if (totalChars > maxChars) {
    throw new ApiError(
      422,
      "SOURCE_TOO_LARGE",
      "The document exceeds the configured character limit for AI extraction."
    );
  }
}

function mapMedicationForPersistence(medication) {
  return {
    ...medication,
    sourceReferences: (medication.sourceReferences || []).map(
      mapSourceReferenceFromApi
    ),
    reviewStatus:
      medication.reviewStatus === "confirmed_against_source"
        ? "unreviewed"
        : medication.reviewStatus || "unreviewed",
  };
}

export function createExtractionService(config) {
  const provider = createAiProvider(config);

  async function extractStructuredInstructions({
    pages,
    language,
    documentMetadata,
  }) {
    const normalizedPages = normalizePages(pages);
    enforceInputLimits(normalizedPages, config);

    let providerResult;

    try {
      providerResult = await Promise.race([
        provider.extractDischargeInstructions({
          pages: normalizedPages,
          language,
          documentMetadata,
        }),
        new Promise((_, reject) => {
          setTimeout(() => reject(new Error("AI_TIMEOUT")), config.aiTimeoutMs);
        }),
      ]);
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }

      if (error.message === "AI_TIMEOUT") {
        throw new ApiError(503, "AI_TIMEOUT", "AI extraction timed out.");
      }

      throw new ApiError(
        503,
        "AI_PROVIDER_ERROR",
        "The AI provider could not complete extraction."
      );
    }

    const schemaResult = validateExtractionOutput(providerResult.data);

    if (!schemaResult.valid) {
      throw new ApiError(
        422,
        "AI_SCHEMA_VALIDATION_FAILED",
        "The AI provider returned an invalid extraction payload.",
        schemaResult.details
      );
    }

    const extractedData = {
      ...schemaResult.value,
      medications: schemaResult.value.medications.map(mapMedicationForPersistence),
      dailyInstructions: schemaResult.value.dailyInstructions.map((item) => ({
        ...item,
        sourceReferences: (item.sourceReferences || []).map(
          mapSourceReferenceFromApi
        ),
      })),
      warningSigns: schemaResult.value.warningSigns.map((item) => ({
        ...item,
        sourceReferences: (item.sourceReferences || []).map(
          mapSourceReferenceFromApi
        ),
      })),
      followUps: schemaResult.value.followUps.map((item) => ({
        ...item,
        sourceReferences: (item.sourceReferences || []).map(
          mapSourceReferenceFromApi
        ),
      })),
      clarifications: schemaResult.value.clarifications.map((item) => ({
        ...item,
        sourceReferences: (item.sourceReferences || []).map(
          mapSourceReferenceFromApi
        ),
      })),
      sourceReferences: (schemaResult.value.sourceReferences || []).map(
        mapSourceReferenceFromApi
      ),
    };

    return {
      extractedData,
      provenance: {
        provider: providerResult.provider,
        model: providerResult.model,
        warnings: providerResult.warnings || [],
      },
    };
  }

  return {
    extractStructuredInstructions,
  };
}
