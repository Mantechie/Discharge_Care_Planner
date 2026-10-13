import Joi from "joi";
import { isValidIanaTimezone } from "../utils/timezone.js";

export const registerSchema = Joi.object({
  name: Joi.string().trim().min(2).max(120).required(),
  email: Joi.string().trim().email().max(254).required(),
  password: Joi.string().min(8).max(128).required(),
  preferredLanguage: Joi.string().valid("en", "hi"),
  timezone: Joi.string()
    .trim()
    .custom((value, helpers) => {
      if (!isValidIanaTimezone(value)) {
        return helpers.error("any.invalid");
      }
      return value;
    }, "IANA timezone validation")
    .messages({
      "any.invalid": "Invalid IANA timezone.",
    }),
});

export const loginSchema = Joi.object({
  email: Joi.string().trim().email().max(254).required(),
  password: Joi.string().min(8).max(128).required(),
});
