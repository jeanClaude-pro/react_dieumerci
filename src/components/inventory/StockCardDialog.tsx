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
    <Dialog label={`Fiche de stock — ${productName}`} onClose={onClose}>
      <section className="max-w-4xl stock-card">
        <header className="alerts-dialog-header">
          <div className="min-w-0">
            <p className="eyebrow"><ClipboardList aria-hidden="true" />Fiche de stock</p>
            <h2 className="section-title truncate">{productName}</h2>
          </div>
          <button type="button" className="btn btn-ghost btn-icon" aria-label="Fermer" onClick={onClose}><X aria-hidden="true" /></button>
        </header>

        <div className="alerts-dialog-body">
          {product && (
            <>
            {product.deleted && (
              <div className="alert alert-info mb-3" role="note">
                <Info aria-hidden="true" />
                <span>Cet article a été supprimé du catalogue. Sa fiche historique reste disponible à partir des instantanés du registre.</span>
              </div>
            )}
            <dl className="stock-card-facts">
              <div><dt>Stock actuel</dt><dd className="num">{formatQuantity(product.stock)} {unit}</dd></div>
              <div><dt>Stock minimum</dt><dd className="num">{product.minStock ? `${formatQuantity(product.minStock)} ${unit}` : "Non défini"}</dd></div>
              <div><dt>Dernière mise à jour du stock</dt><dd>{card?.summary.lastStockUpdatedAt ? formatDateTime(card.summary.lastStockUpdatedAt) : "Aucune depuis le début du suivi"}</dd></div>
              <div><dt>Statut</dt><dd>{status && <span className={`badge badge-${status.tone === "neutral" ? "info" : status.tone}`}>{status.label}</span>}</dd></div>
            </dl>
            </>
          )}

          <PeriodPicker value={selection} onChange={setSelection} range={range} />

          {error ? (
            <ErrorState title="Impossible de charger la fiche de stock" action={<button type="button" className="btn btn-secondary" onClick={() => setAttempt((value) => value + 1)}>Réessayer</button>}>{error}</ErrorState>
          ) : !card || !sameRange ? (
            range ? <LoadingState label="Chargement de la fiche de stock…" /> : null
          ) : (
            <div className={loading ? "is-refreshing" : ""} aria-busy={loading}>
              {card.integrity.consistent === false && (
                <div className="alert alert-danger mb-3" role="alert">
                  <AlertTriangle aria-hidden="true" />
                  <span>Écart détecté : le stock enregistré ({formatQuantity(card.summary.currentStock)}) ne correspond pas à la somme des mouvements ({formatQuantity(card.integrity.ledgerStock)}). Le stock a été modifié hors de l'application ; vérifiez-le par un inventaire.</span>
                </div>
              )}
              {!card.coverage.openingKnown && (
                <div className="alert alert-info mb-3" role="note">
                  <Info aria-hidden="true" />
                  <span>
                    {card.coverage.baselineAt
                      ? <>Le suivi de cet article a commencé le <strong>{formatDateTime(card.coverage.baselineAt)}</strong> avec un solde de reprise. Le stock antérieur n'est pas connu avec exactitude.</>
                      : <>Cet article n'est pas encore couvert par le suivi du stock.</>}
                  </span>
                </div>
              )}

              {card.summary.flows ? (
                <StockBridge
                  opening={card.summary.opening}
                  closing={card.summary.closing}
                  flows={card.summary.flows}
                  unit={unit}
                  closingLabel={new Date(card.period.end) >= new Date() ? "Stock actuel" : "Stock en fin de période"}
                />
              ) : (
                <EmptyState title="Période antérieure au suivi de cet article" icon={<Info aria-hidden="true" />} />
              )}

              <h3 className="section-title mt-5 mb-2">Mouvements</h3>
              {!card.summary.flows ? (
                <EmptyState title="Aucun mouvement de stock pour cette période." icon={<ClipboardList aria-hidden="true" />} />
              ) : (
                <dl className="stock-card-facts" aria-label="Résumé des mouvements de stock">
                  <div><dt>Entrées en stock</dt><dd className="num">{formatQuantity(card.summary.flows.entries)} {unit}</dd></div>
                  <div><dt>Retours</dt><dd className="num">{formatQuantity(card.summary.flows.returns)} {unit}</dd></div>
                  <div><dt>Sorties</dt><dd className="num">{formatQuantity(card.summary.flows.piecesOut)} {unit}</dd></div>
                  <div><dt>Solde de reprise</dt><dd className="num">{formatQuantity(card.summary.flows.baseline)} {unit}</dd></div>
                </dl>
              )}
            </div>
          )}
        </div>
      </section>
    </Dialog>
  );
}
