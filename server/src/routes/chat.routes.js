import { Router } from "express";
import { authenticate } from "../middleware/authenticate.js";
import { validateBody, validateQuery } from "../middleware/validate.js";
import { createChatRateLimiter } from "../middleware/rateLimiter.js";
import {
  createChatMessageSchema,
  chatHistoryQuerySchema,
} from "../validators/chat.validator.js";
import {
  postChatMessage,
  getChatHistory,
  deleteChatHistory,
} from "../controllers/chat.controller.js";

export function createChatRouter(config) {
  const router = Router();
  const chatRateLimiter = createChatRateLimiter(config);
  const maxMessageLength = config.chatMaxMessageLength || 2000;
  const chatMessageSchema = createChatMessageSchema(maxMessageLength);

  router.use(authenticate);
  router.post(
    "/",
    chatRateLimiter,
    validateBody(chatMessageSchema),
    postChatMessage
  );
  router.get("/history", validateQuery(chatHistoryQuerySchema), getChatHistory);
  router.delete(
    "/history",
    validateQuery(chatHistoryQuerySchema),
    deleteChatHistory
  );

  return router;
}
