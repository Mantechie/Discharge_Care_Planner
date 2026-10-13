let accessToken = null;
const clearListeners = new Set();

export function onAccessTokenClear(listener) {
  clearListeners.add(listener);
  return () => clearListeners.delete(listener);
}

export function getAccessToken() {
  return accessToken;
}

export function setAccessToken(token) {
  accessToken = token || null;
}

export function clearAccessToken() {
  accessToken = null;
  clearListeners.forEach((listener) => {
    try {
      listener();
    } catch {
      /* ignore */
    }
  });
}
