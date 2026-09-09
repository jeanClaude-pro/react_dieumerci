// Pure, framework-free helpers for handling handheld 2D/QR keyboard-wedge
// scanners. Kept dependency-free so the exact same logic can be exercised by
// `node --experimental-strip-types --test` without a browser/DOM.

export const RECEIPT_TOKEN_PREFIX = "EDM1:";
export const RECEIPT_TOKEN_LENGTH = 48;
export const RECEIPT_TOKEN_PATTERN = /^EDM1:[A-Za-z0-9_-]{43}$/;

/**
 * Keys that a keyboard-wedge scanner can be configured to send as a
 * burst terminator. `event.key` (not `event.code`) already normalizes the
 * main Enter key and the numpad Enter key to the same "Enter" value, so no
 * special-casing is needed there — only Tab needs to be added explicitly.
 */
const SUBMIT_KEYS = new Set(["Enter", "Tab"]);

export function isScannerSubmitKey(key: string): boolean {
  return SUBMIT_KEYS.has(key);
}

/**
 * Strips only harmless scanner artifacts: leading/trailing whitespace and any
 * CR / LF / CRLF characters the scanner suffix configuration may emit before
 * or in place of a keydown event. Interior characters are never touched, so
 * base64url token bodies (which legitimately contain `-` and `_`) survive
 * untouched — corrupting those would silently break every scan.
 */
export function sanitizeScannerValue(raw: string): string {
  if (typeof raw !== "string") return "";
  return raw.replace(/[\r\n]+/g, "").trim();
}

export function isValidReceiptToken(value: string): boolean {
  return (
    typeof value === "string" &&
    value.length === RECEIPT_TOKEN_LENGTH &&
    RECEIPT_TOKEN_PATTERN.test(value)
  );
}

/**
 * Guards against processing the same physical scan twice — e.g. a keydown
 * "Enter" firing immediately alongside a duplicate input/change/paste event,
 * or an operator's finger holding the trigger a moment too long. Tracks only
 * the single most recent token so it never blocks a genuinely different
 * receipt scanned right after.
 */
export function createScanDeduper(windowMs = 2500) {
  let last: { token: string; at: number } | null = null;
  return {
    shouldSkip(token: string): boolean {
      const now = Date.now();
      if (last && last.token === token && now - last.at < windowMs) return true;
      last = { token, at: now };
      return false;
    },
    reset(): void {
      last = null;
    },
  };
}

/**
 * Redacts a scanned value for development diagnostics. Never returns enough
 * of the token to reconstruct or brute-force it — only whether the expected
 * prefix was present and how long the input was.
 */
export function describeScanForLogging(raw: string): string {
  if (typeof raw !== "string" || raw.length === 0) return "empty";
  const hasPrefix = raw.startsWith(RECEIPT_TOKEN_PREFIX);
  return `prefix=${hasPrefix ? "EDM1" : "none"} len=${raw.length}`;
}
