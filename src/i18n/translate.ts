/**
 * Translator for plain modules (formatters, utilities) that cannot use the
 * React hook. src/i18n/index.ts registers i18next here at start-up; until
 * then (or in framework-free unit tests) the French fallback is returned, so
 * French stays the default everywhere.
 */
type Vars = Record<string, string | number>;
type Translator = (key: string, options: Vars & { defaultValue: string }) => string;

let translator: Translator | null = null;
let localeResolver: () => string = () => "fr-FR";

export function registerTranslator(next: Translator, resolveLocale: () => string) {
  translator = next;
  localeResolver = resolveLocale;
}

function interpolate(template: string, vars: Vars = {}) {
  return template.replace(/\{\{\s*(\w+)\s*\}\}/g, (_, name: string) => (name in vars ? String(vars[name]) : ""));
}

/** tr("dashboard.title", "Tableau de bord") */
export function tr(key: string, fallback: string, vars: Vars = {}): string {
  if (!translator) return interpolate(fallback, vars);
  return translator(key, { ...vars, defaultValue: fallback });
}

/** "fr-FR" or "en-GB", following the interface language. */
export function activeLocale(): string {
  return localeResolver();
}
