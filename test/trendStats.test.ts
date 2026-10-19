import { test } from "node:test";
import assert from "node:assert/strict";
import { relativePercentChange, summarizeTrend } from "../src/components/finance/trendStats.ts";

const point = (key: string, revenue: number, entries: number, validatedExpenses: number) => ({
  key, sales: 0, values: { revenue, entries, validatedExpenses, netCash: revenue + entries - validatedExpenses },
});

test("trend statistics use exact buckets for total, peak, low and average", () => {
  const stats = summarizeTrend([point("2026-10-01", 50, 0, 12), point("2026-10-02", 0, 30, 7), point("2026-10-03", 100, 0, 21)], ["revenue"]);
  assert.ok(stats);
  assert.equal(stats.totals.revenue, 150);
  assert.equal(stats.totals.validatedExpenses, 40);
  assert.equal(stats.average, 50);
  assert.equal(stats.highest.key, "2026-10-03");
  assert.equal(stats.low.key, "2026-10-02");
});

test("each line keeps its own peak; the highest is the top of all lines", () => {
  const stats = summarizeTrend([point("10", 80, 0, 0), point("11", 40, 150, 0), point("12", 300, 0, 95)], ["revenue", "entries", "validatedExpenses"]);
  assert.ok(stats);
  assert.deepEqual(stats.peaks.map((peak) => [peak.metric, peak.key, peak.value]), [
    ["revenue", "12", 300], ["entries", "11", 150], ["validatedExpenses", "12", 95],
  ]);
  assert.deepEqual([stats.highest.metric, stats.highest.value], ["revenue", 300]);
});

test("negative net cash retains its true peak, low, total and average", () => {
  const stats = summarizeTrend([point("2026-10-01", 0, 0, 500), point("2026-10-02", 0, 0, 100)], ["netCash"]);
  assert.ok(stats);
  assert.equal(stats.totals.netCash, -600);
  assert.equal(stats.average, -300);
  assert.equal(stats.highest.value, -100);
  assert.equal(stats.low.value, -500);
});

test("percentage change uses the magnitude of the equivalent previous period", () => {
  assert.equal(relativePercentChange(150, 100), 50);
  assert.equal(relativePercentChange(-50, -100), 50);
  assert.equal(relativePercentChange(50, 0), null);
});
