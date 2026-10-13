import Joi from "joi";

const sourceReferenceSchema = Joi.object({
  pageNumber: Joi.number().integer().min(1).allow(null),
  quotedText: Joi.string().allow("", null),
  startOffset: Joi.number().integer().min(0).allow(null),
  endOffset: Joi.number().integer().min(0).allow(null),
  referencePrecision: Joi.string()
    .valid("exact_span", "page_excerpt", "page_only", "unavailable")
    .allow(null),
}).unknown(false);

const medicationSchema = Joi.object({
  name: Joi.string().trim().required(),
  strength: Joi.string().allow(null, ""),
  dose: Joi.string().allow(null, ""),
  route: Joi.string().allow(null, ""),
  frequency: Joi.string().allow(null, ""),
  timing: Joi.string().allow(null, ""),
  foodInstruction: Joi.string()
    .valid(
      "before_food",
      "after_food",
      "with_food",
      "empty_stomach",
      "not_specified"
    )
    .default("not_specified"),
  duration: Joi.string().allow(null, ""),
  sourceReferences: Joi.array().items(sourceReferenceSchema).default([]),
  confidence: Joi.number().min(0).max(1).allow(null),
  reviewStatus: Joi.string()
    .valid("unreviewed", "confirmed_against_source", "needs_clarification")
    .default("unreviewed"),
  clarificationReason: Joi.string().allow(null, ""),
}).unknown(false);

const dailyInstructionSchema = Joi.object({
  instruction: Joi.string().trim().required(),
  sourceReferences: Joi.array().items(sourceReferenceSchema).default([]),
  reviewStatus: Joi.string()
    .valid("unreviewed", "confirmed_against_source", "needs_clarification")
    .default("unreviewed"),
  clarificationReason: Joi.string().allow(null, ""),
}).unknown(false);

const warningSignSchema = Joi.object({
  description: Joi.string().trim().required(),
  sourceReferences: Joi.array().items(sourceReferenceSchema).default([]),
  reviewStatus: Joi.string()
    .valid("unreviewed", "confirmed_against_source", "needs_clarification")
    .default("unreviewed"),
}).unknown(false);

const followUpSchema = Joi.object({
  description: Joi.string().trim().required(),
  date: Joi.string().allow(null, ""),
  time: Joi.string().allow(null, ""),
  location: Joi.string().allow(null, ""),
  sourceReferences: Joi.array().items(sourceReferenceSchema).default([]),
  reviewStatus: Joi.string()
    .valid("unreviewed", "confirmed_against_source", "needs_clarification")
    .default("unreviewed"),
}).unknown(false);

const clarificationSchema = Joi.object({
  field: Joi.string().trim().required(),
  reason: Joi.string().trim().required(),
  sourceReferences: Joi.array().items(sourceReferenceSchema).default([]),
  requiresProfessionalConfirmation: Joi.boolean().default(false),
}).unknown(false);

export const extractionOutputSchema = Joi.object({
  summary: Joi.string().allow("", null).default(""),
  language: Joi.string().valid("en", "hi").default("en"),
  sourceReferences: Joi.array().items(sourceReferenceSchema).default([]),
  medications: Joi.array().items(medicationSchema).default([]),
  dailyInstructions: Joi.array().items(dailyInstructionSchema).default([]),
  warningSigns: Joi.array().items(warningSignSchema).default([]),
  followUps: Joi.array().items(followUpSchema).default([]),
  clarifications: Joi.array().items(clarificationSchema).default([]),
}).unknown(false);

export function validateExtractionOutput(data) {
  const { error, value } = extractionOutputSchema.validate(data, {
    abortEarly: false,
    stripUnknown: true,
  });

  if (error) {
    return {
      valid: false,
      details: error.details.map((detail) => ({
        field: detail.path.join("."),
        message: detail.message,
      })),
    };
  }

  for (const medication of value.medications) {
    if (medication.reviewStatus === "confirmed_against_source") {
      medication.reviewStatus = "unreviewed";
    }
  }

  return { valid: true, value };
}
