export function getTestAppConfig() {
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
  };
}
