import { useTranslation } from "../../i18n/LanguageProvider.jsx";

export function LanguageSelector() {
  const { locale, setLocale, t } = useTranslation();

  return (
    <div className="flex items-center gap-2">
      <span className="sr-only" id="app-language-label">
        {t("app.language.label")}
      </span>
      <div
        className="inline-flex rounded-full border border-slate-200 bg-slate-50 p-0.5"
        role="group"
        aria-labelledby="app-language-label"
      >
        <button
          type="button"
          className={`rounded-full px-3 py-1 text-xs font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600 ${
            locale === "en"
              ? "bg-white text-teal-900 shadow-sm"
              : "text-slate-600 hover:text-slate-900"
          }`}
          aria-pressed={locale === "en"}
          onClick={() => setLocale("en")}
        >
          {t("app.language.en")}
        </button>
        <button
          type="button"
          className={`rounded-full px-3 py-1 text-xs font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600 ${
            locale === "hi"
              ? "bg-white text-teal-900 shadow-sm"
              : "text-slate-600 hover:text-slate-900"
          }`}
          aria-pressed={locale === "hi"}
          onClick={() => setLocale("hi")}
        >
          {t("app.language.hi")}
        </button>
      </div>
    </div>
  );
}
