import { useMemo } from "react";
import {
  isValidCustomRange, presetRange, type DashboardPreset, type PeriodRange,
} from "../utils/dashboardPeriod";

export interface PeriodSelection {
  preset: DashboardPreset;
  custom: PeriodRange;
}

export function initialPeriodSelection(preset: DashboardPreset = "today"): PeriodSelection {
  return { preset, custom: presetRange("week") };
}

/** The selected range, or null while a custom range is invalid. `tick` re-evaluates "today". */
export function usePeriodRange(selection: PeriodSelection, tick = 0): PeriodRange | null {
  const { preset, custom } = selection;
  return useMemo(() => {
    void tick;
    if (preset === "custom") return isValidCustomRange(custom) ? custom : null;
    return presetRange(preset);
  }, [preset, custom, tick]);
}
