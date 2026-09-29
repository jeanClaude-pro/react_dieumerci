import type { StockFlows } from "../../types/inventory";
import { formatQuantity, formatSigned } from "../../utils/inventoryFormat";

interface BridgeRow {
  key: string;
  label: string;
  hint?: string;
  value: number;
  sign: 1 | -1;
  optional?: boolean;
}

function bridgeRows(flows: StockFlows): BridgeRow[] {
  const rows: BridgeRow[] = [
    { key: "restock", label: "Entrées en stock", hint: "Réapprovisionnements", value: flows.entries - flows.newProducts, sign: 1 },
    { key: "new", label: "Nouveaux articles", hint: "Stock saisi à la création", value: flows.newProducts, sign: 1, optional: true },
    { key: "returns", label: "Retours", hint: "Ventes antérieures annulées ou réduites", value: flows.returns, sign: 1 },
    { key: "out", label: "Sorties", hint: "Ventes, nettes des annulations de la période", value: flows.piecesOut, sign: -1 },
    { key: "adjIn", label: "Corrections +", hint: "Inventaire, erreurs de saisie", value: flows.adjustmentsIn, sign: 1, optional: true },
    { key: "adjOut", label: "Corrections −", hint: "Pertes, casse, articles supprimés", value: flows.adjustmentsOut, sign: -1 },
    { key: "baseline", label: "Solde de reprise", hint: "Stock existant au début du suivi", value: flows.baseline, sign: 1, optional: true },
  ];
  return rows.filter((row) => !row.optional || row.value !== 0);
}

/**
 * Stock reconciliation: opening + every movement class = closing. Each flow
 * is a bar scaled to the largest flow, blue for quantities in and orange for
 * quantities out; the sign is always written, so colour is never the only cue.
 */
export default function StockBridge({ opening, closing, flows, openingLabel = "Stock au début", closingLabel = "Stock en fin de période", unit = "pièces" }: {
  opening: number | null;
  closing: number | null;
  flows: StockFlows;
  openingLabel?: string;
  closingLabel?: string;
  unit?: string;
}) {
  const rows = bridgeRows(flows);
  const scale = Math.max(1, ...rows.map((row) => row.value));

  return (
    <div className="stock-bridge" role="table" aria-label="Bilan du stock de la période">
      <div className="stock-bridge-total" role="row">
        <span role="rowheader">{openingLabel}</span>
        <strong role="cell">{opening === null ? "Non reconstructible" : `${formatQuantity(opening)} ${unit}`}</strong>
      </div>
      {rows.map((row) => {
        const signed = row.value * row.sign;
        return (
          <div key={row.key} className={`stock-bridge-row ${row.value === 0 ? "is-zero" : ""}`} role="row">
            <span className="stock-bridge-label" role="rowheader">
              <span>{row.label}</span>
              {row.hint && <small>{row.hint}</small>}
            </span>
            <span className="stock-bridge-track" role="presentation">
              {row.value > 0 && (
                <span
                  className={`stock-bridge-bar ${row.sign > 0 ? "is-in" : "is-out"}`}
                  style={{ width: `${Math.max(2, (row.value / scale) * 100)}%` }}
                />
              )}
            </span>
            <span className="stock-bridge-value num" role="cell">{formatSigned(signed)}</span>
          </div>
        );
      })}
      <div className="stock-bridge-total is-closing" role="row">
        <span role="rowheader">{closingLabel}</span>
        <strong role="cell">{closing === null ? "Non reconstructible" : `${formatQuantity(closing)} ${unit}`}</strong>
      </div>
    </div>
  );
}
