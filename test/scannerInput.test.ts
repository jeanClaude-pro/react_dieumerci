import test from "node:test";
import assert from "node:assert/strict";
import {
  isScannerSubmitKey,
  sanitizeScannerValue,
  isValidReceiptToken,
  createScanDeduper,
  describeScanForLogging,
  RECEIPT_TOKEN_PATTERN,
} from "../src/utils/scannerInput.ts";

const VALID_TOKEN = "EDM1:" + "A".repeat(43);

test("Enter and NumpadEnter both terminate a scan (same event.key value)", () => {
  assert.equal(isScannerSubmitKey("Enter"), true);
});

test("Tab is also accepted as a scanner suffix key", () => {
  assert.equal(isScannerSubmitKey("Tab"), true);
});

test("ordinary characters are not treated as submit keys", () => {
  for (const key of ["a", "1", "-", "_", "Shift", "Control"]) {
    assert.equal(isScannerSubmitKey(key), false);
  }
});

test("trailing CR/LF/CRLF are stripped without touching interior characters", () => {
  assert.equal(sanitizeScannerValue(VALID_TOKEN + "\r\n"), VALID_TOKEN);
  assert.equal(sanitizeScannerValue(VALID_TOKEN + "\r"), VALID_TOKEN);
  assert.equal(sanitizeScannerValue(VALID_TOKEN + "\n"), VALID_TOKEN);
  assert.equal(sanitizeScannerValue("  " + VALID_TOKEN + "  "), VALID_TOKEN);
});

test("base64url body characters (-, _) survive sanitization untouched", () => {
  const withSpecials = "EDM1:" + "a-b_c".padEnd(43, "9");
  assert.equal(sanitizeScannerValue(withSpecials + "\r\n"), withSpecials);
});

test("valid receipt token pattern accepted, malformed rejected", () => {
  assert.equal(isValidReceiptToken(VALID_TOKEN), true);
  assert.match(VALID_TOKEN, RECEIPT_TOKEN_PATTERN);
  assert.equal(isValidReceiptToken("EDM1:short"), false);
  assert.equal(isValidReceiptToken("https://example.com"), false);
  assert.equal(isValidReceiptToken(""), false);
});

test("deduper skips an immediate repeat of the same physical scan", () => {
  const deduper = createScanDeduper(2500);
  assert.equal(deduper.shouldSkip(VALID_TOKEN), false);
  assert.equal(deduper.shouldSkip(VALID_TOKEN), true);
});

test("deduper does not block a different token scanned right after", () => {
  const deduper = createScanDeduper(2500);
  const otherToken = "EDM1:" + "B".repeat(43);
  assert.equal(deduper.shouldSkip(VALID_TOKEN), false);
  assert.equal(deduper.shouldSkip(otherToken), false);
});

test("deduper allows the same token again once the window has elapsed", () => {
  const deduper = createScanDeduper(10);
  assert.equal(deduper.shouldSkip(VALID_TOKEN), false);
  return new Promise((resolve) => {
    setTimeout(() => {
      assert.equal(deduper.shouldSkip(VALID_TOKEN), false);
      resolve(undefined);
    }, 25);
  });
});

test("release() clears the dedup slot so an immediate retry after a transient failure is not swallowed", () => {
  const deduper = createScanDeduper(2500);
  assert.equal(deduper.shouldSkip(VALID_TOKEN), false);
  deduper.release(VALID_TOKEN);
  assert.equal(deduper.shouldSkip(VALID_TOKEN), false, "retry right after release must not be treated as a duplicate");
});

test("release() is a no-op if a different, more recent scan has since taken the slot", () => {
  const deduper = createScanDeduper(2500);
  const otherToken = "EDM1:" + "B".repeat(43);
  assert.equal(deduper.shouldSkip(VALID_TOKEN), false);
  assert.equal(deduper.shouldSkip(otherToken), false);
  deduper.release(VALID_TOKEN); // stale — otherToken is now "last"
  assert.equal(deduper.shouldSkip(otherToken), true, "release() must not clear a newer unrelated record");
});

test("logging helper never leaks token content", () => {
  const description = describeScanForLogging(VALID_TOKEN);
  assert.doesNotMatch(description, /[A-Za-z0-9_-]{10,}/);
  assert.match(description, /prefix=EDM1/);
  assert.match(description, /len=48/);
  assert.equal(describeScanForLogging(""), "empty");
});
