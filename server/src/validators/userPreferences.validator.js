import Joi from "joi";
import { isValidIanaTimezone } from "../utils/timezone.js";

export const updateUserPreferencesSchema = Joi.object({
  preferredLanguage: Joi.string().valid("en", "hi"),
  timezone: Joi.string()
    .trim()
    .custom((value, helpers) => {
      if (!isValidIanaTimezone(value)) {
        return helpers.error("any.invalid");
      }
      return value;
    }, "IANA timezone validation"),
})
  .min(1)
  .messages({
    "any.invalid": "Invalid IANA timezone.",
  });
