import { AlertTriangle, CalendarRange } from "lucide-react";
import { businessDate } from "../../utils/businessTimeframe";
import { useTranslation } from "react-i18next";
import { currentMonth, DASHBOARD_PRESETS, describePeriod, presetLabel, type DashboardPreset, type PeriodRange } from "../../utils/dashboardPeriod";
import type { PeriodSelection } from "../../hooks/usePeriodRange";

/** Preset row + optional custom dates; one filter row scoping everything below it. */
export default function PeriodPicker({ value, onChange, range, className = "", presets = DASHBOARD_PRESETS }: {
  value: PeriodSelection;
  onChange: (next: PeriodSelection) => void;
  range: PeriodRange | null;
  className?: string;
  presets?: { id: DashboardPreset; label: string }[];
}) {
  const { t } = useTranslation();
  const today = businessDate();
  return (
    <div className={`period-picker ${className}`}>
      <div className="segmented period-presets" role="radiogroup" aria-label={t("period.label")}>
        {presets.map((option) => (
          <button key={option.id} type="button" role="radio" aria-checked={value.preset === option.id} onClick={() => onChange({ ...value, preset: option.id })}>
            {presetLabel(option.id)}
          </button>
        ))}
      </div>
      {value.preset === "pickMonth" && (
        <div className="period-custom">
          <label className="field">
            <span className="field-label">{t("period.month")}</span>
            <input className="input" type="month" value={value.month} max={currentMonth()}
              onChange={(event) => onChange({ ...value, month: event.target.value })} />
          </label>
        </div>
      )}
      {value.preset === "custom" && (
        <div className="period-custom">
          <label className="field">
            <span className="field-label">{t("period.from")}</span>
            <input className="input" type="date" value={value.custom.from} max={today} onChange={(event) => onChange({ ...value, custom: { ...value.custom, from: event.target.value } })} />
          </label>
          <label className="field">
            <span className="field-label">{t("period.to")}</span>
            <input className="input" type="date" value={value.custom.to} min={value.custom.from} max={today} onChange={(event) => onChange({ ...value, custom: { ...value.custom, to: event.target.value } })} />
          </label>
        </div>
      )}
      {range ? (
        <p className="period-label" aria-live="polite"><CalendarRange aria-hidden="true" />{describePeriod(range)}</p>
      ) : (
        <p className="period-label is-invalid" role="alert"><AlertTriangle aria-hidden="true" />{t("period.invalid")}</p>
      )}
    </div>
  );
}
