import { useEffect, useMemo, useState } from "react";
import { ArrowDownRight, ArrowUpRight, BarChart3, LineChart, Minus, Table2, TrendingUp } from "lucide-react";
import { useTranslation } from "react-i18next";
import TrendChart from "./TrendChart";
import { addDays, bucketLabel, SERIES_STYLE, type Metric, type TrendGranularity, type TrendPoint, type TrendSeries } from "./trendUtils";
import { relativePercentChange, summarizeTrend } from "./trendStats";
import { formatNumber, formatPercent, formatUSD } from "../../i18n/format";
import { requestJson } from "../../utils/inventoryFormat";
import type { PeriodRange } from "../../utils/dashboardPeriod";
import { EmptyState, ErrorState, Skeleton } from "../ui/States";

/** One point of GET /api/analytics/timeseries (USD). */
export interface SeriesPoint {
  key: string;
  sales: number;
  revenue: number;
  unitsSold: number;
  validatedExpenses: number;
  entries: number;
  netCash: number;
}

interface SeriesResponse {
  period: { from: string; to: string; granularity: TrendGranularity };
  points: SeriesPoint[];
}

type ViewId = "all" | "revenue" | "entries" | "expenses" | "cash";

/**
 * "Tout" (default) draws sales, money in and validated expenses together;
 * the other views draw ONE indicator alone, with nothing else on the chart.
 */
const VIEWS: { id: ViewId; metrics: Metric[] }[] = [
  { id: "all", metrics: ["revenue", "entries", "validatedExpenses"] },
  { id: "revenue", metrics: ["revenue"] },
  { id: "entries", metrics: ["entries"] },
  { id: "expenses", metrics: ["validatedExpenses"] },
  { id: "cash", metrics: ["netCash"] },
];
type GranularityChoice = "auto" | "day" | "week" | "month";

export interface PreviousTotals {
  totalRevenue?: number;
  totalEntries?: number;
  totalValidatedExpenses?: number;
  netCash?: number;
}

function Change({ value }: { value: number | null }) {
  const { t } = useTranslation();
  if (value === null || !Number.isFinite(value)) return <span className="trend-change is-flat"><Minus aria-hidden="true" />{t("trend.noComparison")}</span>;
  const up = value > 0.05;
  const down = value < -0.05;
  return (
    <span className={`trend-change ${up ? "is-up" : down ? "is-down" : "is-flat"}`}>
      {up ? <ArrowUpRight aria-hidden="true" /> : down ? <ArrowDownRight aria-hidden="true" /> : <Minus aria-hidden="true" />}
      {formatPercent(Math.abs(value))}
      <span className="sr-only">{up ? t("trend.up") : down ? t("trend.down") : t("trend.flat")}</span>
    </span>
  );
}

export default function FinancialTrend({ range, previous, refreshKey = 0 }: {
  range: PeriodRange;
  previous?: PreviousTotals;
  refreshKey?: number;
}) {
  const { t } = useTranslation();
  const [viewId, setViewId] = useState<ViewId>("all");
  const [choice, setChoice] = useState<GranularityChoice>("auto");
  const [showTable, setShowTable] = useState(false);
  const [data, setData] = useState<SeriesResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const sameDay = range.from === range.to;
  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError(null);
    const params = new URLSearchParams({ from: range.from, to: range.to, granularity: choice });
    requestJson<SeriesResponse>(`analytics/timeseries?${params}`, { signal: controller.signal })
      .then((response) => setData(Array.isArray(response?.points) ? response : { period: { from: range.from, to: range.to, granularity: "day" }, points: [] }))
      .catch((reason: Error) => { if (reason.name !== "AbortError") setError(reason.message); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [range.from, range.to, choice, refreshKey]);

  const view = VIEWS.find((item) => item.id === viewId)!;
  const single = view.metrics.length === 1;
  const granularity: TrendGranularity = data?.period.granularity ?? "day";
  const points: TrendPoint[] = useMemo(() => {
    const all = (data?.points ?? []).map((point) => ({
      key: point.key,
      sales: point.sales,
      values: { revenue: point.revenue, entries: point.entries, validatedExpenses: point.validatedExpenses, netCash: point.netCash },
    }));
    if (granularity !== "hour") return all;
    // A day starts at the first hour with a movement: the night before the
    // shop opens is not part of the story (and would always be "Plus bas").
    const first = all.findIndex((point) => point.sales > 0 || point.values.revenue !== 0 || point.values.entries !== 0 || point.values.validatedExpenses !== 0);
    return first > 0 ? all.slice(first) : all;
  }, [data, granularity]);

  const series: TrendSeries[] = view.metrics.map((metric) => ({
    metric,
    label: t(view.id === "all" ? `trend.series.${metric}` : `trend.metrics.${metric}`),
    color: SERIES_STYLE[metric].color,
    dashed: SERIES_STYLE[metric].dashed,
  }));
  const mainMetric = view.metrics[0];
  const lineLabel = t(`trend.metrics.${mainMetric}`);

  const stats = useMemo(() => summarizeTrend(points, view.metrics), [points, view]);
  const totals: Record<Metric, number> = useMemo(() => stats?.totals ?? { revenue: 0, entries: 0, validatedExpenses: 0, netCash: 0 }, [stats]);
  /** Week buckets are clipped to the chosen period (a week can start before it). */
  const dateLabel = (key: string) => {
    if (granularity !== "week") return bucketLabel(key, granularity);
    const from = key < range.from ? range.from : key;
    const naturalEnd = addDays(key, 6);
    const to = naturalEnd > range.to ? range.to : naturalEnd;
    return t("trend.weekOf", { from: bucketLabel(from, "day"), to: bucketLabel(to, "day") });
  };

  const previousTotals: Record<Metric, number | undefined> = {
    revenue: previous?.totalRevenue,
    entries: previous?.totalEntries,
    validatedExpenses: previous?.totalValidatedExpenses,
    netCash: previous?.netCash,
  };
  const change = relativePercentChange(totals[mainMetric], previousTotals[mainMetric]);
  const nothing = !points.some((point) => view.metrics.some((metric) => point.values[metric] !== 0));

  const story = useMemo(() => {
    if (!points.length || nothing) return t("trend.story.empty");
    if (!single) {
      return t("trend.story.net", {
        revenue: formatUSD(totals.revenue),
        entries: formatUSD(totals.entries),
        expenses: formatUSD(totals.validatedExpenses),
        net: formatUSD(totals.revenue + totals.entries - totals.validatedExpenses),
      });
    }
    if (change === null) return t("trend.story.noPrevious", { metric: lineLabel });
    return change >= 0
      ? t("trend.story.up", { metric: lineLabel, value: formatPercent(Math.abs(change)) })
      : t("trend.story.down", { metric: lineLabel, value: formatPercent(Math.abs(change)) });
  }, [points.length, nothing, single, totals, change, lineLabel, t]);

  const marked = stats && points.length > 1 && !nothing;

  return (
    <section className="card trend-card" aria-labelledby="trend-title">
      <header className="trend-head">
        <div className="trend-heading">
          <h2 id="trend-title" className="trend-title"><TrendingUp aria-hidden="true" />{single ? t("trend.title", { metric: lineLabel }) : t("trend.titleAll")}</h2>
        </div>
        <div className="trend-controls">
          <div className="segmented segmented-sm trend-views" role="radiogroup" aria-label={t("trend.viewLabel")}>
            {VIEWS.map((item) => (
              <button key={item.id} type="button" role="radio" aria-checked={viewId === item.id} onClick={() => setViewId(item.id)}>
                {t(`trend.views.${item.id}`)}
              </button>
            ))}
          </div>
          {!sameDay && (
            <div className="segmented segmented-sm" role="radiogroup" aria-label={t("trend.granularityLabel")}>
              {(["auto", "day", "week", "month"] as GranularityChoice[]).map((option) => (
                <button key={option} type="button" role="radio" aria-checked={choice === option} onClick={() => setChoice(option)}>
                  {t(`trend.granularity.${option}`)}
                </button>
              ))}
            </div>
          )}
          <button type="button" className="btn btn-ghost btn-sm trend-table-toggle" aria-pressed={showTable} title={showTable ? t("trend.showChart") : t("trend.showTable")} onClick={() => setShowTable((value) => !value)}>
            {showTable ? <LineChart aria-hidden="true" /> : <Table2 aria-hidden="true" />}
            <span className="trend-table-toggle-label">{showTable ? t("trend.showChart") : t("trend.showTable")}</span>
          </button>
        </div>
      </header>

      {single ? (
        <div className="trend-summary">
          <div className="trend-hero">
            <span className="trend-hero-label">{t("trend.totalFor", { metric: lineLabel })}</span>
            {data ? (
              <span className={`trend-hero-value ${totals[mainMetric] < 0 ? "is-negative" : ""}`}>{formatUSD(totals[mainMetric])}</span>
            ) : loading ? <Skeleton className="h-9 w-40" /> : <span className="trend-hero-value">—</span>}
            <span className="trend-hero-meta">
              <Change value={change} />
              <span>{t("trend.vsPrevious")}</span>
            </span>
          </div>
          {stats && marked && (
            <dl className="trend-facts">
              <div><dt>{t("trend.peak")}</dt><dd>{formatUSD(stats.highest.value)}<small>{dateLabel(stats.highest.key)}</small></dd></div>
              <div><dt>{t("trend.lowest")}</dt><dd>{formatUSD(stats.low.value)}<small>{dateLabel(stats.low.key)}</small></dd></div>
              <div><dt>{t(`trend.averagePer.${granularity}`)}</dt><dd>{formatUSD(stats.average)}</dd></div>
            </dl>
          )}
        </div>
      ) : (
        // "Tout": the legend IS the summary — what each line is, its colour,
        // its total for the period and how it moved.
        <ul className="trend-series-legend" aria-label={t("trend.legend")}>
          {series.map((item) => (
            <li key={item.metric} className="trend-series-item">
              <span className={`trend-series-swatch ${item.dashed ? "is-dashed" : ""}`} style={{ color: item.color }} aria-hidden="true" />
              <span className="trend-series-text">
                <span className="trend-series-name">
                  {item.label}
                  <Change value={relativePercentChange(totals[item.metric], previousTotals[item.metric])} />
                </span>
                <span className="trend-series-total">{data ? formatUSD(totals[item.metric]) : "—"}</span>
                {marked && (() => {
                  const peak = stats.peaks.find((entry) => entry.metric === item.metric);
                  return peak && peak.value !== 0
                    ? <span className="trend-series-peak">{t("trend.peakAt", { value: formatUSD(peak.value), when: dateLabel(peak.key) })}</span>
                    : null;
                })()}
                <span className="trend-series-meaning">{t(`trend.meaning.${item.metric}`)}</span>
              </span>
            </li>
          ))}
        </ul>
      )}

      <div className={`trend-body ${loading && data ? "is-refreshing" : ""}`} aria-busy={loading}>
        {error && !data ? (
          <ErrorState title={t("trend.error")}>{error}</ErrorState>
        ) : !data ? (
          <Skeleton className="trend-skeleton" />
        ) : points.length === 0 ? (
          <EmptyState title={t("trend.emptyTitle")} icon={<BarChart3 aria-hidden="true" />}>{t("trend.emptyBody")}</EmptyState>
        ) : showTable ? (
          <div className="table-scroll trend-table-wrap">
            <table className="ui-table trend-table">
              <caption className="sr-only">{single ? t("trend.tableCaption", { metric: lineLabel }) : t("trend.tableCaptionAll")}</caption>
              <thead>
                <tr>
                  <th scope="col">{t(`trend.bucket.${granularity}`)}</th>
                  {series.map((item) => <th key={item.metric} scope="col" className="is-num">{item.label}</th>)}
                  <th scope="col" className="is-num">{t("trend.salesColumn")}</th>
                </tr>
              </thead>
              <tbody>
                {points.map((point) => (
                  <tr key={point.key}>
                    <th scope="row">{bucketLabel(point.key, granularity, true)}</th>
                    {series.map((item) => (
                      <td key={item.metric} className={`num is-num ${point.values[item.metric] < 0 ? "text-loss" : ""}`}>{formatUSD(point.values[item.metric])}</td>
                    ))}
                    <td className="num is-num">{formatNumber(point.sales, 0)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <TrendChart points={points} granularity={granularity} series={series}
            periodFrom={range.from} periodTo={range.to}
            peaks={marked ? stats.peaks.filter((peak) => peak.value !== 0) : []}
            low={marked && single && stats.low.key !== stats.highest.key ? stats.low : undefined}
            average={marked && single ? stats.average : undefined} />
        )}
      </div>

      <footer className="trend-foot">
        <p className="trend-story">{story}</p>
      </footer>
    </section>
  );
}
