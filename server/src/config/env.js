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
    aiProvider: (process.env.AI_PROVIDER || "mock").toLowerCase(),
    aiApiKey: process.env.AI_API_KEY?.trim() || process.env.GEMINI_API_KEY?.trim() || "",
    aiModel: process.env.AI_MODEL?.trim() || process.env.GEMINI_MODEL?.trim() || "",
    aiTimeoutMs: parsePositiveInt(process.env.AI_TIMEOUT_MS, 45000),
    aiMaxRetries: parsePositiveInt(process.env.AI_MAX_RETRIES, 2),
    aiRetryDelayMs: parsePositiveInt(process.env.AI_RETRY_DELAY_MS, 1000),
    aiMaxInputChars: parsePositiveInt(process.env.AI_MAX_INPUT_CHARS, 120000),
    aiMaxPages: parsePositiveInt(process.env.AI_MAX_PAGES, 40),
    allowTestExtractionFixture:
      (process.env.ALLOW_TEST_EXTRACTION_FIXTURE || "").toLowerCase() === "true",
    uploadDir: process.env.UPLOAD_DIR || "./storage",
    maxFileSizeMb: parsePositiveInt(process.env.MAX_FILE_SIZE_MB, 10),
    jsonBodyLimit: process.env.JSON_BODY_LIMIT || "1mb",
    rateLimitWindowMs: parsePositiveInt(process.env.RATE_LIMIT_WINDOW_MS, 60000),
    rateLimitMaxRequests: parsePositiveInt(
      process.env.RATE_LIMIT_MAX_REQUESTS,
      60
    ),
    authRateLimitMax: parsePositiveInt(process.env.AUTH_RATE_LIMIT_MAX, 20),
    uploadRateLimitMax: parsePositiveInt(process.env.UPLOAD_RATE_LIMIT_MAX, 10),
    maxFilesPerRequest: parsePositiveInt(process.env.MAX_FILES_PER_REQUEST, 1),
    ocrProvider: (process.env.OCR_PROVIDER || "none").toLowerCase(),
    ocrLanguages: process.env.OCR_LANGUAGES || "eng+hin",
    processingTimeoutMs: parsePositiveInt(
      process.env.PROCESSING_TIMEOUT_MS,
      120000
    ),
    minReadableTextChars: parsePositiveInt(
      process.env.MIN_READABLE_TEXT_CHARS,
      40
    ),
    enableWebpUploads:
      (process.env.ENABLE_WEBP_UPLOADS || "true").toLowerCase() === "true",
    defaultLanguage: process.env.DEFAULT_LANGUAGE || "en",
    defaultReminderTime: process.env.DEFAULT_REMINDER_TIME || "06:00",
    chatMaxMessageLength: parsePositiveInt(process.env.CHAT_MAX_MESSAGE_LENGTH, 2000),
    chatMaxRetrievalChars: parsePositiveInt(
      process.env.CHAT_MAX_RETRIEVAL_CHARS,
      12000
    ),
    chatMaxPassages: parsePositiveInt(process.env.CHAT_MAX_PASSAGES, 8),
    chatMaxHistoryMessages: parsePositiveInt(
      process.env.CHAT_MAX_HISTORY_MESSAGES,
      200
    ),
    chatRateLimitMax: parsePositiveInt(process.env.CHAT_RATE_LIMIT_MAX, 30),
    extractionRateLimitMax: parsePositiveInt(
      process.env.EXTRACTION_RATE_LIMIT_MAX,
      10
    ),
    disableExtractionRateLimit: false,
    allowTestChatFixture:
      (process.env.ALLOW_TEST_CHAT_FIXTURE || "").toLowerCase() === "true",
    emergencyContactNumber: process.env.EMERGENCY_CONTACT_NUMBER?.trim() || "",
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

  if (isProduction) {
    if (config.aiProvider === "mock") {
      errors.push("AI_PROVIDER cannot be mock in production.");
    }

    if (config.allowTestExtractionFixture) {
      errors.push("ALLOW_TEST_EXTRACTION_FIXTURE must be false in production.");
    }

    if (config.allowTestChatFixture) {
      errors.push("ALLOW_TEST_CHAT_FIXTURE must be false in production.");
    }

    if (!config.aiApiKey && config.aiProvider === "gemini") {
      errors.push("AI_API_KEY is required when AI_PROVIDER=gemini in production.");
    }
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
