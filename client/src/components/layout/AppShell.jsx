import { LanguageSelector } from "./LanguageSelector.jsx";
import { useTranslation } from "../../i18n/LanguageProvider.jsx";

export function AppShell({ children }) {
  return (
    <div className="min-h-screen bg-[#f6f8f7] text-slate-900">
      {children}
    </div>
  );
}

export function AppHeader() {
  const { t } = useTranslation();

  return (
    <header className="border-b border-slate-200/80 bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3">
          <div
            className="flex h-11 w-11 items-center justify-center rounded-2xl bg-teal-700 text-xl font-bold text-white"
            aria-hidden
          >
            DC
          </div>
          <div>
            <p className="text-lg font-bold tracking-tight">{t("app.name")}</p>
            <p className="text-sm text-slate-600">{t("app.tagline")}</p>
          </div>
        </div>
        <LanguageSelector />
      </div>
    </header>
  );
}

export function AppFooter() {
  const { t } = useTranslation();

  return (
    <footer className="mt-12 border-t border-slate-200 bg-white">
      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
        <p className="text-xs leading-5 text-slate-500">{t("app.footer")}</p>
      </div>
    </footer>
  );
}
