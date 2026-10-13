import { Router } from "express";

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

export default router;
