import { activeLocale } from "./translate";

/**
 * Locale-aware display formatting. Values are never rounded or converted
 * here beyond what is displayed: the stored amounts stay exactly as they are.
 */
const BUSINESS_TZ = "Africa/Lubumbashi";

// Dollar amounts keep the shop's usual "$1,234.56" notation in both
// languages (receipts, cash desk); FC amounts follow the interface locale.
const USD_LOCALE = "en-US";

export function formatUSD(amount: number | null | undefined, options: Intl.NumberFormatOptions = {}): string {
  if (amount === null || amount === undefined || !Number.isFinite(Number(amount))) return "—";
  return new Intl.NumberFormat(USD_LOCALE, { style: "currency", currency: "USD", ...options }).format(Number(amount));
}

/** Compact axis label: $1.2K */
export function formatUSDCompact(amount: number): string {
  return new Intl.NumberFormat(USD_LOCALE, {
    style: "currency", currency: "USD", notation: "compact", maximumFractionDigits: 1,
  }).format(amount);
}

export function formatFC(amount: number | null | undefined): string {
  if (amount === null || amount === undefined || !Number.isFinite(Number(amount))) return "—";
  return `${new Intl.NumberFormat(activeLocale(), { maximumFractionDigits: 0 }).format(Math.round(Number(amount)))} FC`;
}

export function formatNumber(value: number | null | undefined, maximumFractionDigits = 2): string {
  if (value === null || value === undefined || !Number.isFinite(Number(value))) return "—";
  return new Intl.NumberFormat(activeLocale(), { maximumFractionDigits }).format(Number(value));
}

export function formatPercent(value: number | null | undefined, fractionDigits = 1): string {
  if (value === null || value === undefined || !Number.isFinite(Number(value))) return "—";
  return `${new Intl.NumberFormat(activeLocale(), { minimumFractionDigits: fractionDigits, maximumFractionDigits: fractionDigits }).format(Number(value))} %`;
}

export function formatDate(value: string | Date | null | undefined, options: Intl.DateTimeFormatOptions = { day: "numeric", month: "short", year: "numeric" }): string {
  if (!value) return "—";
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat(activeLocale(), { timeZone: BUSINESS_TZ, ...options }).format(date);
}

export function formatDateTime(value: string | Date | null | undefined): string {
  return formatDate(value, { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit", hour12: false });
}

/** A business date "YYYY-MM-DD" (already in Lubumbashi time) as a label. */
export function formatBusinessDay(key: string, options: Intl.DateTimeFormatOptions = { day: "numeric", month: "short" }): string {
  const [year, month, day] = key.split("-").map(Number);
  return new Intl.DateTimeFormat(activeLocale(), { timeZone: "UTC", ...options }).format(new Date(Date.UTC(year, (month || 1) - 1, day || 1)));
}

export function formatTimeOfDay(value: string | Date): string {
  return formatDate(value, { hour: "2-digit", minute: "2-digit", hour12: false });
}
