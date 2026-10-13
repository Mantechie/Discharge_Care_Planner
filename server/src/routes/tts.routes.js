import { Router } from "express";
import { authenticate } from "../middleware/authenticate.js";
import { validateBody } from "../middleware/validate.js";
import { ttsSpeakSchema } from "../validators/tts.validator.js";
import { postTtsSpeak } from "../controllers/tts.controller.js";
import { createChatRateLimiter } from "../middleware/rateLimiter.js";

export function createTtsRouter(config) {
  const router = Router();
  const limiter = createChatRateLimiter({
    ...config,
    chatRateLimitMax: config.ttsRateLimitMax || 20,
  });

  router.use(authenticate);
  router.post("/speak", limiter, validateBody(ttsSpeakSchema), postTtsSpeak);

  return router;
}
