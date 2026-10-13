import { ApiError } from "../utils/ApiError.js";

function isApiError(error) {
  return error instanceof ApiError;
}

export function notFoundHandler(req, res) {
  res.status(404).json({
    success: false,
    error: {
      code: "NOT_FOUND",
      message: "The requested resource was not found.",
      details: [],
    },
    requestId: req.requestId,
  });
}

export function errorHandler(err, req, res, _next) {
  const requestId = req.requestId;

  if (isApiError(err)) {
    return res.status(err.statusCode).json({
      success: false,
      error: {
        code: err.code,
        message: err.message,
        details: err.details,
      },
      requestId,
    });
  }

  if (err?.type === "entity.parse.failed") {
    return res.status(400).json({
      success: false,
      error: {
        code: "INVALID_JSON",
        message: "The request body contains invalid JSON.",
        details: [],
      },
      requestId,
    });
  }

  if (process.env.NODE_ENV !== "production") {
    console.error(`[${requestId}]`, err.message);
  } else {
    console.error(`[${requestId}] Unexpected server error.`);
  }

  return res.status(500).json({
    success: false,
    error: {
      code: "INTERNAL_SERVER_ERROR",
      message: "An unexpected error occurred.",
      details: [],
    },
    requestId,
  });
}
