import { createTranslator } from "./translate.js";

let activeTranslator = createTranslator("en");

/** Allows non-React modules and hooks to use the active UI locale. */
export function setRuntimeTranslator(translator) {
  activeTranslator = translator || createTranslator("en");
}

export function translateActive(key, vars) {
  return activeTranslator(key, vars);
}
