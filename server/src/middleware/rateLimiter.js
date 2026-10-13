import rateLimit from "express-rate-limit";

export function createAuthRateLimiter(config) {
  return rateLimit({
    windowMs: config.rateLimitWindowMs,
    max: Math.min(config.rateLimitMaxRequests, 20),
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
