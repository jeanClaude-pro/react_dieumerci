import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import * as React from "react";
import { AuthContext, type AuthContextValue } from "../src/context/auth-context";
import type { Role, User } from "../src/types/auth";
import ReceiptScannerPage from "../src/components/ReceiptScannerPage";

const { decodeFromVideoDeviceMock } = vi.hoisted(() => ({
  decodeFromVideoDeviceMock: vi.fn(),
}));

vi.mock("@zxing/browser", () => ({
  // Must be a real `function`, not an arrow — the component calls this with
  // `new`, and arrow functions cannot be constructors.
  BrowserQRCodeReader: vi.fn().mockImplementation(function BrowserQRCodeReaderMock(this: {
    decodeFromVideoDevice: typeof decodeFromVideoDeviceMock;
  }) {
    this.decodeFromVideoDevice = decodeFromVideoDeviceMock;
  }),
}));

const VALID_TOKEN_A = "EDM1:" + "A".repeat(43);
const VALID_TOKEN_B = "EDM1:" + "B".repeat(43);

function makeUser(role: Role): User {
  return { id: "u1", username: "op", email: "op@example.test", role };
}

function renderScanner(mode: "approve" | "verify", role: Role = "cashier_supervisor") {
  const value: AuthContextValue = {
    token: "jwt-token",
    user: makeUser(role),
    loading: false,
    setAuth: vi.fn(),
    clearAuth: vi.fn(),
    logout: vi.fn(),
  };
  return render(
    <AuthContext.Provider value={value}>
      <ReceiptScannerPage mode={mode} />
    </AuthContext.Provider>
  );
}

function jsonResponse(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function typeToken(token: string, submitKey: "Enter" | "Tab" = "Enter", target: EventTarget = document.body) {
  for (const char of token) {
    fireEvent.keyDown(target, { key: char });
  }
  fireEvent.keyDown(target, { key: submitKey });
}

beforeEach(() => {
  localStorage.setItem("token", "jwt-token");
  Object.defineProperty(navigator, "mediaDevices", {
    value: { getUserMedia: vi.fn() },
    configurable: true,
  });
  decodeFromVideoDeviceMock.mockReset();
});

afterEach(() => {
  cleanup();
  localStorage.clear();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

describe("physical scanner capture", () => {
  test("a full scan ending with Enter is processed even though nothing is focused (body has focus)", async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse(200, { code: "APPROVED", message: "PAIEMENT APPROUVÉ" }));
    vi.stubGlobal("fetch", fetchMock);
    renderScanner("approve");

    expect(document.activeElement === document.body || document.activeElement === null).toBe(true);
    typeToken(VALID_TOKEN_A, "Enter");

    await screen.findByText("PAIEMENT APPROUVÉ");
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url] = fetchMock.mock.calls[0];
    expect(String(url)).toContain("/sales/receipt/approve");
  });

  test("a full scan ending with Tab is processed the same way", async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse(200, { code: "APPROVED", message: "PAIEMENT APPROUVÉ" }));
    vi.stubGlobal("fetch", fetchMock);
    renderScanner("approve");

    typeToken(VALID_TOKEN_A, "Tab");

    await screen.findByText("PAIEMENT APPROUVÉ");
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  test("ordinary human typing never triggers a network request", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    renderScanner("approve");

    typeToken("bonjour tout le monde", "Enter");

    await new Promise((resolve) => setTimeout(resolve, 20));
    expect(fetchMock).not.toHaveBeenCalled();
  });

  test("a malformed (but prefixed) token is rejected client-side without a network call", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    renderScanner("approve");

    typeToken("EDM1:tooshort", "Enter");

    await screen.findByText("REÇU INVALIDE");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  test("an immediate duplicate of the same scan is deduplicated (single request)", async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse(200, { code: "APPROVED", message: "PAIEMENT APPROUVÉ" }));
    vi.stubGlobal("fetch", fetchMock);
    renderScanner("approve");

    typeToken(VALID_TOKEN_A, "Enter");
    typeToken(VALID_TOKEN_A, "Enter");

    await screen.findByText("PAIEMENT APPROUVÉ");
    await new Promise((resolve) => setTimeout(resolve, 20));
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  test("two different receipts scanned rapidly are both processed, sequentially", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse(200, { code: "APPROVED", message: "PAIEMENT APPROUVÉ" }))
      .mockResolvedValueOnce(jsonResponse(200, { code: "ALREADY_APPROVED", message: "DÉJÀ PAYÉ / DÉJÀ VALIDÉ" }));
    vi.stubGlobal("fetch", fetchMock);
    renderScanner("approve");

    typeToken(VALID_TOKEN_A, "Enter");
    typeToken(VALID_TOKEN_B, "Enter");

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));
    const bodies = fetchMock.mock.calls.map(([, init]) => JSON.parse((init as RequestInit).body as string).token);
    expect(bodies).toEqual([VALID_TOKEN_A, VALID_TOKEN_B]);
  });
});

describe("focus and lifecycle recovery", () => {
  test("window regaining focus refocuses the scanner input", async () => {
    renderScanner("approve");
    const input = screen.getByLabelText("Entrée du lecteur QR USB") as HTMLInputElement;
    input.blur();
    fireEvent.focus(window);
    await waitFor(() => expect(document.activeElement).toBe(input));
  });

  test("visibilitychange to visible refocuses the scanner input", async () => {
    renderScanner("approve");
    const input = screen.getByLabelText("Entrée du lecteur QR USB") as HTMLInputElement;
    input.blur();
    Object.defineProperty(document, "visibilityState", { value: "visible", configurable: true });
    document.dispatchEvent(new Event("visibilitychange"));
    await waitFor(() => expect(document.activeElement).toBe(input));
  });

  test("an in-flight request is aborted on unmount and never updates state afterward", async () => {
    const abortSpy = vi.spyOn(AbortController.prototype, "abort");
    let releaseFetch: (() => void) | null = null;
    const fetchMock = vi.fn().mockImplementation(
      (_url: string, init?: RequestInit) =>
        new Promise<Response>((resolve, reject) => {
          releaseFetch = () => resolve(jsonResponse(200, { code: "APPROVED", message: "PAIEMENT APPROUVÉ" }));
          init?.signal?.addEventListener("abort", () => {
            const err = new Error("aborted");
            err.name = "AbortError";
            reject(err);
          });
        })
    );
    vi.stubGlobal("fetch", fetchMock);
    const { unmount } = renderScanner("approve");

    typeToken(VALID_TOKEN_A, "Enter");
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));

    unmount();
    expect(abortSpy).toHaveBeenCalled();

    // Resolve the stale request after unmount — must not throw / warn.
    releaseFetch?.();
    await new Promise((resolve) => setTimeout(resolve, 10));
  });
});

describe("network failure handling", () => {
  test("a request timeout shows a clear message and the scanner recovers for the next scan", async () => {
    vi.useFakeTimers();
    const fetchMock = vi.fn().mockImplementation(
      (_url: string, init?: RequestInit) =>
        new Promise<Response>((_resolve, reject) => {
          init?.signal?.addEventListener("abort", () => {
            const err = new Error("aborted");
            err.name = "AbortError";
            reject(err);
          });
        })
    );
    fetchMock.mockImplementationOnce(fetchMock.getMockImplementation()!);
    fetchMock.mockResolvedValueOnce(jsonResponse(200, { code: "APPROVED", message: "PAIEMENT APPROUVÉ" }));
    vi.stubGlobal("fetch", fetchMock);
    renderScanner("approve");

    typeToken(VALID_TOKEN_A, "Enter");
    await vi.advanceTimersByTimeAsync(9000);
    // Fake timers + RTL's async findBy*/waitFor polling don't mix well
    // (both rely on timer scheduling) — the state update from the
    // timer-driven abort is already committed by the time
    // advanceTimersByTimeAsync's returned promise settles, so assert
    // synchronously instead of via findByText.
    expect(screen.getByText("DÉLAI D'ATTENTE DÉPASSÉ — RESCANNEZ")).toBeInTheDocument();

    // retry after the timeout must not be swallowed by dedup
    typeToken(VALID_TOKEN_A, "Enter");
    await vi.advanceTimersByTimeAsync(500);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  test("a rejected fetch shows a connection-error message", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("Failed to fetch")));
    renderScanner("approve");
    typeToken(VALID_TOKEN_A, "Enter");
    await screen.findByText("ERREUR DE CONNEXION");
  });
});

describe("authentication handling", () => {
  test("a 401 clears the queue, stops processing, and shows SESSION EXPIRÉE", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(null, { status: 401 }));
    vi.stubGlobal("fetch", fetchMock);
    renderScanner("approve");

    typeToken(VALID_TOKEN_A, "Enter");
    typeToken(VALID_TOKEN_B, "Enter");

    // "SESSION EXPIRÉE" also appears in the status indicator, so disambiguate
    // by scoping to the result panel's heading.
    await screen.findByText("SESSION EXPIRÉE", { selector: "h2" });
    await new Promise((resolve) => setTimeout(resolve, 20));
    // Only the first scan's request should ever have fired — the queued
    // second scan must be dropped, not drained with a dead session.
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});

describe("queue bounds", () => {
  test("overflowing the queue shows a visible message instead of silently backlogging", async () => {
    let resolveFirst: (() => void) | null = null;
    const fetchMock = vi.fn().mockImplementation(
      () =>
        new Promise<Response>((resolve) => {
          resolveFirst = () => resolve(jsonResponse(200, { code: "APPROVED", message: "PAIEMENT APPROUVÉ" }));
        })
    );
    vi.stubGlobal("fetch", fetchMock);
    renderScanner("approve");

    // First scan starts processing (and never resolves yet), so every
    // further scan just piles into the queue.
    typeToken(VALID_TOKEN_A, "Enter");
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));

    for (let i = 0; i < 10; i++) {
      typeToken("EDM1:" + String(i).repeat(43).slice(0, 43), "Enter");
    }

    await screen.findByText("FILE D'ATTENTE SATURÉE — RESCANNEZ LE REÇU");
    resolveFirst?.();
  });
});

describe("camera access is admin-only", () => {
  test("admin sees the camera control", () => {
    renderScanner("approve", "admin");
    expect(screen.getByText("Ouvrir la caméra")).toBeInTheDocument();
  });

  test("cashier_supervisor does not see the camera control on Validation paiement", () => {
    renderScanner("approve", "cashier_supervisor");
    expect(screen.queryByText("Ouvrir la caméra")).not.toBeInTheDocument();
  });

  test("inventory_manager does not see the camera control on Contrôle paiement", () => {
    renderScanner("verify", "inventory_manager");
    expect(screen.queryByText("Ouvrir la caméra")).not.toBeInTheDocument();
  });

  test("admin can open the camera, and the physical scanner still works afterward", async () => {
    decodeFromVideoDeviceMock.mockResolvedValue({ stop: vi.fn() });
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse(200, { code: "APPROVED", message: "PAIEMENT APPROUVÉ" }));
    vi.stubGlobal("fetch", fetchMock);
    renderScanner("verify", "admin");

    fireEvent.click(screen.getByText("Ouvrir la caméra"));
    await screen.findByText("Arrêter");

    typeToken(VALID_TOKEN_A, "Enter");
    await screen.findByText("PAIEMENT APPROUVÉ");
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  test("unmounting while the camera is still starting discards the late resolution and stops it", async () => {
    let resolveDecode: ((controls: { stop: () => void }) => void) | null = null;
    decodeFromVideoDeviceMock.mockImplementation(
      () => new Promise((resolve) => { resolveDecode = resolve; })
    );
    const { unmount } = renderScanner("verify", "admin");

    fireEvent.click(screen.getByText("Ouvrir la caméra"));
    await waitFor(() => expect(decodeFromVideoDeviceMock).toHaveBeenCalled());

    unmount();

    const stop = vi.fn();
    resolveDecode?.({ stop });
    await new Promise((resolve) => setTimeout(resolve, 10));
    expect(stop).toHaveBeenCalled();
  });

  test("a camera start failure shows an error and the physical scanner keeps working", async () => {
    decodeFromVideoDeviceMock.mockRejectedValue(new Error("no device"));
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse(200, { code: "APPROVED", message: "PAIEMENT APPROUVÉ" }));
    vi.stubGlobal("fetch", fetchMock);
    renderScanner("approve", "admin");

    fireEvent.click(screen.getByText("Ouvrir la caméra"));
    await screen.findByText("Impossible de démarrer la caméra.");

    typeToken(VALID_TOKEN_A, "Enter");
    await screen.findByText("PAIEMENT APPROUVÉ");
  });
});

describe("mode switching", () => {
  test("a stale in-flight approval response cannot leak into a freshly mounted verification page", async () => {
    let releaseFetch: (() => void) | null = null;
    const fetchMock = vi.fn().mockImplementation(
      () => new Promise<Response>((resolve) => { releaseFetch = () => resolve(jsonResponse(200, { code: "APPROVED", message: "PAIEMENT APPROUVÉ" })); })
    );
    vi.stubGlobal("fetch", fetchMock);
    const { unmount } = renderScanner("approve");

    typeToken(VALID_TOKEN_A, "Enter");
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));

    // Operator moves to the verification page before the approval settles —
    // this unmounts the approve-mode instance (React Router behavior).
    unmount();
    renderScanner("verify");

    releaseFetch?.();
    await new Promise((resolve) => setTimeout(resolve, 20));

    // The verify-mode instance must show its own idle state, not a result
    // that belongs to the old approve-mode request.
    expect(screen.queryByText("PAIEMENT APPROUVÉ")).not.toBeInTheDocument();
    expect(screen.getByText("SCANNER PRÊT")).toBeInTheDocument();
  });
});
