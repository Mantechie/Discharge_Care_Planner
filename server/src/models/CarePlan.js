import mongoose from "mongoose";
import { sourceReferenceSchema } from "../utils/sourceReferences.js";

const FOOD_INSTRUCTIONS = [
  "before_food",
  "after_food",
  "with_food",
  "empty_stomach",
  "not_specified",
];

const medicationSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    strength: { type: String, default: null, trim: true },
    dose: { type: String, default: null, trim: true },
    route: { type: String, default: null, trim: true },
    frequency: { type: String, default: null, trim: true },
    timing: { type: String, default: null, trim: true },
    foodInstruction: {
      type: String,
      enum: FOOD_INSTRUCTIONS,
      default: "not_specified",
    },
    duration: { type: String, default: null, trim: true },
    sourceReferences: {
      type: [sourceReferenceSchema],
      default: [],
    },
    confidence: {
      type: Number,
      min: 0,
      max: 1,
      default: null,
    },
    reviewStatus: {
      type: String,
      enum: ["unreviewed", "confirmed_against_source", "needs_clarification"],
      default: "unreviewed",
    },
    clarificationReason: {
      type: String,
      default: null,
      trim: true,
    },
  },
  { _id: true }
);

const clarificationSchema = new mongoose.Schema(
  {
    field: { type: String, required: true, trim: true },
    question: { type: String, required: true, trim: true },
    reason: { type: String, required: true, trim: true },
    sourceReferences: { type: [sourceReferenceSchema], default: [] },
    requiresProfessionalConfirmation: { type: Boolean, default: false },
  },
  { _id: true }
);

const carePlanSchema = new mongoose.Schema(
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
    status: {
      type: String,
      enum: ["draft", "review_required", "ready", "archived"],
      default: "draft",
      index: true,
    },
    language: {
      type: String,
      enum: ["en", "hi"],
      default: "en",
    },
    summary: {
      type: String,
      default: "",
      trim: true,
    },
    medications: {
      type: [medicationSchema],
      default: [],
    },
    dailyInstructions: {
      type: [String],
      default: [],
    },
    warningSigns: {
      type: [String],
      default: [],
    },
    followUps: {
      type: [String],
      default: [],
    },
    clarifications: {
      type: [clarificationSchema],
      default: [],
    },
    reviewedByUserAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

carePlanSchema.index({ userId: 1, documentId: 1 });

export const CarePlan = mongoose.model("CarePlan", carePlanSchema);
export { FOOD_INSTRUCTIONS };
