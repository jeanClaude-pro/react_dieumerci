import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import fr from "./locales/fr.json";
import en from "./locales/en.json";
import { registerTranslator } from "./translate";

/**
 * Interface language only. Business data (product names, amounts, database
 * values, API payloads) is never translated or altered: switching language
 * re-renders labels and formats, nothing else.
 */
export const SUPPORTED_LANGUAGES = ["fr", "en"] as const;
export type AppLanguage = (typeof SUPPORTED_LANGUAGES)[number];
export const DEFAULT_LANGUAGE: AppLanguage = "fr";
export const LANGUAGE_STORAGE_KEY = "ui.language";

function isSupported(value: unknown): value is AppLanguage {
  return typeof value === "string" && (SUPPORTED_LANGUAGES as readonly string[]).includes(value);
}

function storedLanguage(): AppLanguage {
  try {
    const value = localStorage.getItem(LANGUAGE_STORAGE_KEY);
    return isSupported(value) ? value : DEFAULT_LANGUAGE;
  } catch {
    return DEFAULT_LANGUAGE;
  }
}

function applyDocumentLanguage(language: string) {
  if (typeof document !== "undefined") document.documentElement.lang = language;
}

void i18n.use(initReactI18next).init({
  resources: { fr: { translation: fr }, en: { translation: en } },
  lng: storedLanguage(),
  fallbackLng: DEFAULT_LANGUAGE,
  supportedLngs: [...SUPPORTED_LANGUAGES],
  interpolation: { escapeValue: false },
  returnNull: false,
  react: { useSuspense: false },
});

applyDocumentLanguage(i18n.language);

i18n.on("languageChanged", (language) => {
  applyDocumentLanguage(language);
  try {
    localStorage.setItem(LANGUAGE_STORAGE_KEY, language);
  } catch {
    /* preference only */
  }
});

export function currentLanguage(): AppLanguage {
  return isSupported(i18n.language) ? i18n.language : DEFAULT_LANGUAGE;
}

/** BCP-47 locale used for numbers and dates in the current language. */
export function currentLocale(): string {
  return currentLanguage() === "en" ? "en-GB" : "fr-FR";
}

registerTranslator((key, options) => i18n.t(key, options) as string, currentLocale);

export function setLanguage(language: AppLanguage) {
  return i18n.changeLanguage(language);
}

export default i18n;
