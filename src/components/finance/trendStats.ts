import type { Metric, TrendPoint } from "./trendUtils";

export interface MarkedValue { key: string; metric: Metric; value: number }

export interface TrendStats {
  /** Sum of every bucket, per metric. */
  totals: Record<Metric, number>;
  /** Each drawn line's own highest bucket. */
  peaks: MarkedValue[];
  /** The highest point over every drawn line. */
  highest: MarkedValue;
  /** Lowest bucket and average of the first (main) line. */
  low: MarkedValue;
  average: number;
}

const METRICS: Metric[] = ["revenue", "entries", "validatedExpenses", "netCash"];

/** Summarize exact server buckets; no interpolation or smoothing occurs. */
export function summarizeTrend(points: TrendPoint[], metrics: Metric[]): TrendStats | null {
  if (points.length === 0 || metrics.length === 0) return null;
  const totals = Object.fromEntries(METRICS.map((metric) => [metric, 0])) as Record<Metric, number>;
  const first = points[0];
  const peaks = metrics.map((metric) => ({ key: first.key, metric, value: first.values[metric] }));
  const main = metrics[0];
  let low: MarkedValue = { key: first.key, metric: main, value: first.values[main] };

  for (const point of points) {
    for (const metric of METRICS) totals[metric] += point.values[metric];
    peaks.forEach((peak, index) => {
      const value = point.values[peak.metric];
      if (value > peak.value) peaks[index] = { key: point.key, metric: peak.metric, value };
    });
    if (point.values[main] < low.value) low = { key: point.key, metric: main, value: point.values[main] };
  }

  const highest = peaks.reduce((best, peak) => (peak.value > best.value ? peak : best), peaks[0]);
  return { totals, peaks, highest, low, average: totals[main] / points.length };
}

export function relativePercentChange(current: number, previous: number | undefined): number | null {
  if (previous === undefined || previous === 0 || !Number.isFinite(previous)) return null;
  return ((current - previous) / Math.abs(previous)) * 100;
}
