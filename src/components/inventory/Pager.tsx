import { ChevronLeft, ChevronRight } from "lucide-react";
import type { Pagination } from "../../types/inventory";
import { useTranslation } from "react-i18next";

export default function Pager({ pagination, onPage, disabled = false }: {
  pagination: Pagination;
  onPage: (page: number) => void;
  disabled?: boolean;
}) {
  const { t } = useTranslation();
  if (pagination.totalPages <= 1) return null;
  return (
    <nav className="inventory-pager" aria-label={t("common.pagination")}>
      <button type="button" className="btn btn-secondary btn-sm" disabled={disabled || !pagination.hasPreviousPage} onClick={() => onPage(pagination.page - 1)}>
        <ChevronLeft aria-hidden="true" />{t("common.previous")}
      </button>
      <span className="num" aria-live="polite">{t("common.page", { page: pagination.page, pages: pagination.totalPages })}</span>
      <button type="button" className="btn btn-secondary btn-sm" disabled={disabled || !pagination.hasNextPage} onClick={() => onPage(pagination.page + 1)}>
        {t("common.next")}<ChevronRight aria-hidden="true" />
      </button>
    </nav>
  );
}
