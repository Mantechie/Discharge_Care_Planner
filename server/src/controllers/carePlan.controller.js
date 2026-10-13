import { asyncHandler } from "../utils/asyncHandler.js";
import { createCarePlanService } from "../services/carePlan.service.js";

function getService(req) {
  return createCarePlanService(req.app.get("config"));
}

export const listCarePlans = asyncHandler(async (req, res) => {
  const service = getService(req);
  const data = await service.listCarePlans(
    req.user.id,
    req.validatedQuery || req.query
  );

  res.json({
    success: true,
    data,
  });
});

export const getCarePlan = asyncHandler(async (req, res) => {
  const service = getService(req);
  const carePlan = await service.getCarePlanById(
    req.user.id,
    req.params.carePlanId
  );

  res.json({
    success: true,
    data: service.toCarePlanResponse(carePlan),
  });
});

export const patchCarePlan = asyncHandler(async (req, res) => {
  const service = getService(req);
  const carePlan = await service.patchCarePlan(
    req.user.id,
    req.params.carePlanId,
    req.body
  );

  res.json({
    success: true,
    data: service.toCarePlanResponse(carePlan),
    message: "Care plan updated successfully.",
  });
});

export const reviewCarePlan = asyncHandler(async (req, res) => {
  const service = getService(req);
  const { carePlan, review } = await service.reviewCarePlan(
    req.user.id,
    req.params.carePlanId,
    req.body
  );

  res.json({
    success: true,
    data: {
      carePlan: service.toCarePlanResponse(carePlan),
      review,
    },
    message: review.message,
  });
});

export const getCarePlanClarifications = asyncHandler(async (req, res) => {
  const service = getService(req);
  const clarifications = await service.getClarifications(
    req.user.id,
    req.params.carePlanId
  );

  res.json({
    success: true,
    data: clarifications,
  });
});

export const resolveCarePlanClarification = asyncHandler(async (req, res) => {
  const service = getService(req);
  const clarification = await service.resolveClarification(
    req.user.id,
    req.params.carePlanId,
    req.params.clarificationId,
    req.body
  );

  res.json({
    success: true,
    data: {
      id: clarification._id.toString(),
      status: clarification.status,
      resolvedAt: clarification.resolvedAt,
      resolutionHistory: clarification.resolutionHistory,
    },
    message: "Clarification updated successfully.",
  });
});
