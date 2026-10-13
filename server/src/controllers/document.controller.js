import { asyncHandler } from "../utils/asyncHandler.js";
import { createDocumentService } from "../services/document.service.js";

function getDocumentService(req) {
  if (!req.app.locals.documentService) {
    req.app.locals.documentService = createDocumentService(req.app.get("config"));
  }

  return req.app.locals.documentService;
}

export const uploadDocument = asyncHandler(async (req, res) => {
  const service = getDocumentService(req);
  const validation = req.uploadValidation;

  const document = await service.uploadDocument({
    userId: req.user.id,
    tempFilePath: req.file.path,
    originalFilename: req.file.originalname,
    detectedKind: validation.detectedKind,
    mimeType: validation.mimeType,
    fileSize: req.file.size,
    fileBuffer: validation.buffer,
  });

  const statusCode = document.status === "processing" ? 202 : 201;

  res.status(statusCode).json({
    success: true,
    data: service.toPublicDocument(document),
    message:
      document.status === "processing"
        ? "Document uploaded and processing started."
        : "Document uploaded and text extraction completed.",
  });
});

export const listDocuments = asyncHandler(async (req, res) => {
  const service = getDocumentService(req);
  const page = Number.parseInt(req.query.page || "1", 10);
  const limit = Number.parseInt(req.query.limit || "20", 10);
  const result = await service.listDocuments(req.user.id, { page, limit });

  res.json({
    success: true,
    data: result.items,
    pagination: result.pagination,
  });
});

export const getDocument = asyncHandler(async (req, res) => {
  const service = getDocumentService(req);
  const document = await service.getOwnedDocumentRecord(
    req.user.id,
    req.params.documentId
  );

  res.json({
    success: true,
    data: service.toPublicDocument(document),
  });
});

export const getDocumentStatus = asyncHandler(async (req, res) => {
  const service = getDocumentService(req);
  const status = await service.getDocumentStatus(
    req.user.id,
    req.params.documentId
  );

  res.json({
    success: true,
    data: status,
  });
});

export const getDocumentSource = asyncHandler(async (req, res) => {
  const service = getDocumentService(req);
  const source = await service.getDocumentSource(
    req.user.id,
    req.params.documentId
  );

  res.json({
    success: true,
    data: source,
  });
});

export const downloadDocumentFile = asyncHandler(async (req, res) => {
  const service = getDocumentService(req);
  const file = await service.getDocumentFileStream(
    req.user.id,
    req.params.documentId
  );

  res.setHeader("Content-Type", file.mimeType);
  res.setHeader(
    "Content-Disposition",
    `attachment; filename="${encodeURIComponent(file.originalFilename)}"`
  );
  res.setHeader("Content-Length", String(file.fileSize));
  res.setHeader("Cache-Control", "private, no-store");

  file.stream.on("error", () => {
    if (!res.headersSent) {
      res.status(500).end();
    }
  });

  file.stream.pipe(res);
});

export const reprocessDocument = asyncHandler(async (req, res) => {
  const service = getDocumentService(req);
  const document = await service.reprocessDocument(
    req.user.id,
    req.params.documentId
  );

  res.json({
    success: true,
    data: service.toPublicDocument(document),
    message: "Document reprocessing completed.",
  });
});

export const deleteDocument = asyncHandler(async (req, res) => {
  const service = getDocumentService(req);
  const result = await service.deleteDocument(
    req.user.id,
    req.params.documentId
  );

  res.json({
    success: true,
    data: result,
    message: result.storageDeleted
      ? "Document deleted successfully."
      : "Document marked deleted, but file removal may be incomplete.",
  });
});
