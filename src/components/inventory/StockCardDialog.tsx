import { useEffect, useState } from "react";
import { AlertTriangle, ClipboardList, Info, X } from "lucide-react";
import Dialog from "../ui/Dialog";
import { EmptyState, ErrorState, LoadingState } from "../ui/States";
import PeriodPicker from "./PeriodPicker";
import { initialPeriodSelection, usePeriodRange, type PeriodSelection } from "../../hooks/usePeriodRange";
import StockBridge from "./StockBridge";
import type { StockCardResponse } from "../../types/inventory";
import { periodQuery } from "../../utils/dashboardPeriod";
import { formatDateTime, formatQuantity, requestJson } from "../../utils/inventoryFormat";
import { productAvailabilityLabel } from "../../utils/productAvailability";
import { useTranslation } from "react-i18next";

/**
 * Fiche de stock: what happened to the physical quantity of one product.
 * Movements are summarized by inventory meaning; individual sale rows stay
 * in Sales History.
 */
export default function StockCardDialog({ productId, productName, onClose }: {
  productId: string;
  productName: string;
  onClose: () => void;
}) {
  const { t } = useTranslation();
  const [selection, setSelection] = useState<PeriodSelection>(() => initialPeriodSelection("month"));
  const range = usePeriodRange(selection);
  const [card, setCard] = useState<StockCardResponse | null>(null);
  // The period the displayed card belongs to: another period never shows its figures.
  const [cardKey, setCardKey] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [attempt, setAttempt] = useState(0);
  const rangeKey = range ? periodQuery(range) : null;

  useEffect(() => {
    if (!rangeKey) return;
    const controller = new AbortController();
    setLoading(true);
    setError(null);
    requestJson<StockCardResponse>(`products/${productId}/stock-card?${rangeKey}`, { signal: controller.signal })
      .then((result) => { setCard(result); setCardKey(rangeKey); })
      .catch((reason: Error) => { if (reason.name !== "AbortError") setError(reason.message); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [productId, rangeKey, attempt]);

  const product = card?.product;
  const status = product ? productAvailabilityLabel(product) : null;
  const unit = product?.unit || "pcs";
  const sameRange = card !== null && cardKey === rangeKey;

  return (
    <Dialog label={t("inventory.card.dialog", { name: productName })} onClose={onClose}>
      <section className="max-w-4xl stock-card">
        <header className="alerts-dialog-header">
          <div className="min-w-0">
            <p className="eyebrow"><ClipboardList aria-hidden="true" />{t("products.actions.card")}</p>
            <h2 className="section-title truncate">{productName}</h2>
          </div>
          <button type="button" className="btn btn-ghost btn-icon" aria-label={t("common.close")} onClick={onClose}><X aria-hidden="true" /></button>
        </header>

        <div className="alerts-dialog-body">
          {product && (
            <>
            {product.deleted && (
              <div className="alert alert-info mb-3" role="note">
                <Info aria-hidden="true" />
                <span>{t("inventory.card.deleted")}</span>
              </div>
            )}
            <dl className="stock-card-facts">
              <div><dt>{t("inventory.current")}</dt><dd className="num">{formatQuantity(product.stock)} {unit}</dd></div>
              <div><dt>{t("products.form.minStock")}</dt><dd className="num">{product.minStock ? `${formatQuantity(product.minStock)} ${unit}` : t("inventory.card.notSet")}</dd></div>
              <div><dt>{t("inventory.card.lastUpdate")}</dt><dd>{card?.summary.lastStockUpdatedAt ? formatDateTime(card.summary.lastStockUpdatedAt) : t("inventory.card.noUpdate")}</dd></div>
              <div><dt>{t("common.status")}</dt><dd>{status && <span className={`badge badge-${status.tone === "neutral" ? "info" : status.tone}`}>{status.label}</span>}</dd></div>
            </dl>
            </>
          )}

          <PeriodPicker value={selection} onChange={setSelection} range={range} />

          {error ? (
            <ErrorState title={t("inventory.card.error")} action={<button type="button" className="btn btn-secondary" onClick={() => setAttempt((value) => value + 1)}>{t("common.retry")}</button>}>{error}</ErrorState>
          ) : !card || !sameRange ? (
            range ? <LoadingState label={t("inventory.card.loading")} /> : null
          ) : (
            <div className={loading ? "is-refreshing" : ""} aria-busy={loading}>
              {card.integrity.consistent === false && (
                <div className="alert alert-danger mb-3" role="alert">
                  <AlertTriangle aria-hidden="true" />
                  <span>{t("inventory.card.mismatch", { stock: formatQuantity(card.summary.currentStock), ledger: formatQuantity(card.integrity.ledgerStock) })}</span>
                </div>
              )}
              {!card.coverage.openingKnown && (
                <div className="alert alert-info mb-3" role="note">
                  <Info aria-hidden="true" />
                  <span>
                    {card.coverage.baselineAt
                      ? t("inventory.card.trackingSince", { date: formatDateTime(card.coverage.baselineAt) })
                      : t("inventory.card.notTracked")}
                  </span>
                </div>
              )}

              {card.summary.flows ? (
                <StockBridge
                  opening={card.summary.opening}
                  closing={card.summary.closing}
                  flows={card.summary.flows}
                  unit={unit}
                  closingLabel={new Date(card.period.end) >= new Date() ? t("inventory.current") : t("inventory.closingPeriod")}
                />
              ) : (
                <EmptyState title={t("inventory.card.beforeTracking")} icon={<Info aria-hidden="true" />} />
              )}

              <h3 className="section-title mt-5 mb-2">{t("inventory.card.movements")}</h3>
              {!card.summary.flows ? (
                <EmptyState title={t("inventory.card.noMovement")} icon={<ClipboardList aria-hidden="true" />} />
              ) : (
                <dl className="stock-card-facts" aria-label={t("inventory.card.summaryAria")}>
                  <div><dt>{t("inventory.bridge.restock")}</dt><dd className="num">{formatQuantity(card.summary.flows.entries)} {unit}</dd></div>
                  <div><dt>{t("inventory.bridge.returns")}</dt><dd className="num">{formatQuantity(card.summary.flows.returns)} {unit}</dd></div>
                  <div><dt>{t("inventory.bridge.out")}</dt><dd className="num">{formatQuantity(card.summary.flows.piecesOut)} {unit}</dd></div>
                  <div><dt>{t("inventory.bridge.baseline")}</dt><dd className="num">{formatQuantity(card.summary.flows.baseline)} {unit}</dd></div>
                </dl>
              )}
            </div>
          )}
        </div>
      </section>
    </Dialog>
  );
}
