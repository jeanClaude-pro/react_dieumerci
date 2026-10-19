import { formatBusinessDay } from "../../i18n/format";
import { tr } from "../../i18n/translate";

export type TrendGranularity = "hour" | "day" | "week" | "month";

/** Amounts returned per bucket by GET /api/analytics/timeseries (USD). */
export type Metric = "revenue" | "entries" | "validatedExpenses" | "netCash";

export interface TrendPoint {
  key: string;
  sales: number;
  values: Record<Metric, number>;
}

/** One line drawn on the chart. */
export interface TrendSeries {
  metric: Metric;
  label: string;
  color: string;
  dashed?: boolean;
}

/**
 * Line colours (dataviz validator, light surface #fffdf9, all pairs pass):
 * green = sales, yellow = money in, red = expenses. Red and green are also
 * told apart by the line style (expenses are dashed) for colour-blind users;
 * the yellow is thicker because it is light on ivory.
 */
export const SERIES_STYLE: Record<Metric, { color: string; dashed?: boolean; width: number }> = {
  revenue: { color: "#1f7a4d", width: 2.25 },
  entries: { color: "#d9a406", width: 2.75 },
  validatedExpenses: { color: "#c8382c", dashed: true, width: 2.25 },
  netCash: { color: "#14532d", width: 2.25 },
};

export const TREND_COLORS = { grid: "#ece8de", axis: "#8a877d", zero: "#a3a096", peak: "#14532d", low: "#b4532a" } as const;

/** "2026-10-19T14" -> 14 (hour buckets of a single day, Lubumbashi time). */
function hourOf(key: string) {
  return Number(key.slice(11, 13));
}

function clock(hour: number) {
  return `${String(hour).padStart(2, "0")}:00`;
}

export function bucketLabel(key: string, granularity: TrendGranularity, long = false): string {
  if (granularity === "hour") {
    const hour = hourOf(key);
    if (!long) return clock(hour);
    const day = formatBusinessDay(key.slice(0, 10), { weekday: "short", day: "numeric", month: "short", year: "numeric" });
    return tr("trend.hourRange", "{{day}}, {{from}}–{{to}}", { day, from: clock(hour), to: clock(hour + 1) });
  }
  if (granularity === "month") {
    return formatBusinessDay(`${key}-01`, long ? { month: "long", year: "numeric" } : { month: "short", year: "2-digit" });
  }
  return formatBusinessDay(key, long ? { weekday: "short", day: "numeric", month: "short", year: "numeric" } : { day: "numeric", month: "short" });
}

export function addDays(key: string, days: number) {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d) + days * 86400000).toISOString().slice(0, 10);
}
