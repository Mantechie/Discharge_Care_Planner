import rateLimit from "express-rate-limit";

export function createUploadRateLimiter(config) {
  if (config.disableUploadRateLimit) {
    return (_req, _res, next) => next();
  }

  const maxRequests =
    config.uploadRateLimitMax ??
    Math.min(config.rateLimitMaxRequests, 10);

  return rateLimit({
    windowMs: config.rateLimitWindowMs,
    max: maxRequests,
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res, _next, options) => {
      res.status(429).json({
        success: false,
        error: {
          code: "RATE_LIMIT_EXCEEDED",
          message: "Too many upload requests. Please try again later.",
          details: [],
        },
        requestId: req.requestId,
      });
    },
  });
}

export function createAuthRateLimiter(config) {
  if (config.disableAuthRateLimit) {
    return (_req, _res, next) => next();
  }

  const maxRequests =
    config.authRateLimitMax ??
    Math.min(config.rateLimitMaxRequests, 20);

  return rateLimit({
    windowMs: config.rateLimitWindowMs,
    max: maxRequests,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
      success: false,
      error: {
        code: "RATE_LIMIT_EXCEEDED",
        message: "Too many requests. Please try again later.",
        details: [],
      },
    },
    handler: (req, res, _next, options) => {
      res.status(429).json({
        success: false,
        error: options.message.error,
        requestId: req.requestId,
      });
    },
  });
}
