import { businessDate } from "./businessTimeframe.ts";

/**
 * Operational periods of the Dashboard, as business dates (Lubumbashi, UTC+2)
 * sent as from/to. The server turns them into exact instants with the same
 * helpers as every other report, so a "day" means the same range everywhere.
 */
export type DashboardPreset = "today" | "yesterday" | "week" | "month" | "custom";

export interface PeriodRange {
  from: string;
  to: string;
}

export const DASHBOARD_PRESETS: { id: DashboardPreset; label: string }[] = [
  { id: "today", label: "Aujourd'hui" },
  { id: "yesterday", label: "Hier" },
  { id: "week", label: "Cette semaine" },
  { id: "month", label: "Ce mois" },
  { id: "custom", label: "Personnalisée" },
];

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

export function presetRange(preset: Exclude<DashboardPreset, "custom">, now: Date = new Date()): PeriodRange {
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
  }
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

const dayFormat = new Intl.DateTimeFormat("fr-FR", {
  weekday: "short", day: "numeric", month: "short", year: "numeric", timeZone: "UTC",
});

function formatBusinessDate(date: string): string {
  const [year, month, day] = date.split("-").map(Number);
  return dayFormat.format(new Date(Date.UTC(year, month - 1, day)));
}

export function describePeriod(range: PeriodRange): string {
  if (range.from === range.to) return formatBusinessDate(range.from);
  return `Du ${formatBusinessDate(range.from)} au ${formatBusinessDate(range.to)}`;
}
