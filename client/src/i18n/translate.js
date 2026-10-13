import { en } from "./locales/en.js";
import { hi } from "./locales/hi.js";

const catalogs = { en, hi };

/**
 * Interpolate `{name}` placeholders. Does not modify clinical source strings —
 * only UI dictionary values.
 */
export function interpolate(template, vars = {}) {
  if (!template || typeof template !== "string") {
    return template;
  }
  return template.replace(/\{(\w+)\}/g, (_, key) => {
    if (vars[key] === undefined || vars[key] === null) {
      return `{${key}}`;
    }
    return String(vars[key]);
  });
}

/**
 * @param {string} locale
 * @param {string} key
 * @param {Record<string, string|number>} [vars]
 * @returns {string}
 */
export function translate(locale, key, vars) {
  const primary = catalogs[locale]?.[key];
  const fallback = catalogs.en[key];
  const template =
    primary ??
    fallback ??
    interpolate(catalogs.en["errors.missingTranslation"] || `[${key}]`, { key });
  return interpolate(template, vars);
}

export function createTranslator(locale) {
  return (key, vars) => translate(locale, key, vars);
}
