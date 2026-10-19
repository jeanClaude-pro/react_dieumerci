import { test } from "node:test";
import assert from "node:assert/strict";
import { niceAbove, peakAxis } from "../src/components/finance/trendAxis.ts";

function assertEven(ticks: number[], step: number) {
  for (let index = 1; index < ticks.length; index += 1) {
    assert.ok(Math.abs((ticks[index] - ticks[index - 1]) - step) < 1e-9);
  }
}

test("small, medium, large and multi-million values receive clean dynamic intervals", () => {
  for (const peak of [50, 500, 5_000, 50_000, 5_000_000]) {
    const axis = peakAxis(peak, 0, peak);
    assert.equal(axis.domain[0], 0);
    assert.ok(axis.domain[1] > peak, `expected headroom above ${peak}`);
    assert.ok(axis.ticks.length >= 4 && axis.ticks.length <= 7);
    assertEven(axis.ticks, axis.step);
  }
});

test("comparison bars share the domain without changing the selected peak", () => {
  const axis = peakAxis(100, 0, 700);
  assert.ok(axis.domain[1] > 700);
  assertEven(axis.ticks, axis.step);
});

test("mixed and all-negative net cash values keep zero and use equal intervals", () => {
  const mixed = peakAxis(400, -130, 400);
  assert.ok(mixed.domain[0] < -130 && mixed.domain[1] > 400);
  assert.ok(mixed.ticks.includes(0));
  assertEven(mixed.ticks, mixed.step);

  const negative = peakAxis(-100, -500, 0);
  assert.ok(negative.domain[0] < -500);
  assert.equal(negative.domain[1], 0);
  assertEven(negative.ticks, negative.step);
});

test("zero-only data has a stable non-degenerate scale", () => {
  assert.deepEqual(peakAxis(0, 0, 0), {
    domain: [0, 1],
    ticks: [0, 0.25, 0.5, 0.75, 1],
    step: 0.25,
  });
});

test("niceAbove adapts precision from cents through millions", () => {
  assert.equal(niceAbove(0.13), 0.15);
  assert.equal(niceAbove(130), 150);
  assert.equal(niceAbove(1_300_000), 1_500_000);
});
