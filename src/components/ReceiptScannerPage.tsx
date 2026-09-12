import { useCallback, useEffect, useRef, useState } from "react";
import { BrowserQRCodeReader, type IScannerControls } from "@zxing/browser";
import { Camera, CameraOff, ScanLine } from "lucide-react";
import { serverUrl } from "../utils/constants";
import {
  createScanDeduper,
  describeScanForLogging,
  isScannerSubmitKey,
  isValidReceiptToken,
  sanitizeScannerValue,
} from "../utils/scannerInput";

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

export default function ReceiptScannerPage({ mode }: { mode: ScannerMode }) {
  const [result, setResult] = useState<ScanResult | null>(null);
  const [processing, setProcessing] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const controlsRef = useRef<IScannerControls | null>(null);
  const processingRef = useRef(false);
  const queueRef = useRef<string[]>([]);
  const deduperRef = useRef(createScanDeduper(2500));
  const cameraDecodeLockedRef = useRef(false);

  const focusScanner = useCallback(() => {
    window.setTimeout(() => inputRef.current?.focus(), 50);
  }, []);

  const devLog = useCallback((step: string, detail?: string) => {
    if (!import.meta.env.DEV) return;
    console.debug(`[receipt-scan:${mode}] ${step}${detail ? ` — ${detail}` : ""}`);
  }, [mode]);

  // Processes exactly one queued scan, then immediately drains the next one
  // if another arrived while this request was in flight. The input is never
  // disabled while a request is pending — disabling it would make the DOM
  // element unfocusable, silently swallowing any scan the operator makes
  // during that window (the scanner still beeps because the optical read
  // succeeded; the browser just never delivers those keystrokes anywhere).
  const drainQueue = useCallback(async () => {
    if (processingRef.current) return;
    const token = queueRef.current.shift();
    if (token === undefined) return;

    devLog("buffer completed", describeScanForLogging(token));

    if (!isValidReceiptToken(token)) {
      devLog("qr prefix check failed");
      setResult({ code: "INVALID", message: "REÇU INVALIDE" });
      focusScanner();
      void drainQueue();
      return;
    }
    if (deduperRef.current.shouldSkip(token)) {
      devLog("duplicate scan skipped (dedup window)");
      void drainQueue();
      return;
    }

    processingRef.current = true;
    setProcessing(true);
    setResult(null);
    try {
      devLog("api request started");
      const response = await fetch(`${serverUrl}/sales/receipt/${mode}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
        },
        body: JSON.stringify({ token }),
      });
      devLog("http response received", `status=${response.status}`);
      const data = (await response.json().catch(() => ({}))) as ScanResult;
      // A 401 here is already handled centrally (see authFetchInterceptor),
      // which clears the session and redirects to /login. This is purely a
      // transient message for the instant before that navigation lands —
      // it must never gate future scans on this page.
      const outcome: ScanResult = response.status === 401 ? {
        code: "AUTH_REQUIRED",
        message: "SESSION AUTHENTIFIÉE REQUISE",
      } : {
        code: data.code || "ERROR",
        message: data.message || "ERREUR DE LECTURE",
        detail: data.detail,
        receiptNumber: data.receiptNumber,
        amount: data.amount,
        approvedBy: data.approvedBy,
        approvedAt: data.approvedAt,
        exitVerified: data.exitVerified,
        verifiedBy: data.verifiedBy,
        verifiedAt: data.verifiedAt,
      };
      devLog("business response", outcome.code);
      setResult(outcome);
    } catch {
      devLog("network/api failure");
      setResult({ code: "ERROR", message: "CONNEXION AU SERVEUR IMPOSSIBLE" });
    } finally {
      processingRef.current = false;
      setProcessing(false);
      focusScanner();
      void drainQueue();
    }
  }, [devLog, focusScanner, mode]);

  const enqueueToken = useCallback((rawValue: string) => {
    const token = sanitizeScannerValue(rawValue);
    if (!token) return;
    queueRef.current.push(token);
    void drainQueue();
  }, [drainQueue]);

  useEffect(() => {
    focusScanner();
    return () => {
      controlsRef.current?.stop();
    };
  }, [focusScanner]);

  useEffect(() => {
    if (!result) return;
    const timer = window.setTimeout(() => {
      setResult(null);
      focusScanner();
    }, 6000);
    return () => window.clearTimeout(timer);
  }, [focusScanner, result]);

  const startCamera = async () => {
    if (!navigator.mediaDevices?.getUserMedia || !videoRef.current) {
      setCameraError("La caméra n'est pas prise en charge par ce navigateur.");
      return;
    }
    setCameraError(null);
    try {
      const reader = new BrowserQRCodeReader();
      controlsRef.current = await reader.decodeFromVideoDevice(
        undefined,
        videoRef.current,
        (decoded) => {
          if (!decoded || cameraDecodeLockedRef.current) return;
          cameraDecodeLockedRef.current = true;
          enqueueToken(decoded.getText());
          // Keep the stream alive; only suppress duplicate video frames briefly.
          window.setTimeout(() => {
            cameraDecodeLockedRef.current = false;
          }, 750);
        }
      );
      setCameraActive(true);
    } catch (error) {
      setCameraActive(false);
      setCameraError(
        error instanceof Error && error.name === "NotAllowedError"
          ? "Permission caméra refusée. Autorisez-la dans les réglages du navigateur."
          : "Impossible de démarrer la caméra."
      );
    }
  };

  const stopCamera = () => {
    controlsRef.current?.stop();
    cameraDecodeLockedRef.current = false;
    controlsRef.current = null;
    setCameraActive(false);
    focusScanner();
  };

  const resultColor = ["APPROVED", "ALREADY_APPROVED", "ALREADY_VERIFIED"].includes(result?.code || "")
    ? "border-emerald-500 bg-emerald-50 text-emerald-950"
    : result?.code === "PENDING"
      ? "border-amber-500 bg-amber-50 text-amber-950"
      : "border-red-500 bg-red-50 text-red-950";

  return (
    <div className="min-h-full bg-slate-100 p-4 md:p-8" onClick={focusScanner}>
      <div className="mx-auto max-w-3xl space-y-6">
        <header>
          <h1 className="text-2xl font-bold text-slate-950">
            {mode === "approve" ? "Validation paiement" : "Contrôle paiement"}
          </h1>
          <p className="mt-1 text-slate-600">
            {mode === "approve"
              ? "Le scan valide automatiquement le paiement."
              : "Vérification en lecture seule — aucun paiement ne sera validé ici."}
          </p>
        </header>

        <section className="rounded-2xl border bg-white p-6 shadow-sm">
          <div className="flex items-center gap-3 text-blue-700">
            <ScanLine className="h-7 w-7" />
            <span className="text-lg font-bold">{processing ? "TRAITEMENT…" : "PRÊT À SCANNER"}</span>
          </div>
          <p className="mt-2 text-sm text-slate-600">
            Scannez avec le lecteur USB. Le code est traité automatiquement à la touche Entrée.
          </p>
          <input
            ref={inputRef}
            type="text"
            autoComplete="off"
            aria-label="Entrée du lecteur QR USB"
            className="mt-4 w-full rounded-lg border border-slate-300 px-4 py-3 font-mono text-sm outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-200"
            placeholder="EDM1:…"
            onKeyDown={(event) => {
              if (!isScannerSubmitKey(event.key)) return;
              event.preventDefault();
              const value = event.currentTarget.value;
              event.currentTarget.value = "";
              devLog("scanner event received", `key=${event.key}`);
              enqueueToken(value);
            }}
          />
        </section>

        <section className="rounded-2xl border bg-white p-6 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="font-semibold text-slate-900">Scanner avec la caméra</h2>
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                if (cameraActive) stopCamera();
                else void startCamera();
              }}
              className="flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2 font-semibold text-white"
            >
              {cameraActive ? <CameraOff className="h-4 w-4" /> : <Camera className="h-4 w-4" />}
              {cameraActive ? "Arrêter" : "Ouvrir la caméra"}
            </button>
          </div>
          <video ref={videoRef} className={`${cameraActive ? "mt-4 block" : "hidden"} max-h-[420px] w-full rounded-xl bg-black object-contain`} muted playsInline />
          {cameraError && <p className="mt-3 text-sm font-medium text-red-700">{cameraError}</p>}
        </section>

        {result && (
          <section className={`rounded-2xl border-2 p-6 shadow-sm ${resultColor}`} aria-live="assertive">
            <h2 className="text-xl font-black">{result.message}</h2>
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
