import Joi from "joi";

const timePattern = /^([01]\d|2[0-3]):[0-5]\d$/;

export const createFollowUpSchema = Joi.object({
  carePlanId: Joi.string().required(),
  documentId: Joi.string().required(),
  title: Joi.string().trim().min(1).max(300).required(),
  appointmentDate: Joi.date().iso().allow(null),
  appointmentTime: Joi.string().pattern(timePattern).allow(null, ""),
  location: Joi.string().trim().max(500).allow("", null),
  instructions: Joi.string().trim().max(2000).allow("", null),
  status: Joi.string().valid(
    "upcoming",
    "completed",
    "needs_clarification",
    "cancelled"
  ),
  origin: Joi.string().valid("source_extracted", "caregiver_entered"),
  sourceReferences: Joi.array().max(20),
  sourceFingerprint: Joi.string().trim().max(128).allow(null, ""),
});

export const updateFollowUpSchema = Joi.object({
  title: Joi.string().trim().min(1).max(300),
  appointmentDate: Joi.date().iso().allow(null),
  appointmentTime: Joi.string().pattern(timePattern).allow(null, ""),
  location: Joi.string().trim().max(500).allow("", null),
  instructions: Joi.string().trim().max(2000).allow("", null),
  status: Joi.string().valid(
    "upcoming",
    "completed",
    "needs_clarification",
    "cancelled"
  ),
}).min(1);

export const listFollowUpsQuerySchema = Joi.object({
  status: Joi.string().valid(
    "upcoming",
    "completed",
    "needs_clarification",
    "cancelled"
  ),
  from: Joi.string().pattern(/^\d{4}-\d{2}-\d{2}$/),
  to: Joi.string().pattern(/^\d{4}-\d{2}-\d{2}$/),
  carePlanId: Joi.string(),
  page: Joi.number().integer().min(1),
  limit: Joi.number().integer().min(1).max(100),
});
