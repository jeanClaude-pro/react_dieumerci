import React, { useEffect, useRef, useState } from "react";
import { AlertCircle, ArrowLeftRight, Calendar, CheckCircle, History, Info, RefreshCw, Save, TriangleAlert, User, X } from "lucide-react";
import { useTranslation } from "react-i18next";
import PageHeader from "../components/ui/PageHeader";
import { EmptyState, LoadingState } from "../components/ui/States";
import { formatDateTimeGMT2 } from "../utils/dateUtils";
import { serverUrl } from "../utils/constants";
import { formatNumber } from "../i18n/format";
import { serverMessage } from "../i18n/serverMessages";

interface ExchangeRate {
  _id?: string;
  rate: number;
  effectiveFrom: string;
  createdBy?: { username?: string; email?: string };
  isActive?: boolean;
  notes?: string;
  createdAt?: string;
}

const authHeaders = () => ({ Authorization: `Bearer ${localStorage.getItem("token") || ""}` });

export default function Rate() {
  const { t } = useTranslation();
  const [current, setCurrent] = useState<ExchangeRate | null>(null);
  const [history, setHistory] = useState<ExchangeRate[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({ rate: "", effectiveFrom: "", notes: "" });

  const loadRates = async () => {
    try {
      setLoading(true);
      setError(null);
      const currentResponse = await fetch(`${serverUrl}/exchange-rates/current`, { headers: authHeaders() });
      if (currentResponse.ok) {
        const data = await currentResponse.json();
        setCurrent(typeof data?.rate === "number" ? data : data?.rate && typeof data.rate === "object" ? data.rate : null);
      } else {
        setCurrent(null);
      }
      const historyResponse = await fetch(`${serverUrl}/exchange-rates/history?limit=20`, { headers: authHeaders() });
      if (historyResponse.ok) {
        const data = await historyResponse.json();
        setHistory(data.history || data || []);
      } else if (historyResponse.status === 403) {
        setError(t("rate.noHistoryPermission"));
      } else {
        setHistory([]);
      }
    } catch (reason) {
      console.error("Exchange rate load failed:", reason);
      setError(t("rate.loadError"));
      setCurrent(null);
      setHistory([]);
    } finally {
      setLoading(false);
    }
  };
  // Latest loadRates for the mount effect below.
  const loadRatesRef = useRef(loadRates);
  loadRatesRef.current = loadRates;
  useEffect(() => { loadRatesRef.current(); }, []);

  const newRate = Number.parseFloat(form.rate);
  const jump = current?.rate && Number.isFinite(newRate) && newRate > 0 ? ((newRate - current.rate) / current.rate) * 100 : null;

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!form.rate || !(newRate > 0)) {
      setError(t("rate.invalid"));
      return;
    }
    try {
      setSubmitting(true);
      setError(null);
      setMessage(null);
      const response = await fetch(`${serverUrl}/exchange-rates`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify({ rate: newRate, effectiveFrom: form.effectiveFrom || new Date().toISOString(), notes: form.notes }),
      });
      const data = await response.json().catch(() => ({}));
      if (response.ok) {
        setMessage(t("rate.updated"));
        setForm({ rate: "", effectiveFrom: "", notes: "" });
        await loadRates();
      } else {
        setError(serverMessage(data.error || data.message, t("rate.updateFailed", { status: response.status })));
      }
    } catch (reason) {
      console.error("Exchange rate update failed:", reason);
      setError(t("rate.updateError"));
    } finally {
      setSubmitting(false);
    }
  };

  const date = (value?: string) => (value ? formatDateTimeGMT2(value) : "—");
  const amount = (value: number, digits = 2) => formatNumber(value, digits);

  if (loading) {
    return <div className="page"><LoadingState page label={t("rate.loading")} /></div>;
  }

  return (
    <div className="page rate-page">
      <PageHeader
        eyebrow={t("nav.sections.cash")}
        icon={<ArrowLeftRight aria-hidden="true" />}
        title={t("rate.title")}
        description={t("rate.subtitle")}
        actions={<button type="button" onClick={loadRates} className="btn btn-secondary"><RefreshCw aria-hidden="true" />{t("common.refresh")}</button>}
      />

      {message && (
        <div className="alert alert-success" role="status">
          <CheckCircle aria-hidden="true" /><p className="flex-1">{message}</p>
          <button type="button" aria-label={t("common.closeMessage")} onClick={() => setMessage(null)} className="btn btn-ghost btn-icon btn-sm"><X aria-hidden="true" /></button>
        </div>
      )}
      {error && (
        <div className="alert alert-danger" role="alert">
          <AlertCircle aria-hidden="true" /><p className="flex-1">{error}</p>
          <button type="button" aria-label={t("common.closeMessage")} onClick={() => setError(null)} className="btn btn-ghost btn-icon btn-sm"><X aria-hidden="true" /></button>
        </div>
      )}

      <div className="rate-grid">
        <section className="card rate-current" aria-labelledby="rate-current-title">
          <header className="card-header">
            <h2 id="rate-current-title" className="section-title">{t("rate.current")}</h2>
            {current && <span className="badge badge-success"><CheckCircle aria-hidden="true" />{t("common.active")}</span>}
          </header>
          {current ? (
            <div className="card-body rate-current-body">
              <div className="rate-figure">
                <small>{t("rate.usdToFc")}</small>
                <strong>1 USD = {amount(current.rate)} FC</strong>
              </div>
              <div className="rate-figure is-secondary">
                <small>{t("rate.fcToUsd")}</small>
                <strong>1 000 FC = {amount(1000 / current.rate, 4)} USD</strong>
              </div>
              <dl className="rate-meta">
                <div><dt><Calendar aria-hidden="true" />{t("rate.effectiveSince")}</dt><dd>{date(current.effectiveFrom)}</dd></div>
                {current.createdBy?.username && <div><dt><User aria-hidden="true" />{t("rate.setBy")}</dt><dd>{current.createdBy.username}</dd></div>}
                {current.notes && <div className="is-wide"><dt>{t("rate.notes")}</dt><dd>{current.notes}</dd></div>}
              </dl>
            </div>
          ) : (
            <div className="card-body"><EmptyState title={t("rate.noneTitle")} icon={<ArrowLeftRight aria-hidden="true" />}>{t("rate.noneBody")}</EmptyState></div>
          )}
        </section>

        <section className="card rate-form" aria-labelledby="rate-form-title">
          <header className="card-header"><h2 id="rate-form-title" className="section-title">{t("rate.updateTitle")}</h2></header>
          <form onSubmit={handleSubmit} className="card-body rate-form-body">
            <label className="field">
              <span className="field-label">{t("rate.newRate")} *</span>
              <input className="input num" type="number" step="0.01" min="0.01" required value={form.rate}
                onChange={(event) => setForm({ ...form, rate: event.target.value })} placeholder={t("rate.newRatePlaceholder")} />
              <span className="field-hint">{t("rate.newRateHint")}</span>
            </label>
            {jump !== null && Math.abs(jump) >= 10 && (
              <div className="alert alert-warning" role="note"><TriangleAlert aria-hidden="true" /><span>{t("rate.jumpWarning", { value: formatNumber(Math.abs(jump), 1) })}</span></div>
            )}
            <label className="field">
              <span className="field-label">{t("rate.effectiveDate")}</span>
              <input className="input" type="datetime-local" value={form.effectiveFrom} onChange={(event) => setForm({ ...form, effectiveFrom: event.target.value })} />
              <span className="field-hint">{t("rate.effectiveDateHint")}</span>
            </label>
            <label className="field">
              <span className="field-label">{t("rate.notes")} {t("common.optional")}</span>
              <textarea className="input" rows={2} value={form.notes} onChange={(event) => setForm({ ...form, notes: event.target.value })} placeholder={t("rate.notesPlaceholder")} />
            </label>
            <button type="submit" disabled={submitting || !form.rate} className="btn btn-primary">
              {submitting ? <RefreshCw className="animate-spin" aria-hidden="true" /> : <Save aria-hidden="true" />}
              {submitting ? t("rate.updating") : t("rate.submit")}
            </button>
          </form>
        </section>

        <section className="card rate-history" aria-labelledby="rate-history-title">
          <header className="card-header">
            <h2 id="rate-history-title" className="section-title"><History aria-hidden="true" className="inline-icon" />{t("rate.history")}</h2>
            <span className="badge">{t("rate.historyCount", { count: history.length })}</span>
          </header>
          {history.length ? (
            <ul className="rate-history-list">
              {history.map((entry) => (
                <li key={entry._id} className={entry.isActive ? "is-active" : ""}>
                  <div><strong className="num">1 USD = {amount(entry.rate)} FC</strong>{entry.isActive && <span className="badge badge-success">{t("common.active")}</span>}</div>
                  <small>{date(entry.effectiveFrom)} · {entry.createdBy?.username || t("common.unknown")}</small>
                  {entry.notes && <small className="rate-history-note">{entry.notes}</small>}
                </li>
              ))}
            </ul>
          ) : (
            <div className="card-body"><EmptyState title={t("rate.noHistoryTitle")} icon={<History aria-hidden="true" />}>{t("rate.noHistoryBody")}</EmptyState></div>
          )}
        </section>
      </div>

      <aside className="card rate-help">
        <div className="card-body">
          <h3 className="section-title"><Info aria-hidden="true" className="inline-icon" />{t("rate.helpTitle")}</h3>
          <ul>
            <li>{t("rate.help1")}</li>
            <li>{t("rate.help2")}</li>
            <li>{t("rate.help3")}</li>
            <li>{t("rate.help4")}</li>
          </ul>
        </div>
      </aside>
    </div>
  );
}
