import type { StockFlows } from "../../types/inventory";
import { formatQuantity, formatSigned } from "../../utils/inventoryFormat";
import { useTranslation } from "react-i18next";
import type { TFunction } from "i18next";

interface BridgeRow {
  key: string;
  label: string;
  hint?: string;
  value: number;
  sign: 1 | -1;
  optional?: boolean;
}

function bridgeRows(flows: StockFlows, t: TFunction): BridgeRow[] {
  const rows: BridgeRow[] = [
    { key: "restock", label: t("inventory.bridge.restock"), hint: t("inventory.bridge.restockHint"), value: flows.entries - flows.newProducts, sign: 1 },
    { key: "new", label: t("inventory.bridge.new"), hint: t("inventory.bridge.newHint"), value: flows.newProducts, sign: 1, optional: true },
    { key: "returns", label: t("inventory.bridge.returns"), hint: t("inventory.bridge.returnsHint"), value: flows.returns, sign: 1 },
    { key: "out", label: t("inventory.bridge.out"), hint: t("inventory.bridge.outHint"), value: flows.piecesOut, sign: -1 },
    { key: "adjIn", label: t("inventory.bridge.adjIn"), hint: t("inventory.bridge.adjInHint"), value: flows.adjustmentsIn, sign: 1, optional: true },
    { key: "adjOut", label: t("inventory.bridge.adjOut"), hint: t("inventory.bridge.adjOutHint"), value: flows.adjustmentsOut, sign: -1 },
    { key: "baseline", label: t("inventory.bridge.baseline"), hint: t("inventory.bridge.baselineHint"), value: flows.baseline, sign: 1, optional: true },
  ];
  return rows.filter((row) => !row.optional || row.value !== 0);
}

/**
 * Stock reconciliation: opening + every movement class = closing. Each flow
 * is a bar scaled to the largest flow, green for quantities in and rust for
 * quantities out; the sign is always written, so colour is never the only cue.
 */
export default function StockBridge({ opening, closing, flows, openingLabel, closingLabel, unit }: {
  opening: number | null;
  closing: number | null;
  flows: StockFlows;
  openingLabel?: string;
  closingLabel?: string;
  unit?: string;
}) {
  const { t } = useTranslation();
  const rows = bridgeRows(flows, t);
  const unitLabel = unit ?? t("inventory.pieces");
  const scale = Math.max(1, ...rows.map((row) => row.value));

  return (
    <div className="stock-bridge" role="table" aria-label={t("inventory.bridge.aria")}>
      <div className="stock-bridge-total" role="row">
        <span role="rowheader">{openingLabel ?? t("inventory.opening")}</span>
        <strong role="cell">{opening === null ? t("inventory.notReconstructible") : `${formatQuantity(opening)} ${unitLabel}`}</strong>
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
        <span role="rowheader">{closingLabel ?? t("inventory.closingPeriod")}</span>
        <strong role="cell">{closing === null ? t("inventory.notReconstructible") : `${formatQuantity(closing)} ${unitLabel}`}</strong>
      </div>
    </div>
  );
}
