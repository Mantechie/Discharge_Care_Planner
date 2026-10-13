import { Router } from "express";
import { authenticate } from "../middleware/authenticate.js";
import { listDocuments, getDocument } from "../controllers/resource.controller.js";

const router = Router();

router.use(authenticate);
router.get("/", listDocuments);
router.get("/:documentId", getDocument);

export default router;
