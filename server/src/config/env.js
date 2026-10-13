import dotenv from "dotenv";

dotenv.config();

const PLACEHOLDER_JWT = "replace_with_a_long_random_secret";

function parsePositiveInt(value, fallback) {
  const parsed = Number.parseInt(value ?? "", 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

export function loadEnv() {
  const nodeEnv = process.env.NODE_ENV || "development";
  const isProduction = nodeEnv === "production";

  const config = {
    nodeEnv,
    isProduction,
    port: parsePositiveInt(process.env.PORT, 5000),
    clientUrl: process.env.CLIENT_URL || "http://localhost:5173",
    apiPrefix: process.env.API_PREFIX || "/api/v1",
    mongodbUri: process.env.MONGODB_URI?.trim() || "",
    jwtSecret: process.env.JWT_SECRET?.trim() || "",
    jwtExpiresIn: process.env.JWT_EXPIRES_IN || "15m",
    jwtIssuer: process.env.JWT_ISSUER || "dischargecare-api",
    jwtAudience: process.env.JWT_AUDIENCE || "dischargecare-client",
    refreshTokenExpiresInDays: parsePositiveInt(
      process.env.REFRESH_TOKEN_EXPIRES_IN_DAYS,
      7
    ),
    aiProvider: process.env.AI_PROVIDER || "mock",
    uploadDir: process.env.UPLOAD_DIR || "./storage",
    maxFileSizeMb: parsePositiveInt(process.env.MAX_FILE_SIZE_MB, 10),
    jsonBodyLimit: process.env.JSON_BODY_LIMIT || "1mb",
    rateLimitWindowMs: parsePositiveInt(process.env.RATE_LIMIT_WINDOW_MS, 60000),
    rateLimitMaxRequests: parsePositiveInt(
      process.env.RATE_LIMIT_MAX_REQUESTS,
      60
    ),
    defaultLanguage: process.env.DEFAULT_LANGUAGE || "en",
    defaultReminderTime: process.env.DEFAULT_REMINDER_TIME || "06:00",
  };

  const errors = [];

  if (!config.mongodbUri) {
    errors.push("MONGODB_URI is required.");
  }

  if (!config.jwtSecret) {
    if (isProduction) {
      errors.push(
        "JWT_SECRET must be set to a strong random value in production."
      );
    } else {
      config.jwtSecret =
        "development-only-jwt-secret-change-before-production";
    }
  } else if (isProduction && config.jwtSecret === PLACEHOLDER_JWT) {
    errors.push(
      "JWT_SECRET must be set to a strong random value in production."
    );
  }

  if (errors.length > 0) {
    const message = `Configuration error:\n${errors.map((e) => `- ${e}`).join("\n")}`;
    throw new Error(message);
  }

  return config;
}

export function getCorsOrigins(clientUrl) {
  return clientUrl
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);
}
