/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState } from "react";
import { useAuth } from "../hooks/useAuth";

interface SortieForm {
  reason: string;
  recipientName: string;
  recipientPhone: string;
  amount: string;
  paymentMethod: "cash" | "mpesa" | "bank" | "card" | "other";
  notes: string;
}

const API_BASE = import.meta.env.VITE_API_URL;

async function readJsonSafe(res: Response) {
  const ct = res.headers.get("content-type") || "";
  if (ct.includes("application/json")) return res.json();
  const text = await res.text();
  return { __nonJson: true, text };
}

export default function Sortie() {
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Get the current user from your auth context
  const { user: currentUser } = useAuth();

  const [form, setForm] = useState<SortieForm>({
    reason: "",
    recipientName: "",
    recipientPhone: "",
    amount: "",
    paymentMethod: "cash",
    notes: "",
  });

  const isFormValid =
    form.reason.trim() !== "" &&
    form.recipientName.trim() !== "" &&
    form.recipientPhone.trim() !== "" &&
    parseFloat(form.amount) > 0;

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  }

  function authHeader(): Record<string, string> {
    const token =
      localStorage.getItem("authToken") || localStorage.getItem("token") || "";
    return token ? { Authorization: `Bearer ${token}` } : {};
  }

  async function handleSortie(e: React.FormEvent) {
    e.preventDefault();
    if (!isFormValid) return;

    setSubmitting(true);
    setMessage(null);
    setError(null);

    try {
      const body = {
        reason: form.reason,
        recipientName: form.recipientName,
        recipientPhone: form.recipientPhone,
        amount: parseFloat(form.amount),
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

      const data = await readJsonSafe(res);
      if (!res.ok) {
        const msg =
          (data as any)?.error ||
          (data as any)?.text ||
          `Expense recording failed: ${res.status}`;
        throw new Error(msg);
      }

      // Reset form on success
      setForm({
        reason: "",
        recipientName: "",
        recipientPhone: "",
        amount: "",
        paymentMethod: "cash",
        notes: "",
      });

      setMessage("✅ Dépense enregistrée avec succès !");
    } catch (e: any) {
      setError(e?.message || "La dépense n'a pas pu être enregistrée");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex-1 p-6 overflow-auto">
      <h2 className="text-2xl font-bold mb-6 mt-6 ml-6">Nouvelle Sortie de Caisse</h2>

      {message && (
        <div className="mb-4 p-3 bg-green-100 text-green-700 rounded">
          {message}
        </div>
      )}
      {error && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">{error}</div>
      )}

      <div className="bg-white shadow-lg rounded-lg max-w-2xl mx-auto overflow-hidden">
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-6">
          <h3 className="text-xl font-semibold text-white text-center">
            Enregistrement de Dépense
          </h3>
          <p className="text-blue-100 text-center mt-2">
            Enregistrez les sorties de caisse pour le suivi des dépenses
          </p>
        </div>

        <form onSubmit={handleSortie} className="p-6 space-y-6">
          {/* Reason for Expense */}
          <div>
            <label className="block mb-2 font-medium text-gray-700">
              Raison de la dépense *
            </label>
            <input
              type="text"
              name="reason"
              value={form.reason}
              onChange={handleChange}
              placeholder="Ex: Achat fournitures bureau, Transport, etc."
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              required
            />
          </div>

          {/* Recipient Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block mb-2 font-medium text-gray-700">
                Nom du bénéficiaire *
              </label>
              <input
                type="text"
                name="recipientName"
                value={form.recipientName}
                onChange={handleChange}
                placeholder="Nom complet"
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                required
              />
            </div>

            <div>
              <label className="block mb-2 font-medium text-gray-700">
                Téléphone du bénéficiaire *
              </label>
              <input
                type="tel"
                name="recipientPhone"
                value={form.recipientPhone}
                onChange={handleChange}
                placeholder="Numéro de téléphone"
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                required
              />
            </div>
          </div>

          {/* Amount and Payment Method */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block mb-2 font-medium text-gray-700">
                Montant (USD) *
              </label>
              <input
                type="number"
                step="0.01"
                name="amount"
                value={form.amount}
                onChange={handleChange}
                placeholder="0.00"
                min="0.01"
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                required
              />
            </div>

            <div>
              <label className="block mb-2 font-medium text-gray-700">
                Méthode de paiement *
              </label>
              <select
                name="paymentMethod"
                value={form.paymentMethod}
                onChange={handleChange}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                required
              >
                <option value="cash">Cash</option>
                <option value="mpesa">M-Pesa ou Airtel Money</option>
                <option value="bank">Transfert Bancaire</option>
                <option value="card">Carte</option>
                <option value="other">Autre</option>
              </select>
            </div>
          </div>

          {/* Additional Notes */}
          <div>
            <label className="block mb-2 font-medium text-gray-700">
              Notes supplémentaires (optionnel)
            </label>
            <textarea
              name="notes"
              value={form.notes}
              onChange={handleChange}
              placeholder="Détails supplémentaires sur cette dépense..."
              rows={3}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
            />
          </div>

          {/* Recorded By */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <label className="block mb-1 text-sm font-medium text-gray-600">
              Enregistré par
            </label>
            <p className="text-gray-900 font-medium">
              {currentUser?.username || "Utilisateur"}
            </p>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={!isFormValid || submitting}
            className={`w-full py-3 px-4 rounded-lg text-white font-semibold transition-all ${
              isFormValid && !submitting
                ? "bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                : "bg-gray-400 cursor-not-allowed"
            }`}
          >
            {submitting ? (
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                Enregistrement...
              </div>
            ) : (
              "📝 Enregistrer la Dépense"
            )}
          </button>
        </form>

        {/* Info Box */}
        <div className="bg-blue-50 border-t border-blue-200 p-4">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-blue-800">
                Information importante
              </h3>
              <div className="mt-1 text-sm text-blue-700">
                <p>
                  Cette dépense sera enregistrée comme une sortie de caisse et ne sera pas comptabilisée dans les ventes.
                  Le reçu pourra être imprimé ultérieurement depuis l'historique des sorties.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}