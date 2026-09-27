import { useCallback, useEffect, useReducer, useRef, useState } from "react";
import { BrowserQRCodeReader, type IScannerControls } from "@zxing/browser";
import { Camera, CameraOff, ScanLine } from "lucide-react";
import { serverUrl } from "../utils/constants";
import { useAuth } from "../hooks/useAuth";
import { AUTH_TOKEN_KEY, SESSION_INVALIDATED_EVENT } from "../lib/sessionManager";
import {
  createScanDeduper,
  describeScanForLogging,
  isScannerSubmitKey,
  isValidReceiptToken,
  sanitizeScannerValue,
} from "../utils/scannerInput";
import { createScannerCaptureBuffer } from "../utils/scannerCaptureBuffer";
import { isEditableTarget } from "../utils/scannerFocusGuard";
import { createBoundedQueue } from "../utils/scannerQueue";
import { performReceiptScan, describeHttpErrorMessage } from "../utils/receiptScanClient";
import { canUseCamera } from "../utils/cameraAccess";
import { cameraReducer, INITIAL_CAMERA_STATE } from "../utils/cameraStateMachine";

type ScannerMode = "approve" | "verify";

interface ScanResult {
  code: string;
  message: string;
  detail?: string;
  receiptNumber?: string;
  amount?: number;
  approvedBy?: string | null;
  approvedAt?: string | null;
  exitVerified?: boolean;
  verifiedBy?: string | null;
  verifiedAt?: string | null;
}

const RESULT_DISPLAY_MS = 6000;
const REFOCUS_DELAY_MS = 50;
const BLUR_RECOVERY_DELAY_MS = 120;
const BUFFER_INACTIVITY_MS = 400;
const CAMERA_DECODE_LOCK_MS = 750;

export default function ReceiptScannerPage({ mode }: { mode: ScannerMode }) {
  const { user } = useAuth();
  const isAdmin = canUseCamera(user?.role);

  const [result, setResult] = useState<ScanResult | null>(null);
  const [processing, setProcessing] = useState(false);
  const [sessionExpired, setSessionExpired] = useState(false);
  const [cameraMachine, dispatchCamera] = useReducer(cameraReducer, INITIAL_CAMERA_STATE);

  const inputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const controlsRef = useRef<IScannerControls | null>(null);

  // Lifecycle/generation guard: bumped on mount, mode change, and unmount so
  // any async work started under a previous generation (an in-flight fetch,
  // a pending camera permission prompt, a queued item) can detect it is
  // stale and abandon itself instead of touching state or draining further.
  const generationRef = useRef(0);
  const abortControllerRef = useRef<AbortController | null>(null);
  const cameraGenerationRef = useRef(0);
  const cameraDecodeLockedRef = useRef(false);

  const processingRef = useRef(false);
  const queueRef = useRef(createBoundedQueue<string>());
  const deduperRef = useRef(createScanDeduper(2500));
  const captureBufferRef = useRef(createScannerCaptureBuffer());
  const sessionInvalidRef = useRef(false);

  const bufferResetTimerRef = useRef<number | null>(null);
  const resultTimerRef = useRef<number | null>(null);
  const focusTimerRef = useRef<number | null>(null);
  const stopCameraRef = useRef<() => void>(() => {});

  const devLog = useCallback((step: string, detail?: string) => {
    if (!import.meta.env.DEV) return;
    console.debug(`[receipt-scan:${mode}] ${step}${detail ? ` — ${detail}` : ""}`);
  }, [mode]);

  const focusScanner = useCallback(() => {
    if (focusTimerRef.current !== null) window.clearTimeout(focusTimerRef.current);
    focusTimerRef.current = window.setTimeout(() => {
      inputRef.current?.focus();
      focusTimerRef.current = null;
    }, REFOCUS_DELAY_MS);
  }, []);

  const clearBufferResetTimer = useCallback(() => {
    if (bufferResetTimerRef.current !== null) {
      window.clearTimeout(bufferResetTimerRef.current);
      bufferResetTimerRef.current = null;
    }
  }, []);

  const scheduleBufferReset = useCallback(() => {
    clearBufferResetTimer();
    bufferResetTimerRef.current = window.setTimeout(() => {
      captureBufferRef.current.reset();
      bufferResetTimerRef.current = null;
    }, BUFFER_INACTIVITY_MS);
  }, [clearBufferResetTimer]);

  // ---- Network / queue processing --------------------------------------

  const processOneToken = useCallback(async (token: string, myGeneration: number) => {
    if (!isValidReceiptToken(token)) {
      devLog("qr format check failed");
      if (generationRef.current === myGeneration) setResult({ code: "INVALID", message: "REÇU INVALIDE" });
      return;
    }
    if (deduperRef.current.shouldSkip(token)) {
      devLog("duplicate scan skipped (dedup window)");
      return;
    }

    const authToken = localStorage.getItem(AUTH_TOKEN_KEY) || "";
    if (!authToken || sessionInvalidRef.current) {
      // Never fire a request with an empty/known-invalid bearer token —
      // just surface the expired state and let the global session handling
      // (already triggered) take over.
      deduperRef.current.release(token);
      if (generationRef.current === myGeneration) {
        setSessionExpired(true);
        setResult({ code: "AUTH_REQUIRED", message: "SESSION EXPIRÉE" });
      }
      return;
    }

    if (generationRef.current !== myGeneration) return;
    setResult(null);
    devLog("api request started", `mode=${mode}`);

    const outcome = await performReceiptScan({
      serverUrl,
      mode,
      token,
      authToken,
      signal: abortControllerRef.current?.signal,
    });

    if (generationRef.current !== myGeneration) {
      devLog("stale response discarded (generation changed)");
      return;
    }

    switch (outcome.kind) {
      case "timeout":
        devLog("request timed out");
        deduperRef.current.release(token);
        setResult({ code: "TIMEOUT", message: "DÉLAI D'ATTENTE DÉPASSÉ — RESCANNEZ" });
        return;
      case "aborted":
        devLog("request aborted (unmount/mode change/session invalidation)");
        deduperRef.current.release(token);
        return;
      case "network_error":
        devLog("network failure");
        deduperRef.current.release(token);
        setResult({ code: "ERROR", message: "ERREUR DE CONNEXION" });
        return;
      case "unauthorized": {
        devLog("401 received — stopping scanner");
        deduperRef.current.release(token);
        generationRef.current += 1; // invalidate this and any further queued work
        queueRef.current.clear();
        stopCameraRef.current();
        sessionInvalidRef.current = true;
        setSessionExpired(true);
        setResult({ code: "AUTH_REQUIRED", message: "SESSION EXPIRÉE" });
        return;
      }
      default: {
        const data = outcome.data as Partial<ScanResult> & { code?: string; message?: string };
        const fallbackMessage =
          outcome.kind === "success" ? "TRAITEMENT TERMINÉ" : describeHttpErrorMessage(outcome.status);
        const scanResult: ScanResult = {
          code: data.code || (outcome.kind === "success" ? "OK" : "ERROR"),
          message: data.message || fallbackMessage,
          detail: data.detail,
          receiptNumber: data.receiptNumber,
          amount: data.amount,
          approvedBy: data.approvedBy,
          approvedAt: data.approvedAt,
          exitVerified: data.exitVerified,
          verifiedBy: data.verifiedBy,
          verifiedAt: data.verifiedAt,
        };
        devLog("business response", scanResult.code);
        setResult(scanResult);
      }
    }
  }, [devLog, mode]);

  // Iterative pump — deliberately a while-loop, not self-recursive calls, so
  // a burst of invalid/duplicate scans can never grow the JS call stack.
  const runPump = useCallback(async (myGeneration: number) => {
    if (processingRef.current) return;
    processingRef.current = true;
    setProcessing(true);
    try {
      let token: string | undefined;
      while (generationRef.current === myGeneration && (token = queueRef.current.shift()) !== undefined) {
        await processOneToken(token, myGeneration);
      }
    } finally {
      processingRef.current = false;
      if (generationRef.current === myGeneration) {
        setProcessing(false);
        focusScanner();
      }
    }
  }, [processOneToken, focusScanner]);

  const enqueueToken = useCallback((rawValue: string) => {
    if (sessionInvalidRef.current) return;
    const token = sanitizeScannerValue(rawValue);
    if (!token) return;
    devLog("buffer completed", describeScanForLogging(token));

    const accepted = queueRef.current.push(token);
    if (!accepted) {
      devLog("queue overflow — clearing backlog");
      queueRef.current.clear();
      setResult({ code: "QUEUE_OVERFLOW", message: "FILE D'ATTENTE SATURÉE — RESCANNEZ LE REÇU" });
      focusScanner();
      return;
    }
    void runPump(generationRef.current);
  }, [devLog, focusScanner, runPump]);

  // ---- Camera lifecycle -----------------------------------------------

  const stopCamera = useCallback(() => {
    cameraGenerationRef.current += 1; // supersede any pending start
    dispatchCamera({ type: "STOP_REQUESTED" });
    try {
      controlsRef.current?.stop();
    } catch {
      // Stream/track may already be gone (device unplugged, permission
      // revoked) — stopping an already-dead stream must never throw up.
    }
    controlsRef.current = null;
    cameraDecodeLockedRef.current = false;
    dispatchCamera({ type: "STOPPED" });
    focusScanner();
  }, [focusScanner]);

  useEffect(() => {
    stopCameraRef.current = stopCamera;
  }, [stopCamera]);

  const attachTrackEndedWatcher = useCallback((myCameraGeneration: number) => {
    const stream = videoRef.current?.srcObject;
    if (!(stream instanceof MediaStream)) return;
    for (const track of stream.getTracks()) {
      track.addEventListener(
        "ended",
        () => {
          if (cameraGenerationRef.current !== myCameraGeneration) return;
          devLog("camera track ended unexpectedly");
          dispatchCamera({ type: "TRACK_ENDED" });
          controlsRef.current = null;
          focusScanner();
        },
        { once: true }
      );
    }
  }, [devLog, focusScanner]);

  const startCamera = useCallback(async () => {
    if (!isAdmin) return; // client-side mirror of the admin-only restriction; never starts for other roles even if invoked directly
    if (cameraMachine.state === "starting" || cameraMachine.state === "active") return;
    if (!navigator.mediaDevices?.getUserMedia || !videoRef.current) {
      dispatchCamera({ type: "START_FAILED", message: "La caméra n'est pas prise en charge par ce navigateur." });
      return;
    }

    dispatchCamera({ type: "START_REQUESTED" });
    const myCameraGeneration = ++cameraGenerationRef.current;
    const myGeneration = generationRef.current;

    try {
      const reader = new BrowserQRCodeReader();
      const controls = await reader.decodeFromVideoDevice(undefined, videoRef.current, (decoded) => {
        if (!decoded) return;
        if (cameraGenerationRef.current !== myCameraGeneration) return; // stale decode callback
        if (cameraDecodeLockedRef.current) return;
        cameraDecodeLockedRef.current = true;
        enqueueToken(decoded.getText());
        window.setTimeout(() => {
          cameraDecodeLockedRef.current = false;
        }, CAMERA_DECODE_LOCK_MS);
      });

      if (cameraGenerationRef.current !== myCameraGeneration || generationRef.current !== myGeneration) {
        // Unmounted / mode changed / camera restarted while the permission
        // prompt was pending — discard this late-resolving control instead
        // of leaving an orphaned stream running in the background.
        devLog("discarding late camera start (stale generation)");
        try {
          controls.stop();
        } catch {
          /* already gone */
        }
        return;
      }

      controlsRef.current = controls;
      attachTrackEndedWatcher(myCameraGeneration);
      dispatchCamera({ type: "START_SUCCEEDED" });
      focusScanner();
    } catch (error) {
      if (cameraGenerationRef.current !== myCameraGeneration) return; // superseded — ignore
      const message =
        error instanceof Error && error.name === "NotAllowedError"
          ? "Permission caméra refusée. Autorisez-la dans les réglages du navigateur."
          : "Impossible de démarrer la caméra.";
      dispatchCamera({ type: "START_FAILED", message });
      focusScanner();
    }
  }, [isAdmin, cameraMachine.state, attachTrackEndedWatcher, devLog, focusScanner, enqueueToken]);

  // ---- Global keyboard-wedge capture -----------------------------------
  // Primary capture path: a page-wide keydown listener, so the physical
  // scanner works even if a button/body/result card currently has focus.
  // The visible input below is a secondary, focus-based affordance — the
  // same keydown events bubble up to window regardless of which of the two
  // is actually focused, so there is exactly one place tokens are parsed.

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (sessionInvalidRef.current) return;
      if (event.ctrlKey || event.metaKey || event.altKey) return;

      const target = event.target as HTMLElement | null;
      if (isEditableTarget(target, inputRef.current)) return;

      if (isScannerSubmitKey(event.key)) {
        // Only intercept Enter/Tab when a plausible scan is actually in
        // progress — otherwise let them behave normally (button activation,
        // tab-navigation between the input and the camera button).
        if (captureBufferRef.current.isEmpty()) return;
        const raw = captureBufferRef.current.handleSubmit();
        clearBufferResetTimer();
        if (!raw) return;
        event.preventDefault();
        devLog("scanner event received", `key=${event.key}`);
        enqueueToken(raw);
        return;
      }

      if (event.key.length === 1) {
        captureBufferRef.current.handleChar(event.key);
        scheduleBufferReset();
      }
    };

    window.addEventListener("keydown", handleKeyDown, true);
    return () => window.removeEventListener("keydown", handleKeyDown, true);
  }, [enqueueToken, devLog, clearBufferResetTimer, scheduleBufferReset]);

  // ---- Focus/lifecycle recovery -----------------------------------------

  useEffect(() => {
    const handleWindowFocus = () => {
      devLog("focus recovery: window focus regained");
      focusScanner();
    };
    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        devLog("focus recovery: page visible again");
        focusScanner();
      }
    };
    window.addEventListener("focus", handleWindowFocus);
    document.addEventListener("visibilitychange", handleVisibility);
    return () => {
      window.removeEventListener("focus", handleWindowFocus);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [focusScanner, devLog]);

  const handleInputBlur = useCallback(() => {
    // Delayed + conditional: only reclaim focus if it fell back to nothing
    // in particular (a stray click on empty space). If the operator
    // deliberately clicked a real control (e.g. the camera button), leave it
    // alone — that control's own handler restores scanner focus when done.
    window.setTimeout(() => {
      const active = document.activeElement;
      if (!active || active === document.body) {
        devLog("focus recovery: input blur (no other control claimed focus)");
        focusScanner();
      }
    }, BLUR_RECOVERY_DELAY_MS);
  }, [focusScanner, devLog]);

  // Session invalidation can originate from this page's own request, from
  // the token-expiry timer in AuthProvider, or from another tab — react to
  // all of them immediately rather than only the local 401 path.
  useEffect(() => {
    const handleInvalidated = () => {
      devLog("session invalidated (global event) — stopping scanner");
      sessionInvalidRef.current = true;
      generationRef.current += 1;
      queueRef.current.clear();
      stopCameraRef.current();
      setSessionExpired(true);
      setProcessing(false);
      setResult({ code: "AUTH_REQUIRED", message: "SESSION EXPIRÉE" });
    };
    window.addEventListener(SESSION_INVALIDATED_EVENT, handleInvalidated);
    return () => window.removeEventListener(SESSION_INVALIDATED_EVENT, handleInvalidated);
  }, [devLog]);

  // Mount / mode-change / unmount: fresh generation each time, hard-stop
  // whatever the previous generation had in flight.
  useEffect(() => {
    generationRef.current += 1;
    const myGeneration = generationRef.current;
    devLog("scanner generation changed", `gen=${myGeneration}`);

    abortControllerRef.current = new AbortController();
    processingRef.current = false;
    queueRef.current.clear();
    deduperRef.current.reset();
    captureBufferRef.current.reset();
    sessionInvalidRef.current = false;
    setResult(null);
    setProcessing(false);
    setSessionExpired(false);
    focusScanner();

    const queue = queueRef.current;
    return () => {
      generationRef.current += 1; // invalidate this generation for any pending callbacks
      abortControllerRef.current?.abort();
      queue.clear();
      clearBufferResetTimer();
      if (resultTimerRef.current !== null) window.clearTimeout(resultTimerRef.current);
      if (focusTimerRef.current !== null) window.clearTimeout(focusTimerRef.current);
      stopCameraRef.current();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode]);

  useEffect(() => {
    if (!result) return;
    resultTimerRef.current = window.setTimeout(() => {
      setResult(null);
      focusScanner();
      resultTimerRef.current = null;
    }, RESULT_DISPLAY_MS);
    return () => {
      if (resultTimerRef.current !== null) {
        window.clearTimeout(resultTimerRef.current);
        resultTimerRef.current = null;
      }
    };
  }, [focusScanner, result]);

  const resultColor = ["APPROVED", "ALREADY_APPROVED", "ALREADY_VERIFIED"].includes(result?.code || "")
    ? "border-emerald-500 bg-emerald-50 text-emerald-950"
    : result?.code === "PENDING"
      ? "border-amber-500 bg-amber-50 text-amber-950"
      : "border-red-500 bg-red-50 text-red-950";

  const statusLabel = sessionExpired
    ? "SESSION EXPIRÉE"
    : processing
      ? "TRAITEMENT…"
      : "SCANNER PRÊT";
  const statusColor = sessionExpired ? "text-red-700" : processing ? "text-amber-700" : "text-blue-700";

  return (
    <div className="page page-narrow" onClick={focusScanner}>
      <div className="space-y-5">
        <header className="page-header" style={{ marginBottom: 0 }}>
          <div>
          <h1 className="page-title">
            {mode === "approve" ? "Validation paiement" : "Contrôle paiement"}
          </h1>
          <p className="page-subtitle">
            {mode === "approve"
              ? "Le scan valide automatiquement le paiement."
              : "Vérification en lecture seule — aucun paiement ne sera validé ici."}
          </p>
          </div>
        </header>

        <section className="card p-5 sm:p-6">
          <div className={`flex items-center gap-3 ${statusColor}`} aria-live="polite">
            <ScanLine className="h-6 w-6" aria-hidden="true" />
            <span className="text-lg font-semibold tracking-wide">{statusLabel}</span>
          </div>
          <p className="mt-2 text-sm text-slate-600">
            Scannez avec le lecteur USB. Le code est traité automatiquement à la touche Entrée.
          </p>
          <input
            ref={inputRef}
            type="text"
            readOnly
            autoComplete="off"
            aria-label="Entrée du lecteur QR USB"
            className="mt-4 w-full rounded-lg border border-slate-300 px-4 py-3 font-mono text-sm outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-200"
            placeholder="EDM1:…"
            onBlur={handleInputBlur}
          />
        </section>

        {isAdmin && (
          <section className="card p-5 sm:p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="section-title">Scanner avec la caméra</h2>
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  if (cameraMachine.state === "active" || cameraMachine.state === "starting") stopCamera();
                  else void startCamera();
                }}
                className={`btn ${cameraMachine.state === "active" ? "btn-secondary" : "btn-primary"}`}
              >
                {cameraMachine.state === "active" ? <CameraOff aria-hidden="true" /> : <Camera aria-hidden="true" />}
                {cameraMachine.state === "active" ? "Arrêter" : "Ouvrir la caméra"}
              </button>
            </div>
            <video
              ref={videoRef}
              className={`${cameraMachine.state === "active" ? "mt-4 block" : "hidden"} max-h-[420px] w-full rounded-xl bg-black object-contain`}
              muted
              playsInline
            />
            {cameraMachine.error && <p className="mt-3 text-sm font-medium text-red-700">{cameraMachine.error}</p>}
          </section>
        )}

        {result && (
          <section className={`rounded-xl border-2 p-5 sm:p-6 ${resultColor}`} aria-live="assertive">
            <h2 className="text-xl font-bold tracking-wide">{result.message}</h2>
            {mode === "verify" && result.code === "APPROVED" && (
              <p className="mt-2 text-lg font-black">SORTIE AUTORISÉE</p>
            )}
            {mode === "verify" && result.code === "PENDING" && (
              <p className="mt-2 text-lg font-black">SORTIE NON AUTORISÉE</p>
            )}
            {result.detail && <p className="mt-2 font-medium">{result.detail}</p>}
            <dl className="mt-4 grid gap-2 text-sm sm:grid-cols-2">
              {result.receiptNumber && <><dt>Reçu</dt><dd className="font-bold">{result.receiptNumber}</dd></>}
              {typeof result.amount === "number" && <><dt>Montant</dt><dd className="font-bold">${result.amount.toFixed(2)}</dd></>}
              {result.approvedBy && <><dt>Confirmé par</dt><dd className="font-bold">{result.approvedBy}</dd></>}
              {result.approvedAt && <><dt>Heure</dt><dd className="font-bold">{new Date(result.approvedAt).toLocaleString("fr-FR")}</dd></>}
              {result.verifiedBy && <><dt>Sortie contrôlée par</dt><dd className="font-bold">{result.verifiedBy}</dd></>}
              {result.verifiedAt && <><dt>Contrôle sortie</dt><dd className="font-bold">{new Date(result.verifiedAt).toLocaleString("fr-FR")}</dd></>}
            </dl>
          </section>
        )}
      </div>
    </div>
  );
}
