import Joi from "joi";

export const ttsSpeakSchema = Joi.object({
  text: Joi.string().trim().min(1).max(4096).required(),
  language: Joi.string().valid("en", "hi").default("en"),
  voice: Joi.string()
    .valid("alloy", "echo", "fable", "onyx", "nova", "shimmer")
    .default("alloy"),
});
