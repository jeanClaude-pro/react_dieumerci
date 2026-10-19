import { useEffect, useMemo, useState } from "react";
import {
  AlertOctagon, AlertTriangle, CheckCircle2, ChevronRight, Eye, Filter, RefreshCw, Search, ShieldAlert, ShieldCheck, UserX, X,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import type { TFunction } from "i18next";
import PageHeader from "../../components/ui/PageHeader";
import Dialog from "../../components/ui/Dialog";
import PeriodPicker from "../../components/inventory/PeriodPicker";
import { EmptyState, ErrorState, Skeleton } from "../../components/ui/States";
import { initialPeriodSelection, usePeriodRange } from "../../hooks/usePeriodRange";
import { describePeriod, REPORT_PRESETS } from "../../utils/dashboardPeriod";
import { requestJson } from "../../utils/inventoryFormat";
import { formatDate, formatDateTime, formatNumber, formatTimeOfDay } from "../../i18n/format";
import { roleLabel } from "../../i18n/nav";
import type { Pagination } from "../../types/inventory";

type Severity = "info" | "warning" | "critical";
type Outcome = "success" | "denied" | "failed" | "error";

interface AuditEntry {
  _id: string;
  at: string;
  user: string | null;
  userName: string | null;
  userEmail: string | null;
  role: string | null;
  method: string;
  path: string;
  route: string;
  action: string;
  category: string;
  resourceId: string | null;
  statusCode: number;
  outcome: Outcome;
  ip: string | null;
  durationMs: number;
  details: Record<string, unknown>;
  severity: Severity;
  suspicious: boolean;
  flags: string[];
  review?: { reviewed: boolean; reviewedByName: string | null; reviewedAt: string | null; note: string };
}

interface AuditSummary {
  total: number;
  bySeverity: Record<Severity, number>;
  byOutcome: Record<Outcome, number>;
  byCategory: { category: string; count: number; suspicious: number }[];
  byFlag: { flag: string; count: number }[];
  topUsers: { userId: string; userName: string | null; role: string | null; actions: number; suspicious: number; critical: number; lastAt: string }[];
  timeline: { date: string; actions: number; suspicious: number }[];
  unreviewedSuspicious: number;
}

interface AuditResponse {
  data: AuditEntry[];
  pagination: Pagination;
  summary: AuditSummary;
}

const CATEGORIES = ["sales", "receipts", "stock", "cash", "expenses", "rates", "debts", "customers", "users", "settings", "auth", "reports", "security", "other"];

const actionLabel = (t: TFunction, action: string) => t(`audit.actions.${action.replace(".", "_")}`, { defaultValue: action });
const flagLabel = (t: TFunction, flag: string) => t(`audit.flags.${flag}.label`, { defaultValue: flag });
const flagHelp = (t: TFunction, flag: string) => t(`audit.flags.${flag}.help`, { defaultValue: "" });

function SeverityBadge({ severity }: { severity: Severity }) {
  const { t } = useTranslation();
  const Icon = severity === "critical" ? AlertOctagon : severity === "warning" ? AlertTriangle : ShieldCheck;
  return <span className={`audit-sev is-${severity}`}><Icon aria-hidden="true" />{t(`audit.severity.${severity}`)}</span>;
}

function OutcomeBadge({ outcome, status }: { outcome: Outcome; status: number }) {
  const { t } = useTranslation();
  return <span className={`audit-outcome is-${outcome}`} title={`HTTP ${status}`}>{t(`audit.outcome.${outcome}`)}</span>;
}

function DetailDialog({ entry, onClose, onReviewed }: { entry: AuditEntry; onClose: () => void; onReviewed: (entry: AuditEntry) => void }) {
  const { t } = useTranslation();
  const [note, setNote] = useState(entry.review?.note || "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const save = async () => {
    setSaving(true);
    setError("");
    try {
      const response = await requestJson<{ data: AuditEntry }>(`audit/${entry._id}/review`, { method: "PATCH", body: JSON.stringify({ note }) });
      onReviewed(response.data);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : String(reason));
    } finally {
      setSaving(false);
    }
  };
  const summary = (entry.details?.summary ?? null) as Record<string, unknown> | null;
  return (
    <Dialog label={t("audit.detail.title")} onClose={onClose}>
      <div className="dialog-panel audit-detail">
        <header className={`dialog-head audit-detail-head is-${entry.severity}`}>
          <div>
            <h2 className="dialog-title">{actionLabel(t, entry.action)}</h2>
            <p className="dialog-subtitle">{formatDateTime(entry.at)} · {entry.userName || entry.userEmail || t("audit.anonymous")}</p>
          </div>
          <button type="button" className="btn btn-ghost btn-icon" onClick={onClose} aria-label={t("common.close")}><X aria-hidden="true" /></button>
        </header>
        <div className="dialog-body audit-detail-body">
          <div className="audit-detail-badges"><SeverityBadge severity={entry.severity} /><OutcomeBadge outcome={entry.outcome} status={entry.statusCode} /></div>
          {entry.flags.length > 0 && (
            <section className="audit-why">
              <h3>{t("audit.detail.why")}</h3>
              <ul>
                {entry.flags.map((flag) => (
                  <li key={flag}><strong>{flagLabel(t, flag)}</strong><span>{flagHelp(t, flag)}</span></li>
                ))}
              </ul>
            </section>
          )}
          <dl className="audit-facts">
            <div><dt>{t("audit.detail.user")}</dt><dd>{entry.userName || "—"}{entry.role && <small>{roleLabel(t, entry.role)}</small>}</dd></div>
            <div><dt>{t("audit.detail.email")}</dt><dd>{entry.userEmail || "—"}</dd></div>
            <div><dt>{t("audit.detail.category")}</dt><dd>{t(`audit.categories.${entry.category}`, { defaultValue: entry.category })}</dd></div>
            <div><dt>{t("audit.detail.request")}</dt><dd className="mono">{entry.method} {entry.path}</dd></div>
            <div><dt>{t("audit.detail.result")}</dt><dd>HTTP {entry.statusCode} · {formatNumber(entry.durationMs, 0)} ms</dd></div>
            <div><dt>{t("audit.detail.ip")}</dt><dd className="mono">{entry.ip || "—"}</dd></div>
            {entry.resourceId && <div><dt>{t("audit.detail.resource")}</dt><dd className="mono">{entry.resourceId}</dd></div>}
          </dl>
          {summary && (
            <section>
              <h3 className="audit-subtitle">{t("audit.detail.summary")}</h3>
              <pre className="audit-json">{JSON.stringify(summary, null, 2)}</pre>
            </section>
          )}
          <details className="audit-raw">
            <summary>{t("audit.detail.raw")}</summary>
            <pre className="audit-json">{JSON.stringify(entry.details ?? {}, null, 2)}</pre>
          </details>
          <section className="audit-review">
            <h3 className="audit-subtitle">{t("audit.detail.review")}</h3>
            {entry.review?.reviewed ? (
              <p className="audit-reviewed"><CheckCircle2 aria-hidden="true" />{t("audit.detail.reviewedBy", { name: entry.review.reviewedByName || "—", date: formatDateTime(entry.review.reviewedAt) })}</p>
            ) : (
              <p className="section-help">{t("audit.detail.reviewHelp")}</p>
            )}
            <label className="field">
              <span className="field-label">{t("audit.detail.note")}</span>
              <textarea className="input" rows={2} maxLength={500} value={note} onChange={(event) => setNote(event.target.value)} placeholder={t("audit.detail.notePlaceholder")} />
            </label>
            {error && <div className="alert alert-danger" role="alert">{error}</div>}
          </section>
        </div>
        <footer className="dialog-foot">
          <button type="button" className="btn btn-secondary" onClick={onClose}>{t("common.close")}</button>
          <button type="button" className="btn btn-primary" onClick={save} disabled={saving}>
            <CheckCircle2 aria-hidden="true" />{entry.review?.reviewed ? t("audit.detail.updateReview") : t("audit.detail.markReviewed")}
          </button>
        </footer>
      </div>
    </Dialog>
  );
}

export default function AuditLog() {
  const { t } = useTranslation();
  const [selection, setSelection] = useState(() => initialPeriodSelection("week"));
  const [refreshKey, setRefreshKey] = useState(0);
  const range = usePeriodRange(selection, refreshKey);
  const [scope, setScope] = useState<"all" | "suspicious" | "critical">("all");
  const [category, setCategory] = useState("");
  const [outcome, setOutcome] = useState("");
  const [userId, setUserId] = useState("");
  const [unreviewed, setUnreviewed] = useState(false);
  const [searchDraft, setSearchDraft] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [data, setData] = useState<AuditResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadedAt, setLoadedAt] = useState<Date | null>(null);
  const [selected, setSelected] = useState<AuditEntry | null>(null);

  useEffect(() => {
    const timer = window.setTimeout(() => setSearch(searchDraft.trim()), 350);
    return () => window.clearTimeout(timer);
  }, [searchDraft]);

  const query = useMemo(() => {
    if (!range) return null;
    const params = new URLSearchParams({ from: range.from, to: range.to, page: String(page), limit: "50" });
    if (scope === "suspicious") params.set("suspicious", "true");
    if (scope === "critical") params.set("severity", "critical");
    if (category) params.set("category", category);
    if (outcome) params.set("outcome", outcome);
    if (userId) params.set("user", userId);
    if (unreviewed) { params.set("suspicious", "true"); params.set("reviewed", "false"); }
    if (search) params.set("search", search);
    return params.toString();
  }, [range, page, scope, category, outcome, userId, unreviewed, search]);

  useEffect(() => { setPage(1); }, [range, scope, category, outcome, userId, unreviewed, search]);

  useEffect(() => {
    if (!query) return;
    const controller = new AbortController();
    setLoading(true);
    setError(null);
    requestJson<AuditResponse>(`audit?${query}`, { signal: controller.signal })
      .then((response) => { setData(response); setLoadedAt(new Date()); })
      .catch((reason: Error) => { if (reason.name !== "AbortError") setError(reason.message); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [query, refreshKey]);

  const summary = data?.summary;
  const rows = data?.data ?? [];
  const pagination = data?.pagination;
  const replaceEntry = (entry: AuditEntry) => {
    setSelected(entry);
    setData((current) => current && { ...current, data: current.data.map((row) => (row._id === entry._id ? entry : row)) });
  };
  const userName = summary?.topUsers.find((row) => row.userId === userId)?.userName;

  return (
    <div className="page audit-page">
      <PageHeader
        eyebrow={t("nav.sections.steering")}
        icon={<ShieldAlert aria-hidden="true" />}
        title={t("audit.title")}
        description={t("audit.subtitle")}
        actions={
          <button type="button" className="btn btn-secondary" onClick={() => setRefreshKey((value) => value + 1)} disabled={loading}>
            <RefreshCw className={loading ? "animate-spin" : ""} aria-hidden="true" />
            {loadedAt ? t("common.updatedAt", { time: formatTimeOfDay(loadedAt) }) : t("common.refresh")}
          </button>
        }
      />

      <div className="card audit-filters">
        <PeriodPicker value={selection} onChange={setSelection} range={range} presets={REPORT_PRESETS} />
        <div className="audit-filter-row">
          <div className="segmented segmented-sm" role="radiogroup" aria-label={t("audit.filters.scope")}>
            {(["all", "suspicious", "critical"] as const).map((option) => (
              <button key={option} type="button" role="radio" aria-checked={scope === option} onClick={() => setScope(option)}>{t(`audit.filters.${option}`)}</button>
            ))}
          </div>
          <label className="audit-select">
            <span className="sr-only">{t("audit.filters.category")}</span>
            <select className="input" value={category} onChange={(event) => setCategory(event.target.value)}>
              <option value="">{t("audit.filters.allCategories")}</option>
              {CATEGORIES.map((value) => <option key={value} value={value}>{t(`audit.categories.${value}`)}</option>)}
            </select>
          </label>
          <label className="audit-select">
            <span className="sr-only">{t("audit.filters.outcome")}</span>
            <select className="input" value={outcome} onChange={(event) => setOutcome(event.target.value)}>
              <option value="">{t("audit.filters.allOutcomes")}</option>
              {(["success", "denied", "failed", "error"] as Outcome[]).map((value) => <option key={value} value={value}>{t(`audit.outcome.${value}`)}</option>)}
            </select>
          </label>
          <label className="audit-search">
            <Search aria-hidden="true" />
            <span className="sr-only">{t("audit.filters.search")}</span>
            <input className="input" type="search" value={searchDraft} onChange={(event) => setSearchDraft(event.target.value)} placeholder={t("audit.filters.searchPlaceholder")} />
          </label>
          <label className="audit-toggle">
            <input type="checkbox" checked={unreviewed} onChange={(event) => setUnreviewed(event.target.checked)} />
            <span>{t("audit.filters.unreviewed")}</span>
          </label>
          {userId && (
            <button type="button" className="audit-chip" onClick={() => setUserId("")}>
              <Filter aria-hidden="true" />{t("audit.filters.user", { name: userName || "—" })}<X aria-hidden="true" />
            </button>
          )}
        </div>
      </div>

      {error && !data ? (
        <div className="card"><ErrorState title={t("audit.error")} action={<button type="button" className="btn btn-primary" onClick={() => setRefreshKey((value) => value + 1)}><RefreshCw aria-hidden="true" />{t("common.retry")}</button>}>{error}</ErrorState></div>
      ) : (
        <div className={`audit-layout ${loading && data ? "is-refreshing" : ""}`} aria-busy={loading}>
          <section className="audit-tiles" aria-label={t("audit.tiles.label")}>
            <div className="audit-tile"><span>{t("audit.tiles.total")}</span><strong>{summary ? formatNumber(summary.total, 0) : <Skeleton className="h-7 w-16" />}</strong><small>{range ? describePeriod(range) : ""}</small></div>
            <button type="button" className={`audit-tile is-warning ${scope === "suspicious" ? "is-selected" : ""}`} onClick={() => setScope("suspicious")}>
              <span>{t("audit.tiles.suspicious")}</span><strong>{summary ? formatNumber(summary.bySeverity.warning + summary.bySeverity.critical, 0) : "…"}</strong><small>{t("audit.tiles.suspiciousHelp")}</small>
            </button>
            <button type="button" className={`audit-tile is-critical ${scope === "critical" ? "is-selected" : ""}`} onClick={() => setScope("critical")}>
              <span>{t("audit.tiles.critical")}</span><strong>{summary ? formatNumber(summary.bySeverity.critical, 0) : "…"}</strong><small>{t("audit.tiles.criticalHelp")}</small>
            </button>
            <button type="button" className={`audit-tile ${outcome === "denied" ? "is-selected" : ""}`} onClick={() => setOutcome(outcome === "denied" ? "" : "denied")}>
              <span>{t("audit.tiles.denied")}</span><strong>{summary ? formatNumber(summary.byOutcome.denied, 0) : "…"}</strong><small>{t("audit.tiles.deniedHelp")}</small>
            </button>
            <button type="button" className={`audit-tile is-review ${unreviewed ? "is-selected" : ""}`} onClick={() => setUnreviewed((value) => !value)}>
              <span>{t("audit.tiles.toReview")}</span><strong>{summary ? formatNumber(summary.unreviewedSuspicious, 0) : "…"}</strong><small>{t("audit.tiles.toReviewHelp")}</small>
            </button>
          </section>

          <section className="card audit-list" aria-labelledby="audit-list-title">
            <header className="card-header">
              <div>
                <h2 id="audit-list-title" className="section-title">{t("audit.list.title")}</h2>
                <p className="section-help">{t("audit.list.help")}</p>
              </div>
              {pagination && <span className="badge">{t("audit.list.count", { count: pagination.totalRecords, formatted: formatNumber(pagination.totalRecords, 0) })}</span>}
            </header>
            {!data ? (
              <div className="card-body"><Skeleton className="h-64 w-full" /></div>
            ) : rows.length === 0 ? (
              <div className="card-body"><EmptyState title={t("audit.list.emptyTitle")} icon={<ShieldCheck aria-hidden="true" />}>{t("audit.list.emptyBody")}</EmptyState></div>
            ) : (
              <ul className="audit-rows">
                {rows.map((entry) => (
                  <li key={entry._id}>
                    <button type="button" className={`audit-row is-${entry.severity} ${entry.review?.reviewed ? "is-reviewed" : ""}`} onClick={() => setSelected(entry)}>
                      <span className="audit-row-time">
                        <strong>{formatTimeOfDay(entry.at)}</strong>
                        <small>{formatDate(entry.at)}</small>
                      </span>
                      <span className="audit-row-main">
                        <span className="audit-row-action">{actionLabel(t, entry.action)}</span>
                        <span className="audit-row-user">
                          {entry.userName || entry.userEmail || t("audit.anonymous")}
                          {entry.role && <small>· {roleLabel(t, entry.role)}</small>}
                        </span>
                        {entry.flags.length > 0 && (
                          <span className="audit-row-flags">
                            {entry.flags.slice(0, 3).map((flag) => <span key={flag} className={`audit-flag is-${entry.severity}`}>{flagLabel(t, flag)}</span>)}
                            {entry.flags.length > 3 && <span className="audit-flag">+{entry.flags.length - 3}</span>}
                          </span>
                        )}
                      </span>
                      <span className="audit-row-side">
                        <OutcomeBadge outcome={entry.outcome} status={entry.statusCode} />
                        {entry.suspicious && <SeverityBadge severity={entry.severity} />}
                        {entry.review?.reviewed && <span className="audit-reviewed-mark" title={t("audit.list.reviewed")}><CheckCircle2 aria-hidden="true" /><span className="sr-only">{t("audit.list.reviewed")}</span></span>}
                        <ChevronRight aria-hidden="true" className="audit-row-chevron" />
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
            {pagination && pagination.totalPages > 1 && (
              <div className="audit-pager">
                <button type="button" className="btn btn-secondary btn-sm" disabled={!pagination.hasPreviousPage} onClick={() => setPage((value) => value - 1)}>{t("common.previous")}</button>
                <span>{t("common.page", { page: pagination.page, pages: pagination.totalPages })}</span>
                <button type="button" className="btn btn-secondary btn-sm" disabled={!pagination.hasNextPage} onClick={() => setPage((value) => value + 1)}>{t("common.next")}</button>
              </div>
            )}
          </section>

          <aside className="audit-side">
            <section className="card report-panel" aria-labelledby="audit-users-title">
              <header className="card-header">
                <div>
                  <h2 id="audit-users-title" className="section-title">{t("audit.users.title")}</h2>
                  <p className="section-help">{t("audit.users.help")}</p>
                </div>
              </header>
              {!summary?.topUsers.length ? (
                <div className="card-body"><EmptyState title={t("audit.users.empty")} icon={<UserX aria-hidden="true" />} /></div>
              ) : (
                <ul className="audit-users">
                  {summary.topUsers.map((row) => (
                    <li key={row.userId}>
                      <button type="button" className={`audit-user ${row.critical ? "is-critical" : row.suspicious ? "is-warning" : ""} ${userId === row.userId ? "is-selected" : ""}`} onClick={() => setUserId(userId === row.userId ? "" : row.userId)}>
                        <span className="audit-user-avatar" aria-hidden="true">{(row.userName || "?").slice(0, 2).toUpperCase()}</span>
                        <span className="audit-user-text"><strong>{row.userName || "—"}</strong><small>{roleLabel(t, row.role)} · {t("audit.users.actions", { count: row.actions })}</small></span>
                        {row.suspicious > 0 && <span className={`audit-user-count ${row.critical ? "is-critical" : "is-warning"}`}>{row.suspicious}</span>}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </section>
            <section className="card report-panel" aria-labelledby="audit-flags-title">
              <header className="card-header">
                <div>
                  <h2 id="audit-flags-title" className="section-title">{t("audit.flagsPanel.title")}</h2>
                  <p className="section-help">{t("audit.flagsPanel.help")}</p>
                </div>
              </header>
              {!summary?.byFlag.length ? (
                <div className="card-body"><EmptyState title={t("audit.flagsPanel.empty")} icon={<ShieldCheck aria-hidden="true" />} /></div>
              ) : (
                <ul className="audit-flag-list">
                  {summary.byFlag.map((row) => (
                    <li key={row.flag}>
                      <span><strong>{flagLabel(t, row.flag)}</strong><small>{flagHelp(t, row.flag)}</small></span>
                      <span className="audit-flag-count">{formatNumber(row.count, 0)}</span>
                    </li>
                  ))}
                </ul>
              )}
            </section>
            <section className="card report-panel audit-legend">
              <div className="card-body">
                <p><Eye aria-hidden="true" className="inline-icon" />{t("audit.legend.body")}</p>
              </div>
            </section>
          </aside>
        </div>
      )}

      {selected && <DetailDialog entry={selected} onClose={() => setSelected(null)} onReviewed={replaceEntry} />}
    </div>
  );
}
