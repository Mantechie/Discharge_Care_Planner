import { Router } from "express";
import { getDatabaseConnectionState } from "../config/database.js";

const router = Router();

router.get("/health", (_req, res) => {
  res.json({
    success: true,
    data: {
      status: "healthy",
      service: "dischargecare-api",
    },
  });
});

router.get("/health/ready", (_req, res) => {
  const mongodbState = getDatabaseConnectionState();
  const mongodbConnected = mongodbState === 1;

  if (!mongodbConnected) {
    return res.status(503).json({
      success: false,
      data: {
        status: "not_ready",
        service: "dischargecare-api",
        checks: {
          mongodb: "disconnected",
        },
      },
      requestId: _req.requestId,
    });
  }

  res.json({
    success: true,
    data: {
      status: "ready",
      service: "dischargecare-api",
      checks: {
        mongodb: "connected",
      },
    },
  });
});

export default router;
