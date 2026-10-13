import Joi from "joi";

const citationSchema = Joi.object({
  pageNumber: Joi.number().integer().min(1).allow(null),
  quotedText: Joi.string().trim().max(4000).allow("", null),
  startOffset: Joi.number().integer().min(0).allow(null),
  endOffset: Joi.number().integer().min(0).allow(null),
  referencePrecision: Joi.string().allow(null),
  sourceReferenceId: Joi.string().trim().max(64).allow(null, ""),
});

export const chatAiResponseSchema = Joi.object({
  answer: Joi.string().trim().min(1).max(8000).required(),
  language: Joi.string().valid("en", "hi").required(),
  answerStatus: Joi.string()
    .valid(
      "answered",
      "insufficient_information",
      "clarification_required",
      "error"
    )
    .required(),
  citations: Joi.array().items(citationSchema).max(10).default([]),
  requiresProfessionalConfirmation: Joi.boolean().default(false),
  isEmergencyGuidance: Joi.boolean().default(false),
});

export function validateChatAiResponse(payload) {
  const { error, value } = chatAiResponseSchema.validate(payload, {
    abortEarly: false,
    stripUnknown: true,
  });

  if (error) {
    return {
      valid: false,
      issues: error.details.map((detail) => detail.message),
    };
  }

  return { valid: true, value };
}
