import { Router } from "express";
import { authenticate } from "../middleware/authenticate.js";
import { validateBody, validateQuery } from "../middleware/validate.js";
import {
  createFollowUpSchema,
  updateFollowUpSchema,
  listFollowUpsQuerySchema,
} from "../validators/followUp.validator.js";
import {
  listFollowUps,
  createFollowUp,
  getFollowUp,
  patchFollowUp,
  deleteFollowUp,
} from "../controllers/followUp.controller.js";

const router = Router();

router.use(authenticate);
router.get("/", validateQuery(listFollowUpsQuerySchema), listFollowUps);
router.post("/", validateBody(createFollowUpSchema), createFollowUp);
router.get("/:followUpId", getFollowUp);
router.patch("/:followUpId", validateBody(updateFollowUpSchema), patchFollowUp);
router.delete("/:followUpId", deleteFollowUp);

export default router;
