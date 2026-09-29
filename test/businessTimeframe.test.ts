import test from "node:test";
import assert from "node:assert/strict";
import { businessDate, businessTimeframeParams } from "../src/utils/businessTimeframe.ts";

test("business date follows Lubumbashi (UTC+2), not UTC", () => {
  assert.equal(businessDate(new Date("2026-09-27T22:30:00Z")), "2026-09-28");
  assert.equal(businessDate(new Date("2026-09-28T21:59:59Z")), "2026-09-28");
});

test("month covers the whole business month including its last day", () => {
  const params = new URLSearchParams(businessTimeframeParams("month", undefined, undefined, new Date("2026-09-30T21:00:00Z")));
  assert.equal(params.get("year"), "2026");
  assert.equal(params.get("month"), "09");
  assert.equal(params.get("from"), null);
});

test("week is the last 7 business days including today", () => {
  const params = new URLSearchParams(businessTimeframeParams("week", undefined, undefined, new Date("2026-09-27T23:00:00Z")));
  assert.equal(params.get("from"), "2026-09-22");
  assert.equal(params.get("to"), "2026-09-28");
});

test("day and year use the selection", () => {
  assert.equal(businessTimeframeParams("day", undefined, "2026-01-05"), "date=2026-01-05");
  assert.equal(businessTimeframeParams("year", 2025), "year=2025");
});
