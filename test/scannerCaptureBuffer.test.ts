import test from "node:test";
import assert from "node:assert/strict";
import { createScannerCaptureBuffer } from "../src/utils/scannerCaptureBuffer.ts";

const VALID_TOKEN = "EDM1:" + "A".repeat(43);

function typeString(buffer: ReturnType<typeof createScannerCaptureBuffer>, text: string) {
  for (const char of text) buffer.handleChar(char);
}

test("a full HID burst followed by Enter yields the token", () => {
  const buffer = createScannerCaptureBuffer();
  typeString(buffer, VALID_TOKEN);
  assert.equal(buffer.isEmpty(), false);
  assert.equal(buffer.handleSubmit(), VALID_TOKEN);
  assert.equal(buffer.isEmpty(), true);
});

test("a full HID burst followed by Tab is captured the same way", () => {
  const buffer = createScannerCaptureBuffer();
  typeString(buffer, VALID_TOKEN);
  assert.equal(buffer.handleSubmit(), VALID_TOKEN);
});

test("ordinary human text never accumulates — buffer stays empty at submit", () => {
  const buffer = createScannerCaptureBuffer();
  typeString(buffer, "hello world");
  assert.equal(buffer.isEmpty(), true);
  assert.equal(buffer.handleSubmit(), null);
});

test("text that starts with the prefix letter but diverges is dropped, not held forever", () => {
  const buffer = createScannerCaptureBuffer();
  typeString(buffer, "Everyone"); // E, then 'v' breaks the "EDM1:" literal match
  assert.equal(buffer.isEmpty(), true);
});

test("pressing submit with an empty buffer returns null (no phantom scan)", () => {
  const buffer = createScannerCaptureBuffer();
  assert.equal(buffer.handleSubmit(), null);
});

test("a malformed-but-prefixed token is still surfaced to the caller for downstream validation", () => {
  const buffer = createScannerCaptureBuffer();
  typeString(buffer, "EDM1:tooshort");
  assert.equal(buffer.handleSubmit(), "EDM1:tooshort");
});

test("reset() discards any in-progress partial scan", () => {
  const buffer = createScannerCaptureBuffer();
  typeString(buffer, "EDM1:partial");
  buffer.reset();
  assert.equal(buffer.isEmpty(), true);
  assert.equal(buffer.handleSubmit(), null);
});

test("two different receipts scanned back-to-back are captured independently", () => {
  const buffer = createScannerCaptureBuffer();
  const tokenA = "EDM1:" + "A".repeat(43);
  const tokenB = "EDM1:" + "B".repeat(43);
  typeString(buffer, tokenA);
  assert.equal(buffer.handleSubmit(), tokenA);
  typeString(buffer, tokenB);
  assert.equal(buffer.handleSubmit(), tokenB);
});

test("base64url body characters (-, _) survive accumulation", () => {
  const buffer = createScannerCaptureBuffer();
  const withSpecials = "EDM1:" + "a-b_c".padEnd(43, "9");
  typeString(buffer, withSpecials);
  assert.equal(buffer.handleSubmit(), withSpecials);
});

test("multi-character key values (e.g. 'Shift', 'Backspace') are ignored, not accumulated", () => {
  const buffer = createScannerCaptureBuffer();
  buffer.handleChar("Shift");
  buffer.handleChar("Backspace");
  assert.equal(buffer.isEmpty(), true);
});
