import { createHash } from "node:crypto";
import mongoose from "mongoose";
import { Task } from "../models/Task.js";
import { User } from "../models/User.js";
import { ApiError } from "../utils/ApiError.js";
import { assertOwnedCarePlanAndDocument } from "./ownership.service.js";
import { mapSourceReferenceFromApi } from "../utils/sourceReferences.js";
import { parseDateOnly, startOfUtcDay, endOfUtcDay } from "../utils/dateQuery.js";

const FREQUENCY_ONLY_PATTERN =
  /\b(twice daily|bd|b\.d\.|three times daily|tid|every\s+\d+\s+hours?)\b/i;

function buildTaskFingerprint({ carePlanId, category, title, scheduledDate, scheduledTime }) {
  const raw = [
    carePlanId,
    category,
    title.trim().toLowerCase(),
    scheduledDate ? new Date(scheduledDate).toISOString().slice(0, 10) : "",
    scheduledTime || "",
  ].join("|");

  return createHash("sha256").update(raw).digest("hex");
}

function mapTask(task) {
  return {
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
    isSourceDerived: task.isSourceDerived,
    createdAt: task.createdAt,
    updatedAt: task.updatedAt,
  };
}

export function createTaskService() {
  async function listTasks(userId, query) {
    const page = query.page || 1;
    const limit = Math.min(query.limit || 20, 100);
    const skip = (page - 1) * limit;
    const filter = { userId };

    if (query.status) {
      filter.status = query.status;
    }

    if (query.category) {
      filter.category = query.category;
    }

    if (query.carePlanId) {
      if (!mongoose.Types.ObjectId.isValid(query.carePlanId)) {
        throw new ApiError(400, "VALIDATION_ERROR", "Invalid carePlanId.");
      }
      filter.carePlanId = query.carePlanId;
    }

    if (query.date) {
      const day = parseDateOnly(query.date);

      if (!day) {
        throw new ApiError(400, "VALIDATION_ERROR", "Invalid date filter.");
      }

      filter.scheduledDate = {
        $gte: startOfUtcDay(day),
        $lte: endOfUtcDay(day),
      };
    } else if (query.from || query.to) {
      const from = query.from ? parseDateOnly(query.from) : null;
      const to = query.to ? parseDateOnly(query.to) : null;

      if ((query.from && !from) || (query.to && !to)) {
        throw new ApiError(400, "VALIDATION_ERROR", "Invalid date range filter.");
      }

      filter.scheduledDate = {};

      if (from) {
        filter.scheduledDate.$gte = startOfUtcDay(from);
      }

      if (to) {
        filter.scheduledDate.$lte = endOfUtcDay(to);
      }
    }

    const [items, total] = await Promise.all([
      Task.find(filter).sort({ scheduledDate: 1, createdAt: -1 }).skip(skip).limit(limit),
      Task.countDocuments(filter),
    ]);

    return {
      items: items.map(mapTask),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }

  async function createTask(userId, payload) {
    await assertOwnedCarePlanAndDocument(userId, {
      carePlanId: payload.carePlanId,
      documentId: payload.documentId,
    });

    if (
      payload.category === "medication" &&
      payload.scheduledTime &&
      FREQUENCY_ONLY_PATTERN.test(payload.description || payload.title)
    ) {
      throw new ApiError(
        422,
        "UNSUPPORTED_SCHEDULE_INFERENCE",
        "Exact medicine times cannot be inferred from frequency alone."
      );
    }

    const sourceFingerprint =
      payload.sourceFingerprint ||
      (payload.isSourceDerived
        ? buildTaskFingerprint({
            carePlanId: payload.carePlanId,
            category: payload.category,
            title: payload.title,
            scheduledDate: payload.scheduledDate,
            scheduledTime: payload.scheduledTime,
          })
        : null);

    if (sourceFingerprint) {
      const duplicate = await Task.findOne({
        carePlanId: payload.carePlanId,
        sourceFingerprint,
      });

      if (duplicate) {
        throw new ApiError(409, "DUPLICATE_TASK", "A matching source-derived task already exists.");
      }
    }

    const task = await Task.create({
      userId,
      carePlanId: payload.carePlanId,
      documentId: payload.documentId,
      title: payload.title,
      description: payload.description || "",
      category: payload.category,
      scheduledDate: payload.scheduledDate || null,
      scheduledTime: payload.scheduledTime || null,
      timezone: payload.timezone,
      status: payload.status || "pending",
      sourceReferences: (payload.sourceReferences || []).map(mapSourceReferenceFromApi),
      isSourceDerived: Boolean(payload.isSourceDerived),
      sourceFingerprint,
    });

    return mapTask(task);
  }

  async function getTask(userId, taskId) {
    if (!mongoose.Types.ObjectId.isValid(taskId)) {
      throw new ApiError(404, "NOT_FOUND", "Task not found.");
    }

    const task = await Task.findOne({ _id: taskId, userId });

    if (!task) {
      throw new ApiError(404, "NOT_FOUND", "Task not found.");
    }

    return mapTask(task);
  }

  async function updateTask(userId, taskId, updates) {
    const task = await Task.findOne({ _id: taskId, userId });

    if (!task) {
      throw new ApiError(404, "NOT_FOUND", "Task not found.");
    }

    if (updates.title !== undefined) {
      task.title = updates.title;
    }

    if (updates.description !== undefined) {
      task.description = updates.description;
    }

    if (updates.scheduledDate !== undefined) {
      task.scheduledDate = updates.scheduledDate;
    }

    if (updates.scheduledTime !== undefined) {
      task.scheduledTime = updates.scheduledTime || null;
    }

    if (updates.timezone !== undefined) {
      task.timezone = updates.timezone;
    }

    if (updates.status !== undefined) {
      task.status = updates.status;
    }

    await task.save();
    return mapTask(task);
  }

  async function deleteTask(userId, taskId) {
    const task = await Task.findOneAndDelete({ _id: taskId, userId });

    if (!task) {
      throw new ApiError(404, "NOT_FOUND", "Task not found.");
    }

    return { id: task._id.toString(), deleted: true };
  }

  async function getUserTimezone(userId) {
    const user = await User.findById(userId).select("timezone");
    return user?.timezone || "Asia/Kolkata";
  }

  return {
    listTasks,
    createTask,
    getTask,
    updateTask,
    deleteTask,
    getUserTimezone,
  };
}
