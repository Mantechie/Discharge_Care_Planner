import mongoose from "mongoose";
import { sourceReferenceSchema } from "../utils/sourceReferences.js";

const followUpSchema = new mongoose.Schema(
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
    appointmentDate: {
      type: Date,
      default: null,
    },
    appointmentTime: {
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
        message: "Invalid appointment time format.",
      },
    },
    location: {
      type: String,
      default: null,
      trim: true,
      maxlength: 500,
    },
    instructions: {
      type: String,
      default: "",
      trim: true,
      maxlength: 2000,
    },
    status: {
      type: String,
      enum: ["upcoming", "completed", "needs_clarification", "cancelled"],
      default: "upcoming",
      index: true,
    },
    sourceReferences: {
      type: [sourceReferenceSchema],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

followUpSchema.index({ userId: 1, appointmentDate: 1 });

export const FollowUp = mongoose.model("FollowUp", followUpSchema);
