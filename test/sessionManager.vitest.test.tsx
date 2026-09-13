import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { AUTH_TOKEN_KEY, AUTH_USER_KEY, SESSION_INVALIDATED_EVENT } from "../src/lib/sessionManager";

// invalidateSession() needs window/localStorage/CustomEvent — exercised here
// under jsdom rather than the framework-free node:test suite (see
// test/sessionManager.test.ts for the pure JWT-decoding logic).
//
// The module keeps a module-level `invalidating` latch that only resets on a
// real page navigation (see sessionManager.ts) — so each test here resets
// the module registry and re-imports it fresh, giving every test its own
// unlatched instance instead of leaking state across tests.

const originalLocation = window.location;

beforeEach(() => {
  vi.resetModules();
  localStorage.setItem(AUTH_TOKEN_KEY, "jwt-token");
  localStorage.setItem(AUTH_USER_KEY, JSON.stringify({ id: "u1" }));
  // jsdom's real Location object throws "Not implemented: navigation" on
  // `.href =` assignment, and its `href` accessor can't be spied on
  // directly — swap in a plain writable stand-in for the duration of each
  // test instead.
  Object.defineProperty(window, "location", {
    configurable: true,
    value: { ...originalLocation, href: originalLocation.href },
  });
});

afterEach(() => {
  Object.defineProperty(window, "location", { configurable: true, value: originalLocation });
  vi.restoreAllMocks();
  localStorage.clear();
});

test("dispatches SESSION_INVALIDATED_EVENT synchronously so mounted listeners react immediately", async () => {
  const { invalidateSession } = await import("../src/lib/sessionManager");
  const handler = vi.fn();
  window.addEventListener(SESSION_INVALIDATED_EVENT, handler);
  invalidateSession("unauthorized");
  window.removeEventListener(SESSION_INVALIDATED_EVENT, handler);
  expect(handler).toHaveBeenCalledTimes(1);
});

test("clears auth storage", async () => {
  const { invalidateSession } = await import("../src/lib/sessionManager");
  invalidateSession("expired");
  expect(localStorage.getItem(AUTH_TOKEN_KEY)).toBeNull();
  expect(localStorage.getItem(AUTH_USER_KEY)).toBeNull();
});

test("an exception while clearing storage does not leave the invalidation latch stuck forever", async () => {
  const { invalidateSession } = await import("../src/lib/sessionManager");
  const removeItemSpy = vi
    .spyOn(Storage.prototype, "removeItem")
    .mockImplementationOnce(() => {
      throw new Error("storage boom");
    });

  expect(() => invalidateSession("unauthorized")).not.toThrow();
  removeItemSpy.mockRestore();

  // The first call's exception must not leave `invalidating` permanently
  // latched — a second, now-unobstructed call must still go through.
  const handler = vi.fn();
  window.addEventListener(SESSION_INVALIDATED_EVENT, handler);
  invalidateSession("unauthorized");
  window.removeEventListener(SESSION_INVALIDATED_EVENT, handler);
  expect(handler).toHaveBeenCalledTimes(1);
});

test("a second concurrent call in the same tick is a no-op (idempotent)", async () => {
  const { invalidateSession } = await import("../src/lib/sessionManager");
  const handler = vi.fn();
  window.addEventListener(SESSION_INVALIDATED_EVENT, handler);
  invalidateSession("expired");
  invalidateSession("expired");
  window.removeEventListener(SESSION_INVALIDATED_EVENT, handler);
  expect(handler).toHaveBeenCalledTimes(1);
});
