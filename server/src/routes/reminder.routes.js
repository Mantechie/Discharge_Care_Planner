import { Router } from "express";
import { authenticate } from "../middleware/authenticate.js";
import {
  getReminderSettings,
  updateReminderSettings,
} from "../controllers/resource.controller.js";

const router = Router();

router.use(authenticate);
router.get("/settings", getReminderSettings);
router.put("/settings", updateReminderSettings);

export default router;
