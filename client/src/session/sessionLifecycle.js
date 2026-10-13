const listeners = new Set();

/**
 * Register a handler invoked when the API reports an expired/invalid session (401).
 * Returns unsubscribe function.
 */
export function onSessionExpired(handler) {
  listeners.add(handler);
  return () => listeners.delete(handler);
}

export function notifySessionExpired() {
  listeners.forEach((handler) => {
    try {
      handler();
    } catch {
      /* isolate listener failures */
    }
  });
}
