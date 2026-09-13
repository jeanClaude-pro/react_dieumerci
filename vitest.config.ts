import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

// Separate from vite.config.ts on purpose: the app's Vite config enforces
// production-only env requirements (VITE_API_URL) and loads the PWA plugin,
// neither of which is relevant to component tests. This config only wires up
// jsdom + React for testing ReceiptScannerPage's DOM/lifecycle behavior —
// global keydown capture, focus/visibility recovery, camera lifecycle races —
// that the framework-free `node --test` suite (see test/*.test.ts) cannot
// exercise without a browser/DOM.
export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    setupFiles: ["./test/setupVitest.ts"],
    include: ["test/**/*.vitest.test.{ts,tsx}"],
    css: false,
    env: {
      // src/utils/constants requires this at import time; the actual value
      // is irrelevant to these tests since fetch itself is always mocked.
      VITE_API_URL: "https://api.test.invalid/api",
    },
  },
});
