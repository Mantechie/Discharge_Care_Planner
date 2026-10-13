import { Router } from "express";
import { authenticate } from "../middleware/authenticate.js";
import { getFollowUp, createFollowUp } from "../controllers/resource.controller.js";

const router = Router();

router.use(authenticate);
router.post("/", createFollowUp);
router.get("/:followUpId", getFollowUp);

export default router;
