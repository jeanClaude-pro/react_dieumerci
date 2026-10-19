import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import {
  AlertTriangle, ArrowDownToLine, ArrowUpFromLine, Boxes, CalendarRange, ChevronRight,
  History, Info, LayoutDashboard, PackageCheck, PackageX, RefreshCw, TrendingDown, WifiOff,
} from "lucide-react";
import PageHeader from "../../components/ui/PageHeader";
import { EmptyState, ErrorState, Skeleton } from "../../components/ui/States";
import StockBridge from "../../components/inventory/StockBridge";
import StockLevelChart from "../../components/inventory/StockLevelChart";
import CategoryBars from "../../components/inventory/CategoryBars";
import StockAlertsDialog, { type AlertKind } from "./StockAlertsDialog";
import type { DashboardSummary } from "../../types/inventory";
import PeriodPicker from "../../components/inventory/PeriodPicker";
import { initialPeriodSelection, usePeriodRange, type PeriodSelection } from "../../hooks/usePeriodRange";
import { describePeriod, periodQuery } from "../../utils/dashboardPeriod";
import { formatDateTime, formatQuantity, formatTime, requestJson } from "../../utils/inventoryFormat";
import { useTranslation } from "react-i18next";
import type { TFunction } from "i18next";
import SoldProductStory from "./SoldProductStory";

function productCount(t: TFunction, count: number) {
  return t("inventory.productCount", { count, formatted: formatQuantity(count) });
}

function KpiTile({ label, value, unit, icon, detail, tone = "neutral", unknown }: {
  label: string;
  value: number | null;
  unit?: string;
  icon: ReactNode;
  detail?: ReactNode;
  tone?: "neutral" | "in" | "out";
  unknown?: string;
}) {
  const { t } = useTranslation();
  return (
    <div className={`dash-kpi dash-kpi-${tone}`}>
      <div className="dash-kpi-head"><span className="dash-kpi-icon" aria-hidden="true">{icon}</span><span>{label}</span></div>
      {value === null ? (
        <div className="dash-kpi-value is-unknown">—<span className="sr-only">{unknown || t("common.notAvailable")}</span></div>
      ) : (
        <div className="dash-kpi-value">{formatQuantity(value)}{unit && <small>{unit}</small>}</div>
      )}
      <div className="dash-kpi-detail">{value === null ? unknown || t("common.notAvailable") : detail}</div>
    </div>
  );
}

function HealthTile({ label, value, icon, detail, tone, onOpen, actionLabel }: {
  label: string;
  value: number;
  icon: ReactNode;
  detail: ReactNode;
  tone: "success" | "warning" | "danger";
  onOpen?: () => void;
  actionLabel?: string;
}) {
  const { t } = useTranslation();
  const content = (
    <>
      <div className="dash-kpi-head"><span className="dash-kpi-icon" aria-hidden="true">{icon}</span><span>{label}</span></div>
      <div className="dash-kpi-value">{formatQuantity(value)}<small>{t("dashboard.productsUnit", { count: value })}</small></div>
      <div className="dash-kpi-detail">{detail}</div>
      {onOpen && <span className="dash-health-action">{actionLabel}<ChevronRight aria-hidden="true" /></span>}
    </>
  );
  const className = `dash-health dash-health-${tone} ${value > 0 && tone !== "success" ? "is-alert" : ""}`;
  return onOpen ? (
    <button type="button" className={className} onClick={onOpen} aria-label={t("dashboard.healthAria", { label, value, action: actionLabel })}>{content}</button>
  ) : (
    <div className={className}>{content}</div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="dash-grid" aria-hidden="true">
      <div className="dash-kpis">{[0, 1, 2, 3].map((key) => <div key={key} className="dash-kpi"><Skeleton className="h-4 w-28" /><Skeleton className="h-8 w-24 mt-3" /><Skeleton className="h-3 w-36 mt-3" /></div>)}</div>
      <div className="dash-health-row">{[0, 1, 2].map((key) => <div key={key} className="dash-health"><Skeleton className="h-4 w-24" /><Skeleton className="h-7 w-16 mt-3" /></div>)}</div>
      <div className="dash-panels"><div className="card p-5"><Skeleton className="h-48 w-full" /></div><div className="card p-5"><Skeleton className="h-48 w-full" /></div></div>
    </div>
  );
}

export default function Dashboard() {
  const { t } = useTranslation();
  const [selection, setSelection] = useState<PeriodSelection>(() => initialPeriodSelection("today"));
  const [data, setData] = useState<DashboardSummary | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [online, setOnline] = useState(() => navigator.onLine);
  const [refreshKey, setRefreshKey] = useState(0);
  const [alertKind, setAlertKind] = useState<AlertKind | null>(null);
  const loadedFor = useRef<string | null>(null);

  // refreshKey also re-evaluates "today" when the page stays open past midnight.
  const period = usePeriodRange(selection, refreshKey);
  const periodKey = period ? periodQuery(period) : null;
  const periodLabel = period ? describePeriod(period) : t("period.invalidShort");

  useEffect(() => {
    const update = () => setOnline(navigator.onLine);
    window.addEventListener("online", update);
    window.addEventListener("offline", update);
    return () => { window.removeEventListener("online", update); window.removeEventListener("offline", update); };
  }, []);

  useEffect(() => {
    if (!periodKey) return;
    const controller = new AbortController();
    setLoading(true);
    setError(null);
    // A different period must never show the previous period's figures.
    if (loadedFor.current !== periodKey) setData(null);
    requestJson<DashboardSummary>(`dashboard/summary?${periodKey}`, { signal: controller.signal })
      .then((summary) => { setData(summary); loadedFor.current = periodKey; })
      .catch((reason: Error) => { if (reason.name !== "AbortError") setError(reason.message); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [periodKey, refreshKey]);

  const refresh = useCallback(() => setRefreshKey((value) => value + 1), []);

  const flows = data?.stock.flows ?? null;
  const coverage = data?.coverage;
  const endIsNow = data?.period.endIsNow ?? true;
  const pieceUnit = t("inventory.pieces");
  const otherUnits = data?.units.filter((row) => row.dimension !== "piece") ?? [];
  const activity = data?.activity ?? {};
  const partial = Boolean(flows && coverage && !coverage.flowsComplete);
  const partialNote = coverage?.trackingStartedAt ? t("dashboard.partialSince", { date: formatDateTime(coverage.trackingStartedAt) }) : t("dashboard.partial");
  const chartable = (data?.series.filter((point) => point.level !== null).length ?? 0) >= 2;

  return (
    <div className="page dashboard-page">
      <PageHeader
        eyebrow={t("nav.sections.steering")}
        icon={<LayoutDashboard aria-hidden="true" />}
        title={t("dashboard.title")}
        description={t("dashboard.subtitle")}
        actions={
          <button type="button" className="btn btn-secondary" onClick={refresh} disabled={loading || !period}>
            <RefreshCw className={loading ? "animate-spin" : ""} aria-hidden="true" />
            {data ? t("common.updatedAt", { time: formatTime(data.generatedAt) }) : t("common.refresh")}
          </button>
        }
      />

      <PeriodPicker className="card mb-4" value={selection} onChange={setSelection} range={period} />

      {!online && (
        <div className="alert alert-warning mb-4" role="status"><WifiOff aria-hidden="true" /><span>{t("dashboard.offline")}</span></div>
      )}

      {error && !data ? (
        <div className="card">
          <ErrorState title={t("dashboard.error")} action={<button type="button" className="btn btn-primary" onClick={refresh}><RefreshCw aria-hidden="true" />{t("common.retry")}</button>}>
            {online ? error : t("dashboard.youAreOffline")}
          </ErrorState>
        </div>
      ) : !data ? (
        period ? <DashboardSkeleton /> : null
      ) : (
        <div className={`dash-grid ${loading ? "is-refreshing" : ""}`} aria-busy={loading}>
          {error && (
            <div className="alert alert-danger" role="alert"><AlertTriangle aria-hidden="true" /><span>{t("dashboard.refreshFailed", { error, time: formatTime(data.generatedAt) })}</span></div>
          )}
          {coverage && (!coverage.openingKnown || (coverage.untrackedProducts ?? 0) > 0) && (
            <div className="alert alert-info" role="note">
              <Info aria-hidden="true" />
              <span>
                {coverage.trackingStartedAt
                  ? t(coverage.flowsAvailable && !coverage.flowsComplete ? "dashboard.trackingSincePartial" : "dashboard.trackingSince", { date: formatDateTime(coverage.trackingStartedAt) })
                  : t("dashboard.notAllTracked")}
                {(coverage.untrackedProducts ?? 0) > 0 && <> {t("dashboard.untracked", { products: productCount(t, coverage.untrackedProducts ?? 0) })}</>}
              </span>
            </div>
          )}
          {otherUnits.length > 0 && (
            <div className="alert alert-info" role="note">
              <Info aria-hidden="true" />
              <span>
                {t("dashboard.otherUnits", { list: otherUnits.map((row) => `${formatQuantity(row.quantity)} ${row.unit} (${productCount(t, row.products)})`).join(", ") })}
              </span>
            </div>
          )}

          <section aria-labelledby="dash-flows-title">
            <div className="dash-section-head">
              <h2 id="dash-flows-title" className="section-title">{t("dashboard.flowsTitle")}</h2>
              <span className="badge">{periodLabel}</span>
            </div>
            <div className="dash-kpis">
              <KpiTile
                label={t("inventory.opening")}
                value={data.stock.opening}
                unit={pieceUnit}
                icon={<History />}
                unknown={t("dashboard.unknownBeforeTracking")}
                detail={t("dashboard.openingDetail")}
              />
              <KpiTile
                label={endIsNow ? t("inventory.current") : t("inventory.closingPeriod")}
                value={data.stock.closing}
                unit={pieceUnit}
                icon={<Boxes />}
                unknown={t("dashboard.unknownBeforeTracking")}
                detail={flows && data.stock.opening !== null ? t("dashboard.change", { value: `${flows.net >= 0 ? "+" : "−"}${formatQuantity(Math.abs(flows.net))}`, unit: pieceUnit }) : endIsNow ? t("dashboard.closingNowDetail") : t("dashboard.closingDetail")}
              />
              <KpiTile
                label={t("dashboard.piecesOut")}
                value={flows ? flows.piecesOut : null}
                unit={pieceUnit}
                tone="out"
                icon={<ArrowUpFromLine />}
                detail={partial ? partialNote : flows && flows.returns > 0 ? t("dashboard.returnedDetail", { qty: formatQuantity(flows.returns) }) : t("dashboard.outDetail")}
              />
              <KpiTile
                label={t("inventory.bridge.restock")}
                value={flows ? flows.entries : null}
                unit={pieceUnit}
                tone="in"
                icon={<ArrowDownToLine />}
                detail={partial ? partialNote : flows && flows.newProducts > 0 ? t("dashboard.newProductsDetail", { qty: formatQuantity(flows.newProducts) }) : t("dashboard.inDetail")}
              />
            </div>
            <SoldProductStory rows={data.soldProductMovements} endIsNow={endIsNow} />
          </section>

          <section aria-labelledby="dash-health-title">
            <div className="dash-section-head">
              <h2 id="dash-health-title" className="section-title">{t("dashboard.healthTitle")}</h2>
              <span className="badge badge-info">{t("dashboard.currentState", { time: formatTime(data.generatedAt) })}</span>
            </div>
            <div className="dash-health-row">
              <HealthTile
                label={t("dashboard.sellable")}
                value={data.health.sellable}
                tone="success"
                icon={<PackageCheck />}
                detail={t("dashboard.sellableDetail", { active: formatQuantity(data.health.active), inactive: formatQuantity(data.health.inactive) })}
              />
              <HealthTile
                label={t("availability.low")}
                value={data.health.lowStock}
                tone="warning"
                icon={<TrendingDown />}
                detail={t("dashboard.lowDetail")}
                onOpen={() => setAlertKind("low")}
                actionLabel={t("dashboard.seeProducts")}
              />
              <HealthTile
                label={t("availability.out")}
                value={data.health.outOfStock}
                tone="danger"
                icon={<PackageX />}
                detail={data.health.becameOutOfStock > 0 ? t("dashboard.becameOut", { count: data.health.becameOutOfStock }) : t("dashboard.outHealthDetail")}
                onOpen={() => setAlertKind(data.health.outOfStock === 0 && data.health.becameOutOfStock > 0 ? "became_out" : "out")}
                actionLabel={t("dashboard.seeProducts")}
              />
            </div>
          </section>

          <div className="dash-panels">
            <section className="card dash-panel" aria-labelledby="dash-bridge-title">
              <header className="card-header">
                <div>
                  <h2 id="dash-bridge-title" className="section-title">{t("dashboard.bridgeTitle")}</h2>
                  <p className="text-sm text-gray-500">{t("dashboard.bridgeFormula")}</p>
                </div>
              </header>
              <div className="card-body">
                {flows ? (
                  <>
                    <StockBridge opening={data.stock.opening} closing={data.stock.closing} flows={flows} unit={pieceUnit} closingLabel={endIsNow ? t("inventory.current") : t("inventory.closingPeriod")} />
                    <dl className="dash-activity">
                      <div><dt>{t("dashboard.activity.sales")}</dt><dd className="num">{formatQuantity(data.transactions.sales)}</dd></div>
                      <div><dt>{t("dashboard.activity.voids")}</dt><dd className="num">{formatQuantity((activity.sale_void ?? 0) + (activity.sale_delete ?? 0))}</dd></div>
                      <div><dt>{t("dashboard.activity.restocks")}</dt><dd className="num">{formatQuantity(activity.restock ?? 0)}</dd></div>
                      <div><dt>{t("dashboard.activity.corrections")}</dt><dd className="num">{formatQuantity((activity.adjustment ?? 0) + (activity.product_delete ?? 0))}</dd></div>
                    </dl>
                    <p className="dash-footnote">{t("dashboard.activity.footnote")}</p>
                  </>
                ) : (
                  <EmptyState title={t("dashboard.beforeTrackingTitle")} icon={<History aria-hidden="true" />}>
                    {t("dashboard.beforeTrackingBody")}
                  </EmptyState>
                )}
              </div>
            </section>

            <section className="card dash-panel" aria-labelledby="dash-level-title">
              <header className="card-header">
                <div>
                  <h2 id="dash-level-title" className="section-title">{t("dashboard.levelTitle")}</h2>
                  <p className="text-sm text-gray-500">{t(data.period.granularity === "month" ? "dashboard.levelSubtitleMonth" : "dashboard.levelSubtitleDay")}</p>
                </div>
              </header>
              <div className="card-body">
                {chartable ? (
                  <StockLevelChart series={data.series} granularity={data.period.granularity} unit={pieceUnit} />
                ) : (
                  <EmptyState title={data.series.length <= 1 ? t("dashboard.singleDay") : t("dashboard.notEnoughHistory")} icon={<CalendarRange aria-hidden="true" />}>
                    {data.series.length <= 1 ? t("dashboard.singleDayHint") : t("dashboard.notEnoughHistoryHint")}
                  </EmptyState>
                )}
              </div>
            </section>

            <section className="card dash-panel" aria-labelledby="dash-attention-title">
              <header className="card-header">
                <div>
                  <h2 id="dash-attention-title" className="section-title">{t("dashboard.attentionTitle")}</h2>
                  <p className="text-sm text-gray-500">{t("dashboard.attentionSubtitle")}</p>
                </div>
                {(data.health.lowStock + data.health.outOfStock) > 0 && (
                  <button type="button" className="btn btn-secondary btn-sm" onClick={() => setAlertKind(data.health.outOfStock > 0 ? "out" : "low")}>{t("dashboard.seeAll")}<ChevronRight aria-hidden="true" /></button>
                )}
              </header>
              {data.attention.length === 0 ? (
                <div className="card-body">
                  <EmptyState title={t("inventory.alerts.empty.low")} icon={<PackageCheck aria-hidden="true" />}>{t("dashboard.allAboveMin")}</EmptyState>
                </div>
              ) : (
                <ul className="dash-attention">
                  {data.attention.map((row) => {
                    const out = (row.stock ?? 0) <= 0;
                    return (
                      <li key={row._id}>
                        <span className={`dash-attention-mark ${out ? "is-out" : "is-low"}`} aria-hidden="true">{out ? <PackageX /> : <TrendingDown />}</span>
                        <span className="min-w-0 flex-1">
                          <strong className="block truncate">{row.name}</strong>
                          <small className="text-gray-500">{row.category || t("dashboard.noCategory")}</small>
                        </span>
                        <span className="dash-attention-figures num">
                          <strong>{formatQuantity(row.stock)} / {formatQuantity(row.minStock)}</strong>
                          <small>{out ? t("availability.out") : t("dashboard.missing", { qty: formatQuantity(row.gap) })}</small>
                        </span>
                      </li>
                    );
                  })}
                </ul>
              )}
            </section>

            <section className="card dash-panel" aria-labelledby="dash-category-title">
              <header className="card-header">
                <div>
                  <h2 id="dash-category-title" className="section-title">{t("dashboard.categoryTitle")}</h2>
                  <p className="text-sm text-gray-500">{t("dashboard.categorySubtitle", { count: data.health.pieceProducts })}</p>
                </div>
              </header>
              <div className="card-body">
                {data.categories.length ? <CategoryBars rows={data.categories} unit={pieceUnit} /> : (
                  <EmptyState title={t("dashboard.noProduct")} icon={<Boxes aria-hidden="true" />}>{t("dashboard.noProductHint")}</EmptyState>
                )}
              </div>
            </section>
          </div>
        </div>
      )}

      {alertKind && period && (
        <StockAlertsDialog initialKind={alertKind} period={period} periodLabel={periodLabel} onClose={() => setAlertKind(null)} />
      )}
    </div>
  );
}
