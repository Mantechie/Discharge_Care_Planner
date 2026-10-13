import { Router } from "express";
import { authenticate } from "../middleware/authenticate.js";
import { getChatHistory } from "../controllers/resource.controller.js";

const router = Router();

router.use(authenticate);
router.get("/history", getChatHistory);

export default router;
