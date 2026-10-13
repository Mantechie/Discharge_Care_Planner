import { asyncHandler } from "../utils/asyncHandler.js";
import { createChatService } from "../services/chat.service.js";

function getService(req) {
  return createChatService(req.app.get("config"));
}

export const postChatMessage = asyncHandler(async (req, res) => {
  const service = getService(req);
  const data = await service.sendMessage(req.user.id, req.body);

  res.json({
    success: true,
    data,
    message: "Chat response generated successfully.",
  });
});

export const getChatHistory = asyncHandler(async (req, res) => {
  const service = getService(req);
  const data = await service.getHistory(req.user.id, req.validatedQuery || req.query);

  res.json({
    success: true,
    data,
  });
});

export const deleteChatHistory = asyncHandler(async (req, res) => {
  const service = getService(req);
  const documentId = (req.validatedQuery || req.query).documentId;
  const result = await service.deleteHistory(req.user.id, documentId);

  res.json({
    success: true,
    data: result,
    message: "Chat history deleted successfully.",
  });
});
