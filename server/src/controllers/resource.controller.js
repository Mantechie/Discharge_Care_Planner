import { Document } from "../models/Document.js";
import { Task } from "../models/Task.js";
import { FollowUp } from "../models/FollowUp.js";
import { ReminderSetting } from "../models/ReminderSetting.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import {
  getOwnedDocument,
  getOwnedCarePlan,
  getOwnedTask,
  getOwnedFollowUp,
  getOwnedReminderSetting,
  assertOwnedCarePlanAndDocument,
  getChatHistoryForDocument,
} from "../services/ownership.service.js";

function toDocumentResponse(document) {
  return {
    id: document._id.toString(),
    originalFilename: document.originalFilename,
    mimeType: document.mimeType,
    fileSize: document.fileSize,
    status: document.status,
    extractionMethod: document.extractionMethod,
    createdAt: document.createdAt,
    updatedAt: document.updatedAt,
  };
}

function toCarePlanResponse(carePlan) {
  return {
    id: carePlan._id.toString(),
    documentId: carePlan.documentId.toString(),
    status: carePlan.status,
    language: carePlan.language,
    summary: carePlan.summary,
    medications: carePlan.medications,
    dailyInstructions: carePlan.dailyInstructions,
    warningSigns: carePlan.warningSigns,
    followUps: carePlan.followUps,
    clarifications: carePlan.clarifications,
    reviewedByUserAt: carePlan.reviewedByUserAt,
    createdAt: carePlan.createdAt,
    updatedAt: carePlan.updatedAt,
  };
}

export const listDocuments = asyncHandler(async (req, res) => {
  const documents = await Document.find({
    userId: req.user.id,
    deletedAt: null,
  })
    .sort({ createdAt: -1 })
    .select("-storageKey -extractedText");

  res.json({
    success: true,
    data: documents.map(toDocumentResponse),
  });
});

export const getDocument = asyncHandler(async (req, res) => {
  const document = await getOwnedDocument(req.user.id, req.params.documentId);

  res.json({
    success: true,
    data: toDocumentResponse(document),
  });
});

export const getCarePlan = asyncHandler(async (req, res) => {
  const carePlan = await getOwnedCarePlan(req.user.id, req.params.carePlanId);

  res.json({
    success: true,
    data: toCarePlanResponse(carePlan),
  });
});

export const getTask = asyncHandler(async (req, res) => {
  const task = await getOwnedTask(req.user.id, req.params.taskId);

  res.json({
    success: true,
    data: {
      id: task._id.toString(),
      carePlanId: task.carePlanId.toString(),
      documentId: task.documentId.toString(),
      title: task.title,
      description: task.description,
      category: task.category,
      scheduledDate: task.scheduledDate,
      scheduledTime: task.scheduledTime,
      timezone: task.timezone,
      status: task.status,
      sourceReferences: task.sourceReferences,
      createdAt: task.createdAt,
      updatedAt: task.updatedAt,
    },
  });
});

export const createTask = asyncHandler(async (req, res) => {
  const { carePlanId, documentId, title, description, category, timezone } =
    req.body;

  if (!title || !category || !timezone) {
    throw new ApiError(
      400,
      "VALIDATION_ERROR",
      "The request contains invalid data.",
      []
    );
  }

  await assertOwnedCarePlanAndDocument(req.user.id, {
    carePlanId,
    documentId,
  });

  const task = await Task.create({
    userId: req.user.id,
    carePlanId,
    documentId,
    title,
    description: description || "",
    category,
    timezone,
    scheduledTime: null,
    scheduledDate: null,
  });

  res.status(201).json({
    success: true,
    data: {
      id: task._id.toString(),
      scheduledTime: task.scheduledTime,
    },
  });
});

export const getFollowUp = asyncHandler(async (req, res) => {
  const followUp = await getOwnedFollowUp(req.user.id, req.params.followUpId);

  res.json({
    success: true,
    data: {
      id: followUp._id.toString(),
      carePlanId: followUp.carePlanId.toString(),
      documentId: followUp.documentId.toString(),
      title: followUp.title,
      appointmentDate: followUp.appointmentDate,
      appointmentTime: followUp.appointmentTime,
      location: followUp.location,
      instructions: followUp.instructions,
      status: followUp.status,
      sourceReferences: followUp.sourceReferences,
      createdAt: followUp.createdAt,
      updatedAt: followUp.updatedAt,
    },
  });
});

export const createFollowUp = asyncHandler(async (req, res) => {
  const { carePlanId, documentId, title } = req.body;

  if (!title) {
    throw new ApiError(
      400,
      "VALIDATION_ERROR",
      "The request contains invalid data.",
      []
    );
  }

  await assertOwnedCarePlanAndDocument(req.user.id, {
    carePlanId,
    documentId,
  });

  const followUp = await FollowUp.create({
    userId: req.user.id,
    carePlanId,
    documentId,
    title,
  });

  res.status(201).json({
    success: true,
    data: { id: followUp._id.toString() },
  });
});

export const getReminderSettings = asyncHandler(async (req, res) => {
  const settings = await getOwnedReminderSetting(req.user.id);

  res.json({
    success: true,
    data: {
      enabled: settings.enabled,
      reviewTime: settings.reviewTime,
      timezone: settings.timezone,
      reminderType: settings.reminderType,
    },
  });
});

export const updateReminderSettings = asyncHandler(async (req, res) => {
  const settings = await getOwnedReminderSetting(req.user.id);
  const allowed = {};

  if (typeof req.body.enabled === "boolean") {
    allowed.enabled = req.body.enabled;
  }

  if (typeof req.body.reviewTime === "string") {
    allowed.reviewTime = req.body.reviewTime;
  }

  if (typeof req.body.timezone === "string") {
    allowed.timezone = req.body.timezone;
  }

  settings.set(allowed);
  await settings.save();

  res.json({
    success: true,
    data: {
      enabled: settings.enabled,
      reviewTime: settings.reviewTime,
      timezone: settings.timezone,
      reminderType: settings.reminderType,
    },
  });
});

export const getChatHistory = asyncHandler(async (req, res) => {
  const { documentId } = req.query;

  if (!documentId) {
    throw new ApiError(
      400,
      "VALIDATION_ERROR",
      "documentId query parameter is required."
    );
  }

  const messages = await getChatHistoryForDocument(req.user.id, documentId);

  res.json({
    success: true,
    data: messages.map((message) => ({
      id: message._id.toString(),
      documentId: message.documentId.toString(),
      carePlanId: message.carePlanId?.toString() ?? null,
      role: message.role,
      language: message.language,
      answerStatus: message.answerStatus,
      sourceReferences: message.sourceReferences,
      createdAt: message.createdAt,
    })),
  });
});
