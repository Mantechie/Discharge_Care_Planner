import { asyncHandler } from "../utils/asyncHandler.js";
import { createTaskService } from "../services/task.service.js";

const taskService = createTaskService();

export const listTasks = asyncHandler(async (req, res) => {
  const data = await taskService.listTasks(
    req.user.id,
    req.validatedQuery || req.query
  );

  res.json({
    success: true,
    data,
  });
});

export const createTask = asyncHandler(async (req, res) => {
  const task = await taskService.createTask(req.user.id, req.body);

  res.status(201).json({
    success: true,
    data: task,
    message: "Task created successfully.",
  });
});

export const getTask = asyncHandler(async (req, res) => {
  const task = await taskService.getTask(req.user.id, req.params.taskId);

  res.json({
    success: true,
    data: task,
  });
});

export const patchTask = asyncHandler(async (req, res) => {
  const task = await taskService.updateTask(
    req.user.id,
    req.params.taskId,
    req.body
  );

  res.json({
    success: true,
    data: task,
    message: "Task updated successfully.",
  });
});

export const deleteTask = asyncHandler(async (req, res) => {
  const result = await taskService.deleteTask(req.user.id, req.params.taskId);

  res.json({
    success: true,
    data: result,
    message: "Task deleted successfully.",
  });
});
