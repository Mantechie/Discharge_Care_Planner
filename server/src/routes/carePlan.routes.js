import { Router } from "express";
import { authenticate } from "../middleware/authenticate.js";
import { validateBody, validateQuery } from "../middleware/validate.js";
import {
  carePlanListQuerySchema,
  carePlanPatchSchema,
  carePlanReviewSchema,
  clarificationResolveSchema,
} from "../validators/carePlan.validator.js";
import {
  listCarePlans,
  getCarePlan,
  patchCarePlan,
  reviewCarePlan,
  getCarePlanClarifications,
  resolveCarePlanClarification,
} from "../controllers/carePlan.controller.js";

const router = Router();

router.use(authenticate);
router.get("/", validateQuery(carePlanListQuerySchema), listCarePlans);
router.get("/:carePlanId/clarifications", getCarePlanClarifications);
router.patch(
  "/:carePlanId/clarifications/:clarificationId",
  validateBody(clarificationResolveSchema),
  resolveCarePlanClarification
);
router.post(
  "/:carePlanId/review",
  validateBody(carePlanReviewSchema),
  reviewCarePlan
);
router.patch(
  "/:carePlanId",
  validateBody(carePlanPatchSchema),
  patchCarePlan
);
router.get("/:carePlanId", getCarePlan);

export default router;
