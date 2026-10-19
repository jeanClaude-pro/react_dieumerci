import { useMemo } from "react";
import {
  currentMonth, isValidCustomRange, monthRange, presetRange, type DashboardPreset, type PeriodRange,
} from "../utils/dashboardPeriod";

export interface PeriodSelection {
  preset: DashboardPreset;
  custom: PeriodRange;
  /** "YYYY-MM" chosen in the calendar for the "pickMonth" preset. */
  month: string;
}

export function initialPeriodSelection(preset: DashboardPreset = "today"): PeriodSelection {
  return { preset, custom: presetRange("week"), month: currentMonth() };
}

/** The selected range, or null while a custom range is invalid. `tick` re-evaluates "today". */
export function usePeriodRange(selection: PeriodSelection, tick = 0): PeriodRange | null {
  const { preset, custom, month } = selection;
  return useMemo(() => {
    void tick;
    if (preset === "custom") return isValidCustomRange(custom) ? custom : null;
    if (preset === "pickMonth") return monthRange(month);
    return presetRange(preset);
  }, [preset, custom, month, tick]);
}
