/**
 * Production: the app prints nothing in the browser console — neither its own
 * messages (also removed at build time) nor those of bundled libraries
 * (charts, PDF). Development keeps the console untouched.
 * Imported first in main.tsx so it runs before any other module.
 */
if (import.meta.env.PROD) {
  const noop = () => {};
  const methods = [
    "log", "debug", "info", "warn", "error", "trace", "table", "dir", "dirxml",
    "group", "groupCollapsed", "groupEnd", "time", "timeEnd", "timeLog", "count", "assert",
  ] as const;
  for (const method of methods) {
    try {
      (console as unknown as Record<string, unknown>)[method] = noop;
    } catch {
      // A locked-down console is already quiet enough.
    }
  }
}

export {};
