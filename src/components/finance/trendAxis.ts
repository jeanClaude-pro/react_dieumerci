// Financial Y-axis rules for the trend chart (no imports: tested with node --test).

const NICE_MULTIPLIERS = [1, 1.2, 1.5, 2, 2.5, 3, 4, 5, 6, 8, 10];

function finite(value: number, fallback = 0): number {
  return Number.isFinite(value) ? value : fallback;
}

/** Smallest conventional financial interval greater than or equal to value. */
export function niceAbove(value: number): number {
  if (!(value > 0) || !Number.isFinite(value)) return 1;
  const power = 10 ** Math.floor(Math.log10(value));
  const normalized = value / power;
  const multiplier = NICE_MULTIPLIERS.find((candidate) => candidate >= normalized - 1e-12) ?? 10;
  return Number((multiplier * power).toPrecision(12));
}

function clean(value: number): number {
  const normalized = Number(value.toPrecision(12));
  return Object.is(normalized, -0) ? 0 : normalized;
}

/**
 * Build a zero-aware, evenly spaced financial axis that contains both the
 * selected line and its comparison bars. The selected metric's exact peak is
 * shown by a reference line instead of becoming an irregular axis tick.
 */
export function peakAxis(
  peakValue: number,
  minValue: number,
  maxValue: number,
  targetIntervals = 4,
): { domain: [number, number]; ticks: number[]; step: number } {
  const safePeak = finite(peakValue);
  const dataMin = Math.min(0, finite(minValue), safePeak);
  const dataMax = Math.max(0, finite(maxValue), safePeak);

  if (dataMin === 0 && dataMax === 0) {
    return { domain: [0, 1], ticks: [0, 0.25, 0.5, 0.75, 1], step: 0.25 };
  }

  const intervals = Math.max(3, Math.min(6, Math.round(targetIntervals)));
  const span = dataMax - dataMin;
  const padding = span * 0.12;
  const paddedMin = dataMin < 0 ? dataMin - padding : 0;
  const paddedMax = dataMax > 0 ? dataMax + padding : 0;
  const step = niceAbove((paddedMax - paddedMin) / intervals);
  const bottom = dataMin < 0 ? Math.floor(paddedMin / step) * step : 0;
  const top = dataMax > 0 ? Math.ceil(paddedMax / step) * step : 0;

  const ticks: number[] = [];
  const tickCount = Math.round((top - bottom) / step);
  for (let index = 0; index <= tickCount; index += 1) {
    ticks.push(clean(bottom + index * step));
  }

  return { domain: [clean(bottom), clean(top)], ticks, step: clean(step) };
}
