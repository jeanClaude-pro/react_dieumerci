import { useEffect, useState } from "react";
import { serverUrl } from "../utils/constants";
import { Info, Landmark, Plus } from "lucide-react";
import PageHeader from "../components/ui/PageHeader";
import { EmptyState } from "../components/ui/States";
import type { CreditorHistory } from "../types/records";
import { useTranslation } from "react-i18next";
import { formatDate, formatUSD } from "../i18n/format";
import { serverMessage } from "../i18n/serverMessages";

type Creditor = { _id: string; name: string; type: "person" | "bank" | "company"; phone: string; address: string; isActive: boolean; totalBorrowed: number; totalRepaid: number; remainingBalance: number };
const headers = () => ({ "Content-Type": "application/json", Authorization: `Bearer ${localStorage.getItem("authToken") || localStorage.getItem("token") || ""}` });
const money = (n: number) => formatUSD(n || 0);

export default function Remboursements() {
  const { t } = useTranslation();
  const [creditors, setCreditors] = useState<Creditor[]>([]);
  const [selected, setSelected] = useState("");
  const [history, setHistory] = useState<CreditorHistory | null>(null);
  const [message, setMessage] = useState("");
  const [form, setForm] = useState({ name: "", type: "person", phone: "", address: "" });
  const [loan, setLoan] = useState({ enteredAmount: "", enteredCurrency: "USD", exchangeRate: "", borrowedAt: new Date().toISOString().slice(0, 10), reference: "", note: "" });

  const load = async () => { const r = await fetch(`${serverUrl}/creditors`, { headers: headers() }); if (r.ok) setCreditors(await r.json()); };
  const loadHistory = async (id: string) => { setSelected(id); const r = await fetch(`${serverUrl}/creditors/${id}/history`, { headers: headers() }); setHistory(r.ok ? await r.json() : null); };
  useEffect(() => { load(); }, []);
  const createCreditor = async (e: React.FormEvent) => { e.preventDefault(); const r = await fetch(`${serverUrl}/creditors`, { method: "POST", headers: headers(), body: JSON.stringify(form) }); const data = await r.json(); setMessage(r.ok ? t("debts.creditorAdded") : serverMessage(data.error)); if (r.ok) { setForm({ name: "", type: "person", phone: "", address: "" }); load(); } };
  const addLoan = async (e: React.FormEvent) => { e.preventDefault(); const amount = Number(loan.enteredAmount); const rate = loan.enteredCurrency === "FC" ? Number(loan.exchangeRate) : (Number(loan.exchangeRate) || 1); const body = { ...loan, enteredAmount: amount, exchangeRate: rate, amount: amount, amountUSD: loan.enteredCurrency === "FC" ? amount / rate : amount, amountFC: loan.enteredCurrency === "FC" ? amount : amount * rate }; const r = await fetch(`${serverUrl}/creditors/${selected}/loans`, { method: "POST", headers: headers(), body: JSON.stringify(body) }); const data = await r.json(); setMessage(r.ok ? t("debts.loanRecorded") : serverMessage(data.error)); if (r.ok) { setLoan({ ...loan, enteredAmount: "", reference: "", note: "" }); await load(); await loadHistory(selected); } };

  return <div className="page space-y-5">
    <PageHeader eyebrow={t("nav.sections.steering")} icon={<Landmark aria-hidden="true" />} title={t("debts.title")} description={t("debts.subtitle")} />
    {message && <div className="alert alert-info" role="status"><Info aria-hidden="true" /><span>{message}</span></div>}

    <form onSubmit={createCreditor} className="card">
      <div className="card-header"><h2 className="section-title">{t("debts.newCreditor")}</h2></div>
      <div className="card-body grid sm:grid-cols-2 lg:grid-cols-5 gap-4 items-end">
        <div className="field">
          <label htmlFor="creditor-name" className="field-label">{t("debts.name")} <span className="req" aria-hidden="true">*</span></label>
          <input id="creditor-name" required className="input" placeholder={t("debts.namePlaceholder")} value={form.name} onChange={e => setForm({...form, name:e.target.value})}/>
        </div>
        <div className="field">
          <label htmlFor="creditor-type" className="field-label">{t("debts.type")}</label>
          <select id="creditor-type" className="input" value={form.type} onChange={e => setForm({...form, type:e.target.value})}><option value="person">{t("debts.types.person")}</option><option value="bank">{t("debts.types.bank")}</option><option value="company">{t("debts.types.company")}</option></select>
        </div>
        <div className="field">
          <label htmlFor="creditor-phone" className="field-label">{t("debts.phone")}</label>
          <input id="creditor-phone" type="tel" className="input" placeholder="+243 …" value={form.phone} onChange={e => setForm({...form, phone:e.target.value})}/>
        </div>
        <div className="field">
          <label htmlFor="creditor-address" className="field-label">{t("debts.address")}</label>
          <input id="creditor-address" className="input" placeholder={t("debts.address")} value={form.address} onChange={e => setForm({...form, address:e.target.value})}/>
        </div>
        <button className="btn btn-primary"><Plus aria-hidden="true" />{t("debts.add")}</button>
      </div>
    </form>

    <div className="grid lg:grid-cols-3 gap-5 items-start">
      <section className="card overflow-hidden" aria-labelledby="creditors-title">
        <div className="card-header"><h2 id="creditors-title" className="section-title">{t("debts.creditors")}</h2><span className="badge num">{creditors.length}</span></div>
        {creditors.length === 0
          ? <EmptyState title={t("debts.noCreditor")} icon={<Landmark aria-hidden="true" />}>{t("debts.noCreditorHint")}</EmptyState>
          : <ul className="divide-y divide-gray-100">{creditors.map(c => <li key={c._id}><button type="button" onClick={() => loadHistory(c._id)} aria-pressed={selected===c._id} className={`w-full text-left px-5 py-3.5 transition-colors hover:bg-gray-50 ${selected===c._id?"bg-blue-50":""}`}>
              <div className="font-semibold text-sm flex items-center gap-2">{c.name} {!c.isActive && <span className="badge badge-danger">{t("debts.archived")}</span>}</div>
              <div className="text-xs text-gray-600 num mt-0.5">{t("debts.creditorLine", { debt: money(c.remainingBalance), borrowed: money(c.totalBorrowed) })}</div>
            </button></li>)}</ul>}
      </section>
      <div className="lg:col-span-2 space-y-5">
        {!selected && <div className="card"><EmptyState title={t("debts.selectCreditor")} icon={<Landmark aria-hidden="true" />}>{t("debts.selectCreditorHint")}</EmptyState></div>}
        {selected && <form onSubmit={addLoan} className="card">
          <div className="card-header"><h2 className="section-title">{t("debts.newLoan")}</h2></div>
          <div className="card-body grid sm:grid-cols-2 lg:grid-cols-3 gap-4 items-end">
            <div className="field">
              <label htmlFor="loan-amount" className="field-label">{t("debts.amount")} <span className="req" aria-hidden="true">*</span></label>
              <input id="loan-amount" required type="number" inputMode="decimal" min="0.01" step="0.01" className="input num" placeholder="0,00" value={loan.enteredAmount} onChange={e=>setLoan({...loan,enteredAmount:e.target.value})}/>
            </div>
            <div className="field">
              <label htmlFor="loan-currency" className="field-label">{t("debts.currency")}</label>
              <select id="loan-currency" className="input" value={loan.enteredCurrency} onChange={e=>setLoan({...loan,enteredCurrency:e.target.value})}><option>USD</option><option>FC</option></select>
            </div>
            <div className="field">
              <label htmlFor="loan-rate" className="field-label">{t("debts.rate")} {loan.enteredCurrency==="FC" && <span className="req" aria-hidden="true">*</span>}</label>
              <input id="loan-rate" required={loan.enteredCurrency==="FC"} type="number" inputMode="decimal" className="input num" placeholder={t("rate.newRatePlaceholder")} value={loan.exchangeRate} onChange={e=>setLoan({...loan,exchangeRate:e.target.value})}/>
            </div>
            <div className="field">
              <label htmlFor="loan-date" className="field-label">{t("debts.loanDate")}</label>
              <input id="loan-date" type="date" className="input" value={loan.borrowedAt} onChange={e=>setLoan({...loan,borrowedAt:e.target.value})}/>
            </div>
            <div className="field">
              <label htmlFor="loan-reference" className="field-label">{t("debts.reference")}</label>
              <input id="loan-reference" className="input" placeholder={t("debts.reference")} value={loan.reference} onChange={e=>setLoan({...loan,reference:e.target.value})}/>
            </div>
            <button className="btn btn-success">{t("debts.saveLoan")}</button>
          </div>
        </form>}
        {history && <section className="card" aria-labelledby="creditor-history-title">
          <div className="card-header"><h2 id="creditor-history-title" className="section-title">{t("debts.historyOf", { name: history.creditor.name })}</h2></div>
          <div className="card-body space-y-4">
            <div className="grid grid-cols-3 gap-3">
              <div className="metric-card"><span className="metric-label">{t("debts.borrowed")}</span><span className="metric-value">{money(history.reconciliation.borrowed)}</span></div>
              <div className="metric-card"><span className="metric-label">{t("debts.repaid")}</span><span className="metric-value">{money(history.reconciliation.repaid)}</span></div>
              <div className="metric-card"><span className="metric-label">{t("debts.balance")}</span><span className="metric-value">{money(history.reconciliation.storedOutstanding)}</span></div>
            </div>
            <ul className="space-y-2 num">
              {history.loans.map((x)=><li key={x._id} className="flex items-center justify-between gap-3 px-3 py-2 rounded-lg border border-green-200 bg-green-50 text-sm"><span className="font-medium text-green-800">{t("debts.loan")}</span><span>{money(x.amountUSD)} · {formatDate(x.borrowedAt)}</span></li>)}
              {history.repayments.map((x)=><li key={x._id} className="flex items-center justify-between gap-3 px-3 py-2 rounded-lg border border-amber-200 bg-amber-50 text-sm"><span className="font-medium text-amber-800">{t("debts.repayment")}</span><span>{money(x.amountUSD)} · {t(`expenses.status.${x.status}`, { defaultValue: x.status })}</span></li>)}
              {!history.loans.length && !history.repayments.length && <li className="text-sm text-gray-500">{t("debts.noMovement")}</li>}
            </ul>
          </div>
        </section>}
      </div>
    </div>
  </div>;
}
