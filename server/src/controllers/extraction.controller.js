import { asyncHandler } from "../utils/asyncHandler.js";
import { createCarePlanService } from "../services/carePlan.service.js";

function getCarePlanService(req) {
  if (!req.app.locals.carePlanService) {
    req.app.locals.carePlanService = createCarePlanService(req.app.get("config"));
  }

  return req.app.locals.carePlanService;
}

export const extractDocument = asyncHandler(async (req, res) => {
  const service = getCarePlanService(req);
  const result = await service.runExtractionForDocument(
    req.user.id,
    req.params.documentId
  );

  res.status(201).json({
    success: true,
    data: {
      carePlanId: result.carePlan._id.toString(),
      documentId: result.carePlan.documentId.toString(),
      status: result.carePlan.status,
      validationIssueCount: result.validation.issues.length,
      extractionProvenance: result.carePlan.extractionProvenance,
    },
    message: "Structured extraction completed.",
  });
});

export const getDocumentExtraction = asyncHandler(async (req, res) => {
  const service = getCarePlanService(req);
  const result = await service.getExtractionResult(
    req.user.id,
    req.params.documentId
  );

  res.json({
    success: true,
    data: result,
  });
});

export const reprocessExtraction = asyncHandler(async (req, res) => {
  const service = getCarePlanService(req);
  const result = await service.runExtractionForDocument(
    req.user.id,
    req.params.documentId,
    { regenerate: true }
  );

  res.json({
    success: true,
    data: {
      carePlanId: result.carePlan._id.toString(),
      documentId: result.carePlan.documentId.toString(),
      status: result.carePlan.status,
      validationIssueCount: result.validation.issues.length,
      extractionProvenance: result.carePlan.extractionProvenance,
    },
    message: "Extraction regenerated successfully.",
  });
});
