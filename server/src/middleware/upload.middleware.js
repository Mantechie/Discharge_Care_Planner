import multer from "multer";
import path from "node:path";
import { randomBytes } from "node:crypto";
import fs from "node:fs";
import { ApiError } from "../utils/ApiError.js";
import {
  detectFileKind,
  mimeTypeForKind,
} from "../utils/fileValidation.js";
import { createStorageService } from "../services/storage.service.js";

function createTempStorage(tempDir) {
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
  }

  return multer.diskStorage({
    destination: (_req, _file, cb) => {
      cb(null, tempDir);
    },
    filename: (_req, _file, cb) => {
      cb(null, `${randomBytes(16).toString("hex")}.upload`);
    },
  });
}

export function createUploadMiddleware(config) {
  const storage = createStorageService(config);
  const maxBytes = config.maxFileSizeMb * 1024 * 1024;

  const upload = multer({
    storage: createTempStorage(storage.getTempDir()),
    limits: {
      files: config.maxFilesPerRequest,
      fileSize: maxBytes,
    },
  }).single("file");

  return function documentUpload(req, res, next) {
    upload(req, res, async (error) => {
      if (error instanceof multer.MulterError) {
        if (error.code === "LIMIT_FILE_SIZE") {
          return next(
            new ApiError(413, "FILE_TOO_LARGE", "Uploaded file exceeds the size limit.")
          );
        }

        if (error.code === "LIMIT_FILE_COUNT" || error.code === "LIMIT_UNEXPECTED_FILE") {
          return next(
            new ApiError(400, "INVALID_UPLOAD", "Only one file may be uploaded per request.")
          );
        }

        return next(
          new ApiError(400, "INVALID_UPLOAD", "The upload could not be processed.")
        );
      }

      if (error) {
        return next(error);
      }

      if (!req.file) {
        return next(new ApiError(400, "FILE_REQUIRED", "A file upload is required."));
      }

      if (req.file.size === 0) {
        await safeUnlink(req.file.path);
        return next(new ApiError(400, "EMPTY_FILE", "Uploaded file is empty."));
      }

      try {
        const buffer = await fs.promises.readFile(req.file.path);
        const detectedKind = detectFileKind(buffer, {
          enableWebp: config.enableWebpUploads,
        });

        if (!detectedKind) {
          await safeUnlink(req.file.path);
          return next(
            new ApiError(415, "UNSUPPORTED_MEDIA_TYPE", "Unsupported file type.")
          );
        }

        const expectedMime = mimeTypeForKind(detectedKind);

        req.uploadValidation = {
          detectedKind,
          mimeType: expectedMime,
          buffer,
        };
      } catch (validationError) {
        await safeUnlink(req.file.path);
        return next(validationError);
      }

      next();
    });
  };
}

async function safeUnlink(filePath) {
  try {
    await fs.promises.unlink(filePath);
  } catch {
    // ignore cleanup errors
  }
}
