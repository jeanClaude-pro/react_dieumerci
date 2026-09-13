// Pure, framework-free capture buffer for a global (not input-focus-bound)
// keyboard-wedge listener. Framework-free for the same reason as
// scannerInput.ts: it must be exercisable by `node --experimental-strip-types
// --test` without a browser/DOM.
//
// Design: rather than gate on typing *speed* (fragile — fast human typists
// and OS key-repeat both look "fast"), every accumulated character must keep
// the buffer a valid prefix of the EDM1: token shape. Anything that stops
// being a possible prefix — i.e. any ordinary text a human might type — is
// dropped immediately instead of accumulating. This is what lets a page-wide
// keydown listener safely ignore ordinary typing without needing to know
// where else on the page a legitimate text field might live.

const RECEIPT_TOKEN_PREFIX = "EDM1:";

// Generous ceiling — well above the real 48-char token — so a rogue/garbled
// scan (or a stuck key) can never grow the buffer without bound.
const CAPTURE_MAX_LENGTH = 96;

function isPossibleTokenPrefix(value: string): boolean {
  const literalPart = value.slice(0, RECEIPT_TOKEN_PREFIX.length);
  if (RECEIPT_TOKEN_PREFIX.startsWith(literalPart)) return true;
  if (!value.startsWith(RECEIPT_TOKEN_PREFIX)) return false;
  const body = value.slice(RECEIPT_TOKEN_PREFIX.length);
  return /^[A-Za-z0-9_-]*$/.test(body);
}

export interface ScannerCaptureBuffer {
  /** Feed one printable character (a single-character `event.key`). */
  handleChar(char: string): void;
  /** Enter/Tab was pressed. Returns the finalized raw candidate, or null if the buffer was empty. */
  handleSubmit(): string | null;
  reset(): void;
  isEmpty(): boolean;
}

export function createScannerCaptureBuffer(): ScannerCaptureBuffer {
  let buffer = "";
  return {
    handleChar(char: string): void {
      if (typeof char !== "string" || char.length !== 1) return;
      const next = buffer + char;
      if (isPossibleTokenPrefix(next)) {
        buffer = next.length > CAPTURE_MAX_LENGTH ? next.slice(-CAPTURE_MAX_LENGTH) : next;
      } else if (char === RECEIPT_TOKEN_PREFIX[0]) {
        // Doesn't extend the current buffer, but could start a fresh token.
        buffer = char;
      } else {
        buffer = "";
      }
    },
    handleSubmit(): string | null {
      const value = buffer;
      buffer = "";
      return value.length > 0 ? value : null;
    },
    reset(): void {
      buffer = "";
    },
    isEmpty(): boolean {
      return buffer.length === 0;
    },
  };
}
