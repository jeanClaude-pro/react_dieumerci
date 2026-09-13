import "@testing-library/jest-dom/vitest";

// jsdom doesn't implement the Media Capture APIs at all. Component tests stub
// navigator.mediaDevices.getUserMedia per-test, but `instanceof MediaStream`
// (used by ReceiptScannerPage's track-ended watcher) needs the constructor to
// merely exist so the check doesn't throw a ReferenceError.
if (typeof globalThis.MediaStream === "undefined") {
  // @ts-expect-error -- minimal stand-in, not a spec-complete MediaStream
  globalThis.MediaStream = class MediaStream {
    getTracks() {
      return [];
    }
  };
}
