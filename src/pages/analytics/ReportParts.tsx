import { useMemo, useState, type ReactNode } from "react";
import { ArrowDownRight, ArrowUpRight, Minus, Package, Users } from "lucide-react";
import { useTranslation } from "react-i18next";
import { formatNumber, formatPercent, formatUSD } from "../../i18n/format";
import { EmptyState } from "../../components/ui/States";

/* ------------------------------------------------------------------ KPI -- */

export function Delta({ value, inverse = false }: { value: number | null | undefined; inverse?: boolean }) {
  const { t } = useTranslation();
  if (value === null || value === undefined || !Number.isFinite(value)) {
    return <span className="kpi-delta is-flat"><Minus aria-hidden="true" />{t("reports.kpi.noComparison")}</span>;
  }
  const up = value > 0.05;
  const down = value < -0.05;
  // For costs, a rise is bad news: the colour follows the meaning, not the sign.
  const good = inverse ? down : up;
  const bad = inverse ? up : down;
  return (
    <span className={`kpi-delta ${good ? "is-good" : bad ? "is-bad" : "is-flat"}`} title={t("reports.kpi.vsPrevious")}>
      {up ? <ArrowUpRight aria-hidden="true" /> : down ? <ArrowDownRight aria-hidden="true" /> : <Minus aria-hidden="true" />}
      {formatPercent(Math.abs(value))}
      <span className="sr-only">{up ? t("trend.up") : down ? t("trend.down") : t("trend.flat")} — {t("reports.kpi.vsPrevious")}</span>
    </span>
  );
}

export function KpiCard({ label, value, hint, delta, inverseDelta, tone = "neutral", icon, extra }: {
  label: string;
  value: ReactNode;
  hint: string;
  delta?: number | null;
  inverseDelta?: boolean;
  tone?: "neutral" | "gain" | "loss" | "accent";
  icon: ReactNode;
  extra?: ReactNode;
}) {
  return (
    <article className={`kpi kpi-${tone}`} title={hint}>
      <header className="kpi-head">
        <span className="kpi-icon" aria-hidden="true">{icon}</span>
        <h3 className="kpi-label">{label}</h3>
      </header>
      <p className="kpi-value">{value}</p>
      <div className="kpi-foot">
        {delta !== undefined && <Delta value={delta} inverse={inverseDelta} />}
        {extra}
      </div>
      <p className="kpi-hint">{hint}</p>
    </article>
  );
}

/* --------------------------------------------------------- Profit bridge -- */

export interface CashSummary {
  revenue: number;
  entries: number;
  expenses: number;
  netCash: number;
}

/**
 * "Comment se calcule votre trésorerie nette":
 * (ventes + entrées d'argent) − dépenses validées = trésorerie nette.
 * Same formula as the server (utils/financialCalculations.calculateNetCash).
 */
export function CashBridge({ cash }: { cash: CashSummary }) {
  const { t } = useTranslation();
  const moneyIn = cash.revenue + cash.entries;
  const scale = Math.max(moneyIn, cash.expenses, Math.abs(cash.netCash), 1);
  const rows: { key: string; label: string; help: string; value: number; sign: "+" | "−" | "="; tone: string }[] = [
    { key: "revenue", label: t("reports.bridge.revenue"), help: t("reports.bridge.revenueHelp"), value: cash.revenue, sign: "+", tone: "base" },
    { key: "entries", label: t("reports.bridge.entries"), help: t("reports.bridge.entriesHelp"), value: cash.entries, sign: "+", tone: "base" },
    { key: "expenses", label: t("reports.bridge.expenses"), help: t("reports.bridge.expensesHelp"), value: cash.expenses, sign: "−", tone: "cost" },
    { key: "net", label: t("reports.bridge.net"), help: t("reports.bridge.netHelp"), value: cash.netCash, sign: "=", tone: cash.netCash < 0 ? "loss" : "result" },
  ];
  return (
    <section className="card report-panel" aria-labelledby="bridge-title">
      <header className="card-header">
        <div>
          <h2 id="bridge-title" className="section-title">{t("reports.bridge.title")}</h2>
          <p className="section-help">{t("reports.bridge.subtitle")}</p>
        </div>
      </header>
      <ol className="bridge">
        {rows.map((row) => (
          <li key={row.key} className={`bridge-row is-${row.tone}`}>
            <span className="bridge-sign" aria-hidden="true">{row.sign}</span>
            <div className="bridge-text">
              <strong>{row.label}</strong>
              <small>{row.help}</small>
            </div>
            <div className="bridge-bar" aria-hidden="true">
              <span style={{ width: `${Math.min(100, (Math.abs(row.value) / scale) * 100)}%` }} />
            </div>
            <span className={`bridge-value num ${row.value < 0 ? "text-loss" : ""}`}>{formatUSD(row.value)}</span>
          </li>
        ))}
      </ol>
      <div className="bridge-foot">
        <p>{t(cash.netCash < 0 ? "reports.bridge.sentenceNegative" : "reports.bridge.sentence", { moneyIn: formatUSD(moneyIn), expenses: formatUSD(cash.expenses), net: formatUSD(Math.abs(cash.netCash)) })}</p>
      </div>
    </section>
  );
}

/* --------------------------------------------------- Product performance -- */

export interface ProductRow {
  productId?: string | null;
  name: string;
  quantity: number;
  revenue: number;
}

type ProductSort = "revenue" | "quantity";

/** totalRevenue comes from the server summary (share of each item in the period sales). */
export function ProductPerformance({ rows, totalRevenue }: { rows: ProductRow[]; totalRevenue: number }) {
  const { t } = useTranslation();
  const [sort, setSort] = useState<ProductSort>("revenue");
  const [expanded, setExpanded] = useState(false);
  const sorted = useMemo(
    () => [...rows].sort((a, b) => (sort === "revenue" ? b.revenue - a.revenue : b.quantity - a.quantity)),
    [rows, sort]
  );
  const visible = expanded ? sorted : sorted.slice(0, 10);

  return (
    <section className="card report-panel report-products" aria-labelledby="products-title">
      <header className="card-header">
        <div>
          <h2 id="products-title" className="section-title">{t("reports.products.title")}</h2>
          <p className="section-help">{t("reports.products.subtitle")}</p>
        </div>
        <div className="segmented segmented-sm" role="radiogroup" aria-label={t("reports.products.sortLabel")}>
          {(["revenue", "quantity"] as ProductSort[]).map((option) => (
            <button key={option} type="button" role="radio" aria-checked={sort === option} onClick={() => setSort(option)}>
              {t(`reports.products.sort.${option}`)}
            </button>
          ))}
        </div>
      </header>
      {rows.length === 0 ? (
        <div className="card-body"><EmptyState title={t("reports.products.emptyTitle")} icon={<Package aria-hidden="true" />}>{t("reports.products.emptyBody")}</EmptyState></div>
      ) : (
        <>
          <div className="table-scroll">
            <table className="ui-table report-table">
              <thead>
                <tr>
                  <th scope="col" className="is-text">{t("reports.products.col.product")}</th>
                  <th scope="col" className="is-num">{t("reports.products.col.qty")}</th>
                  <th scope="col" className="is-num">{t("reports.products.col.revenue")}</th>
                  <th scope="col" className="is-num">{t("reports.products.col.share")}</th>
                </tr>
              </thead>
              <tbody>
                {visible.map((row, index) => {
                  const share = totalRevenue > 0 ? (row.revenue / totalRevenue) * 100 : 0;
                  return (
                    <tr key={`${row.productId ?? row.name}-${index}`}>
                      <th scope="row" className="is-text"><span className="rank">{index + 1}</span>{row.name}</th>
                      <td className="num is-num">{formatNumber(row.quantity, 3)}</td>
                      <td className="num is-num">{formatUSD(row.revenue)}</td>
                      <td className="num is-num"><span className="margin-pill">{formatPercent(share, 0)}</span></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {sorted.length > 10 && (
            <div className="card-footer-row">
              <button type="button" className="btn btn-ghost btn-sm" onClick={() => setExpanded((value) => !value)}>
                {expanded ? t("reports.products.showLess") : t("reports.products.showAll", { count: sorted.length })}
              </button>
            </div>
          )}
        </>
      )}
    </section>
  );
}

/* ----------------------------------------------------- Ranked bar lists -- */

export function RankedList({ title, help, rows, empty, icon }: {
  title: string;
  help: string;
  rows: { key: string; label: string; value: number; detail: string }[];
  empty: string;
  icon?: ReactNode;
}) {
  const max = Math.max(...rows.map((row) => row.value), 1);
  return (
    <section className="card report-panel" aria-label={title}>
      <header className="card-header">
        <div>
          <h2 className="section-title">{title}</h2>
          <p className="section-help">{help}</p>
        </div>
      </header>
      {rows.length === 0 ? (
        <div className="card-body"><EmptyState title={empty} icon={icon ?? <Users aria-hidden="true" />} /></div>
      ) : (
        <ul className="ranked">
          {rows.map((row) => (
            <li key={row.key}>
              <div className="ranked-line">
                <span className="ranked-label">{row.label}</span>
                <span className="ranked-value num">{formatUSD(row.value)}</span>
              </div>
              <div className="ranked-bar" aria-hidden="true"><span style={{ width: `${(row.value / max) * 100}%` }} /></div>
              <small className="ranked-detail">{row.detail}</small>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
