import mongoose from "mongoose";
import { isValidIanaTimezone } from "../utils/timezone.js";

const reminderSettingSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    enabled: {
      type: Boolean,
      default: true,
    },
    reviewTime: {
      type: String,
      default: "06:00",
      match: /^([01]\d|2[0-3]):[0-5]\d$/,
    },
    timezone: {
      type: String,
      default: "Asia/Kolkata",
      validate: {
        validator: isValidIanaTimezone,
        message: "Invalid IANA timezone.",
      },
    },
    reminderType: {
      type: String,
      enum: ["daily_care_plan_review"],
      default: "daily_care_plan_review",
    },
  },
  {
    timestamps: true,
  }
);

export const ReminderSetting = mongoose.model(
  "ReminderSetting",
  reminderSettingSchema
);
