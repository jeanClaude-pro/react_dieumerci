import { useEffect, useState } from "react";
import { PackageCheck, PackageX, Search, TrendingDown, X } from "lucide-react";
import Dialog from "../../components/ui/Dialog";
import ResponsiveTable from "../../components/ui/ResponsiveTable";
import { EmptyState, ErrorState, LoadingState } from "../../components/ui/States";
import Pager from "../../components/inventory/Pager";
import type { Pagination, StockAlertRow } from "../../types/inventory";
import { formatDateTime, formatQuantity, requestJson } from "../../utils/inventoryFormat";
import { productAvailabilityLabel } from "../../utils/productAvailability";
import { periodQuery, type PeriodRange } from "../../utils/dashboardPeriod";

export type AlertKind = "low" | "out" | "became_out";

const TABS: { id: AlertKind; label: string }[] = [
  { id: "low", label: "Stock faible" },
  { id: "out", label: "En rupture" },
  { id: "became_out", label: "Tombés en rupture" },
];

const EMPTY_MESSAGES: Record<AlertKind, string> = {
  low: "Aucun produit sous le stock minimum.",
  out: "Aucun produit actif en rupture de stock.",
  became_out: "Aucun produit n'est tombé en rupture pendant cette période.",
};

const PAGE_SIZE = 20;

export default function StockAlertsDialog({ initialKind, period, periodLabel, onClose }: {
  initialKind: AlertKind;
  period: PeriodRange;
  periodLabel: string;
  onClose: () => void;
}) {
  const [kind, setKind] = useState<AlertKind>(initialKind);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState("");
  const [rows, setRows] = useState<StockAlertRow[] | null>(null);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [attempt, setAttempt] = useState(0);

  // Search is sent to the server (debounced): lists are never filtered in the browser.
  useEffect(() => {
    const timer = window.setTimeout(() => { setQuery(search.trim()); setPage(1); }, 300);
    return () => window.clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    const controller = new AbortController();
    const params = new URLSearchParams({ kind, page: String(page), limit: String(PAGE_SIZE) });
    if (query) params.set("search", query);
    const periodParams = kind === "became_out" ? `&${periodQuery(period)}` : "";
    setLoading(true);
    setError(null);
    requestJson<{ data: StockAlertRow[]; pagination: Pagination }>(`dashboard/stock-alerts?${params}${periodParams}`, { signal: controller.signal })
      .then((result) => { setRows(result.data); setPagination(result.pagination); })
      .catch((reason: Error) => { if (reason.name !== "AbortError") setError(reason.message); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [kind, page, query, period, attempt]);

  const selectKind = (next: AlertKind) => { setKind(next); setPage(1); setRows(null); };

  return (
    <Dialog label="Articles à surveiller" onClose={onClose}>
      <section className="max-w-4xl alerts-dialog">
        <header className="alerts-dialog-header">
          <div className="min-w-0">
            <h2 className="section-title">Articles à surveiller</h2>
            <p className="text-sm text-gray-500">
              {kind === "became_out" ? `Période : ${periodLabel}` : "État actuel du stock (articles actifs uniquement)"}
            </p>
          </div>
          <button type="button" className="btn btn-ghost btn-icon" aria-label="Fermer" onClick={onClose}><X aria-hidden="true" /></button>
        </header>

        <div className="alerts-dialog-body">
          <div className="alerts-dialog-tools">
            <div className="segmented" role="tablist" aria-label="Type d'alerte">
              {TABS.map((tab) => (
                <button key={tab.id} type="button" role="tab" aria-selected={kind === tab.id} onClick={() => selectKind(tab.id)}>
                  {tab.label}
                </button>
              ))}
            </div>
            <div className="input-group alerts-dialog-search">
              <Search aria-hidden="true" />
              <input className="input" type="search" aria-label="Rechercher un article" placeholder="Rechercher un article…" value={search} onChange={(event) => setSearch(event.target.value)} />
            </div>
          </div>

          {error ? (
            <ErrorState title="Impossible de charger la liste" action={<button type="button" className="btn btn-secondary" onClick={() => setAttempt((value) => value + 1)}>Réessayer</button>}>{error}</ErrorState>
          ) : rows === null ? (
            <LoadingState label="Chargement des articles…" />
          ) : rows.length === 0 ? (
            <EmptyState title={query ? "Aucun résultat" : EMPTY_MESSAGES[kind]} icon={<PackageCheck aria-hidden="true" />}>
              {query ? `Aucun article ne correspond à « ${query} ».` : undefined}
            </EmptyState>
          ) : (
            <div className={loading ? "is-refreshing" : ""} aria-busy={loading}>
              {pagination && <p className="alerts-dialog-count num">{pagination.totalRecords} article{pagination.totalRecords > 1 ? "s" : ""}</p>}
              <ResponsiveTable>
                <thead>
                  <tr>
                    <th>Article</th>
                    <th>Catégorie</th>
                    {kind === "became_out" && <th>En rupture le</th>}
                    <th>Stock actuel</th>
                    {kind !== "became_out" && <th>Minimum</th>}
                    {kind !== "became_out" && <th>À commander</th>}
                    <th>Statut</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => {
                    const status = row.deleted
                      ? { label: "Supprimé", tone: "neutral" as const }
                      : productAvailabilityLabel({ stock: row.stock ?? 0, minStock: row.minStock, status: row.status });
                    return (
                      <tr key={row._id}>
                        <td>
                          <strong className="block">{row.name}</strong>
                          {row.brand && <small className="text-gray-500">{row.brand}</small>}
                        </td>
                        <td>{row.category || "—"}</td>
                        {kind === "became_out" && <td className="num">{formatDateTime(row.reachedZeroAt)}</td>}
                        <td className="num">{row.deleted ? "—" : `${formatQuantity(row.stock)} ${row.unit || ""}`}</td>
                        {kind !== "became_out" && <td className="num">{formatQuantity(row.minStock)}</td>}
                        {kind !== "became_out" && <td className="num">{row.gap ? formatQuantity(row.gap) : "—"}</td>}
                        <td>
                          <span className={`badge badge-${status.tone === "neutral" ? "info" : status.tone}`}>
                            {status.tone === "danger" ? <PackageX aria-hidden="true" /> : status.tone === "warning" ? <TrendingDown aria-hidden="true" /> : null}
                            {status.label}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </ResponsiveTable>
              {pagination && <Pager pagination={pagination} onPage={setPage} disabled={loading} />}
            </div>
          )}
        </div>
      </section>
    </Dialog>
  );
}
