import Joi from "joi";

const timePattern = /^([01]\d|2[0-3]):[0-5]\d$/;

export const createTaskSchema = Joi.object({
  carePlanId: Joi.string().required(),
  documentId: Joi.string().required(),
  title: Joi.string().trim().min(1).max(300).required(),
  description: Joi.string().trim().max(2000).allow("", null),
  category: Joi.string()
    .valid("medication", "care_instruction", "follow_up", "other")
    .required(),
  scheduledDate: Joi.date().iso().allow(null),
  scheduledTime: Joi.string().pattern(timePattern).allow(null, ""),
  timezone: Joi.string().trim().required(),
  status: Joi.string().valid("pending", "completed", "skipped"),
  sourceReferences: Joi.array()
    .items(
      Joi.object({
        pageNumber: Joi.number().integer().min(1).allow(null),
        quotedText: Joi.string().allow("", null),
        startOffset: Joi.number().integer().min(0).allow(null),
        endOffset: Joi.number().integer().min(0).allow(null),
        referencePrecision: Joi.string().allow(null),
      })
    )
    .max(20),
  isSourceDerived: Joi.boolean(),
  sourceFingerprint: Joi.string().trim().max(128).allow(null, ""),
});

export const updateTaskSchema = Joi.object({
  title: Joi.string().trim().min(1).max(300),
  description: Joi.string().trim().max(2000).allow("", null),
  scheduledDate: Joi.date().iso().allow(null),
  scheduledTime: Joi.string().pattern(timePattern).allow(null, ""),
  timezone: Joi.string().trim(),
  status: Joi.string().valid("pending", "completed", "skipped"),
}).min(1);

export const listTasksQuerySchema = Joi.object({
  date: Joi.string().pattern(/^\d{4}-\d{2}-\d{2}$/),
  from: Joi.string().pattern(/^\d{4}-\d{2}-\d{2}$/),
  to: Joi.string().pattern(/^\d{4}-\d{2}-\d{2}$/),
  status: Joi.string().valid("pending", "completed", "skipped"),
  category: Joi.string().valid(
    "medication",
    "care_instruction",
    "follow_up",
    "other"
  ),
  carePlanId: Joi.string(),
  page: Joi.number().integer().min(1),
  limit: Joi.number().integer().min(1).max(100),
});
