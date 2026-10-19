import { useCallback, useEffect, useState } from "react";
import { Check, Clock3, RefreshCw, ShieldCheck, X } from "lucide-react";
import { toast } from "react-toastify";
import { useAuth } from "../../hooks/useAuth";
import { serverUrl } from "../../utils/constants";
import { useTranslation } from "react-i18next";
import { formatDateTime, formatUSD } from "../../i18n/format";
import { serverMessage } from "../../i18n/serverMessages";

type Item = { productId: string; name: string; quantity: number; price: number; total: number };
type Snapshot = {
  customer: { name?: string; phone?: string; email?: string } | null;
  items: Item[];
  total: number;
  paymentMethod: string;
  isWalkIn: boolean;
};
type Approval = {
  _id: string;
  status: "pending";
  requestedByName: string;
  requestedAt: string;
  reason: string;
  original: Snapshot;
  proposed: Snapshot;
};
type QueueSale = { _id: string; saleId: string; saleNumber?: string; saleEditApproval: Approval };

const money = (value: number) => formatUSD(value || 0);
const dateTime = (value: string) => formatDateTime(value);

function ValueRow({ label, before, after }: { label: string; before: React.ReactNode; after: React.ReactNode }) {
  const changed = JSON.stringify(before) !== JSON.stringify(after);
  return <div className={`approval-value-row ${changed ? "is-changed" : ""}`}>
    <strong>{label}</strong><span>{before || "—"}</span><span>{after || "—"}</span>
  </div>;
}

export default function SaleEditApprovals() {
  const { t } = useTranslation();
  const payment = (value?: string) => (value ? t(`payment.${value}`, { defaultValue: value }) : "");
  const { token } = useAuth();
  const [queue, setQueue] = useState<QueueSale[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [notes, setNotes] = useState<Record<string, string>>({});

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(`${serverUrl}/sales/edit-approvals/pending`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(serverMessage(body.error, t("approvals.loadFailed")));
      setQueue(body.data || []);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("approvals.loadFailed"));
    } finally {
      setLoading(false);
    }
  }, [token, t]);

  useEffect(() => { void load(); }, [load]);

  const decide = async (sale: QueueSale, decision: "approved" | "rejected") => {
    setBusyId(sale._id);
    try {
      const response = await fetch(`${serverUrl}/sales/edit-approvals/${sale._id}/decision`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ decision, note: notes[sale._id] || "" }),
      });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(serverMessage(body.error, t("approvals.decisionFailed")));
      toast.success(serverMessage(body.message, decision === "approved" ? t("approvals.approved") : t("approvals.rejected")));
      setQueue((current) => current.filter((entry) => entry._id !== sale._id));
      window.dispatchEvent(new Event("salesUpdated"));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("approvals.decisionFailed"));
    } finally {
      setBusyId(null);
    }
  };

  return <div className="approval-page">
    <header className="approval-page-header">
      <div><span className="approval-eyebrow"><ShieldCheck aria-hidden="true" /> {t("approvals.eyebrow")}</span><h1>{t("approvals.title")}</h1><p>{t("approvals.subtitle")}</p></div>
      <button type="button" className="approval-refresh" onClick={() => void load()} disabled={loading}><RefreshCw className={loading ? "animate-spin" : ""} aria-hidden="true" /> {t("common.refresh")}</button>
    </header>

    {loading ? <div className="approval-empty"><RefreshCw className="animate-spin" aria-hidden="true" /><strong>{t("approvals.loading")}</strong></div>
      : queue.length === 0 ? <div className="approval-empty"><ShieldCheck aria-hidden="true" /><strong>{t("approvals.emptyTitle")}</strong><span>{t("approvals.emptyBody")}</span></div>
      : <div className="approval-list">{queue.map((sale) => {
        const request = sale.saleEditApproval;
        return <article className="approval-card" key={sale._id}>
          <div className="approval-card-header"><div><span className="approval-pending"><Clock3 aria-hidden="true" /> {t("approvals.pending")}</span><h2>{t("approvals.saleEdit", { id: sale.saleNumber || sale.saleId })}</h2><p>{t("approvals.requestedBy")} <strong>{request.requestedByName}</strong> · {dateTime(request.requestedAt)}</p></div></div>
          <div className="approval-reason"><strong>{t("approvals.reason")}</strong><p>{request.reason}</p></div>
          <div className="approval-compare-head"><span>{t("approvals.field")}</span><strong>{t("entryHistory.before")}</strong><strong>{t("entryHistory.after")}</strong></div>
          <ValueRow label={t("customers.col.customer")} before={request.original.customer?.name} after={request.proposed.customer?.name} />
          <ValueRow label={t("entryHistory.phone")} before={request.original.customer?.phone} after={request.proposed.customer?.phone} />
          <ValueRow label={t("entryHistory.col.payment")} before={payment(request.original.paymentMethod)} after={payment(request.proposed.paymentMethod)} />
          <ValueRow label={t("common.total")} before={money(request.original.total)} after={money(request.proposed.total)} />
          <div className="approval-items">
            <h3>{t("approvals.proposedItems")}</h3>
            {request.proposed.items.map((item, index) => {
              const before = request.original.items.find((old) => String(old.productId) === String(item.productId));
              return <div className="approval-item" key={`${item.productId}-${index}`}><span>{item.name}</span><span className={before?.quantity !== item.quantity ? "changed" : ""}>{before?.quantity ?? 0} → {item.quantity}</span><strong>{money(item.total)}</strong></div>;
            })}
          </div>
          <label className="approval-note">{t("approvals.note")}<textarea value={notes[sale._id] || ""} onChange={(event) => setNotes((current) => ({ ...current, [sale._id]: event.target.value }))} maxLength={500} placeholder={t("approvals.notePlaceholder")} /></label>
          <footer className="approval-actions"><button type="button" className="reject" disabled={busyId === sale._id} onClick={() => void decide(sale, "rejected")}><X aria-hidden="true" /> {t("sortieHistory.reject")}</button><button type="button" className="approve" disabled={busyId === sale._id} onClick={() => void decide(sale, "approved")}><Check aria-hidden="true" /> {t("approvals.approve")}</button></footer>
        </article>;
      })}</div>}
  </div>;
}
