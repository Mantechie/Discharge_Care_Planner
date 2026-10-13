import { ApiError } from "../utils/ApiError.js";
import { verifyAccessToken } from "../utils/tokens.js";
import { getUserById } from "../services/auth.service.js";

function extractBearerToken(req) {
  const header = req.headers.authorization;

  if (!header || typeof header !== "string") {
    return null;
  }

  const [scheme, token] = header.split(" ");

  if (scheme !== "Bearer" || !token) {
    return null;
  }

  return token.trim();
}

export function authenticate(req, _res, next) {
  const config = req.app.get("config");
  const token = extractBearerToken(req);

  if (!token) {
    return next(new ApiError(401, "UNAUTHORIZED", "Authentication required."));
  }

  try {
    const payload = verifyAccessToken(token, {
      secret: config.jwtSecret,
      issuer: config.jwtIssuer,
      audience: config.jwtAudience,
    });

    getUserById(payload.sub)
      .then((user) => {
        req.user = {
          id: user._id.toString(),
        };
        next();
      })
      .catch(next);
  } catch {
    next(new ApiError(401, "UNAUTHORIZED", "Authentication required."));
  }
}
