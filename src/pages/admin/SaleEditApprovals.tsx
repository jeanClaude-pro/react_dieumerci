import { useCallback, useEffect, useState } from "react";
import { Check, Clock3, RefreshCw, ShieldCheck, X } from "lucide-react";
import { toast } from "react-toastify";
import { useAuth } from "../../hooks/useAuth";
import { serverUrl } from "../../utils/constants";

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

const money = (value: number) => `${new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 2 }).format(value || 0)} $`;
const dateTime = (value: string) => new Intl.DateTimeFormat("fr-FR", {
  dateStyle: "medium", timeStyle: "short", timeZone: "Africa/Lubumbashi",
}).format(new Date(value));

function ValueRow({ label, before, after }: { label: string; before: React.ReactNode; after: React.ReactNode }) {
  const changed = JSON.stringify(before) !== JSON.stringify(after);
  return <div className={`approval-value-row ${changed ? "is-changed" : ""}`}>
    <strong>{label}</strong><span>{before || "—"}</span><span>{after || "—"}</span>
  </div>;
}

export default function SaleEditApprovals() {
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
      if (!response.ok) throw new Error(body.error || "Chargement impossible");
      setQueue(body.data || []);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Chargement impossible");
    } finally {
      setLoading(false);
    }
  }, [token]);

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
      if (!response.ok) throw new Error(body.error || "Décision impossible");
      toast.success(body.message);
      setQueue((current) => current.filter((entry) => entry._id !== sale._id));
      window.dispatchEvent(new Event("salesUpdated"));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Décision impossible");
    } finally {
      setBusyId(null);
    }
  };

  return <div className="approval-page">
    <header className="approval-page-header">
      <div><span className="approval-eyebrow"><ShieldCheck /> Contrôle administrateur</span><h1>Approbation des modifications</h1><p>Comparez les valeurs originales et proposées avant d'autoriser toute modification opérationnelle.</p></div>
      <button className="approval-refresh" onClick={() => void load()} disabled={loading}><RefreshCw className={loading ? "animate-spin" : ""} /> Actualiser</button>
    </header>

    {loading ? <div className="approval-empty"><RefreshCw className="animate-spin" /><strong>Chargement des demandes…</strong></div>
      : queue.length === 0 ? <div className="approval-empty"><ShieldCheck /><strong>Aucune modification en attente</strong><span>Les nouvelles demandes des managers apparaîtront ici.</span></div>
      : <div className="approval-list">{queue.map((sale) => {
        const request = sale.saleEditApproval;
        return <article className="approval-card" key={sale._id}>
          <div className="approval-card-header"><div><span className="approval-pending"><Clock3 /> En attente d'approbation</span><h2>Modification de la vente #{sale.saleNumber || sale.saleId}</h2><p>Demandée par <strong>{request.requestedByName}</strong> · {dateTime(request.requestedAt)}</p></div></div>
          <div className="approval-reason"><strong>Motif du manager</strong><p>{request.reason}</p></div>
          <div className="approval-compare-head"><span>Donnée</span><strong>Avant</strong><strong>Après</strong></div>
          <ValueRow label="Client" before={request.original.customer?.name} after={request.proposed.customer?.name} />
          <ValueRow label="Téléphone" before={request.original.customer?.phone} after={request.proposed.customer?.phone} />
          <ValueRow label="Paiement" before={request.original.paymentMethod} after={request.proposed.paymentMethod} />
          <ValueRow label="Total" before={money(request.original.total)} after={money(request.proposed.total)} />
          <div className="approval-items">
            <h3>Articles proposés</h3>
            {request.proposed.items.map((item, index) => {
              const before = request.original.items.find((old) => String(old.productId) === String(item.productId));
              return <div className="approval-item" key={`${item.productId}-${index}`}><span>{item.name}</span><span className={before?.quantity !== item.quantity ? "changed" : ""}>{before?.quantity ?? 0} → {item.quantity}</span><strong>{money(item.total)}</strong></div>;
            })}
          </div>
          <label className="approval-note">Note de décision (facultative)<textarea value={notes[sale._id] || ""} onChange={(event) => setNotes((current) => ({ ...current, [sale._id]: event.target.value }))} maxLength={500} placeholder="Ajoutez un contexte pour l'audit…" /></label>
          <footer className="approval-actions"><button className="reject" disabled={busyId === sale._id} onClick={() => void decide(sale, "rejected")}><X /> Rejeter</button><button className="approve" disabled={busyId === sale._id} onClick={() => void decide(sale, "approved")}><Check /> Approuver et appliquer</button></footer>
        </article>;
      })}</div>}
  </div>;
}
