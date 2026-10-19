import { expect, test } from "vitest";
import { bucketLabel } from "../src/components/finance/trendUtils";

test("hour buckets of a single day are labelled by clock time, never as an invalid date", () => {
  expect(bucketLabel("2026-10-19T09", "hour")).toBe("09:00");
  const long = bucketLabel("2026-10-19T12", "hour", true);
  expect(long).toMatch(/12:00–13:00/);
  expect(long).not.toMatch(/Invalid|NaN/);
});
