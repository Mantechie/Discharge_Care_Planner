import {
  registerUser,
  loginUser,
  refreshAuthSession,
  logoutUser,
  buildAuthResponse,
  getUserById,
} from "../services/auth.service.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { setAuthCookies, clearAuthCookies, getRefreshCookieName } from "../utils/cookies.js";
import { toPublicUser } from "../utils/userProfile.js";

export const register = asyncHandler(async (req, res) => {
  const config = req.app.get("config");
  const session = await registerUser(req.body, config);
  setAuthCookies(res, session, config);

  res.status(201).json({
    success: true,
    data: buildAuthResponse(session.user, config),
    message: "Registration completed successfully.",
  });
});

export const login = asyncHandler(async (req, res) => {
  const config = req.app.get("config");
  const session = await loginUser(req.body, config);
  setAuthCookies(res, session, config);

  res.json({
    success: true,
    data: buildAuthResponse(session.user, config),
    message: "Login completed successfully.",
  });
});

export const refresh = asyncHandler(async (req, res) => {
  const config = req.app.get("config");
  const refreshToken = req.cookies?.[getRefreshCookieName()];

  if (!refreshToken) {
    return res.status(401).json({
      success: false,
      error: {
        code: "UNAUTHORIZED",
        message: "Authentication required.",
        details: [],
      },
      requestId: req.requestId,
    });
  }

  const session = await refreshAuthSession(refreshToken, config);
  setAuthCookies(res, session, config);

  res.json({
    success: true,
    data: buildAuthResponse(session.user, config),
    message: "Session refreshed successfully.",
  });
});

export const logout = asyncHandler(async (req, res) => {
  const config = req.app.get("config");
  const refreshToken = req.cookies?.[getRefreshCookieName()];
  await logoutUser(refreshToken);
  clearAuthCookies(res, config);

  res.json({
    success: true,
    data: {},
    message: "Logout completed successfully.",
  });
});

export const me = asyncHandler(async (req, res) => {
  const user = await getUserById(req.user.id);

  res.json({
    success: true,
    data: toPublicUser(user),
  });
});
