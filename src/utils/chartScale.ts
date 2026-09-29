/**
 * Round axis ticks that always enclose [min, max] with at least two ticks, so
 * every value maps inside the plot (flat series included).
 */
export function niceTicks(min: number, max: number, count = 4): number[] {
  const span = max - min || Math.max(1, Math.abs(max));
  const rough = span / count;
  const power = 10 ** Math.floor(Math.log10(rough));
  const step = [1, 2, 2.5, 5, 10].map((factor) => factor * power).find((candidate) => candidate >= rough) ?? rough;
  const start = Math.floor(min / step) * step;
  let end = Math.ceil(max / step) * step;
  if (end <= start) end = start + step;
  const ticks: number[] = [];
  for (let index = 0; start + index * step <= end + step * 1e-9; index += 1) {
    ticks.push(Math.round((start + index * step) * 1e6) / 1e6);
  }
  return ticks;
}
