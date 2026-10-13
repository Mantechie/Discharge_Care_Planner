import { asyncHandler } from "../utils/asyncHandler.js";
import { createFollowUpService } from "../services/followUp.service.js";

const followUpService = createFollowUpService();

export const listFollowUps = asyncHandler(async (req, res) => {
  const data = await followUpService.listFollowUps(
    req.user.id,
    req.validatedQuery || req.query
  );

  res.json({
    success: true,
    data,
  });
});

export const createFollowUp = asyncHandler(async (req, res) => {
  const followUp = await followUpService.createFollowUp(req.user.id, req.body);

  res.status(201).json({
    success: true,
    data: followUp,
    message: "Follow-up created successfully.",
  });
});

export const getFollowUp = asyncHandler(async (req, res) => {
  const followUp = await followUpService.getFollowUp(
    req.user.id,
    req.params.followUpId
  );

  res.json({
    success: true,
    data: followUp,
  });
});

export const patchFollowUp = asyncHandler(async (req, res) => {
  const followUp = await followUpService.updateFollowUp(
    req.user.id,
    req.params.followUpId,
    req.body
  );

  res.json({
    success: true,
    data: followUp,
    message: "Follow-up updated successfully.",
  });
});

export const deleteFollowUp = asyncHandler(async (req, res) => {
  const result = await followUpService.deleteFollowUp(
    req.user.id,
    req.params.followUpId
  );

  res.json({
    success: true,
    data: result,
    message: "Follow-up deleted successfully.",
  });
});
