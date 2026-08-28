import { useEffect, useState } from "react";
import { serverUrl } from "../utils/constants";

type Creditor = { _id: string; name: string; type: "person" | "bank" | "company"; phone: string; address: string; isActive: boolean; totalBorrowed: number; totalRepaid: number; remainingBalance: number };
const headers = () => ({ "Content-Type": "application/json", Authorization: `Bearer ${localStorage.getItem("authToken") || localStorage.getItem("token") || ""}` });
const money = (n: number) => new Intl.NumberFormat("fr-FR", { style: "currency", currency: "USD" }).format(n || 0);

export default function Remboursements() {
  const [creditors, setCreditors] = useState<Creditor[]>([]);
  const [selected, setSelected] = useState("");
  const [history, setHistory] = useState<any>(null);
  const [message, setMessage] = useState("");
  const [form, setForm] = useState({ name: "", type: "person", phone: "", address: "" });
  const [loan, setLoan] = useState({ enteredAmount: "", enteredCurrency: "USD", exchangeRate: "", borrowedAt: new Date().toISOString().slice(0, 10), reference: "", note: "" });

  const load = async () => { const r = await fetch(`${serverUrl}/creditors`, { headers: headers() }); if (r.ok) setCreditors(await r.json()); };
  const loadHistory = async (id: string) => { setSelected(id); const r = await fetch(`${serverUrl}/creditors/${id}/history`, { headers: headers() }); setHistory(r.ok ? await r.json() : null); };
  useEffect(() => { load(); }, []);
  const createCreditor = async (e: React.FormEvent) => { e.preventDefault(); const r = await fetch(`${serverUrl}/creditors`, { method: "POST", headers: headers(), body: JSON.stringify(form) }); const data = await r.json(); setMessage(r.ok ? "Créancier ajouté." : data.error); if (r.ok) { setForm({ name: "", type: "person", phone: "", address: "" }); load(); } };
  const addLoan = async (e: React.FormEvent) => { e.preventDefault(); const amount = Number(loan.enteredAmount); const rate = loan.enteredCurrency === "FC" ? Number(loan.exchangeRate) : (Number(loan.exchangeRate) || 1); const body = { ...loan, enteredAmount: amount, exchangeRate: rate, amount: amount, amountUSD: loan.enteredCurrency === "FC" ? amount / rate : amount, amountFC: loan.enteredCurrency === "FC" ? amount : amount * rate }; const r = await fetch(`${serverUrl}/creditors/${selected}/loans`, { method: "POST", headers: headers(), body: JSON.stringify(body) }); const data = await r.json(); setMessage(r.ok ? "Emprunt enregistré." : data.error); if (r.ok) { setLoan({ ...loan, enteredAmount: "", reference: "", note: "" }); await load(); await loadHistory(selected); } };

  return <div className="p-6 space-y-6 max-w-7xl mx-auto">
    <div><h1 className="text-2xl font-bold">Remboursements et dettes</h1><p className="text-gray-600">Suivi administratif des créanciers, emprunts et remboursements validés.</p></div>
    {message && <div className="rounded-lg bg-blue-50 border border-blue-200 p-3">{message}</div>}
    <form onSubmit={createCreditor} className="bg-white border rounded-xl p-4 grid md:grid-cols-5 gap-3">
      <input required className="border rounded p-2" placeholder="Nom du créancier" value={form.name} onChange={e => setForm({...form, name:e.target.value})}/>
      <select className="border rounded p-2" value={form.type} onChange={e => setForm({...form, type:e.target.value})}><option value="person">Personne</option><option value="bank">Banque</option><option value="company">Entreprise</option></select>
      <input className="border rounded p-2" placeholder="Téléphone" value={form.phone} onChange={e => setForm({...form, phone:e.target.value})}/>
      <input className="border rounded p-2" placeholder="Adresse" value={form.address} onChange={e => setForm({...form, address:e.target.value})}/>
      <button className="bg-blue-600 text-white rounded p-2">Ajouter</button>
    </form>
    <div className="grid lg:grid-cols-3 gap-5">
      <div className="bg-white border rounded-xl overflow-hidden"><h2 className="font-semibold p-4 border-b">Créanciers</h2>{creditors.map(c => <button key={c._id} onClick={() => loadHistory(c._id)} className={`w-full text-left p-4 border-b hover:bg-gray-50 ${selected===c._id?"bg-blue-50":""}`}><div className="font-semibold">{c.name} {!c.isActive && <span className="text-xs text-red-600">Archivé</span>}</div><div className="text-sm text-gray-600">Dette: {money(c.remainingBalance)} · Emprunté: {money(c.totalBorrowed)}</div></button>)}</div>
      <div className="lg:col-span-2 space-y-5">
        {selected && <form onSubmit={addLoan} className="bg-white border rounded-xl p-4 grid md:grid-cols-3 gap-3"><h2 className="font-semibold md:col-span-3">Nouvel emprunt</h2><input required type="number" min="0.01" step="0.01" className="border rounded p-2" placeholder="Montant" value={loan.enteredAmount} onChange={e=>setLoan({...loan,enteredAmount:e.target.value})}/><select className="border rounded p-2" value={loan.enteredCurrency} onChange={e=>setLoan({...loan,enteredCurrency:e.target.value})}><option>USD</option><option>FC</option></select><input required={loan.enteredCurrency==="FC"} type="number" className="border rounded p-2" placeholder="Taux USD/FC" value={loan.exchangeRate} onChange={e=>setLoan({...loan,exchangeRate:e.target.value})}/><input type="date" className="border rounded p-2" value={loan.borrowedAt} onChange={e=>setLoan({...loan,borrowedAt:e.target.value})}/><input className="border rounded p-2" placeholder="Référence" value={loan.reference} onChange={e=>setLoan({...loan,reference:e.target.value})}/><button className="bg-emerald-600 text-white rounded p-2">Enregistrer l'emprunt</button></form>}
        {history && <div className="bg-white border rounded-xl p-4"><h2 className="font-semibold mb-3">Historique — {history.creditor.name}</h2><div className="grid grid-cols-3 gap-2 mb-4 text-sm"><div>Emprunté<br/><b>{money(history.reconciliation.borrowed)}</b></div><div>Remboursé<br/><b>{money(history.reconciliation.repaid)}</b></div><div>Solde<br/><b>{money(history.reconciliation.storedOutstanding)}</b></div></div><div className="space-y-2">{history.loans.map((x:any)=><div key={x._id} className="p-2 bg-green-50 rounded">Emprunt {money(x.amountUSD)} · {new Date(x.borrowedAt).toLocaleDateString("fr-FR")}</div>)}{history.repayments.map((x:any)=><div key={x._id} className="p-2 bg-orange-50 rounded">Remboursement {money(x.amountUSD)} · {x.status}</div>)}</div></div>}
      </div>
    </div>
  </div>;
}
