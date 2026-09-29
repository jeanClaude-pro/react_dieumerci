import { ChevronLeft, ChevronRight } from "lucide-react";
import type { Pagination } from "../../types/inventory";

export default function Pager({ pagination, onPage, disabled = false }: {
  pagination: Pagination;
  onPage: (page: number) => void;
  disabled?: boolean;
}) {
  if (pagination.totalPages <= 1) return null;
  return (
    <nav className="inventory-pager" aria-label="Pagination">
      <button type="button" className="btn btn-secondary btn-sm" disabled={disabled || !pagination.hasPreviousPage} onClick={() => onPage(pagination.page - 1)}>
        <ChevronLeft aria-hidden="true" />Précédent
      </button>
      <span className="num" aria-live="polite">Page {pagination.page} / {pagination.totalPages}</span>
      <button type="button" className="btn btn-secondary btn-sm" disabled={disabled || !pagination.hasNextPage} onClick={() => onPage(pagination.page + 1)}>
        Suivant<ChevronRight aria-hidden="true" />
      </button>
    </nav>
  );
}
