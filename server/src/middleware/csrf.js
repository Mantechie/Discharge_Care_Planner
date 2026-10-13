import { ApiError } from "../utils/ApiError.js";
import { getCsrfCookieName } from "../utils/cookies.js";

export function requireCsrfToken(req, _res, next) {
  const cookieToken = req.cookies?.[getCsrfCookieName()];
  const headerToken = req.headers["x-csrf-token"];

  if (!cookieToken && !headerToken) {
    return next();
  }

  if (
    !cookieToken ||
    !headerToken ||
    typeof cookieToken !== "string" ||
    typeof headerToken !== "string" ||
    cookieToken !== headerToken
  ) {
    return next(new ApiError(403, "CSRF_VALIDATION_FAILED", "Request denied."));
  }

  next();
}
