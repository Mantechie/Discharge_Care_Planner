const SUPPORTED = new Set(["en", "hi"]);

/** UI language only — kept in React state for the session (no localStorage). */
let sessionLanguage = "en";

export function readStoredLanguage() {
  return sessionLanguage;
}

export function writeStoredLanguage(locale) {
  if (SUPPORTED.has(locale)) {
    sessionLanguage = locale;
  }
}

export function isSupportedLocale(locale) {
  return SUPPORTED.has(locale);
}

/** @internal tests */
export function resetSessionLanguage() {
  sessionLanguage = "en";
}
