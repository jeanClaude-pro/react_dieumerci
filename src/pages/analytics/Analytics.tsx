import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ChartColumn, CircleArrowDown, Coins, FileDown, Landmark, Package, Receipt, ShoppingCart,
  RefreshCw, Shield, ShoppingBag, TrendingUp, Users, WalletCards,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { useFitTrendToScreen } from "../../hooks/useFitTrendToScreen";
import PageHeader from "../../components/ui/PageHeader";
import { ErrorState, LoadingState, PermissionDenied } from "../../components/ui/States";
import PeriodPicker from "../../components/inventory/PeriodPicker";
import FinancialTrend from "../../components/finance/FinancialTrend";
import { initialPeriodSelection, usePeriodRange } from "../../hooks/usePeriodRange";
import { describePeriod, REPORT_PRESETS } from "../../utils/dashboardPeriod";
import { serverUrl } from "../../utils/constants";
import { formatNumber, formatPercent, formatTimeOfDay, formatUSD } from "../../i18n/format";
import { generateCompanyReport, type ReportSections } from "./reportGenerator";
import ReportBuilderDialog from "./ReportBuilderDialog";
import { CashBridge, KpiCard, ProductPerformance, RankedList, type ProductRow } from "./ReportParts";
import { getVerifiedUserRaw } from "../../lib/sessionManager";

/** data of GET /api/analytics/summary (all amounts in USD). */
interface AnalyticsData {
  totalSales: number;
  totalRevenue: number;
  totalCustomers: number;
  totalProducts: number;
  totalValidatedExpenses: number;
  totalEntries: number;
  entryCount: number;
  netRevenue: number;
  averageTicket?: number;
  unitsSold?: number;
  reimbursement?: {
    borrowedDuringPeriod: number;
    repaidDuringPeriod: number;
    repaymentCount: number;
    currentOutstanding: number;
  };
  topProducts: ProductRow[];
  topCustomers: { name: string; purchases: number; totalSpent: number }[];
  paymentMethods?: { _id: string; count: number; amount: number }[];
  recentTrends: {
    salesGrowth: number | null;
    revenueGrowth: number | null;
    customerGrowth: number | null;
    netCashGrowth?: number | null;
    entryGrowth?: number | null;
    expenseGrowth?: number | null;
  };
  previous?: {
    totalSales: number;
    totalRevenue: number;
    totalValidatedExpenses: number;
    totalEntries: number;
    netCash: number;
    averageTicket: number;
  };
}

const authHeaders = () => {
  const token = localStorage.getItem("token");
  return { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) };
};

function readUser(): { role?: string; username?: string; email?: string } | null {
  try {
    const raw = getVerifiedUserRaw();
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function change(current: number | undefined, previous: number | undefined) {
  if (current === undefined || previous === undefined || !Number.isFinite(previous) || previous === 0) return null;
  return ((current - previous) / Math.abs(previous)) * 100;
}

export default function Analytics() {
  const { t } = useTranslation();
  const user = readUser();
  const isAdmin = user?.role === "admin";
  const adminName = user?.username || user?.email || "Admin";

  const [selection, setSelection] = useState(() => initialPeriodSelection("today"));
  const [refreshKey, setRefreshKey] = useState(0);
  const range = usePeriodRange(selection, refreshKey);
  const periodLabel = range ? describePeriod(range) : t("period.invalidShort");

  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const pageRef = useRef<HTMLDivElement>(null);
  useFitTrendToScreen(pageRef, analytics !== null);
  const [loadedAt, setLoadedAt] = useState<Date | null>(null);
  const [showBuilder, setShowBuilder] = useState(false);

  const [shopSettings, setShopSettings] = useState({
    shopName: "ETS. DIEU MERCI",
    shopAddress: "Av Manono Coin Munama N°39, C. Kenya, Lubumbashi",
    shopPhone: "+243 977 771 421 / +243 853 549 102",
    shopRegistration: "RCCM: 14-A-017885",
  });

  // Access gate: the administrator re-confirms the password (checked by the
  // server) before any financial figure is requested.
  const [accessVerified, setAccessVerified] = useState(false);
  const [accessPassword, setAccessPassword] = useState("");
  const [accessError, setAccessError] = useState("");
  const [accessLoading, setAccessLoading] = useState(false);

  const verifyPassword = useCallback(async (password: string, purpose: string): Promise<boolean> => {
    try {
      const response = await fetch(`${serverUrl}/auth/verify-password`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({ password, purpose }),
      });
      if (!response.ok) return false;
      const body = await response.json().catch(() => ({}));
      return body?.verified !== false;
    } catch {
      return false;
    }
  }, []);

  useEffect(() => {
    if (!accessVerified) return;
    fetch(`${serverUrl}/settings/receipt`, { headers: authHeaders() })
      .then((response) => (response.ok ? response.json() : null))
      .then((data) => {
        if (data) {
          setShopSettings((current) => ({
            shopName: data.shopName || current.shopName,
            shopAddress: data.shopAddress || current.shopAddress,
            shopPhone: data.shopNumber || current.shopPhone,
            shopRegistration: data.shopRegistration || current.shopRegistration,
          }));
        }
      })
      .catch(() => {});
  }, [accessVerified]);

  const requestId = useRef(0);
  useEffect(() => {
    if (!accessVerified || !range) return;
    const id = ++requestId.current;
    setLoading(true);
    setError(null);
    const params = new URLSearchParams({ from: range.from, to: range.to });
    fetch(`${serverUrl}/analytics/summary?${params}`, { headers: authHeaders() })
      .then(async (response) => {
        const payload = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(payload?.error || payload?.message || t("reports.loadError", { status: response.status }));
        if (payload.source !== "mongodb-aggregation" || payload.paginated !== false) throw new Error(t("reports.invalidSource"));
        if (id === requestId.current) {
          setAnalytics(payload.data as AnalyticsData);
          setLoadedAt(new Date());
        }
      })
      .catch((reason: Error) => { if (id === requestId.current) setError(reason.message); })
      .finally(() => { if (id === requestId.current) setLoading(false); });
  }, [accessVerified, range, refreshKey, t]);

  const handleAccess = async (event: React.FormEvent) => {
    event.preventDefault();
    setAccessError("");
    setAccessLoading(true);
    try {
      if (await verifyPassword(accessPassword, "reports")) setAccessVerified(true);
      else {
        setAccessError(t("reports.gate.wrong"));
        setAccessPassword("");
      }
    } finally {
      setAccessLoading(false);
    }
  };

  const generate = async (options: { sections: ReportSections; signatureText: string; hasSignature: boolean; hasStamp: boolean }) => {
    if (!analytics) return;
    await new Promise((resolve) => setTimeout(resolve, 30));
    generateCompanyReport({
      sections: options.sections,
      analytics,
      adminUsername: adminName,
      adminSignatureText: options.signatureText,
      hasSignature: options.hasSignature,
      hasStamp: options.hasStamp,
      timeframeLabel: periodLabel,
      formatCurrency: (amount: number) => formatUSD(amount),
      companyAddress: shopSettings.shopAddress,
      companyPhone: shopSettings.shopPhone,
      companyRegistration: shopSettings.shopRegistration,
      t,
    });
  };

  const paymentRows = useMemo(
    () => (analytics?.paymentMethods ?? []).map((row) => ({
      key: row._id || "other",
      label: t(`payment.${row._id || "other"}`, { defaultValue: row._id || t("payment.other") }),
      value: row.amount,
      detail: t("reports.payments.detail", { count: row.count, share: formatPercent(analytics && analytics.totalRevenue > 0 ? (row.amount / analytics.totalRevenue) * 100 : 0, 0) }),
    })),
    [analytics, t]
  );
  const customerRows = useMemo(
    () => (analytics?.topCustomers ?? []).map((row, index) => ({
      key: `${row.name}-${index}`,
      label: row.name,
      value: row.totalSpent,
      detail: t("reports.customers.detail", { count: row.purchases }),
    })),
    [analytics, t]
  );

  if (!isAdmin) {
    return <div className="page"><PermissionDenied>{t("reports.adminOnly")}</PermissionDenied></div>;
  }

  if (!accessVerified) {
    return (
      <div className="page reports-gate">
        <div className="card reports-gate-card">
          <div className="reports-gate-icon"><Shield aria-hidden="true" /></div>
          <h1>{t("reports.gate.title")}</h1>
          <p>{t("reports.gate.body")}</p>
          <form onSubmit={handleAccess} className="reports-gate-form">
            <label className="field">
              <span className="field-label">{t("reports.gate.label")}</span>
              <input className="input" type="password" value={accessPassword} onChange={(event) => setAccessPassword(event.target.value)}
                placeholder={t("reports.gate.placeholder")} autoComplete="current-password" autoFocus required />
            </label>
            {accessError && <div className="alert alert-danger" role="alert">{accessError}</div>}
            <button type="submit" disabled={accessLoading} className="btn btn-primary btn-lg btn-block">
              {accessLoading ? t("common.verifying") : t("reports.gate.submit")}
            </button>
          </form>
        </div>
      </div>
    );
  }

  const previous = analytics?.previous;
  const trends = analytics?.recentTrends;

  return (
    <div className="page reports-page" ref={pageRef}>
      <PageHeader
        eyebrow={t("nav.sections.steering")}
        icon={<ChartColumn aria-hidden="true" />}
        title={t("reports.title")}
        description={t("reports.subtitle")}
        actions={<>
          <button type="button" className="btn btn-secondary" onClick={() => setRefreshKey((value) => value + 1)} disabled={loading}>
            <RefreshCw className={loading ? "animate-spin" : ""} aria-hidden="true" />
            {loadedAt ? t("common.updatedAt", { time: formatTimeOfDay(loadedAt) }) : t("common.refresh")}
          </button>
          <button type="button" className="btn btn-primary" onClick={() => setShowBuilder(true)} disabled={!analytics}>
            <FileDown aria-hidden="true" />{t("reports.pdfButton")}
          </button>
        </>}
      />

      <div className="reports-filter card">
        <PeriodPicker value={selection} onChange={setSelection} range={range} presets={REPORT_PRESETS} />
      </div>

      {error && analytics && <div className="alert alert-danger" role="alert"><span>{t("reports.staleError", { error })}</span></div>}

      {/* First screen: the trend and the key figures (side by side on
          computers, stacked on tablets) — visible before any scrolling. */}
      <div className="reports-top">
        {range && <FinancialTrend range={range} refreshKey={refreshKey} previous={previous ? { totalRevenue: previous.totalRevenue, totalEntries: previous.totalEntries, totalValidatedExpenses: previous.totalValidatedExpenses, netCash: previous.netCash } : undefined} />}
        {analytics && (
          <section className={`reports-kpis ${loading ? "is-refreshing" : ""}`} aria-labelledby="kpi-title" aria-busy={loading}>
            <div className="section-row">
              <h2 id="kpi-title" className="section-title">{t("reports.kpi.title")}</h2>
              <span className="badge">{periodLabel}</span>
            </div>
            <div className="kpi-grid">
              <KpiCard tone="accent" icon={<TrendingUp />} label={t("reports.kpi.revenue")} value={formatUSD(analytics.totalRevenue)}
                delta={trends?.revenueGrowth} hint={t("reports.kpi.revenueHint")} />
              <KpiCard icon={<CircleArrowDown />} label={t("reports.kpi.entries")} value={formatUSD(analytics.totalEntries)}
                delta={trends?.entryGrowth ?? change(analytics.totalEntries, previous?.totalEntries)}
                extra={<span className="kpi-tag">{t("reports.kpi.entriesCount", { count: analytics.entryCount })}</span>}
                hint={t("reports.kpi.entriesHint")} />
              <KpiCard icon={<Receipt />} label={t("reports.kpi.expenses")} value={formatUSD(analytics.totalValidatedExpenses)}
                delta={trends?.expenseGrowth} inverseDelta hint={t("reports.kpi.expensesHint")} />
              <KpiCard tone={analytics.netRevenue < 0 ? "loss" : "gain"} icon={<WalletCards />} label={t("reports.kpi.netCash")}
                value={formatUSD(analytics.netRevenue)} delta={trends?.netCashGrowth} hint={t("reports.kpi.netCashHint")} />
              <KpiCard icon={<ShoppingBag />} label={t("reports.kpi.sales")} value={formatNumber(analytics.totalSales, 0)}
                delta={trends?.salesGrowth} hint={t("reports.kpi.salesHint")} />
              <KpiCard icon={<ShoppingCart />} label={t("reports.kpi.averageTicketLabel")} value={formatUSD(analytics.averageTicket ?? 0)}
                delta={change(analytics.averageTicket, previous?.averageTicket)} hint={t("reports.kpi.averageTicketHint")} />
              <KpiCard icon={<Package />} label={t("reports.kpi.units")} value={formatNumber(analytics.unitsSold ?? 0, 3)}
                hint={t("reports.kpi.unitsHint")} />
              <KpiCard icon={<Users />} label={t("reports.kpi.customers")} value={formatNumber(analytics.totalCustomers, 0)}
                delta={trends?.customerGrowth} hint={t("reports.kpi.customersHint")} />
            </div>
          </section>
        )}
      </div>

      {error && !analytics ? (
        <div className="card"><ErrorState title={t("reports.errorTitle")} action={<button type="button" className="btn btn-primary" onClick={() => setRefreshKey((value) => value + 1)}><RefreshCw aria-hidden="true" />{t("common.retry")}</button>}>{error}</ErrorState></div>
      ) : !analytics ? (
        <div className="card"><LoadingState label={t("reports.loading")} /></div>
      ) : (
        <div className={`reports-body ${loading ? "is-refreshing" : ""}`} aria-busy={loading}>
          <div className="reports-grid">
            <CashBridge cash={{ revenue: analytics.totalRevenue, entries: analytics.totalEntries, expenses: analytics.totalValidatedExpenses, netCash: analytics.netRevenue }} />
            <div className="reports-side">
              <RankedList title={t("reports.payments.title")} help={t("reports.payments.help")} rows={paymentRows} empty={t("reports.payments.empty")} icon={<Coins aria-hidden="true" />} />
              {analytics.reimbursement && (
                <section className="card report-panel" aria-labelledby="debt-title">
                  <header className="card-header">
                    <div>
                      <h2 id="debt-title" className="section-title"><Landmark aria-hidden="true" className="inline-icon" />{t("reports.debts.title")}</h2>
                      <p className="section-help">{t("reports.debts.help")}</p>
                    </div>
                  </header>
                  <dl className="debt-list">
                    <div><dt>{t("reports.debts.borrowed")}</dt><dd className="num">{formatUSD(analytics.reimbursement.borrowedDuringPeriod)}</dd></div>
                    <div><dt>{t("reports.debts.repaid")}</dt><dd className="num">{formatUSD(analytics.reimbursement.repaidDuringPeriod)}<small>{t("reports.debts.repaymentCount", { count: analytics.reimbursement.repaymentCount })}</small></dd></div>
                    <div className="is-total"><dt>{t("reports.debts.outstanding")}</dt><dd className="num">{formatUSD(analytics.reimbursement.currentOutstanding)}</dd></div>
                  </dl>
                </section>
              )}
            </div>
          </div>

          <div className="reports-grid reports-grid-wide">
            <ProductPerformance rows={analytics.topProducts} totalRevenue={analytics.totalRevenue} />
            <RankedList title={t("reports.customers.title")} help={t("reports.customers.help")} rows={customerRows} empty={t("reports.customers.empty")} />
          </div>
        </div>
      )}

      {showBuilder && analytics && (
        <ReportBuilderDialog
          adminName={adminName}
          periodLabel={periodLabel}
          onClose={() => setShowBuilder(false)}
          verifyPassword={(password) => verifyPassword(password, "pdf_report")}
          onGenerate={generate}
        />
      )}
    </div>
  );
}
