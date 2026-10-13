import { createHash } from "node:crypto";
import mongoose from "mongoose";
import { FollowUp } from "../models/FollowUp.js";
import { ApiError } from "../utils/ApiError.js";
import { assertOwnedCarePlanAndDocument } from "./ownership.service.js";
import { mapSourceReferenceFromApi } from "../utils/sourceReferences.js";
import { parseDateOnly, startOfUtcDay, endOfUtcDay } from "../utils/dateQuery.js";

function buildFollowUpFingerprint({ carePlanId, title, sourceReferences }) {
  const quote = sourceReferences?.[0]?.quotedText || title;
  const raw = `${carePlanId}|${quote.trim().toLowerCase()}`;
  return createHash("sha256").update(raw).digest("hex");
}

function mapFollowUp(followUp) {
  return {
    id: followUp._id.toString(),
    carePlanId: followUp.carePlanId.toString(),
    documentId: followUp.documentId.toString(),
    title: followUp.title,
    appointmentDate: followUp.appointmentDate,
    appointmentTime: followUp.appointmentTime,
    location: followUp.location,
    instructions: followUp.instructions,
    status: followUp.status,
    origin: followUp.origin,
    sourceExtracted: followUp.sourceExtracted,
    sourceReferences: followUp.sourceReferences,
    createdAt: followUp.createdAt,
    updatedAt: followUp.updatedAt,
  };
}

export function createFollowUpService() {
  async function listFollowUps(userId, query) {
    const page = query.page || 1;
    const limit = Math.min(query.limit || 20, 100);
    const skip = (page - 1) * limit;
    const filter = { userId };

    if (query.status) {
      filter.status = query.status;
    }

    if (query.carePlanId) {
      if (!mongoose.Types.ObjectId.isValid(query.carePlanId)) {
        throw new ApiError(400, "VALIDATION_ERROR", "Invalid carePlanId.");
      }
      filter.carePlanId = query.carePlanId;
    }

    if (query.from || query.to) {
      const from = query.from ? parseDateOnly(query.from) : null;
      const to = query.to ? parseDateOnly(query.to) : null;

      if ((query.from && !from) || (query.to && !to)) {
        throw new ApiError(400, "VALIDATION_ERROR", "Invalid date range filter.");
      }

      filter.appointmentDate = {};

      if (from) {
        filter.appointmentDate.$gte = startOfUtcDay(from);
      }

      if (to) {
        filter.appointmentDate.$lte = endOfUtcDay(to);
      }
    }

    const [items, total] = await Promise.all([
      FollowUp.find(filter).sort({ appointmentDate: 1, createdAt: -1 }).skip(skip).limit(limit),
      FollowUp.countDocuments(filter),
    ]);

    return {
      items: items.map(mapFollowUp),
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) || 1 },
    };
  }

  async function createFollowUp(userId, payload) {
    await assertOwnedCarePlanAndDocument(userId, {
      carePlanId: payload.carePlanId,
      documentId: payload.documentId,
    });

    const origin = payload.origin || "caregiver_entered";
    const mappedReferences = (payload.sourceReferences || []).map(
      mapSourceReferenceFromApi
    );

    const sourceFingerprint =
      payload.sourceFingerprint ||
      (origin === "source_extracted"
        ? buildFollowUpFingerprint({
            carePlanId: payload.carePlanId,
            title: payload.title,
            sourceReferences: mappedReferences,
          })
        : null);

    if (sourceFingerprint) {
      const duplicate = await FollowUp.findOne({
        carePlanId: payload.carePlanId,
        sourceFingerprint,
      });

      if (duplicate) {
        throw new ApiError(
          409,
          "DUPLICATE_FOLLOW_UP",
          "A matching source-derived follow-up already exists."
        );
      }
    }

    const followUp = await FollowUp.create({
      userId,
      carePlanId: payload.carePlanId,
      documentId: payload.documentId,
      title: payload.title,
      appointmentDate: payload.appointmentDate || null,
      appointmentTime: payload.appointmentTime || null,
      location: payload.location || null,
      instructions: payload.instructions || "",
      status: payload.status || "upcoming",
      origin,
      sourceReferences: mappedReferences,
      sourceFingerprint,
      sourceExtracted:
        origin === "source_extracted"
          ? {
              appointmentDate: payload.appointmentDate || null,
              appointmentTime: payload.appointmentTime || null,
              location: payload.location || null,
              instructions: payload.instructions || null,
            }
          : {},
    });

    return mapFollowUp(followUp);
  }

  async function getFollowUp(userId, followUpId) {
    if (!mongoose.Types.ObjectId.isValid(followUpId)) {
      throw new ApiError(404, "NOT_FOUND", "Follow-up not found.");
    }

    const followUp = await FollowUp.findOne({ _id: followUpId, userId });

    if (!followUp) {
      throw new ApiError(404, "NOT_FOUND", "Follow-up not found.");
    }

    return mapFollowUp(followUp);
  }

  async function updateFollowUp(userId, followUpId, updates) {
    const followUp = await FollowUp.findOne({ _id: followUpId, userId });

    if (!followUp) {
      throw new ApiError(404, "NOT_FOUND", "Follow-up not found.");
    }

    const allowed = [
      "title",
      "appointmentDate",
      "appointmentTime",
      "location",
      "instructions",
      "status",
    ];

    for (const key of allowed) {
      if (updates[key] !== undefined) {
        followUp[key] = updates[key];
      }
    }

    await followUp.save();
    return mapFollowUp(followUp);
  }

  async function deleteFollowUp(userId, followUpId) {
    const followUp = await FollowUp.findOneAndDelete({ _id: followUpId, userId });

    if (!followUp) {
      throw new ApiError(404, "NOT_FOUND", "Follow-up not found.");
    }

    return { id: followUp._id.toString(), deleted: true };
  }

  return {
    listFollowUps,
    createFollowUp,
    getFollowUp,
    updateFollowUp,
    deleteFollowUp,
  };
}
