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

const reviewStatusSchema = {
  type: String,
  enum: ["unreviewed", "confirmed_against_source", "needs_clarification"],
  default: "unreviewed",
};

const clarificationResolutionSchema = new mongoose.Schema(
  {
    status: {
      type: String,
      enum: ["open", "resolved", "dismissed"],
    },
    resolutionNote: { type: String, trim: true, default: null },
    confirmedWithProfessionalOn: { type: Date, default: null },
    confirmationSource: { type: String, trim: true, default: null },
    recordedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const clarificationSchema = new mongoose.Schema(
  {
    field: { type: String, required: true, trim: true },
    question: { type: String, required: true, trim: true },
    reason: { type: String, required: true, trim: true },
    sourceReferences: { type: [sourceReferenceSchema], default: [] },
    requiresProfessionalConfirmation: { type: Boolean, default: false },
    reviewPriority: {
      type: String,
      enum: ["normal", "high", "critical"],
      default: "normal",
    },
    status: {
      type: String,
      enum: ["open", "resolved", "dismissed"],
      default: "open",
    },
    resolvedAt: { type: Date, default: null },
    resolutionHistory: {
      type: [clarificationResolutionSchema],
      default: [],
    },
  },
  { _id: true }
);

const caregiverFieldEditSchema = new mongoose.Schema(
  {
    value: { type: String, default: null, trim: true },
    updatedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const caregiverMedicationEditSchema = new mongoose.Schema(
  {
    medicationId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },
    dose: { type: caregiverFieldEditSchema, default: null },
    frequency: { type: caregiverFieldEditSchema, default: null },
    timing: { type: caregiverFieldEditSchema, default: null },
    notes: { type: caregiverFieldEditSchema, default: null },
  },
  { _id: false }
);

const caregiverEditsSchema = new mongoose.Schema(
  {
    summary: { type: caregiverFieldEditSchema, default: null },
    medications: { type: [caregiverMedicationEditSchema], default: [] },
  },
  { _id: false }
);

const validationIssueSchema = new mongoose.Schema(
  {
    code: { type: String, required: true, trim: true },
    field: { type: String, required: true, trim: true },
    reason: { type: String, required: true, trim: true },
    sourceReferences: { type: [sourceReferenceSchema], default: [] },
    requiresProfessionalConfirmation: { type: Boolean, default: false },
    reviewPriority: {
      type: String,
      enum: ["normal", "high", "critical"],
      default: "normal",
    },
  },
  { _id: true }
);

const dailyInstructionItemSchema = new mongoose.Schema(
  {
    instruction: { type: String, required: true, trim: true },
    sourceReferences: { type: [sourceReferenceSchema], default: [] },
    reviewStatus: reviewStatusSchema,
    clarificationReason: { type: String, default: null, trim: true },
  },
  { _id: true }
);

const warningSignItemSchema = new mongoose.Schema(
  {
    description: { type: String, required: true, trim: true },
    sourceReferences: { type: [sourceReferenceSchema], default: [] },
    reviewStatus: reviewStatusSchema,
  },
  { _id: true }
);

const followUpItemSchema = new mongoose.Schema(
  {
    description: { type: String, required: true, trim: true },
    date: { type: String, default: null, trim: true },
    time: { type: String, default: null, trim: true },
    location: { type: String, default: null, trim: true },
    sourceReferences: { type: [sourceReferenceSchema], default: [] },
    reviewStatus: reviewStatusSchema,
  },
  { _id: true }
);

const extractionProvenanceSchema = new mongoose.Schema(
  {
    provider: { type: String, default: null, trim: true },
    model: { type: String, default: null, trim: true },
    extractedAt: { type: Date, default: null },
    validatedAt: { type: Date, default: null },
    sourceExtractionMethod: { type: String, default: null, trim: true },
    extractionVersion: { type: Number, default: 1 },
  },
  { _id: false }
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
    dailyInstructionItems: {
      type: [dailyInstructionItemSchema],
      default: [],
    },
    warningSignItems: {
      type: [warningSignItemSchema],
      default: [],
    },
    followUpItems: {
      type: [followUpItemSchema],
      default: [],
    },
    clarifications: {
      type: [clarificationSchema],
      default: [],
    },
    validationIssues: {
      type: [validationIssueSchema],
      default: [],
    },
    extractionProvenance: {
      type: extractionProvenanceSchema,
      default: () => ({}),
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    reviewedByUserAt: {
      type: Date,
      default: null,
    },
    caregiverReviewNote: {
      type: String,
      default: null,
      trim: true,
      maxlength: 2000,
    },
    extractedSnapshot: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
      select: false,
    },
    caregiverEdits: {
      type: caregiverEditsSchema,
      default: () => ({}),
    },
  },
  {
    timestamps: true,
  }
);

carePlanSchema.index({ userId: 1, documentId: 1 });
carePlanSchema.index({ documentId: 1, isActive: 1 });

export const CarePlan = mongoose.model("CarePlan", carePlanSchema);
export { FOOD_INSTRUCTIONS };
