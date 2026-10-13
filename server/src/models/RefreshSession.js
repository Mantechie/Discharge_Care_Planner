import mongoose from "mongoose";

const refreshSessionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    tokenHash: {
      type: String,
      required: true,
      unique: true,
    },
    familyId: {
      type: String,
      required: true,
      index: true,
    },
    expiresAt: {
      type: Date,
      required: true,
      index: true,
    },
    revokedAt: {
      type: Date,
      default: null,
      index: true,
    },
    replacedByTokenHash: {
      type: String,
      default: null,
    },
    userAgent: {
      type: String,
      maxlength: 512,
      default: null,
      select: false,
    },
    ipAddress: {
      type: String,
      maxlength: 64,
      default: null,
      select: false,
    },
  },
  {
    timestamps: true,
  }
);

refreshSessionSchema.index({ userId: 1, familyId: 1 });

export const RefreshSession = mongoose.model(
  "RefreshSession",
  refreshSessionSchema
);
