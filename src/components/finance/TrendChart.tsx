import { useId, useMemo } from "react";
import {
  Area, CartesianGrid, ComposedChart, Line, ReferenceDot, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";
import { useTranslation } from "react-i18next";
import { formatNumber, formatUSD, formatUSDCompact } from "../../i18n/format";
import { addDays, bucketLabel, SERIES_STYLE, TREND_COLORS, type TrendGranularity, type TrendPoint, type TrendSeries } from "./trendUtils";
import { useMediaQuery } from "../../hooks/useMediaQuery";
import { peakAxis } from "./trendAxis";
import type { MarkedValue } from "./trendStats";

interface ChartDatum extends TrendPoint {
  label: string;
  revenue: number;
  entries: number;
  validatedExpenses: number;
  netCash: number;
}

function TrendTooltip({ active, datum, granularity, series, peaks, low, periodFrom, periodTo }: {
  active?: boolean;
  datum?: ChartDatum;
  granularity: TrendGranularity;
  series: TrendSeries[];
  peaks: MarkedValue[];
  low?: MarkedValue;
  periodFrom: string;
  periodTo: string;
}) {
  const { t } = useTranslation();
  if (!active || !datum) return null;
  // A week bucket can start before the period or end after it: clip it.
  let title = bucketLabel(datum.key, granularity, true);
  if (granularity === "week") {
    const weekFrom = datum.key < periodFrom ? periodFrom : datum.key;
    const naturalWeekEnd = addDays(datum.key, 6);
    const weekTo = naturalWeekEnd > periodTo ? periodTo : naturalWeekEnd;
    title = t("trend.weekOf", { from: bucketLabel(weekFrom, "day"), to: bucketLabel(weekTo, "day") });
  }
  const peakHere = new Set(peaks.filter((peak) => peak.key === datum.key).map((peak) => peak.metric));
  return (
    <div className="trend-tooltip" role="status">
      <p className="trend-tooltip-date">
        {title}
        {series.length === 1 && peakHere.size > 0 && <span className="trend-tooltip-badge is-peak">{t("trend.peak")}</span>}
        {datum.key === low?.key && <span className="trend-tooltip-badge is-low">{t("trend.lowest")}</span>}
      </p>
      {series.map((item) => {
        const value = datum.values[item.metric];
        return (
          <div key={item.metric} className="trend-tooltip-row">
            <span className={`trend-key trend-key-line ${item.dashed ? "is-dashed" : ""}`} style={{ color: item.color }} aria-hidden="true" />
            <strong className={value < 0 ? "is-negative" : ""}>{formatUSD(value)}</strong>
            <span>{item.label}</span>
            {series.length > 1 && peakHere.has(item.metric) && <span className="trend-tooltip-badge is-peak">{t("trend.peak")}</span>}
          </div>
        );
      })}
      <p className="trend-tooltip-foot">{t("trend.salesCount", { count: datum.sales, formatted: formatNumber(datum.sales, 0) })}</p>
    </div>
  );
}

function AxisTick({ x, y, payload }: { x?: number; y?: number; payload?: { value: number } }) {
  return (
    <text x={x} y={y} dy={4} textAnchor="end" fill={TREND_COLORS.axis} fontSize={11}>
      {formatUSDCompact(Number(payload?.value ?? 0))}
    </text>
  );
}

/** Pill drawn above / below a marked point (peak or lowest). */
function MarkerLabel({ viewBox, text, tone, below, minX = 0, fill, ink }: {
  viewBox?: { x?: number; y?: number; width?: number; height?: number };
  text: string;
  tone: "peak" | "low";
  below?: boolean;
  minX?: number;
  /** Pill colour (the line's colour) and text colour; defaults come from CSS. */
  fill?: string;
  ink?: string;
}) {
  const width = Math.max(56, text.length * 6.6 + 18);
  // viewBox is the dot's box. Labels sit to the right of points near the Y
  // axis and to the left of all other points, so they stay inside the plot.
  const cx = Number(viewBox?.x ?? 0) + Number(viewBox?.width ?? 0) / 2;
  const cy = Number(viewBox?.y ?? 0) + Number(viewBox?.height ?? 0) / 2;
  const placeRight = cx - minX < width + 16;
  const x = placeRight ? cx + width / 2 + 10 : cx - width / 2 - 10;
  const top = below ? cy + 8 : cy - 30;
  return (
    <g className={`trend-marker is-${tone}`} pointerEvents="none">
      <rect x={x - width / 2} y={top} width={width} height={22} rx={11} style={fill ? { fill } : undefined} />
      <text x={x} y={top + 15} textAnchor="middle" style={ink ? { fill: ink } : undefined}>{text}</text>
    </g>
  );
}

/**
 * One or several lines in USD on ONE axis (never a dual axis). The axis
 * starts at zero and climbs in even steps to just above the highest point of
 * all lines (net-cash losses extend it below zero). Values are drawn exactly
 * as returned by the server (an empty bucket is a real zero). Each line's own
 * highest point is marked "Pic" in that line's colour; with a single line,
 * the lowest point is marked "Plus bas" and the dashed line is the average.
 */
export default function TrendChart({ points, granularity, series, periodFrom, periodTo, peaks, low, average }: {
  points: TrendPoint[];
  granularity: TrendGranularity;
  series: TrendSeries[];
  periodFrom: string;
  periodTo: string;
  peaks: MarkedValue[];
  low?: MarkedValue;
  average?: number;
}) {
  const { t } = useTranslation();
  const gradientId = useId().replace(/:/g, "");
  const phone = useMediaQuery("(max-width: 639px)");
  const reducedMotion = useMediaQuery("(prefers-reduced-motion: reduce)");
  const single = series.length === 1;

  const data: ChartDatum[] = useMemo(
    () => points.map((point) => ({ ...point, ...point.values, label: bucketLabel(point.key, granularity) })),
    [points, granularity]
  );
  const labelOf = (key: string) => data.find((point) => point.key === key)?.label;
  const highest = peaks.reduce<MarkedValue | undefined>((best, peak) => (!best || peak.value > best.value ? peak : best), undefined);
  const drawn = data.flatMap((point) => series.map((item) => point.values[item.metric]));
  const axis = peakAxis(highest?.value ?? 0, Math.min(0, ...drawn), Math.max(0, ...drawn), phone ? 4 : 5);
  const plotLeft = phone ? 58 : 76;
  const lowLabel = low ? labelOf(low.key) : undefined;
  // A lowest point of exactly zero (an hour or day with nothing) is not worth
  // a pill: it would sit on the axis. It stays in the summary above.
  const showLow = single && low !== undefined && lowLabel !== undefined && low.value !== 0;

  return (
    // Height: fixed on phones; on tablets and computers it follows the screen
    // height (CSS + useFitTrendToScreen) so the trend and the key figures fit
    // before scrolling.
    <div className="trend-chart" style={phone ? { height: 360 } : undefined}>
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart accessibilityLayer data={data} margin={{ top: 20, right: phone ? 8 : 20, bottom: 4, left: phone ? -12 : 0 }}>
          {single && (
            <defs>
              <linearGradient id={`${gradientId}-area`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={series[0].color} stopOpacity={0.16} />
                <stop offset="100%" stopColor={series[0].color} stopOpacity={0} />
              </linearGradient>
            </defs>
          )}
          <CartesianGrid vertical={false} stroke={TREND_COLORS.grid} strokeWidth={1} />
          <XAxis
            dataKey="label"
            tickLine={false}
            axisLine={{ stroke: TREND_COLORS.zero }}
            tick={{ fill: TREND_COLORS.axis, fontSize: 11 }}
            minTickGap={phone ? 18 : 28}
            interval="preserveStartEnd"
            dy={6}
          />
          <YAxis
            tickLine={false}
            axisLine={false}
            width={phone ? 70 : 76}
            tick={<AxisTick />}
            ticks={axis.ticks}
            interval={0}
            domain={axis.domain}
            allowDataOverflow={false}
          />
          <ReferenceLine y={0} stroke={TREND_COLORS.zero} strokeWidth={1} />
          {single && highest && highest.value !== 0 && (
            <ReferenceLine y={highest.value} stroke={TREND_COLORS.peak} strokeOpacity={0.45} strokeDasharray="2 4" ifOverflow="extendDomain" />
          )}
          {single && average !== undefined && Number.isFinite(average) && Math.abs(average) > 1e-9 && (
            <ReferenceLine
              y={average}
              stroke={series[0].color}
              strokeOpacity={0.55}
              strokeDasharray="5 5"
              label={{ value: t("trend.averageMark", { value: formatUSDCompact(average) }), position: "insideTopRight", fill: TREND_COLORS.axis, fontSize: 11, fontWeight: 600 }}
            />
          )}
          <Tooltip
            cursor={{ stroke: TREND_COLORS.axis, strokeWidth: 1, strokeDasharray: "3 3" }}
            wrapperStyle={{ outline: "none", zIndex: 5 }}
            content={({ active, payload }) => (
              <TrendTooltip
                active={active}
                datum={payload?.[0]?.payload as ChartDatum | undefined}
                granularity={granularity}
                series={series}
                peaks={peaks}
                low={low}
                periodFrom={periodFrom}
                periodTo={periodTo}
              />
            )}
          />
          {single && (
            <Area
              type="monotoneX"
              dataKey={series[0].metric}
              stroke="none"
              fill={`url(#${gradientId}-area)`}
              baseValue={0}
              isAnimationActive={!reducedMotion}
              animationDuration={480}
              tooltipType="none"
              activeDot={false}
            />
          )}
          {series.map((item) => (
            <Line
              key={item.metric}
              type="monotoneX"
              dataKey={item.metric}
              name={item.label}
              stroke={item.color}
              strokeWidth={SERIES_STYLE[item.metric].width}
              strokeDasharray={item.dashed ? "7 4" : undefined}
              strokeLinecap="round"
              dot={false}
              activeDot={{ r: 5, fill: item.color, stroke: "#fffdf9", strokeWidth: 2 }}
              isAnimationActive={!reducedMotion}
              animationDuration={480}
              animationEasing="ease-out"
            />
          ))}
          {showLow && low && lowLabel !== undefined && (
            <ReferenceDot
              x={lowLabel}
              y={low.value}
              r={5}
              fill="#fffdf9"
              stroke={TREND_COLORS.low}
              strokeWidth={2}
              label={<MarkerLabel text={`${t("trend.lowest")} · ${formatUSD(low.value)}`} tone="low" below minX={plotLeft} />}
            />
          )}
          {peaks.map((peak) => {
            const x = labelOf(peak.key);
            if (x === undefined) return null;
            const color = single ? TREND_COLORS.peak : SERIES_STYLE[peak.metric].color;
            const ink = "#ffffff";
            return (
              <ReferenceDot
                key={peak.metric}
                x={x}
                y={peak.value}
                r={single ? 7 : 6}
                fill={color}
                stroke="#fffdf9"
                strokeWidth={3}
                label={single
                  ? <MarkerLabel text={`${t("trend.peak")} · ${formatUSD(peak.value)}`} tone="peak" minX={plotLeft} fill={color} ink={ink} />
                  // Several lines: a small "Pic" tag in the line's colour; the
                  // amount is in that line's legend card (no overlapping pills).
                  : { value: t("trend.peak"), position: "top", offset: 10, fill: peak.metric === "entries" ? "#8a6a00" : color, fontSize: 11, fontWeight: 700 }}
              />
            );
          })}
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
