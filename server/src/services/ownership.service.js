import mongoose from "mongoose";
import { Document } from "../models/Document.js";
import { CarePlan } from "../models/CarePlan.js";
import { Task } from "../models/Task.js";
import { FollowUp } from "../models/FollowUp.js";
import { ReminderSetting } from "../models/ReminderSetting.js";
import { ChatMessage } from "../models/ChatMessage.js";
import { ApiError } from "../utils/ApiError.js";

function assertObjectId(value, fieldName) {
  if (!mongoose.Types.ObjectId.isValid(value)) {
    throw new ApiError(400, "VALIDATION_ERROR", `Invalid ${fieldName}.`);
  }
}

export async function getOwnedDocument(userId, documentId) {
  assertObjectId(documentId, "documentId");
  const document = await Document.findOne({
    _id: documentId,
    userId,
    deletedAt: null,
  }).select("-storageKey -extractedText");

  if (!document) {
    throw new ApiError(404, "NOT_FOUND", "Document not found.");
  }

  return document;
}

export async function getOwnedCarePlan(userId, carePlanId) {
  assertObjectId(carePlanId, "carePlanId");
  const carePlan = await CarePlan.findOne({ _id: carePlanId, userId });

  if (!carePlan) {
    throw new ApiError(404, "NOT_FOUND", "Care plan not found.");
  }

  return carePlan;
}

export async function getOwnedTask(userId, taskId) {
  assertObjectId(taskId, "taskId");
  const task = await Task.findOne({ _id: taskId, userId });

  if (!task) {
    throw new ApiError(404, "NOT_FOUND", "Task not found.");
  }

  return task;
}

export async function getOwnedFollowUp(userId, followUpId) {
  assertObjectId(followUpId, "followUpId");
  const followUp = await FollowUp.findOne({ _id: followUpId, userId });

  if (!followUp) {
    throw new ApiError(404, "NOT_FOUND", "Follow-up not found.");
  }

  return followUp;
}

export async function getOwnedReminderSetting(userId) {
  const setting = await ReminderSetting.findOne({ userId });

  if (!setting) {
    throw new ApiError(404, "NOT_FOUND", "Reminder settings not found.");
  }

  return setting;
}

export async function assertOwnedCarePlanAndDocument(
  userId,
  { carePlanId, documentId }
) {
  const carePlan = await getOwnedCarePlan(userId, carePlanId);

  if (documentId && carePlan.documentId.toString() !== documentId.toString()) {
    throw new ApiError(404, "NOT_FOUND", "Care plan not found.");
  }

  return carePlan;
}

export async function getChatHistoryForDocument(userId, documentId) {
  await getOwnedDocument(userId, documentId);

  const messages = await ChatMessage.find({ userId, documentId })
    .sort({ createdAt: 1 })
    .select("-message");

  return messages;
}
