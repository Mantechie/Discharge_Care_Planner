import mongoose from "mongoose";

export const sourceReferenceSchema = new mongoose.Schema(
  {
    page: {
      type: Number,
      min: 1,
      default: null,
    },
    quotedText: {
      type: String,
      trim: true,
      maxlength: 4000,
      default: null,
    },
    startOffset: {
      type: Number,
      min: 0,
      default: null,
    },
    endOffset: {
      type: Number,
      min: 0,
      default: null,
    },
  },
  { _id: false }
);
