import mongoose from "mongoose";

const documentSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    originalFilename: {
      type: String,
      required: true,
      trim: true,
      maxlength: 255,
    },
    mimeType: {
      type: String,
      required: true,
      trim: true,
      maxlength: 128,
    },
    fileSize: {
      type: Number,
      required: true,
      min: 0,
    },
    storageKey: {
      type: String,
      required: true,
      select: false,
    },
    checksum: {
      type: String,
      default: null,
      trim: true,
    },
    status: {
      type: String,
      enum: ["uploaded", "processing", "review_required", "ready", "failed"],
      default: "uploaded",
      index: true,
    },
    extractedText: {
      type: String,
      default: null,
      select: false,
    },
    extractedPages: {
      type: [
        {
          pageNumber: { type: Number, min: 1, required: true },
          text: { type: String, default: "" },
          extractionSource: {
            type: String,
            enum: ["pdf_text", "ocr"],
            required: true,
          },
        },
      ],
      default: [],
      select: false,
    },
    pageCount: {
      type: Number,
      min: 0,
      default: 0,
    },
    hasReadableText: {
      type: Boolean,
      default: false,
    },
    extractionMethod: {
      type: String,
      enum: ["pdf_text", "ocr", "mixed", null],
      default: null,
    },
    processingErrors: {
      type: [String],
      default: [],
    },
    deletedAt: {
      type: Date,
      default: null,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

documentSchema.index({ userId: 1, createdAt: -1 });

export const Document = mongoose.model("Document", documentSchema);
