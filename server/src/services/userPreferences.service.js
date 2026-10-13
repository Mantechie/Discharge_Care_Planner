import { User } from "../models/User.js";
import { ReminderSetting } from "../models/ReminderSetting.js";
import { ApiError } from "../utils/ApiError.js";
import { toPublicUser } from "../utils/userProfile.js";

export async function updateUserPreferences(userId, patch) {
  const user = await User.findById(userId);

  if (!user || !user.isActive) {
    throw new ApiError(404, "NOT_FOUND", "User not found.");
  }

  const previousTimezone = user.timezone;

  if (patch.preferredLanguage !== undefined) {
    user.preferredLanguage = patch.preferredLanguage;
  }

  if (patch.timezone !== undefined) {
    user.timezone = patch.timezone;
  }

  await user.save();

  if (patch.timezone !== undefined) {
    const reminder = await ReminderSetting.findOne({ userId });

    if (reminder && reminder.timezone === previousTimezone) {
      reminder.timezone = patch.timezone;
      await reminder.save();
    }
  }

  return toPublicUser(user);
}
