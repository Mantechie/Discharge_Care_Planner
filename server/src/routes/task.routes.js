import { Router } from "express";
import { authenticate } from "../middleware/authenticate.js";
import { getTask, createTask } from "../controllers/resource.controller.js";

const router = Router();

router.use(authenticate);
router.post("/", createTask);
router.get("/:taskId", getTask);

export default router;
