import test from "node:test";
import assert from "node:assert/strict";
import { performReceiptScan, describeHttpErrorMessage } from "../src/utils/receiptScanClient.ts";

function jsonResponse(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

const baseOptions = {
  serverUrl: "https://api.example.test",
  mode: "approve" as const,
  token: "EDM1:" + "A".repeat(43),
  authToken: "jwt-token",
};

test("a normal successful response resolves as success with parsed JSON", async () => {
  const fetchImpl = async () => jsonResponse(200, { code: "APPROVED", message: "PAIEMENT APPROUVÉ" });
  const outcome = await performReceiptScan({ ...baseOptions, fetchImpl });
  assert.equal(outcome.kind, "success");
  if (outcome.kind === "success") {
    assert.equal(outcome.data.code, "APPROVED");
  }
});

test("a 401 response resolves as unauthorized without needing the body", async () => {
  const fetchImpl = async () => new Response(null, { status: 401 });
  const outcome = await performReceiptScan({ ...baseOptions, fetchImpl });
  assert.deepEqual(outcome, { kind: "unauthorized" });
});

test("a rejected fetch (network failure) resolves as network_error, never rejects", async () => {
  const fetchImpl = async () => {
    throw new TypeError("Failed to fetch");
  };
  const outcome = await performReceiptScan({ ...baseOptions, fetchImpl });
  assert.deepEqual(outcome, { kind: "network_error" });
});

test("a request that never settles is aborted and reported as a timeout, not left hanging", async () => {
  const fetchImpl = (_url: string, init?: RequestInit) =>
    new Promise<Response>((_resolve, reject) => {
      init?.signal?.addEventListener("abort", () => {
        const err = new Error("aborted");
        err.name = "AbortError";
        reject(err);
      });
    });
  const outcome = await performReceiptScan({ ...baseOptions, fetchImpl, timeoutMs: 30 });
  assert.deepEqual(outcome, { kind: "timeout" });
});

test("an externally-aborted signal (generation change / unmount) reports aborted, not timeout", async () => {
  const controller = new AbortController();
  const fetchImpl = (_url: string, init?: RequestInit) =>
    new Promise<Response>((_resolve, reject) => {
      init?.signal?.addEventListener("abort", () => {
        const err = new Error("aborted");
        err.name = "AbortError";
        reject(err);
      });
    });
  const promise = performReceiptScan({ ...baseOptions, fetchImpl, signal: controller.signal, timeoutMs: 5000 });
  controller.abort();
  const outcome = await promise;
  assert.deepEqual(outcome, { kind: "aborted" });
});

test("an already-aborted external signal short-circuits without calling fetch", async () => {
  const controller = new AbortController();
  controller.abort();
  let called = false;
  const fetchImpl = async () => {
    called = true;
    return jsonResponse(200, {});
  };
  const outcome = await performReceiptScan({ ...baseOptions, fetchImpl, signal: controller.signal });
  assert.deepEqual(outcome, { kind: "aborted" });
  assert.equal(called, false);
});

test("a 500 response resolves as http_error with the status preserved", async () => {
  const fetchImpl = async () => jsonResponse(500, { message: "boom" });
  const outcome = await performReceiptScan({ ...baseOptions, fetchImpl });
  assert.equal(outcome.kind, "http_error");
  if (outcome.kind === "http_error") assert.equal(outcome.status, 500);
});

test("a 429 rate-limit response resolves as http_error", async () => {
  const fetchImpl = async () => jsonResponse(429, { message: "Too many receipt requests." });
  const outcome = await performReceiptScan({ ...baseOptions, fetchImpl });
  assert.equal(outcome.kind, "http_error");
  if (outcome.kind === "http_error") assert.equal(outcome.status, 429);
});

test("a non-JSON / malformed body never throws — resolves with empty data", async () => {
  const fetchImpl = async () =>
    new Response("<html>not json</html>", { status: 200, headers: { "Content-Type": "text/html" } });
  const outcome = await performReceiptScan({ ...baseOptions, fetchImpl });
  assert.equal(outcome.kind, "success");
  if (outcome.kind === "success") assert.deepEqual(outcome.data, {});
});

test("describeHttpErrorMessage gives French fallback text per status class", () => {
  assert.match(describeHttpErrorMessage(429), /DEMANDES/);
  assert.match(describeHttpErrorMessage(403), /REFUSÉ/);
  assert.match(describeHttpErrorMessage(500), /SERVEUR/);
  assert.match(describeHttpErrorMessage(400), /LECTURE/);
});
