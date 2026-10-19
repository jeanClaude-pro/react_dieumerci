import { useState, type FormEvent } from "react";
import { AlertTriangle, ArrowDownToLine, SlidersHorizontal, X } from "lucide-react";
import Dialog from "../ui/Dialog";
import type { Product } from "../../types";
import { formatQuantity, requestJson } from "../../utils/inventoryFormat";
import { useTranslation } from "react-i18next";

type MovementKind = "restock" | "adjustment";

/**
 * Relative stock change (never an absolute overwrite): the server applies it
 * atomically, so a sale made while this dialog is open is never lost.
 */
export default function StockMovementDialog({ product, onClose, onSaved }: {
  product: Product;
  onClose: () => void;
  onSaved: (product: Product) => void;
}) {
  const { t } = useTranslation();
  const [kind, setKind] = useState<MovementKind>("restock");
  const [direction, setDirection] = useState<1 | -1>(1);
  const [quantity, setQuantity] = useState("");
  const [reason, setReason] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const amount = Number(quantity);
  const signed = kind === "restock" ? amount : amount * direction;
  const valid = Number.isFinite(amount) && amount > 0 && (kind === "restock" || reason.trim().length >= 3);
  const resulting = product.stock + (Number.isFinite(signed) ? signed : 0);

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!valid || saving) return;
    setSaving(true);
    setError(null);
    try {
      const updated = await requestJson<Product>(`products/${product._id}/stock-movements`, {
        method: "POST",
        body: JSON.stringify({ type: kind, quantity: signed, reason: reason.trim() }),
      });
      onSaved(updated);
    } catch (reasonError) {
      setError((reasonError as Error).message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog label={t("inventory.move.dialog", { name: product.name })} onClose={onClose}>
      <form className="max-w-lg stock-movement-form" onSubmit={submit}>
        <header className="alerts-dialog-header">
          <div className="min-w-0">
            <h2 className="section-title">{t("inventory.move.title")}</h2>
            <p className="text-sm text-gray-500 truncate">{t("inventory.move.subtitle", { name: product.name, stock: formatQuantity(product.stock), unit: product.unit })}</p>
          </div>
          <button type="button" className="btn btn-ghost btn-icon" aria-label={t("common.close")} onClick={onClose}><X aria-hidden="true" /></button>
        </header>
        <div className="alerts-dialog-body grid gap-4">
          <div className="segmented" role="radiogroup" aria-label={t("inventory.move.typeLabel")}>
            <button type="button" role="radio" aria-checked={kind === "restock"} onClick={() => setKind("restock")}><ArrowDownToLine aria-hidden="true" />{t("inventory.move.restock")}</button>
            <button type="button" role="radio" aria-checked={kind === "adjustment"} onClick={() => setKind("adjustment")}><SlidersHorizontal aria-hidden="true" />{t("inventory.move.adjustment")}</button>
          </div>

          {kind === "adjustment" && (
            <div className="segmented" role="radiogroup" aria-label={t("inventory.move.directionLabel")}>
              <button type="button" role="radio" aria-checked={direction === 1} onClick={() => setDirection(1)}>{t("inventory.move.add")}</button>
              <button type="button" role="radio" aria-checked={direction === -1} onClick={() => setDirection(-1)}>{t("inventory.move.remove")}</button>
            </div>
          )}

          <label className="field">
            <span className="field-label">{t("inventory.move.quantity", { unit: product.unit })} <span className="req">*</span></span>
            <input className="input num" type="number" inputMode="decimal" min="0" step="any" required value={quantity} onChange={(event) => setQuantity(event.target.value)} />
          </label>

          <label className="field">
            <span className="field-label">
              {kind === "restock" ? t("inventory.move.reference") : t("inventory.move.reason")}
              {kind === "adjustment" ? <span className="req"> *</span> : <span className="opt"> {t("common.optional")}</span>}
            </span>
            <input className="input" type="text" maxLength={300} value={reason} onChange={(event) => setReason(event.target.value)}
              placeholder={kind === "restock" ? t("inventory.move.referencePlaceholder") : t("inventory.move.reasonPlaceholder")} />
          </label>

          {amount > 0 && (
            <p className={`text-sm ${resulting < 0 ? "text-red-700" : "text-gray-600"} num`} aria-live="polite">
              {t("inventory.move.after")} <strong>{formatQuantity(resulting)} {product.unit}</strong>
              {resulting < 0 && ` — ${t("inventory.move.negative")}`}
            </p>
          )}

          {error && <div className="alert alert-danger" role="alert"><AlertTriangle aria-hidden="true" /><span>{error}</span></div>}

          <div className="dialog-actions">
            <button type="submit" className="btn btn-primary" disabled={!valid || saving || resulting < 0}>{saving ? t("common.saving") : t("inventory.move.save")}</button>
            <button type="button" className="btn btn-secondary" onClick={onClose}>{t("common.cancel")}</button>
          </div>
        </div>
      </form>
    </Dialog>
  );
}
