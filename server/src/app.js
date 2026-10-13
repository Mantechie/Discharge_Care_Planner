import express from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import { getCorsOrigins } from "./config/env.js";
import healthRoutes from "./routes/health.routes.js";
import authRoutes from "./routes/auth.routes.js";
import documentRoutes from "./routes/document.routes.js";
import carePlanRoutes from "./routes/carePlan.routes.js";
import taskRoutes from "./routes/task.routes.js";
import followUpRoutes from "./routes/followUp.routes.js";
import reminderRoutes from "./routes/reminder.routes.js";
import chatRoutes from "./routes/chat.routes.js";
import {
  errorHandler,
  notFoundHandler,
} from "./middleware/errorHandler.js";
import {
  requestContext,
  safeRequestLogger,
} from "./middleware/requestContext.js";
import { createAuthRateLimiter } from "./middleware/rateLimiter.js";

export function createApp(config) {
  const app = express();
  const appConfig = {
    jsonBodyLimit: "1mb",
    apiPrefix: "/api/v1",
    clientUrl: "http://localhost:5173",
    rateLimitWindowMs: 60000,
    rateLimitMaxRequests: 60,
    refreshTokenExpiresInDays: 7,
    jwtExpiresIn: "15m",
    jwtIssuer: "dischargecare-api",
    jwtAudience: "dischargecare-client",
    jwtSecret: "development-only-jwt-secret-change-before-production",
    isProduction: false,
    ...config,
  };

  app.set("config", appConfig);

  app.disable("x-powered-by");

  app.use(requestContext);
  app.use(safeRequestLogger);

  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: "cross-origin" },
    })
  );

  app.use(
    cors({
      origin: getCorsOrigins(appConfig.clientUrl),
      credentials: true,
    })
  );

  app.use(cookieParser());
  app.use(express.json({ limit: appConfig.jsonBodyLimit }));

  const authRateLimiter = createAuthRateLimiter(appConfig);

  const apiRouter = express.Router();
  apiRouter.use(healthRoutes);
  apiRouter.use("/auth", authRateLimiter, authRoutes);
  apiRouter.use("/documents", documentRoutes);
  apiRouter.use("/care-plans", carePlanRoutes);
  apiRouter.use("/tasks", taskRoutes);
  apiRouter.use("/follow-ups", followUpRoutes);
  apiRouter.use("/reminders", reminderRoutes);
  apiRouter.use("/chat", chatRoutes);

  app.use(appConfig.apiPrefix, apiRouter);

  app.get("/api/health", (_req, res) => {
    res.json({
      success: true,
      message: "Backend connected",
      data: {
        status: "healthy",
        service: "dischargecare-api",
      },
    });
  });

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
