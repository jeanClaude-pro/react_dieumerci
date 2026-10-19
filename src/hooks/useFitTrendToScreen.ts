import { useEffect, type RefObject } from "react";

const MIN_CHART = 200;
const MAX_CHART = 420;
const BOTTOM_GAP = 12;

/**
 * Tablets and computers: give the trend chart exactly the height left on the
 * first screen, so the user sees the whole Trend section AND the key figures
 * before scrolling. Measures what sits above and around the chart (header,
 * period filter, trend header, summary and story, and the key figures when
 * they are stacked under the trend) and writes the remaining height to --trend-chart-h on the page. Phones keep a fixed height.
 */
export function useFitTrendToScreen(pageRef: RefObject<HTMLElement | null>, ready: boolean) {
  useEffect(() => {
    const page = pageRef.current;
    if (!page || !ready) return;
    let frame = 0;

    const fit = () => {
      const chart = page.querySelector<HTMLElement>(".trend-chart");
      const trend = page.querySelector<HTMLElement>(".trend-card");
      const figures = page.querySelector<HTMLElement>(".reports-kpis");
      if (window.innerWidth < 640 || !chart || !trend) {
        page.style.removeProperty("--trend-chart-h");
        return;
      }
      const scroller = page.closest<HTMLElement>(".app-main") ?? (document.scrollingElement as HTMLElement);
      const isDocument = scroller === document.scrollingElement;
      const viewportHeight = isDocument ? window.innerHeight : scroller.clientHeight;
      const scrollerTop = isDocument ? 0 : scroller.getBoundingClientRect().top;
      const bottomOf = (element: HTMLElement) => element.getBoundingClientRect().bottom - scrollerTop + scroller.scrollTop;
      const chartBox = chart.getBoundingClientRect();
      // What must fit: the trend card, plus the key figures when they sit
      // under the chart (tablets). Beside the chart (computers) they do not
      // depend on its height.
      let lowest = bottomOf(trend);
      if (figures && figures.getBoundingClientRect().top >= chartBox.bottom) lowest = Math.max(lowest, bottomOf(figures));
      const everythingElse = lowest - chart.offsetHeight;
      const height = Math.round(Math.min(MAX_CHART, Math.max(MIN_CHART, viewportHeight - BOTTOM_GAP - everythingElse)));
      if (page.style.getPropertyValue("--trend-chart-h") !== `${height}px`) page.style.setProperty("--trend-chart-h", `${height}px`);
    };

    const schedule = () => { cancelAnimationFrame(frame); frame = requestAnimationFrame(fit); };

    schedule();
    const observer = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(schedule);
    observer?.observe(page);
    window.addEventListener("resize", schedule);
    return () => {
      cancelAnimationFrame(frame);
      observer?.disconnect();
      window.removeEventListener("resize", schedule);
    };
  }, [pageRef, ready]);
}
