import Joi from "joi";

export const carePlanListQuerySchema = Joi.object({
  page: Joi.number().integer().min(1),
  limit: Joi.number().integer().min(1).max(100),
  status: Joi.string().valid("draft", "review_required", "ready", "archived"),
  documentId: Joi.string(),
});

export const carePlanPatchSchema = Joi.object({
  status: Joi.string().valid("draft", "review_required", "ready", "archived"),
  summary: Joi.string().trim().max(4000).allow("", null),
  caregiverReviewNote: Joi.string().trim().max(2000).allow("", null),
  medicationEdits: Joi.array()
    .items(
      Joi.object({
        medicationId: Joi.string().required(),
        dose: Joi.string().trim().max(300).allow("", null),
        frequency: Joi.string().trim().max(300).allow("", null),
        timing: Joi.string().trim().max(300).allow("", null),
        notes: Joi.string().trim().max(1000).allow("", null),
      })
    )
    .max(50),
}).min(1);

export const carePlanReviewSchema = Joi.object({
  note: Joi.string().trim().max(2000).allow("", null),
});

export const clarificationResolveSchema = Joi.object({
  status: Joi.string().valid("resolved", "dismissed").required(),
  resolutionNote: Joi.string().trim().max(2000).allow("", null),
  confirmedWithProfessionalOn: Joi.date().iso().allow(null),
  confirmationSource: Joi.string().trim().max(500).allow("", null),
});
