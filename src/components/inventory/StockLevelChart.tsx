import { useEffect, useId, useMemo, useRef, useState, type KeyboardEvent, type PointerEvent } from "react";
import type { StockSeriesPoint } from "../../types/inventory";
import { formatQuantity, formatSigned } from "../../utils/inventoryFormat";
import { niceTicks } from "../../utils/chartScale";

const HEIGHT = 200;
const PAD = { top: 12, right: 16, bottom: 28, left: 52 };

const dayLabel = new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "short", timeZone: "UTC" });
const monthLabel = new Intl.DateTimeFormat("fr-FR", { month: "short", year: "2-digit", timeZone: "UTC" });

function keyLabel(key: string, granularity: "day" | "month"): string {
  const [year, month, day = 1] = key.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return granularity === "month" ? monthLabel.format(date) : dayLabel.format(date);
}

/**
 * End-of-day (or end-of-month) stock level. Single series: no legend box; the
 * card title names it. Buckets before the ledger could prove the stock are
 * left out rather than drawn with invented values.
 */
export default function StockLevelChart({ series, granularity, unit = "pièces" }: {
  series: StockSeriesPoint[];
  granularity: "day" | "month";
  unit?: string;
}) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(640);
  const [active, setActive] = useState<number | null>(null);
  const titleId = useId();

  useEffect(() => {
    const node = wrapRef.current;
    if (!node) return;
    const observer = new ResizeObserver(([entry]) => setWidth(Math.max(260, entry.contentRect.width)));
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  const points = useMemo(() => series.filter((point) => point.level !== null) as (StockSeriesPoint & { level: number })[], [series]);
  const geometry = useMemo(() => {
    if (points.length === 0) return null;
    const levels = points.map((point) => point.level);
    const ticks = niceTicks(Math.min(...levels), Math.max(...levels));
    const yMin = ticks[0];
    const yMax = ticks[ticks.length - 1] === yMin ? yMin + 1 : ticks[ticks.length - 1];
    const plotWidth = width - PAD.left - PAD.right;
    const plotHeight = HEIGHT - PAD.top - PAD.bottom;
    const x = (index: number) => PAD.left + (points.length === 1 ? plotWidth / 2 : (index / (points.length - 1)) * plotWidth);
    const y = (value: number) => PAD.top + plotHeight - ((value - yMin) / (yMax - yMin)) * plotHeight;
    const line = points.map((point, index) => `${index ? "L" : "M"}${x(index).toFixed(1)},${y(point.level).toFixed(1)}`).join(" ");
    const area = `${line} L${x(points.length - 1).toFixed(1)},${y(yMin).toFixed(1)} L${x(0).toFixed(1)},${y(yMin).toFixed(1)} Z`;
    return { ticks, x, y, line, area, plotWidth };
  }, [points, width]);

  if (!geometry) return null;
  const { ticks, x, y, line, area, plotWidth } = geometry;
  const labelEvery = Math.max(1, Math.ceil(points.length / Math.max(2, Math.floor(plotWidth / 72))));
  const current = active === null ? null : points[active];

  const onPointerMove = (event: PointerEvent<SVGRectElement>) => {
    const bounds = event.currentTarget.getBoundingClientRect();
    const ratio = (event.clientX - bounds.left) / bounds.width;
    setActive(Math.min(points.length - 1, Math.max(0, Math.round(ratio * (points.length - 1)))));
  };
  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "ArrowRight" || event.key === "ArrowLeft") {
      event.preventDefault();
      const step = event.key === "ArrowRight" ? 1 : -1;
      setActive((index) => Math.min(points.length - 1, Math.max(0, (index ?? points.length - 1) + (index === null ? 0 : step))));
    } else if (event.key === "Escape") {
      setActive(null);
    }
  };

  return (
    <figure className="stock-chart" aria-labelledby={titleId}>
      <figcaption id={titleId} className="sr-only">
        Niveau du stock en fin de {granularity === "month" ? "mois" : "journée"}, de {formatQuantity(points[0].level)} à {formatQuantity(points[points.length - 1].level)} {unit}.
      </figcaption>
      <div
        ref={wrapRef}
        className="stock-chart-plot"
        tabIndex={0}
        role="img"
        aria-label="Graphique du niveau de stock. Flèches gauche et droite pour parcourir les valeurs."
        onKeyDown={onKeyDown}
        onBlur={() => setActive(null)}
      >
        <svg width={width} height={HEIGHT} aria-hidden="true">
          {ticks.map((tick) => (
            <g key={tick}>
              <line x1={PAD.left} x2={width - PAD.right} y1={y(tick)} y2={y(tick)} className="stock-chart-grid" />
              <text x={PAD.left - 8} y={y(tick)} dy="0.32em" textAnchor="end" className="stock-chart-tick">{formatQuantity(tick)}</text>
            </g>
          ))}
          <path d={area} className="stock-chart-area" />
          <path d={line} className="stock-chart-line" />
          {points.map((point, index) => (index % labelEvery === 0 || index === points.length - 1) && (
            <text key={point.key} x={x(index)} y={HEIGHT - 8} textAnchor={index === 0 ? "start" : index === points.length - 1 ? "end" : "middle"} className="stock-chart-tick">
              {keyLabel(point.key, granularity)}
            </text>
          ))}
          <circle cx={x(points.length - 1)} cy={y(points[points.length - 1].level)} r={4} className="stock-chart-dot" />
          {current && active !== null && (
            <g>
              <line x1={x(active)} x2={x(active)} y1={PAD.top} y2={HEIGHT - PAD.bottom} className="stock-chart-crosshair" />
              <circle cx={x(active)} cy={y(current.level)} r={4.5} className="stock-chart-dot" />
            </g>
          )}
          <rect
            x={PAD.left} y={PAD.top} width={plotWidth} height={HEIGHT - PAD.top - PAD.bottom}
            fill="transparent" onPointerMove={onPointerMove} onPointerLeave={() => setActive(null)}
          />
        </svg>
        {current && active !== null && (
          <div
            className="stock-chart-tooltip"
            role="status"
            style={{ left: Math.min(Math.max(x(active), 80), width - 80), top: Math.max(0, y(current.level) - 64) }}
          >
            <strong className="num">{formatQuantity(current.level)} {unit}</strong>
            <span>{keyLabel(current.key, granularity)} · variation {formatSigned(current.net)}</span>
          </div>
        )}
      </div>
      <details className="stock-chart-table">
        <summary>Voir les valeurs</summary>
        <table>
          <thead><tr><th scope="col">{granularity === "month" ? "Mois" : "Jour"}</th><th scope="col">Variation</th><th scope="col">Stock en fin</th></tr></thead>
          <tbody>
            {series.map((point) => (
              <tr key={point.key}>
                <td>{keyLabel(point.key, granularity)}</td>
                <td className="num">{formatSigned(point.net)}</td>
                <td className="num">{point.level === null ? "Non reconstructible" : formatQuantity(point.level)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </details>
    </figure>
  );
}
