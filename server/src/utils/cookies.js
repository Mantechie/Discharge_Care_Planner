const REFRESH_COOKIE = "dc_refresh_token";
const CSRF_COOKIE = "dc_csrf_token";
const AUTH_COOKIE_PATH = "/api/v1/auth";

export function getRefreshCookieName() {
  return REFRESH_COOKIE;
}

export function getCsrfCookieName() {
  return CSRF_COOKIE;
}

function cookieMaxAgeMs(days) {
  return days * 24 * 60 * 60 * 1000;
}

export function setAuthCookies(res, { refreshToken, csrfToken }, config) {
  const maxAge = cookieMaxAgeMs(config.refreshTokenExpiresInDays);
  const secure = config.isProduction;
  const sameSite = config.isProduction ? "strict" : "lax";

  res.cookie(REFRESH_COOKIE, refreshToken, {
    httpOnly: true,
    secure,
    sameSite,
    path: AUTH_COOKIE_PATH,
    maxAge,
  });

  res.cookie(CSRF_COOKIE, csrfToken, {
    httpOnly: false,
    secure,
    sameSite,
    path: AUTH_COOKIE_PATH,
    maxAge,
  });
}

export function clearAuthCookies(res, config) {
  const secure = config.isProduction;
  const sameSite = config.isProduction ? "strict" : "lax";

  res.clearCookie(REFRESH_COOKIE, {
    httpOnly: true,
    secure,
    sameSite,
    path: AUTH_COOKIE_PATH,
  });

  res.clearCookie(CSRF_COOKIE, {
    httpOnly: false,
    secure,
    sameSite,
    path: AUTH_COOKIE_PATH,
  });
}
