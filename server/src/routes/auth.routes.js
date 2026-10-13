import { Router } from "express";
import {
  register,
  login,
  refresh,
  logout,
  me,
} from "../controllers/auth.controller.js";
import { validateBody } from "../middleware/validate.js";
import { registerSchema, loginSchema } from "../validators/auth.validator.js";
import { authenticate } from "../middleware/authenticate.js";
import { requireCsrfToken } from "../middleware/csrf.js";

const router = Router();

router.post("/register", validateBody(registerSchema), register);
router.post("/login", validateBody(loginSchema), login);
router.post("/refresh", requireCsrfToken, refresh);
router.post("/logout", requireCsrfToken, logout);
router.get("/me", authenticate, me);

export default router;
