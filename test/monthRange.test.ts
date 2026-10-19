import test from "node:test";
import assert from "node:assert/strict";
import { monthRange } from "../src/utils/dashboardPeriod.ts";

const now = new Date("2026-10-19T08:00:00Z");

test("a month picked in the calendar spans its real first and last day", () => {
  assert.deepEqual(monthRange("2026-09", now), { from: "2026-09-01", to: "2026-09-30" });
  assert.deepEqual(monthRange("2026-08", now), { from: "2026-08-01", to: "2026-08-31" });
  assert.deepEqual(monthRange("2026-02", now), { from: "2026-02-01", to: "2026-02-28" });
  assert.deepEqual(monthRange("2024-02", now), { from: "2024-02-01", to: "2024-02-29" }, "leap year comes from the calendar");
});

test("the current month stops today and a future month is refused", () => {
  assert.deepEqual(monthRange("2026-10", now), { from: "2026-10-01", to: "2026-10-19" });
  assert.equal(monthRange("2026-11", now), null);
  assert.equal(monthRange("2026-13", now), null);
  assert.equal(monthRange("", now), null);
});
