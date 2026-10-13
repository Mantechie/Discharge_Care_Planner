import mongoose from "mongoose";
import { normalizeEmail } from "../utils/normalizeEmail.js";
import { isValidIanaTimezone } from "../utils/timezone.js";

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 120,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      set: normalizeEmail,
    },
    passwordHash: {
      type: String,
      required: true,
      select: false,
    },
    preferredLanguage: {
      type: String,
      enum: ["en", "hi"],
      default: "en",
    },
    timezone: {
      type: String,
      default: "Asia/Kolkata",
      validate: {
        validator: isValidIanaTimezone,
        message: "Invalid IANA timezone.",
      },
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    isAnonymous: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

export const User = mongoose.model("User", userSchema);
