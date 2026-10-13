import path from "node:path";
import { fileURLToPath } from "node:url";
import fs from "node:fs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const testStorageRoot = path.join(__dirname, "..", ".tmp-storage");

export function getTestAppConfig() {
  fs.mkdirSync(testStorageRoot, { recursive: true });

  return {
    clientUrl: "http://localhost:5173",
    apiPrefix: "/api/v1",
    jsonBodyLimit: "1mb",
    jwtSecret: "test-jwt-secret-with-sufficient-length-value",
    jwtExpiresIn: "15m",
    jwtIssuer: "dischargecare-api",
    jwtAudience: "dischargecare-client",
    refreshTokenExpiresInDays: 7,
    isProduction: false,
    rateLimitWindowMs: 60000,
    rateLimitMaxRequests: 200,
    disableAuthRateLimit: true,
    disableUploadRateLimit: true,
    uploadDir: testStorageRoot,
    maxFileSizeMb: 10,
    maxFilesPerRequest: 1,
    ocrProvider: "mock",
    allowTestOcrMock: true,
    ocrLanguages: "eng",
    minReadableTextChars: 10,
    processingTimeoutMs: 60000,
    enableWebpUploads: true,
    aiProvider: "mock",
    allowTestExtractionFixture: true,
    aiTimeoutMs: 45000,
    aiMaxRetries: 1,
    aiRetryDelayMs: 100,
    aiMaxInputChars: 120000,
    aiMaxPages: 40,
    defaultLanguage: "en",
    disableChatRateLimit: true,
    disableExtractionRateLimit: true,
    allowTestChatFixture: true,
    chatMaxMessageLength: 2000,
  };
}
