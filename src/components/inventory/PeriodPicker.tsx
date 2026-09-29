import { AlertTriangle, CalendarRange } from "lucide-react";
import { businessDate } from "../../utils/businessTimeframe";
import { DASHBOARD_PRESETS, describePeriod, type PeriodRange } from "../../utils/dashboardPeriod";
import type { PeriodSelection } from "../../hooks/usePeriodRange";

/** Preset row + optional custom dates; one filter row scoping everything below it. */
export default function PeriodPicker({ value, onChange, range, className = "" }: {
  value: PeriodSelection;
  onChange: (next: PeriodSelection) => void;
  range: PeriodRange | null;
  className?: string;
}) {
  const today = businessDate();
  return (
    <div className={`period-picker ${className}`}>
      <div className="segmented period-presets" role="radiogroup" aria-label="Période">
        {DASHBOARD_PRESETS.map((option) => (
          <button key={option.id} type="button" role="radio" aria-checked={value.preset === option.id} onClick={() => onChange({ ...value, preset: option.id })}>
            {option.label}
          </button>
        ))}
      </div>
      {value.preset === "custom" && (
        <div className="period-custom">
          <label className="field">
            <span className="field-label">Du</span>
            <input className="input" type="date" value={value.custom.from} max={today} onChange={(event) => onChange({ ...value, custom: { ...value.custom, from: event.target.value } })} />
          </label>
          <label className="field">
            <span className="field-label">Au</span>
            <input className="input" type="date" value={value.custom.to} min={value.custom.from} max={today} onChange={(event) => onChange({ ...value, custom: { ...value.custom, to: event.target.value } })} />
          </label>
        </div>
      )}
      {range ? (
        <p className="period-label" aria-live="polite"><CalendarRange aria-hidden="true" />{describePeriod(range)}</p>
      ) : (
        <p className="period-label is-invalid" role="alert"><AlertTriangle aria-hidden="true" />Date de début après la date de fin, ou dans le futur.</p>
      )}
    </div>
  );
}
