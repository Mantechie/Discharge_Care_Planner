import { Router } from "express";
import { authenticate } from "../middleware/authenticate.js";
import { createUploadMiddleware } from "../middleware/upload.middleware.js";
import { createUploadRateLimiter } from "../middleware/rateLimiter.js";
import {
  uploadDocument,
  listDocuments,
  getDocument,
  getDocumentStatus,
  getDocumentSource,
  downloadDocumentFile,
  reprocessDocument,
  deleteDocument,
} from "../controllers/document.controller.js";

const router = Router();

router.use(authenticate);

router.get("/", listDocuments);
router.post("/", (req, res, next) => {
  const config = req.app.get("config");
  const uploadLimiter = createUploadRateLimiter(config);
  const upload = createUploadMiddleware(config);

  uploadLimiter(req, res, (limitError) => {
    if (limitError) {
      return next(limitError);
    }

    upload(req, res, (uploadError) => {
      if (uploadError) {
        return next(uploadError);
      }

      uploadDocument(req, res, next);
    });
  });
});

router.get("/:documentId/status", getDocumentStatus);
router.get("/:documentId/source", getDocumentSource);
router.get("/:documentId/file", downloadDocumentFile);
router.post("/:documentId/reprocess", reprocessDocument);
router.get("/:documentId", getDocument);
router.delete("/:documentId", deleteDocument);

export default router;
