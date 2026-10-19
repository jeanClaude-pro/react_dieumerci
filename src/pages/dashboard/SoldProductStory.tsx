import { useMemo, useState } from "react";
import { BookOpenText, Boxes, PackageX, Table2, TrendingDown } from "lucide-react";
import { useTranslation } from "react-i18next";
import type { TFunction } from "i18next";
import ResponsiveTable from "../../components/ui/ResponsiveTable";
import { EmptyState } from "../../components/ui/States";
import type { DashboardSummary } from "../../types/inventory";
import { formatQuantity } from "../../utils/inventoryFormat";

type Row = DashboardSummary["soldProductMovements"][number];

/** One plain-language sentence per product: start → in → sold → end. */
function productStory(t: TFunction, row: Row, endIsNow: boolean): string {
  const q = (value: number | null | undefined) => formatQuantity(value ?? 0);
  const unit = row.unit;
  const parts: string[] = [];
  if (row.openingStock === null || row.openingStock === undefined) {
    parts.push(t("dashboard.story.openingUnknown"));
  } else {
    parts.push(t("dashboard.story.opening", { qty: q(row.openingStock), unit }));
  }
  const received = row.flows.entries;
  if (received > 0) parts.push(t("dashboard.story.received", { qty: q(received), unit }));
  parts.push(t("dashboard.story.sold", { qty: q(row.flows.piecesOut), unit }));
  if (row.flows.returns > 0) parts.push(t("dashboard.story.returned", { qty: q(row.flows.returns), unit }));
  const corrections = row.flows.adjustmentsIn - row.flows.adjustmentsOut;
  if (corrections > 0) parts.push(t("dashboard.story.correctedUp", { qty: q(corrections), unit }));
  if (corrections < 0) parts.push(t("dashboard.story.correctedDown", { qty: q(-corrections), unit }));
  const closing = row.closingStock ?? row.currentStock;
  if (closing !== null && closing !== undefined) {
    parts.push(closing <= 0
      ? t("dashboard.story.endEmpty")
      : t(endIsNow ? "dashboard.story.endNow" : "dashboard.story.end", { qty: q(closing), unit }));
  }
  return parts.join(" ");
}

function health(row: Row): "out" | "low" | "ok" {
  const closing = row.currentStock ?? 0;
  if (closing <= 0) return "out";
  if (row.minStock && closing <= row.minStock) return "low";
  return "ok";
}

/**
 * "Mouvements par article vendu": every product that sold in the period, with
 * the stock it started with, what came in, what left, and what remains —
 * as a story (plain sentences) or as a table (same figures).
 */
export default function SoldProductStory({ rows, endIsNow }: { rows: Row[]; endIsNow: boolean }) {
  const { t } = useTranslation();
  const [view, setView] = useState<"story" | "table">("story");
  const [expanded, setExpanded] = useState(false);

  const headline = useMemo(() => {
    if (!rows.length) return "";
    const top = rows[0];
    const out = rows.filter((row) => health(row) === "out").length;
    const low = rows.filter((row) => health(row) === "low").length;
    const sentences = [t("dashboard.story.headline", { count: rows.length, name: top.name, qty: formatQuantity(top.flows.piecesOut), unit: top.unit })];
    if (out) sentences.push(t("dashboard.story.headlineOut", { count: out }));
    if (low) sentences.push(t("dashboard.story.headlineLow", { count: low }));
    return sentences.join(" ");
  }, [rows, t]);

  const visible = expanded ? rows : rows.slice(0, 8);

  return (
    <div className="card mt-4 sold-story">
      <header className="card-header">
        <div>
          <h3 className="section-title">{t("dashboard.sold.title")}</h3>
          <p className="text-sm text-gray-500">{t("dashboard.sold.subtitle")}</p>
        </div>
        {rows.length > 0 && (
          <div className="segmented segmented-sm" role="radiogroup" aria-label={t("dashboard.sold.viewLabel")}>
            <button type="button" role="radio" aria-checked={view === "story"} onClick={() => setView("story")}><BookOpenText aria-hidden="true" />{t("dashboard.sold.story")}</button>
            <button type="button" role="radio" aria-checked={view === "table"} onClick={() => setView("table")}><Table2 aria-hidden="true" />{t("dashboard.sold.table")}</button>
          </div>
        )}
      </header>
      {rows.length === 0 ? (
        <div className="card-body">
          <EmptyState title={t("dashboard.sold.emptyTitle")} icon={<Boxes aria-hidden="true" />}>{t("dashboard.sold.emptyBody")}</EmptyState>
        </div>
      ) : (
        <>
          <p className="sold-headline">{headline}</p>
          {view === "story" ? (
            <ol className="sold-list">
              {visible.map((row) => {
                const state = health(row);
                const opening = row.openingStock;
                const closing = row.closingStock ?? row.currentStock ?? 0;
                const scale = Math.max(opening ?? 0, (opening ?? 0) + row.flows.entries + row.flows.returns + Math.max(0, row.flows.adjustmentsIn), closing, 1);
                return (
                  <li key={row.productId} className={`sold-item is-${state}`}>
                    <div className="sold-item-head">
                      <strong>{row.name}</strong>
                      {row.category && <small>{row.category}</small>}
                      {state !== "ok" && (
                        <span className={`badge ${state === "out" ? "badge-danger" : "badge-warning"}`}>
                          {state === "out" ? <PackageX aria-hidden="true" /> : <TrendingDown aria-hidden="true" />}
                          {state === "out" ? t("availability.out") : t("dashboard.story.toRestock")}
                        </span>
                      )}
                    </div>
                    <p className="sold-sentence">{productStory(t, row, endIsNow)}</p>
                    <div className="sold-flow" aria-hidden="true">
                      <span className="sold-flow-step"><small>{t("dashboard.sold.start")}</small><b>{opening === null || opening === undefined ? "?" : formatQuantity(opening)}</b></span>
                      <span className="sold-flow-arrow">+{formatQuantity(row.flows.entries + row.flows.returns)}</span>
                      <span className="sold-flow-arrow is-out">−{formatQuantity(row.flows.piecesOut)}</span>
                      <span className="sold-flow-step is-end"><small>{endIsNow ? t("dashboard.sold.now") : t("dashboard.sold.end")}</small><b>{formatQuantity(closing)}</b></span>
                      <span className="sold-flow-bar"><span className="is-sold" style={{ width: `${Math.min(100, (row.flows.piecesOut / scale) * 100)}%` }} /><span className="is-left" style={{ width: `${Math.min(100, (Math.max(closing, 0) / scale) * 100)}%` }} /></span>
                    </div>
                  </li>
                );
              })}
            </ol>
          ) : (
            <div className="card-body">
              <ResponsiveTable stack="lg" className="dash-sold-table" aria-label={t("dashboard.sold.title")}>
                <thead>
                  <tr>
                    <th className="is-text">{t("products.col.product")}</th>
                    <th className="is-text">{t("products.form.unit")}</th>
                    <th className="is-num">{t("dashboard.sold.start")}</th>
                    <th className="is-num">{t("dashboard.sold.in")}</th>
                    <th className="is-num">{t("inventory.bridge.returns")}</th>
                    <th className="is-num">{t("dashboard.sold.soldCol")}</th>
                    <th className="is-num">{t("dashboard.sold.corrections")}</th>
                    <th className="is-num">{endIsNow ? t("dashboard.sold.now") : t("dashboard.sold.end")}</th>
                  </tr>
                </thead>
                <tbody>
                  {visible.map((row) => {
                    const corrections = row.flows.adjustmentsIn - row.flows.adjustmentsOut;
                    return (
                      <tr key={row.productId}>
                        <td className="is-text"><strong>{row.name}</strong>{row.category && <small className="block text-gray-500">{row.category}</small>}</td>
                        <td className="is-text whitespace-nowrap">{row.unit}</td>
                        <td className="num is-num">{row.openingStock === null || row.openingStock === undefined ? "—" : formatQuantity(row.openingStock)}</td>
                        <td className="num is-num">{formatQuantity(row.flows.entries)}</td>
                        <td className="num is-num">{formatQuantity(row.flows.returns)}</td>
                        <td className="num is-num">{formatQuantity(row.flows.piecesOut)}</td>
                        <td className="num is-num">{corrections > 0 ? "+" : corrections < 0 ? "−" : ""}{formatQuantity(Math.abs(corrections))}</td>
                        <td className="num is-num"><strong>{formatQuantity(row.closingStock ?? row.currentStock)}</strong></td>
                      </tr>
                    );
                  })}
                </tbody>
              </ResponsiveTable>
            </div>
          )}
          {rows.length > 8 && (
            <div className="card-footer-row">
              <button type="button" className="btn btn-ghost btn-sm" onClick={() => setExpanded((value) => !value)}>
                {expanded ? t("reports.products.showLess") : t("dashboard.sold.showAll", { count: rows.length })}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
