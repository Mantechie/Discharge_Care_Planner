import Joi from "joi";

export function createChatMessageSchema(maxLength) {
  return Joi.object({
    documentId: Joi.string().required(),
    message: Joi.string().trim().min(1).max(maxLength).required(),
    language: Joi.string().valid("en", "hi").default("en"),
  });
}

export const chatHistoryQuerySchema = Joi.object({
  documentId: Joi.string().required(),
  page: Joi.number().integer().min(1),
  limit: Joi.number().integer().min(1).max(100),
});
