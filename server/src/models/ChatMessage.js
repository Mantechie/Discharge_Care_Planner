import mongoose from "mongoose";
import { sourceReferenceSchema } from "../utils/sourceReferences.js";

const chatMessageSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    documentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Document",
      required: true,
      index: true,
    },
    carePlanId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "CarePlan",
      default: null,
      index: true,
    },
    role: {
      type: String,
      enum: ["user", "assistant"],
      required: true,
    },
    message: {
      type: String,
      required: true,
      trim: true,
      maxlength: 8000,
      select: false,
    },
    language: {
      type: String,
      enum: ["en", "hi"],
      default: "en",
    },
    sourceReferences: {
      type: [sourceReferenceSchema],
      default: [],
    },
    answerStatus: {
      type: String,
      enum: [
        "answered",
        "insufficient_information",
        "clarification_required",
        "error",
      ],
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

chatMessageSchema.index({ userId: 1, documentId: 1, createdAt: 1 });

export const ChatMessage = mongoose.model("ChatMessage", chatMessageSchema);
