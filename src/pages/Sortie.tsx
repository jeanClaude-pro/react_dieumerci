import React, { useState, useEffect } from "react";
import PageHeader from "../components/ui/PageHeader";
import ExchangeRateChip from "../components/ui/ExchangeRateChip";
import { useAuth } from "../hooks/useAuth";
import { AlertTriangle, Calculator, CheckCircle2, CircleArrowUp } from "lucide-react";
import { useTranslation } from "react-i18next";
import { formatFC, formatNumber, formatUSD } from "../i18n/format";
import { serverMessage } from "../i18n/serverMessages";
import { serverUrl } from "../utils/constants";
import { createAmountSnapshot } from "../utils/salePricing";

interface SortieForm {
  expenseType: "normal" | "repayment";
  creditorId: string;
  reason: string;
  recipientName: string;
  recipientPhone: string;
  amount: string;
  amountInFC: string;
  paymentMethod: "cash" | "mpesa" | "bank" | "card" | "other";
  notes: string;
  currencyMode: "usd" | "fc";
}

interface ExchangeRate {
  rate: number;
  effectiveFrom: string;
  lastUpdated: string;
}

const API_BASE = serverUrl;

async function readJsonSafe(res: Response) {
  const ct = res.headers.get("content-type") || "";
  if (ct.includes("application/json")) return res.json();
  const text = await res.text();
  return { __nonJson: true, text };
}

export default function Sortie() {
  const { t } = useTranslation();
  const [creditors, setCreditors] = useState<Array<{_id:string; name:string; type:string; phone?:string}>>([]);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [exchangeRate, setExchangeRate] = useState<ExchangeRate | null>(null);
  const [loadingRate, setLoadingRate] = useState(true);

  // Get the current user from your auth context
  const { user: currentUser } = useAuth();

  const [form, setForm] = useState<SortieForm>({
    expenseType: "normal",
    creditorId: "",
    reason: "",
    recipientName: "",
    recipientPhone: "",
    amount: "",
    amountInFC: "",
    paymentMethod: "cash",
    notes: "",
    currencyMode: "usd",
  });

  // Load exchange rate
  const loadExchangeRate = async () => {
    try {
      setLoadingRate(true);
      const response = await fetch(`${API_BASE}/exchange-rates/current`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token') || ''}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setExchangeRate(data);
      } else {
        console.warn('Failed to load exchange rate');
      }
    } catch (error) {
      console.error('Error loading exchange rate:', error);
    } finally {
      setLoadingRate(false);
    }
  };

  useEffect(() => {
    loadExchangeRate();
    fetch(`${API_BASE}/creditors/selector`, { headers: authHeader() }).then(r => r.ok ? r.json() : []).then(setCreditors).catch(() => setCreditors([]));
  }, []);

  // Calculate USD amount when FC amount changes
  useEffect(() => {
    if (form.currencyMode === "fc" && form.amountInFC && exchangeRate) {
      const fcAmount = parseFloat(form.amountInFC) || 0;
      const usdAmount = fcAmount / exchangeRate.rate;
      setForm(prev => ({
        ...prev,
        amount: usdAmount.toFixed(2)
      }));
    }
  }, [form.amountInFC, form.currencyMode, exchangeRate]);

  // Calculate FC amount when USD amount changes
  useEffect(() => {
    if (form.currencyMode === "usd" && form.amount && exchangeRate) {
      const usdAmount = parseFloat(form.amount) || 0;
      const fcAmount = usdAmount * exchangeRate.rate;
      setForm(prev => ({
        ...prev,
        amountInFC: Math.round(fcAmount).toString()
      }));
    }
  }, [form.amount, form.currencyMode, exchangeRate]);

  const isFormValid =
    (form.expenseType === "normal" || form.creditorId !== "") &&
    form.reason.trim() !== "" &&
    form.recipientName.trim() !== "" &&
    (form.expenseType === "repayment" || form.recipientPhone.trim() !== "") &&
    parseFloat(form.amount) > 0;

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  }

  // Toggle between USD and FC input modes
  const toggleCurrencyMode = () => {
    setForm(prev => ({
      ...prev,
      currencyMode: prev.currencyMode === "usd" ? "fc" : "usd",
      amount: "",
      amountInFC: ""
    }));
  };

  function authHeader(): Record<string, string> {
    const token =
      localStorage.getItem("authToken") || localStorage.getItem("token") || "";
    return token ? { Authorization: `Bearer ${token}` } : {};
  }

  const formatCurrency = (amount: number) => formatUSD(amount);
  const formatFc = (amount: number) => formatFC(amount);

  async function handleSortie(e: React.FormEvent) {
    e.preventDefault();
    if (!isFormValid) return;

    setSubmitting(true);
    setMessage(null);
    setError(null);

    try {
      const amountSnapshot = createAmountSnapshot(
        parseFloat(form.currencyMode === "fc" ? form.amountInFC : form.amount),
        form.currencyMode === "fc" ? "FC" : "USD",
        exchangeRate?.rate
      );
      const body = {
        expenseType: form.expenseType,
        creditorId: form.expenseType === "repayment" ? form.creditorId : undefined,
        reason: form.reason,
        recipientName: form.recipientName,
        recipientPhone: form.recipientPhone,
        amount: amountSnapshot.amountUSD,
        ...amountSnapshot,
        paymentMethod: form.paymentMethod,
        notes: form.notes || "",
        recordedBy: currentUser?.username || "unknown",
      };

      // ✅ Changed from /sales to /expenses
      const res = await fetch(`${API_BASE}/expenses`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...authHeader(),
        },
        body: JSON.stringify(body),
      });

      const data = (await readJsonSafe(res)) as { error?: string; text?: string };
      if (!res.ok) {
        throw new Error(serverMessage(data?.error || data?.text, t("sortie.failedStatus", { status: res.status })));
      }

      // Reset form on success
      setForm({
        expenseType: "normal",
        creditorId: "",
        reason: "",
        recipientName: "",
        recipientPhone: "",
        amount: "",
        amountInFC: "",
        paymentMethod: "cash",
        notes: "",
        currencyMode: "usd",
      });

      setMessage(t("sortie.success"));
    } catch (e: unknown) {
      setError(e instanceof Error && e.message ? e.message : t("sortie.failed"));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="page page-narrow cash-form-page">
      <PageHeader
        eyebrow={t("nav.sections.cash")}
        icon={<CircleArrowUp aria-hidden="true" />}
        title={t("sortie.title")}
        description={t("sortie.subtitle")}
        actions={<ExchangeRateChip loading={loadingRate} rate={exchangeRate} />}
      />

      {message && <div className="alert alert-success" role="status"><CheckCircle2 aria-hidden="true" /><span>{message}</span></div>}
      {error && <div className="alert alert-danger" role="alert"><AlertTriangle aria-hidden="true" /><span>{error}</span></div>}

      <form onSubmit={handleSortie} className="card cash-form">
        <header className="card-header">
          <div>
            <h2 className="section-title">{t("sortie.formTitle")}</h2>
            <p className="section-help">{t("sortie.formHelp")}</p>
          </div>
        </header>
        <div className="card-body cash-form-body">
          <fieldset className="form-section">
            <legend>{t("sortie.sectionWhat")}</legend>
            <div className="form-row">
              <label className="field">
                <span className="field-label">{t("sortie.type")} *</span>
                <select className="input" value={form.expenseType} onChange={(e) => setForm({ ...form, expenseType: e.target.value as "normal" | "repayment", creditorId: "" })}>
                  <option value="normal">{t("sortie.types.normal")}</option>
                  <option value="repayment">{t("sortie.types.repayment")}</option>
                </select>
              </label>
              {form.expenseType === "repayment" && (
                <label className="field">
                  <span className="field-label">{t("sortie.creditor")} *</span>
                  <select className="input" required value={form.creditorId} onChange={(e) => {
                    const c = creditors.find((x) => x._id === e.target.value);
                    setForm({ ...form, creditorId: e.target.value, reason: c ? t("sortie.repaymentReason", { name: c.name }) : form.reason, recipientName: c?.name || form.recipientName, recipientPhone: c?.phone || form.recipientPhone });
                  }}>
                    <option value="">{t("sortie.select")}</option>
                    {creditors.map((c) => <option key={c._id} value={c._id}>{c.name} ({t(`debts.types.${c.type}`, { defaultValue: c.type })})</option>)}
                  </select>
                  <span className="field-hint">{t("sortie.creditorHint")}</span>
                </label>
              )}
            </div>
            <label className="field">
              <span className="field-label">{t("sortie.reason")} *</span>
              <input className="input" type="text" name="reason" value={form.reason} onChange={handleChange} placeholder={t("sortie.reasonPlaceholder")} required />
            </label>
          </fieldset>

          <fieldset className="form-section">
            <legend>{t("sortie.sectionWho")}</legend>
            <div className="form-row">
              <label className="field">
                <span className="field-label">{t("sortie.recipientName")} *</span>
                <input className="input" type="text" name="recipientName" value={form.recipientName} onChange={handleChange} placeholder={t("sortie.recipientNamePlaceholder")} required />
              </label>
              <label className="field">
                <span className="field-label">{t("sortie.recipientPhone")}{form.expenseType === "repayment" ? "" : " *"}</span>
                <input className="input" type="tel" name="recipientPhone" value={form.recipientPhone} onChange={handleChange} placeholder={t("sortie.recipientPhonePlaceholder")} required={form.expenseType !== "repayment"} />
              </label>
            </div>
          </fieldset>

          <fieldset className="form-section">
            <legend>{t("sortie.sectionAmount")}</legend>
            <div className="form-row">
              <div className="field">
                <div className="field-label-row">
                  <span className="field-label">{t("sortie.amount")} ({form.currencyMode === "usd" ? "USD" : "FC"}) *</span>
                  <button type="button" onClick={toggleCurrencyMode} className="btn btn-ghost btn-sm">
                    <Calculator aria-hidden="true" />{form.currencyMode === "usd" ? "USD → FC" : "FC → USD"}
                  </button>
                </div>
                {form.currencyMode === "usd" ? (
                  <input aria-label={`${t("sortie.amount")} *`} className="input num" type="number" step="0.01" name="amount" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} placeholder="0.00" min="0.01" required />
                ) : (
                  <input aria-label={`${t("sortie.amount")} *`} className="input num" type="number" name="amountInFC" value={form.amountInFC} onChange={(e) => setForm({ ...form, amountInFC: e.target.value })} placeholder="0" min="1" required />
                )}
                {form.amount && form.currencyMode === "usd" && exchangeRate && <span className="field-hint num">≈ {formatFc(parseFloat(form.amount) * exchangeRate.rate)}</span>}
                {form.amountInFC && form.currencyMode === "fc" && exchangeRate && <span className="field-hint num">≈ {formatCurrency(parseFloat(form.amountInFC) / exchangeRate.rate)}</span>}
              </div>
              <label className="field">
                <span className="field-label">{t("sortie.paymentMethod")} *</span>
                <select className="input" name="paymentMethod" value={form.paymentMethod} onChange={handleChange} required>
                  <option value="cash">{t("payment.cash")}</option>
                  <option value="mpesa">{t("sortie.methods.mpesa")}</option>
                  <option value="bank">{t("sortie.methods.bank")}</option>
                  <option value="card">{t("payment.card")}</option>
                  <option value="other">{t("payment.other")}</option>
                </select>
              </label>
            </div>
            {form.amount && exchangeRate && (
              <div className="amount-summary">
                <div><small>{t("sortie.amountUsd")}</small><strong>{formatCurrency(parseFloat(form.amount))}</strong></div>
                <div><small>{t("sortie.amountFc")}</small><strong>{formatFc(parseFloat(form.amount) * exchangeRate.rate)}</strong></div>
              </div>
            )}
            <label className="field">
              <span className="field-label">{t("sortie.notes")} {t("common.optional")}</span>
              <textarea className="input" name="notes" value={form.notes} onChange={handleChange} placeholder={t("sortie.notesPlaceholder")} rows={2} />
            </label>
          </fieldset>

          <div className="readonly-field"><span>{t("sortie.recordedBy")}</span><strong>{currentUser?.username || t("sortie.user")}</strong></div>
          <p className="field-hint">{t("sortie.info")}{exchangeRate ? ` ${t("sortie.rateUsed", { rate: formatNumber(exchangeRate.rate, 2) })}` : ""}</p>
        </div>
        <footer className="dialog-foot">
          <button type="submit" disabled={!isFormValid || submitting} className="btn btn-primary btn-lg">
            {submitting ? t("common.saving") : t("sortie.submit")}
          </button>
        </footer>
      </form>
    </div>
  );
}
