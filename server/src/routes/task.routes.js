import { Router } from "express";
import { authenticate } from "../middleware/authenticate.js";
import { validateBody, validateQuery } from "../middleware/validate.js";
import {
  createTaskSchema,
  updateTaskSchema,
  listTasksQuerySchema,
} from "../validators/task.validator.js";
import {
  listTasks,
  createTask,
  getTask,
  patchTask,
  deleteTask,
} from "../controllers/task.controller.js";

const router = Router();

router.use(authenticate);
router.get("/", validateQuery(listTasksQuerySchema), listTasks);
router.post("/", validateBody(createTaskSchema), createTask);
router.get("/:taskId", getTask);
router.patch("/:taskId", validateBody(updateTaskSchema), patchTask);
router.delete("/:taskId", deleteTask);

export default router;
