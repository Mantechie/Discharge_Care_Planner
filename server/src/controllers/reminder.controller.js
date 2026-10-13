import { asyncHandler } from "../utils/asyncHandler.js";
import {
  getReminderSettingsForUser,
  getReminderTemplateForUser,
  updateReminderSettingsForUser,
} from "../services/reminder.service.js";

export const getReminderSettings = asyncHandler(async (req, res) => {
  const data = await getReminderSettingsForUser(req.user.id);

  res.json({
    success: true,
    data,
  });
});

export const getReminderTemplate = asyncHandler(async (req, res) => {
  const language = req.validatedQuery?.language;
  const data = await getReminderTemplateForUser(req.user.id, language);

  res.json({
    success: true,
    data,
  });
});

export const updateReminderSettings = asyncHandler(async (req, res) => {
  const data = await updateReminderSettingsForUser(req.user.id, req.body);

  res.json({
    success: true,
    data,
    message: "Reminder settings updated successfully.",
  });
});
