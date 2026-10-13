import { Router } from "express";
import { authenticate } from "../middleware/authenticate.js";
import { validateBody, validateQuery } from "../middleware/validate.js";
import { updateReminderSettingsSchema } from "../validators/reminder.validator.js";
import Joi from "joi";
import {
  getReminderSettings,
  getReminderTemplate,
  updateReminderSettings,
} from "../controllers/reminder.controller.js";

const reminderTemplateQuerySchema = Joi.object({
  language: Joi.string().valid("en", "hi"),
});

const router = Router();

router.use(authenticate);
router.get("/settings", getReminderSettings);
router.get(
  "/template",
  validateQuery(reminderTemplateQuerySchema),
  getReminderTemplate
);
router.put(
  "/settings",
  validateBody(updateReminderSettingsSchema),
  updateReminderSettings
);
router.patch(
  "/settings",
  validateBody(updateReminderSettingsSchema),
  updateReminderSettings
);

export default router;
