import Joi from "joi";
import { isValidIanaTimezone } from "../utils/timezone.js";

const reviewTimePattern = /^([01]\d|2[0-3]):[0-5]\d$/;

export const updateReminderSettingsSchema = Joi.object({
  enabled: Joi.boolean(),
  reviewTime: Joi.string().pattern(reviewTimePattern).messages({
    "string.pattern.base": "reviewTime must use HH:mm format.",
  }),
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
