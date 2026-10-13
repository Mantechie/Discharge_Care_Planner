import { asyncHandler } from "../utils/asyncHandler.js";
import { updateUserPreferences } from "../services/userPreferences.service.js";

export const patchUserPreferences = asyncHandler(async (req, res) => {
  const user = await updateUserPreferences(req.user.id, req.body);

  res.json({
    success: true,
    data: user,
    message: "Preferences updated successfully.",
  });
});
