import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { createTranslator } from "./translate.js";
import { setRuntimeTranslator } from "./runtimeTranslator.js";
import {
  readStoredLanguage,
  writeStoredLanguage,
  isSupportedLocale,
} from "./languagePreference.js";

const LanguageContext = createContext(null);

export function LanguageProvider({ children }) {
  const [locale, setLocaleState] = useState(() => readStoredLanguage());

  const setLocale = useCallback((next) => {
    const value = isSupportedLocale(next) ? next : "en";
    setLocaleState(value);
    writeStoredLanguage(value);
  }, []);

  const t = useMemo(() => createTranslator(locale), [locale]);

  useEffect(() => {
    setRuntimeTranslator(t);
  }, [t]);

  const value = useMemo(
    () => ({ locale, setLocale, t }),
    [locale, setLocale, t]
  );

  return (
    <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>
  );
}

export function useTranslation() {
  const ctx = useContext(LanguageContext);
  if (!ctx) {
    throw new Error("useTranslation must be used within LanguageProvider");
  }
  return ctx;
}
