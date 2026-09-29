/**
 * Business-day helpers for API query params.
 * Lubumbashi is UTC+2 with no DST; this mirrors jean-server/utils/queryHelpers.js
 * so a "day" or "month" on the client is exactly the same range on the server.
 */

export type Timeframe = "day" | "week" | "month" | "year";

const BUSINESS_UTC_OFFSET_MS = 2 * 60 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;

/** YYYY-MM-DD of the given instant in the business timezone. */
export function businessDate(now: Date = new Date()): string {
  const shifted = new Date(now.getTime() + BUSINESS_UTC_OFFSET_MS);
  return [
    shifted.getUTCFullYear(),
    String(shifted.getUTCMonth() + 1).padStart(2, "0"),
    String(shifted.getUTCDate()).padStart(2, "0"),
  ].join("-");
}

/**
 * Query string for the server's buildTimeframeFilter.
 * week = the last 7 business days including today; month = the full current business month.
 */
export function businessTimeframeParams(
  timeframe: Timeframe,
  selectedYear?: number,
  selectedDate?: string,
  now: Date = new Date()
): string {
  const params = new URLSearchParams();
  const today = businessDate(now);

  switch (timeframe) {
    case "day":
      params.set("date", selectedDate || today);
      break;
    case "week":
      params.set("from", businessDate(new Date(now.getTime() - 6 * DAY_MS)));
      params.set("to", today);
      break;
    case "month":
      params.set("year", today.slice(0, 4));
      params.set("month", today.slice(5, 7));
      break;
    case "year":
      params.set("year", String(selectedYear || Number(today.slice(0, 4))));
      break;
  }

  return params.toString();
}
