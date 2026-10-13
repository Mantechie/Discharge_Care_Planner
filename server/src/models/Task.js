import mongoose from "mongoose";
import { sourceReferenceSchema } from "../utils/sourceReferences.js";
import { isValidIanaTimezone } from "../utils/timezone.js";

const taskSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    carePlanId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "CarePlan",
      required: true,
      index: true,
    },
    documentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Document",
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 300,
    },
    description: {
      type: String,
      default: "",
      trim: true,
      maxlength: 2000,
    },
    category: {
      type: String,
      enum: ["medication", "care_instruction", "follow_up", "other"],
      required: true,
    },
    scheduledDate: {
      type: Date,
      default: null,
    },
    scheduledTime: {
      type: String,
      default: null,
      trim: true,
      validate: {
        validator(value) {
          if (value == null || value === "") {
            return true;
          }
          return /^([01]\d|2[0-3]):[0-5]\d$/.test(value);
        },
        message: "Invalid scheduled time format.",
      },
    },
    timezone: {
      type: String,
      required: true,
      validate: {
        validator: isValidIanaTimezone,
        message: "Invalid IANA timezone.",
      },
    },
    status: {
      type: String,
      enum: ["pending", "completed", "skipped"],
      default: "pending",
      index: true,
    },
    sourceReferences: {
      type: [sourceReferenceSchema],
      default: [],
    },
    isSourceDerived: {
      type: Boolean,
      default: false,
    },
    sourceFingerprint: {
      type: String,
      default: null,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

taskSchema.index({ userId: 1, scheduledDate: 1 });
taskSchema.index(
  { carePlanId: 1, sourceFingerprint: 1 },
  {
    unique: true,
    partialFilterExpression: { sourceFingerprint: { $type: "string" } },
  }
);

export const Task = mongoose.model("Task", taskSchema);
