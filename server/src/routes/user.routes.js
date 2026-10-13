import { Router } from "express";
import { authenticate } from "../middleware/authenticate.js";
import { validateBody } from "../middleware/validate.js";
import { updateUserPreferencesSchema } from "../validators/userPreferences.validator.js";
import { patchUserPreferences } from "../controllers/user.controller.js";

const router = Router();

router.use(authenticate);
router.patch(
  "/me/preferences",
  validateBody(updateUserPreferencesSchema),
  patchUserPreferences
);

export default router;
