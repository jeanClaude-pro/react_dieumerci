// Timeout/abort-hardened transport for the two receipt-scan endpoints.
// Pure enough to unit-test under plain `node --test` (Node has global
// fetch/AbortController) by injecting `fetchImpl` — no DOM required.
//
// The one invariant this module exists to guarantee: performReceiptScan()
// ALWAYS settles within timeoutMs, one way or another. A hung network
// connection can never leave the caller awaiting forever, which is what lets
// ReceiptScannerPage guarantee its processing lock is always released.

export const RECEIPT_SCAN_TIMEOUT_MS = 8000;

export type ScannerMode = "approve" | "verify";

export type ReceiptScanOutcome =
  | { kind: "success"; status: number; data: Record<string, unknown> }
  | { kind: "http_error"; status: number; data: Record<string, unknown> }
  | { kind: "unauthorized" }
  | { kind: "timeout" }
  | { kind: "aborted" }
  | { kind: "network_error" };

export interface PerformReceiptScanOptions {
  serverUrl: string;
  mode: ScannerMode;
  token: string;
  authToken: string;
  /** External (generation-level) abort signal — combined with the per-request timeout. */
  signal?: AbortSignal;
  fetchImpl?: typeof fetch;
  timeoutMs?: number;
}

export async function performReceiptScan(options: PerformReceiptScanOptions): Promise<ReceiptScanOutcome> {
  const fetchImpl = options.fetchImpl ?? fetch;
  const timeoutMs = options.timeoutMs ?? RECEIPT_SCAN_TIMEOUT_MS;

  if (options.signal?.aborted) return { kind: "aborted" };

  const controller = new AbortController();
  let timedOut = false;

  const onExternalAbort = () => controller.abort();
  options.signal?.addEventListener("abort", onExternalAbort, { once: true });

  const timer = setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, timeoutMs);

  try {
    const response = await fetchImpl(`${options.serverUrl}/sales/receipt/${options.mode}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${options.authToken}`,
      },
      body: JSON.stringify({ token: options.token }),
      signal: controller.signal,
    });

    if (response.status === 401) {
      return { kind: "unauthorized" };
    }

    let data: Record<string, unknown> = {};
    try {
      data = await response.json();
    } catch {
      data = {};
    }

    return response.ok
      ? { kind: "success", status: response.status, data }
      : { kind: "http_error", status: response.status, data };
  } catch {
    if (controller.signal.aborted) {
      return timedOut ? { kind: "timeout" } : { kind: "aborted" };
    }
    return { kind: "network_error" };
  } finally {
    clearTimeout(timer);
    options.signal?.removeEventListener("abort", onExternalAbort);
  }
}

/**
 * French, operator-facing fallback message for an HTTP error response whose
 * body didn't carry a usable `code`/`message` (rate limiter plain-text body,
 * a proxy error page, malformed JSON, etc). Business-logic errors from
 * /receipt/approve and /receipt/verify already return a French message
 * directly and never reach this fallback.
 */
export function describeHttpErrorMessage(status: number): string {
  if (status === 429) return "TROP DE DEMANDES — PATIENTEZ";
  if (status === 403) return "ACCÈS REFUSÉ";
  if (status >= 500) return "ERREUR SERVEUR";
  return "ERREUR DE LECTURE";
}
