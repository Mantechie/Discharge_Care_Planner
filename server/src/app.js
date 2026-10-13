import express from "express";
import cors from "cors";
import helmet from "helmet";
import { getCorsOrigins } from "./config/env.js";
import healthRoutes from "./routes/health.routes.js";
import {
  errorHandler,
  notFoundHandler,
} from "./middleware/errorHandler.js";
import {
  requestContext,
  safeRequestLogger,
} from "./middleware/requestContext.js";

export function createApp(config) {
  const app = express();

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
      origin: getCorsOrigins(config.clientUrl),
      credentials: true,
    })
  );

  app.use(express.json({ limit: config.jsonBodyLimit }));

  const apiRouter = express.Router();
  apiRouter.use(healthRoutes);
  app.use(config.apiPrefix, apiRouter);

  // Legacy path for the existing React client health check (GET /api/health).
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
