import { Router } from "express";
import { authenticate } from "../middleware/authenticate.js";
import { getCarePlan } from "../controllers/resource.controller.js";

const router = Router();

router.use(authenticate);
router.get("/:carePlanId", getCarePlan);

export default router;
