import { User } from "../models/User.js";
import { ReminderSetting } from "../models/ReminderSetting.js";
import { ApiError } from "../utils/ApiError.js";
import {
  buildDailyCarePlanReviewTemplate,
  buildReminderDeliveryCapabilities,
} from "../utils/reminderTemplates.js";

async function getUserLanguage(userId) {
  const user = await User.findById(userId).select("preferredLanguage timezone");

  if (!user) {
    throw new ApiError(404, "NOT_FOUND", "User not found.");
  }

  return user;
}

export async function getReminderSettingsForUser(userId) {
  const [user, settings] = await Promise.all([
    getUserLanguage(userId),
    ReminderSetting.findOne({ userId }),
  ]);

  if (!settings) {
    throw new ApiError(404, "NOT_FOUND", "Reminder settings not found.");
  }

  const language = user.preferredLanguage || "en";
  const template = buildDailyCarePlanReviewTemplate(language, {
    reviewTime: settings.reviewTime,
    timezone: settings.timezone,
  });

  return {
    enabled: settings.enabled,
    reviewTime: settings.reviewTime,
    timezone: settings.timezone,
    reminderType: settings.reminderType,
    preferredLanguage: language,
    isMedicationSchedule: false,
    template,
    delivery: buildReminderDeliveryCapabilities(),
    updatedAt: settings.updatedAt,
  };
}

export async function getReminderTemplateForUser(userId, languageOverride) {
  const [user, settings] = await Promise.all([
    getUserLanguage(userId),
    ReminderSetting.findOne({ userId }),
  ]);

  if (!settings) {
    throw new ApiError(404, "NOT_FOUND", "Reminder settings not found.");
  }

  const language =
    languageOverride === "hi" || languageOverride === "en"
      ? languageOverride
      : user.preferredLanguage || "en";

  return {
    reminderType: settings.reminderType,
    language,
    template: buildDailyCarePlanReviewTemplate(language, {
      reviewTime: settings.reviewTime,
      timezone: settings.timezone,
    }),
    delivery: buildReminderDeliveryCapabilities(),
    isMedicationSchedule: false,
  };
}

export async function updateReminderSettingsForUser(userId, patch) {
  const settings = await ReminderSetting.findOne({ userId });

  if (!settings) {
    throw new ApiError(404, "NOT_FOUND", "Reminder settings not found.");
  }

  if (patch.enabled !== undefined) {
    settings.enabled = patch.enabled;
  }

  if (patch.reviewTime !== undefined) {
    settings.reviewTime = patch.reviewTime;
  }

  if (patch.timezone !== undefined) {
    settings.timezone = patch.timezone;
  }

  await settings.save();

  return getReminderSettingsForUser(userId);
}
