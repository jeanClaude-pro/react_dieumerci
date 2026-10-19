import { businessDate } from "./businessTimeframe.ts";
import { activeLocale, tr } from "../i18n/translate.ts";

/**
 * Operational periods of the Dashboard, as business dates (Lubumbashi, UTC+2)
 * sent as from/to. The server turns them into exact instants with the same
 * helpers as every other report, so a "day" means the same range everywhere.
 */
export type DashboardPreset = "today" | "yesterday" | "week" | "month" | "pickMonth" | "last30" | "quarter" | "year" | "custom";

export interface PeriodRange {
  from: string;
  to: string;
}

export const DASHBOARD_PRESETS: { id: DashboardPreset; label: string }[] = [
  { id: "today", label: "Aujourd'hui" },
  { id: "yesterday", label: "Hier" },
  { id: "week", label: "Cette semaine" },
  { id: "month", label: "Ce mois" },
  { id: "pickMonth", label: "Choisir un mois" },
  { id: "custom", label: "Personnalisée" },
];

/** Longer horizons offered by the Reports page (trend analysis). */
export const REPORT_PRESETS: { id: DashboardPreset; label: string }[] = [
  { id: "today", label: "Aujourd'hui" },
  { id: "week", label: "Cette semaine" },
  { id: "month", label: "Ce mois" },
  { id: "last30", label: "30 derniers jours" },
  { id: "quarter", label: "90 derniers jours" },
  { id: "pickMonth", label: "Choisir un mois" },
  { id: "year", label: "Cette année" },
  { id: "custom", label: "Personnalisée" },
];

/** Preset label in the interface language (period.presets.<id>). */
export function presetLabel(preset: DashboardPreset): string {
  const fallback = [...DASHBOARD_PRESETS, ...REPORT_PRESETS].find((option) => option.id === preset)?.label ?? preset;
  return tr(`period.presets.${preset}`, fallback);
}

const DAY_MS = 24 * 60 * 60 * 1000;

function shiftDate(date: string, days: number): string {
  const [year, month, day] = date.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day) + days * DAY_MS).toISOString().slice(0, 10);
}

/** Monday-based week, as in the French calendar. */
function weekStart(date: string): string {
  const [year, month, day] = date.split("-").map(Number);
  const weekday = new Date(Date.UTC(year, month - 1, day)).getUTCDay();
  return shiftDate(date, -((weekday + 6) % 7));
}

export function presetRange(preset: Exclude<DashboardPreset, "custom" | "pickMonth">, now: Date = new Date()): PeriodRange {
  const today = businessDate(now);
  switch (preset) {
    case "today":
      return { from: today, to: today };
    case "yesterday": {
      const yesterday = shiftDate(today, -1);
      return { from: yesterday, to: yesterday };
    }
    case "week":
      return { from: weekStart(today), to: today };
    case "month":
      return { from: `${today.slice(0, 8)}01`, to: today };
    case "last30":
      return { from: shiftDate(today, -29), to: today };
    case "quarter":
      return { from: shiftDate(today, -89), to: today };
    case "year":
      return { from: `${today.slice(0, 4)}-01-01`, to: today };
  }
}

/** Current business month, "YYYY-MM". */
export function currentMonth(now: Date = new Date()): string {
  return businessDate(now).slice(0, 7);
}

/**
 * A month picked in the calendar ("YYYY-MM" from <input type="month">).
 * The first and last day come from the calendar itself (the Date API knows
 * that February has 28 or 29 days, April 30, …): nothing is assumed about the
 * length of a month. The current month stops at today; a future month is
 * refused (null).
 */
export function monthRange(month: string, now: Date = new Date()): PeriodRange | null {
  const match = /^(\d{4})-(\d{2})$/.exec(month);
  if (!match) return null;
  const year = Number(match[1]);
  const monthIndex = Number(match[2]) - 1;
  if (monthIndex < 0 || monthIndex > 11) return null;
  const first = new Date(Date.UTC(year, monthIndex, 1));
  // Day 0 of the next month = the last day of this month, as the calendar says.
  const last = new Date(Date.UTC(year, monthIndex + 1, 0));
  const from = first.toISOString().slice(0, 10);
  const to = last.toISOString().slice(0, 10);
  const today = businessDate(now);
  if (from > today) return null;
  return { from, to: to > today ? today : to };
}

/** A custom range is valid when both dates exist, are ordered and not in the future. */
export function isValidCustomRange(range: PeriodRange, now: Date = new Date()): boolean {
  const pattern = /^\d{4}-\d{2}-\d{2}$/;
  if (!pattern.test(range.from) || !pattern.test(range.to)) return false;
  return range.from <= range.to && range.from <= businessDate(now);
}

export function periodQuery(range: PeriodRange): string {
  return new URLSearchParams({ from: range.from, to: range.to }).toString();
}

function formatBusinessDate(date: string): string {
  const [year, month, day] = date.split("-").map(Number);
  return new Intl.DateTimeFormat(activeLocale(), {
    weekday: "short", day: "numeric", month: "short", year: "numeric", timeZone: "UTC",
  }).format(new Date(Date.UTC(year, month - 1, day)));
}

export function describePeriod(range: PeriodRange): string {
  if (range.from === range.to) return formatBusinessDate(range.from);
  return tr("period.range", "Du {{from}} au {{to}}", { from: formatBusinessDate(range.from), to: formatBusinessDate(range.to) });
}
