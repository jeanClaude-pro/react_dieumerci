import { ArrowLeftRight, Loader2 } from "lucide-react";
import { formatDateGMT2 } from "../../utils/dateUtils";

/** Read-only display of the current USD/FC rate already loaded by a page. */
export default function ExchangeRateChip({ loading, rate }: {
  loading: boolean;
  rate: { rate: number; effectiveFrom: string } | null;
}) {
  return (
    <div className="pos-rate" role="status" aria-live="polite">
      <ArrowLeftRight aria-hidden="true" />
      {loading ? (
        <span className="text-sm text-gray-500 inline-flex items-center gap-2">
          <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />Taux du jour…
        </span>
      ) : rate ? (
        <div>
          <strong>1 USD = {new Intl.NumberFormat("fr-FR").format(rate.rate)} FC</strong>
          <small>Taux du jour · depuis le {formatDateGMT2(rate.effectiveFrom)}</small>
        </div>
      ) : (
        <span className="text-sm font-medium text-red-700">Taux non disponible</span>
      )}
    </div>
  );
}
