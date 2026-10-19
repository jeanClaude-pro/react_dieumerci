import { ArrowLeftRight, Loader2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { formatDateGMT2 } from "../../utils/dateUtils";
import { formatNumber } from "../../i18n/format";

/** Read-only display of the current USD/FC rate already loaded by a page. */
export default function ExchangeRateChip({ loading, rate }: {
  loading: boolean;
  rate: { rate: number; effectiveFrom: string } | null;
}) {
  const { t } = useTranslation();
  return (
    <div className="pos-rate" role="status" aria-live="polite">
      <ArrowLeftRight aria-hidden="true" />
      {loading ? (
        <span className="text-sm text-gray-500 inline-flex items-center gap-2">
          <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />{t("rateChip.loading")}
        </span>
      ) : rate ? (
        <div>
          <strong>1 USD = {formatNumber(rate.rate)} FC</strong>
          <small>{t("rateChip.since", { date: formatDateGMT2(rate.effectiveFrom) })}</small>
        </div>
      ) : (
        <span className="text-sm font-medium text-red-700">{t("rateChip.unavailable")}</span>
      )}
    </div>
  );
}
