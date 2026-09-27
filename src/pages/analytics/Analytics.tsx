"use client";
import Dialog from "../../components/ui/Dialog";
import PageHeader from "../../components/ui/PageHeader";
import { EmptyState, LoadingState, PermissionDenied } from "../../components/ui/States";
/* eslint-disable @typescript-eslint/no-explicit-any */

import React, { useCallback, useState, useEffect } from "react";
import {
  BarChart3,
  TrendingUp,
  DollarSign,
  Users,
  Package,
  ArrowUp,
  ArrowDown,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Receipt,
  Calculator,
  Shield,
  FileText,
  RefreshCw,
  FileDown,
  AlertTriangle,
} from "lucide-react";
import { generateCompanyReport, type ReportSections } from "./reportGenerator";
import { serverUrl } from "../../utils/constants";

interface AnalyticsData {
  totalSales: number;
  totalRevenue: number;
  totalCustomers: number;
  totalProducts: number;
  totalValidatedExpenses: number;
  totalEntries: number;
  netRevenue: number;
  reimbursement?: {
    borrowedDuringPeriod: number;
    repaidDuringPeriod: number;
    repaymentCount: number;
    currentOutstanding: number;
  };
  salesByDay: {
    date: string;
    dayName: string;
    sales: number;
    revenue: number;
  }[];
  salesByWeek: {
    week: string;
    startDate: string;
    endDate: string;
    sales: number;
    revenue: number;
  }[];
  salesByMonth: {
    month: string;
    monthName: string;
    sales: number;
    revenue: number;
  }[];
  salesByYear: {
    year: string;
    months: {
      month: string;
      monthName: string;
      sales: number;
      revenue: number;
    }[];
  }[];
  topProducts: { name: string; quantity: number; revenue: number }[];
  topCustomers: { name: string; purchases: number; totalSpent: number }[];
  recentTrends: {
    salesGrowth: number | null;
    revenueGrowth: number | null;
    customerGrowth: number | null;
  };
}

interface TimeframeData {
  description: string;
  start: string;
  end: string;
}

function TrendIndicator({ value }: { value: number | null }) {
  if (value === null) {
    return <span className="mt-1 text-xs text-gray-500">Pas assez de données</span>;
  }

  const positive = value >= 0;
  return (
    <div className="flex items-center mt-1">
      {positive ? (
        <ArrowUp className="w-3 h-3 sm:w-4 sm:h-4 text-green-500" />
      ) : (
        <ArrowDown className="w-3 h-3 sm:w-4 sm:h-4 text-red-500" />
      )}
      <span className={`text-xs sm:text-sm ml-1 ${positive ? "text-green-500" : "text-red-500"}`}>
        {Math.abs(value).toFixed(1)}%
      </span>
    </div>
  );
}

// Helper function to get today's date in correct format
const getTodayDate = (): string => {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

// Helper function to get user role from localStorage
const getUserRole = (): string => {
  if (typeof window === "undefined") return "user";

  try {
    const userData = localStorage.getItem("user");
    if (userData) {
      const user = JSON.parse(userData);
      return user.role || "user";
    }
  } catch (error) {
    console.error("Error parsing user data:", error);
  }

  return "user";
};

// Check if user is admin
const isAdmin = (): boolean => {
  return getUserRole() === "admin";
};

// Read admin username from localStorage (display-only)
const getAdminUsername = (): string => {
  if (typeof window === "undefined") return "Admin";
  try {
    const raw = localStorage.getItem("user");
    if (raw) {
      const u = JSON.parse(raw);
      return u.username || u.email || "Admin";
    }
  } catch { /* ignore */ }
  return "Admin";
};

// Check if user should see only today's data (non-admin)
const shouldSeeOnlyTodayData = (): boolean => {
  return !isAdmin();
};

// Helper function to get headers
const getHeaders = () => {
  const token = localStorage.getItem("token");
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

// Helper function to get timeframe parameters based on selection
const getTimeframeParams = (
  timeframe: "day" | "week" | "month" | "year", 
  selectedYear?: number, 
  selectedDate?: string
) => {
  const params = new URLSearchParams();
  const today = new Date();
  
  switch (timeframe) {
    case "day": {
      params.set("date", selectedDate || getTodayDate());
      break;
    }
      
    case "week": {
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      params.set("from", weekAgo.toISOString().split('T')[0]);
      params.set("to", today.toISOString().split('T')[0]);
      break;
    }
      
    case "month": {
      const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      const lastDayOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
      params.set("from", firstDayOfMonth.toISOString().split('T')[0]);
      params.set("to", lastDayOfMonth.toISOString().split('T')[0]);
      break;
    }
      
    case "year": {
      const year = selectedYear || today.getFullYear();
      params.set("year", year.toString());
      break;
    }
  }
  
  return params.toString();
};

const describeTimeframe = (
  timeframe: "day" | "week" | "month" | "year",
  selectedDate: string,
  selectedYear: number
) => {
  if (timeframe === "day") {
    return new Date(selectedDate).toLocaleDateString("fr-FR", {
      timeZone: "Africa/Lubumbashi",
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  }
  if (timeframe === "week") return "Cette Semaine";
  if (timeframe === "month") return "Ce Mois";
  return `Année ${selectedYear}`;
};

export default function Analytics() {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeframe, setTimeframe] = useState<"day" | "week" | "month" | "year">(
    "day"
  );
  const [selectedYear, setSelectedYear] = useState<number>(
    new Date().getFullYear()
  );
  const [selectedDate, setSelectedDate] = useState<string>(getTodayDate());
  const [timeframeData, setTimeframeData] = useState<TimeframeData | null>(null);
  const [initialLoad, setInitialLoad] = useState(true);
  const [availableYears, setAvailableYears] = useState<number[]>([]);

  // ── Company / shop settings ───────────────────────────────────────────
  const [shopSettings, setShopSettings] = useState({
    shopName: "ETS. DIEU MERCI",
    shopAddress: "Av Manono Coin Munama N°39, C. Kenya, Lubumbashi",
    shopPhone: "+243 977 771 421 / +243 853 549 102",
    shopRegistration: "RCCM: 14-A-017885",
  });

  // ── Report generation state (admin only) ──────────────────────────────
  const [reportSections, setReportSections] = useState<ReportSections>({
    financial: true,
    sales: true,
    products: true,
    clients: true,
    expenses: true,
    entries: true,
  });
  const [adminSignatureText, setAdminSignatureText] = useState("");
  const [hasSignature, setHasSignature] = useState(false);
  const [hasStamp, setHasStamp] = useState(false);
  const [generatingReport, setGeneratingReport] = useState(false);

  // ── Security gates ────────────────────────────────────────────────────
  const [accessVerified, setAccessVerified] = useState(false);
  const [accessPassword, setAccessPassword] = useState("");
  const [accessError, setAccessError] = useState("");
  const [accessLoading, setAccessLoading] = useState(false);

  const [showPrintPasswordModal, setShowPrintPasswordModal] = useState(false);
  const [printPassword, setPrintPassword] = useState("");
  const [printPasswordError, setPrintPasswordError] = useState("");
  const [printPasswordLoading, setPrintPasswordLoading] = useState(false);

  // Effect to automatically set to today's date when timeframe changes to "day"
  useEffect(() => {
    if (!initialLoad && timeframe === "day") {
      const today = getTodayDate();
      setSelectedDate(today);
    }
  }, [timeframe, initialLoad]);

  // Effect to mark initial load as complete
  useEffect(() => {
    if (analytics) {
      setInitialLoad(false);
    }
  }, [analytics]);

  // Effect to enforce day-only view for non-admin users
  useEffect(() => {
    if (shouldSeeOnlyTodayData() && timeframe !== "day") {
      setTimeframe("day");
      setSelectedDate(getTodayDate());
    }
  }, [timeframe]);

  // Fetch shop settings once on mount
  useEffect(() => {
    fetch(`${serverUrl}/settings/receipt`, { headers: getHeaders() })
      .then((r) => r.ok ? r.json() : null)
      .then((data) => {
        if (data) {
          setShopSettings({
            shopName: data.shopName || "ETS. DIEU MERCI",
            shopAddress: data.shopAddress || "Av Manono Coin Munama N°39, C. Kenya, Lubumbashi",
            shopPhone: data.shopNumber || "+243 977 771 421 / +243 853 549 102",
            shopRegistration: data.shopRegistration || "RCCM: 14-A-017885",
          });
        }
      })
      .catch(() => {});
  }, []);

  // Fetch analytics data with server-side timeframe filtering
  const fetchAnalytics = useCallback(async () => {
    try {
      setLoading(true);
      const effectiveTimeframe = shouldSeeOnlyTodayData() ? "day" : timeframe;
      const effectiveDate = shouldSeeOnlyTodayData() ? getTodayDate() : selectedDate;
      const params = new URLSearchParams(
        getTimeframeParams(effectiveTimeframe, selectedYear, effectiveDate)
      );
      params.set("timeframe", effectiveTimeframe);
      const response = await fetch(`${serverUrl}/analytics/summary?${params}`, {
        headers: getHeaders(),
      });
      if (!response.ok) throw new Error(`Failed to fetch analytics: ${response.status}`);
      const payload = await response.json();
      if (payload.source !== "mongodb-aggregation" || payload.paginated !== false) {
        throw new Error(
          "Invalid analytics response: production must use the aggregation endpoint"
        );
      }
      const raw = payload.data;
      const chartRows = (raw.chartData || []).map((row: any, index: number) => {
        const date = new Date(row.date);
        return {
          date: date.toLocaleDateString("fr-FR", { timeZone: "Africa/Lubumbashi", day: "numeric", month: "short" }),
          dayName: date.toLocaleDateString("fr-FR", { timeZone: "Africa/Lubumbashi", weekday: "long" }),
          week: `Semaine ${index + 1}`,
          startDate: date.toLocaleDateString("fr-FR", { timeZone: "Africa/Lubumbashi", day: "numeric", month: "short" }),
          endDate: "",
          month: String(date.getUTCMonth()),
          monthName: date.toLocaleDateString("fr-FR", { timeZone: "Africa/Lubumbashi", month: "long" }),
          sales: row.sales,
          revenue: row.revenue,
        };
      });
      const normalized: AnalyticsData = {
        ...raw,
        salesByDay: effectiveTimeframe === "day" ? chartRows : [],
        salesByWeek: effectiveTimeframe === "week" ? chartRows : [],
        salesByMonth: effectiveTimeframe === "month" ? chartRows : [],
        salesByYear: effectiveTimeframe === "year"
          ? [{ year: selectedYear.toString(), months: chartRows }]
          : [],
      };
      setAnalytics(normalized);
      setTimeframeData({
        description: describeTimeframe(
          effectiveTimeframe,
          effectiveDate,
          selectedYear
        ),
        start: payload.timeframe.start,
        end: payload.timeframe.end,
      });
      setAvailableYears(extractAvailableYears());
    } catch (error) {
      console.error("Error fetching analytics:", error);
      setAnalytics(null);
    } finally {
      setLoading(false);
    }
  }, [selectedDate, selectedYear, timeframe]);

  // Analytics has one request per selected period and never walks sales pages.
  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  // Extract available years from data
  const extractAvailableYears = (): number[] => {
    const yearsSet = new Set<number>();
    const now = new Date();
    
    // Add current year
    yearsSet.add(now.getFullYear());
    
    // Add previous 5 years as options
    for (let i = 1; i <= 5; i++) {
      yearsSet.add(now.getFullYear() - i);
    }
    
    // Sort descending
    return Array.from(yearsSet).sort((a, b) => b - a);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  const navigateYear = (direction: "prev" | "next") => {
    const currentIndex = availableYears.indexOf(selectedYear);
    
    if (direction === "prev" && currentIndex < availableYears.length - 1) {
      setSelectedYear(availableYears[currentIndex + 1]);
    } else if (direction === "next" && currentIndex > 0) {
      setSelectedYear(availableYears[currentIndex - 1]);
    }
  };

  const getTimeframeLabel = () => {
    if (timeframeData?.description) {
      return timeframeData.description;
    }
    
    switch (timeframe) {
      case "day": {
        if (selectedDate) {
          const date = new Date(selectedDate);
          return date.toLocaleDateString("fr-FR", {
            timeZone: "Africa/Lubumbashi",
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
          });
        }
        return "Aujourd'hui";
      }
      case "week":
        return "Cette Semaine";
      case "month":
        return "Ce Mois";
      case "year":
        return `Année ${selectedYear}`;
      default:
        return "Cette Semaine";
    }
  };

  const handleTimeframeChange = (period: "day" | "week" | "month" | "year") => {
    // For non-admin users, only allow "day" timeframe
    if (shouldSeeOnlyTodayData() && period !== "day") {
      return;
    }

    setTimeframe(period);

    if (period === "year") {
      // Set to current year if available
      const currentYear = new Date().getFullYear();
      if (availableYears.length > 0 && availableYears.includes(currentYear)) {
        setSelectedYear(currentYear);
      } else if (availableYears.length > 0) {
        setSelectedYear(availableYears[0]);
      }
    }
  };

  // Verify admin password against the server
  const verifyPassword = async (password: string): Promise<boolean> => {
    try {
      const userRaw = localStorage.getItem("user");
      if (!userRaw) return false;
      const user = JSON.parse(userRaw);
      const email = user.email;
      if (!email) return false;
      const res = await fetch(`${serverUrl}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      return res.ok;
    } catch {
      return false;
    }
  };

  const handleAccessVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setAccessError("");
    setAccessLoading(true);
    try {
      const ok = await verifyPassword(accessPassword);
      if (ok) {
        setAccessVerified(true);
      } else {
        setAccessError("Mot de passe incorrect. Accès refusé.");
        setAccessPassword("");
      }
    } finally {
      setAccessLoading(false);
    }
  };

  const handlePrintPasswordVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setPrintPasswordError("");
    setPrintPasswordLoading(true);
    try {
      const ok = await verifyPassword(printPassword);
      if (ok) {
        setShowPrintPasswordModal(false);
        setPrintPassword("");
        await doGenerateReport();
      } else {
        setPrintPasswordError("Mot de passe incorrect. Impression refusée.");
        setPrintPassword("");
      }
    } finally {
      setPrintPasswordLoading(false);
    }
  };

  const handleGenerateReport = () => {
    if (!analytics || !isAdmin()) return;
    if (!Object.values(reportSections).some(Boolean)) return;
    setPrintPassword("");
    setPrintPasswordError("");
    setShowPrintPasswordModal(true);
  };

  const doGenerateReport = async () => {
    setGeneratingReport(true);
    try {
      // Yield to let React re-render the loading state before the synchronous PDF build
      await new Promise((res) => setTimeout(res, 50));
      generateCompanyReport({
        sections: reportSections,
        analytics: analytics!,
        adminUsername: getAdminUsername(),
        adminSignatureText,
        hasSignature,
        hasStamp,
        timeframeLabel: getTimeframeLabel(),
        formatCurrency,
        companyAddress: shopSettings.shopAddress,
        companyPhone: shopSettings.shopPhone,
        companyRegistration: shopSettings.shopRegistration,
      });
    } finally {
      setGeneratingReport(false);
    }
  };

  // Non-admin: hard block
  if (!isAdmin()) {
    return (
      <div className="page">
        <PermissionDenied>Cette section est réservée aux administrateurs.</PermissionDenied>
      </div>
    );
  }

  // Admin: password gate before showing anything
  if (!accessVerified) {
    return (
      <div className="page min-h-screen flex items-center justify-center">
        <div className="card p-6 sm:p-8 max-w-sm w-full">
          <div className="text-center mb-6">
            <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center mx-auto mb-3">
              <Shield className="w-6 h-6 text-blue-600" aria-hidden="true" />
            </div>
            <h1 className="text-xl font-semibold text-gray-900">Vérification requise</h1>
            <p className="text-gray-500 text-sm mt-1">
              Saisissez votre mot de passe pour accéder aux rapports.
            </p>
          </div>
          <form onSubmit={handleAccessVerify} className="space-y-4">
            <div>
              <label htmlFor="analytics-field-18830" className="block text-sm font-medium text-gray-700 mb-1.5">
                Mot de passe administrateur
              </label>
              <input id="analytics-field-18830"
                type="password"
                value={accessPassword}
                onChange={(e) => setAccessPassword(e.target.value)}
                className="input"
                placeholder="Votre mot de passe"
                autoComplete="current-password"
                autoFocus
                required
              />
            </div>
            {accessError && (
              <div className="alert alert-danger" role="alert">
                {accessError}
              </div>
            )}
            <button
              type="submit"
              disabled={accessLoading}
              className="btn btn-primary btn-lg btn-block"
            >
              {accessLoading ? "Vérification…" : "Accéder aux rapports"}
            </button>
          </form>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="page analytics-page">
        <PageHeader title="Rapports & analytique" description="Performance commerciale par période." />
        <div className="card"><LoadingState label="Chargement des analytiques…" /></div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="page analytics-page">
        <PageHeader title="Rapports & analytique" description="Performance commerciale par période." />
        <div className="card">
          <EmptyState title="Aucune donnée disponible" icon={<BarChart3 aria-hidden="true" />}>
            Aucune donnée n'est disponible pour les analytiques.
          </EmptyState>
        </div>
      </div>
    );
  }

  const chartData = getChartDataForTimeframe();
  const maxRevenue = Math.max(...chartData.map((d: any) => d.revenue), 1);

  function getChartDataForTimeframe() {
    if (!analytics) return [];
    
    switch (timeframe) {
      case "day":
        return analytics.salesByDay;
      case "week":
        return analytics.salesByWeek;
      case "month":
        return analytics.salesByMonth;
      case "year": {
        const yearData = analytics.salesByYear.find(
          (y) => y.year === selectedYear.toString()
        );
        return yearData ? yearData.months : [];
      }
      default:
        return analytics.salesByWeek;
    }
  }

  return (
    <>
    <div className="page analytics-page">
      <div className="space-y-5">
        {/* Header */}
        <div>
          <div className="page-header" style={{ marginBottom: 0 }}>
            <div>
              <h1 className="page-title">Rapports & analytique</h1>
              <p className="page-subtitle">Performance commerciale, dépenses et rapports imprimables par période.</p>
            </div>
            <div className="flex items-center gap-3">
              {shouldSeeOnlyTodayData() && (
                <div className="flex items-center gap-2 bg-blue-50 text-blue-700 px-3 py-2 rounded-lg border border-blue-200">
                  <Shield className="w-4 h-4" />
                  <span className="text-sm font-medium">
                    Vue limitée - Données du jour uniquement
                  </span>
                </div>
              )}
              <button
                onClick={fetchAnalytics}
                disabled={loading}
                className="px-3 py-2 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg border border-blue-200 transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                <span className="text-sm">Actualiser</span>
              </button>
            </div>
          </div>
        </div>

        {/* Timeframe Selection */}
        <div className="analytics-card bg-white p-4 sm:p-6 rounded-lg shadow border border-gray-200">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Calendar className="w-4 h-4 sm:w-5 sm:h-5" />
              Période d'analyse: {getTimeframeLabel()}
            </h3>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              {/* Date Picker for Day View */}
              {timeframe === "day" && (
                <div className="flex items-center gap-2 bg-white rounded-lg border border-gray-300 px-3 py-2 shadow-sm w-full sm:w-auto">
                  <Calendar className="w-4 h-4 text-gray-500 flex-shrink-0" />
                  <label
                    htmlFor="date-picker"
                    className="text-xs sm:text-sm font-medium text-gray-700 whitespace-nowrap"
                  >
                    Date:
                  </label>
                  <input
                    id="date-picker"
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="ml-2 px-2 py-1 border-none bg-transparent text-xs sm:text-sm focus:outline-none focus:ring-0 text-gray-900 font-medium w-full"
                    disabled={shouldSeeOnlyTodayData()}
                  />
                </div>
              )}

              {timeframe === "year" && availableYears.length > 1 && (
                <div className="flex items-center gap-2 bg-white rounded-lg border border-gray-300 px-3 py-2 shadow-sm w-full sm:w-auto">
                  <button type="button" aria-label="Année précédente"
                    onClick={() => navigateYear("prev")}
                    disabled={availableYears.indexOf(selectedYear) === availableYears.length - 1}
                    className="p-1 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronLeft className="w-3 h-3 sm:w-4 sm:h-4" />
                  </button>
                  <span className="text-xs sm:text-sm font-medium text-gray-900 px-2 min-w-[60px] sm:min-w-[80px] text-center">
                    {selectedYear}
                  </span>
                  <button type="button" aria-label="Année suivante"
                    onClick={() => navigateYear("next")}
                    disabled={availableYears.indexOf(selectedYear) === 0}
                    className="p-1 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronRight className="w-3 h-3 sm:w-4 sm:h-4" />
                  </button>
                </div>
              )}

              <div className="segmented w-full sm:w-auto" role="group" aria-label="Période">
                {(["day", "week", "month", "year"] as const).map((period) => (
                  <button
                    key={period}
                    type="button"
                    aria-pressed={timeframe === period}
                    onClick={() => handleTimeframeChange(period)}
                    className={shouldSeeOnlyTodayData() && period !== "day" ? "opacity-50 !cursor-not-allowed" : ""}
                    disabled={shouldSeeOnlyTodayData() && period !== "day"}
                  >
                    {period === "day" && "Jour"}
                    {period === "week" && "Semaine"}
                    {period === "month" && "Mois"}
                    {period === "year" && "Année"}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          <div className="metric-card bg-white p-4 sm:p-6 rounded-lg shadow border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm text-gray-600">
                  Ventes Totales
                </p>
                <p className="text-xl sm:text-2xl font-bold text-gray-900">
                  {analytics.totalSales}
                </p>
                <TrendIndicator value={analytics.recentTrends.salesGrowth} />
              </div>
              <div className="metric-icon p-2 sm:p-3 rounded-full">
                <BarChart3 className="w-4 h-4 sm:w-6 sm:h-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="metric-card bg-white p-4 sm:p-6 rounded-lg shadow border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm text-gray-600">Revenu Total</p>
                <p className="text-xl sm:text-2xl font-bold text-gray-900">
                  {formatCurrency(analytics.totalRevenue)}
                </p>
                <TrendIndicator value={analytics.recentTrends.revenueGrowth} />
              </div>
              <div className="metric-icon p-2 sm:p-3 rounded-full">
                <DollarSign className="w-4 h-4 sm:w-6 sm:h-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="metric-card bg-white p-4 sm:p-6 rounded-lg shadow border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm text-gray-600">
                  Entrées d'Argent
                </p>
                <p className="text-xl sm:text-2xl font-bold text-gray-900">
                  {formatCurrency(analytics.totalEntries)}
                </p>
                <p className="text-xs text-gray-500 mt-1">Total reçu</p>
              </div>
              <div className="metric-icon p-2 sm:p-3 rounded-full">
                <FileText className="w-4 h-4 sm:w-6 sm:h-6 text-yellow-600" />
              </div>
            </div>
          </div>

          <div className="metric-card bg-white p-4 sm:p-6 rounded-lg shadow border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm text-gray-600">
                  Dépenses Validées
                </p>
                <p className="text-xl sm:text-2xl font-bold text-gray-900">
                  {formatCurrency(analytics.totalValidatedExpenses)}
                </p>
                <p className="text-xs text-gray-500 mt-1">Total validé</p>
              </div>
              <div className="metric-icon p-2 sm:p-3 rounded-full">
                <Receipt className="w-4 h-4 sm:w-6 sm:h-6 text-red-600" />
              </div>
            </div>
          </div>
        </div>

        {analytics.reimbursement && (
          <section className="bg-white p-4 sm:p-6 rounded-lg shadow border border-gray-200">
            <h2 className="font-bold text-lg mb-4">Dettes et remboursements</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="rounded-lg bg-blue-50 p-4"><p className="text-sm text-gray-600">Emprunté sur la période</p><p className="text-xl font-bold">{formatCurrency(analytics.reimbursement.borrowedDuringPeriod)}</p></div>
              <div className="rounded-lg bg-emerald-50 p-4"><p className="text-sm text-gray-600">Remboursé sur la période</p><p className="text-xl font-bold">{formatCurrency(analytics.reimbursement.repaidDuringPeriod)}</p><p className="text-xs text-gray-500">{analytics.reimbursement.repaymentCount} remboursement(s)</p></div>
              <div className="rounded-lg bg-orange-50 p-4"><p className="text-sm text-gray-600">Dette actuelle</p><p className="text-xl font-bold">{formatCurrency(analytics.reimbursement.currentOutstanding)}</p></div>
            </div>
          </section>
        )}

        {/* Additional Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          <div className="metric-card bg-white p-4 sm:p-6 rounded-lg shadow border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm text-gray-600">Trésorerie Nette</p>
                <p className="text-xl sm:text-2xl font-bold text-gray-900">
                  {formatCurrency(analytics.netRevenue)}
                </p>
                <p className="text-xs text-gray-500 mt-1">(Ventes + Entrées) - Dépenses</p>
              </div>
              <div className="metric-icon p-2 sm:p-3 rounded-full">
                <Calculator className="w-4 h-4 sm:w-6 sm:h-6 text-purple-600" />
              </div>
            </div>
          </div>

          <div className="metric-card bg-white p-4 sm:p-6 rounded-lg shadow border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm text-gray-600">
                  Clients Totaux
                </p>
                <p className="text-xl sm:text-2xl font-bold text-gray-900">
                  {analytics.totalCustomers}
                </p>
                <TrendIndicator value={analytics.recentTrends.customerGrowth} />
              </div>
              <div className="metric-icon p-2 sm:p-3 rounded-full">
                <Users className="w-4 h-4 sm:w-6 sm:h-6 text-orange-600" />
              </div>
            </div>
          </div>

          <div className="metric-card bg-white p-4 sm:p-6 rounded-lg shadow border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm text-gray-600">
                  Produits Totaux
                </p>
                <p className="text-xl sm:text-2xl font-bold text-gray-900">
                  {analytics.totalProducts}
                </p>
                <p className="text-xs text-gray-500 mt-1">Produits actifs</p>
              </div>
              <div className="metric-icon p-2 sm:p-3 rounded-full">
                <Package className="w-4 h-4 sm:w-6 sm:h-6 text-indigo-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Sales Chart */}
        <div className="analytics-card bg-white p-4 sm:p-6 rounded-lg shadow border border-gray-200">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5" />
              Tendances des Ventes ({getTimeframeLabel()})
            </h3>
          </div>

          <div className="space-y-4 overflow-x-auto">
            {timeframe === "year" ? (
              // Yearly view with months for selected year
              <div className="mb-6">
                <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Année {selectedYear}
                </h4>
                <div className="space-y-4 ml-0 sm:ml-4 min-w-[300px]">
                  {chartData.map((month: any, index: number) => (
                    <div
                      key={index}
                      className="flex items-center gap-3 sm:gap-4"
                    >
                      <div className="w-28 sm:w-40 text-xs sm:text-sm text-gray-600 font-medium capitalize">
                        {month.monthName}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs sm:text-sm text-gray-700 truncate">
                            {month.sales} ventes
                          </span>
                          <span className="text-xs sm:text-sm font-medium text-gray-900 whitespace-nowrap ml-2">
                            {formatCurrency(month.revenue)}
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                            style={{
                              width: `${(month.revenue / maxRevenue) * 100}%`,
                            }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              // Daily, Weekly, Monthly view
              chartData.map((item: any, index: number) => (
                <div
                  key={index}
                  className="flex items-center gap-3 sm:gap-4 min-w-[300px]"
                >
                  <div className="w-32 sm:w-48 text-xs sm:text-sm text-gray-600 font-medium">
                    {timeframe === "day" ? (
                      <div>
                        <div className="capitalize">
                          {item.dayName}
                        </div>
                        <div className="text-xs text-gray-500">
                          {item.date}
                        </div>
                      </div>
                    ) : timeframe === "week" ? (
                      <div>
                        <div className="text-xs sm:text-sm">
                          {item.week}
                        </div>
                        <div className="text-xs text-gray-500">
                          Du {item.startDate} au {item.endDate}
                        </div>
                      </div>
                    ) : timeframe === "month" ? (
                      <div className="capitalize">
                        {item.monthName}
                      </div>
                    ) : (
                      item.monthName
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs sm:text-sm text-gray-700">
                        {item.sales} ventes
                      </span>
                      <span className="text-xs sm:text-sm font-medium text-gray-900 whitespace-nowrap ml-2">
                        {formatCurrency(item.revenue)}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{
                          width: `${(item.revenue / maxRevenue) * 100}%`,
                        }}
                      ></div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Top Products and Customers */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          <div className="analytics-card bg-white p-4 sm:p-6 rounded-lg shadow border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Package className="w-4 h-4 sm:w-5 sm:h-5" />
              Articles Vendus ({getTimeframeLabel()})
            </h3>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {analytics.topProducts.length > 0 ? (
                analytics.topProducts.map((product, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 truncate text-sm sm:text-base">
                        {index + 1}. {product.name}
                      </p>
                      <p className="text-xs sm:text-sm text-gray-600">
                        {product.quantity} unités vendues
                      </p>
                    </div>
                    <div className="text-right ml-2">
                      <p className="font-medium text-gray-900 text-sm sm:text-base whitespace-nowrap">
                        {formatCurrency(product.revenue)}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Package className="w-8 h-8 sm:w-12 sm:h-12 mx-auto mb-3 opacity-50" />
                  <p className="font-medium text-sm sm:text-base">
                    Aucun produit vendu
                  </p>
                  <p className="text-xs sm:text-sm">dans cette période</p>
                </div>
              )}
            </div>
          </div>

          <div className="analytics-card bg-white p-4 sm:p-6 rounded-lg shadow border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Users className="w-4 h-4 sm:w-5 sm:h-5" />
              Meilleurs Clients ({getTimeframeLabel()})
            </h3>
            <div className="space-y-3">
              {analytics.topCustomers.length > 0 ? (
                analytics.topCustomers.map((customer, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-sm flex-shrink-0">
                        <span className="text-xs sm:text-sm font-medium text-white">
                          {customer.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 truncate text-sm sm:text-base">
                          {customer.name}
                        </p>
                        <p className="text-xs sm:text-sm text-gray-600">
                          {customer.purchases} achats
                        </p>
                      </div>
                    </div>
                    <div className="text-right ml-2 flex-shrink-0">
                      <p className="font-medium text-gray-900 text-sm sm:text-base whitespace-nowrap">
                        {formatCurrency(customer.totalSpent)}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Users className="w-8 h-8 sm:w-12 sm:h-12 mx-auto mb-3 opacity-50" />
                  <p className="font-medium text-sm sm:text-base">
                    Aucun client
                  </p>
                  <p className="text-xs sm:text-sm">dans cette période</p>
                </div>
              )}
            </div>
          </div>
        </div>
        {/* ── Report Generation — Admin Only ────────────────────────── */}
        {isAdmin() && (
          <div className="report-builder bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
            {/* Card header */}
            <div className="report-builder-header px-4 sm:px-6 py-4 border-b border-gray-200">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <div>
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <FileDown className="w-5 h-5" />
                    Génération de Rapport Officiel
                  </h3>
                  <p className="text-sm text-blue-200 mt-0.5">
                    Générez et téléchargez des rapports professionnels au format PDF
                  </p>
                </div>
                <div className="flex items-center gap-2 bg-white/10 border border-white/20 rounded-lg px-3 py-1.5 self-start sm:self-auto">
                  <Shield className="w-4 h-4 text-blue-200" />
                  <span className="text-sm text-white font-medium">Accès Administrateur</span>
                </div>
              </div>
            </div>

            <div className="p-4 sm:p-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* ── Left: Section selection ──────────────────────── */}
                <div className="lg:col-span-2 space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Sections à inclure
                    </h4>
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() =>
                          setReportSections({
                            financial: true, sales: true, products: true,
                            clients: true, expenses: true, entries: true,
                          })
                        }
                        className="text-xs font-medium text-blue-600 hover:text-blue-800 transition-colors"
                      >
                        Tout sélectionner
                      </button>
                      <span className="text-gray-300 text-xs">|</span>
                      <button
                        type="button"
                        onClick={() =>
                          setReportSections({
                            financial: false, sales: false, products: false,
                            clients: false, expenses: false, entries: false,
                          })
                        }
                        className="text-xs font-medium text-gray-500 hover:text-gray-700 transition-colors"
                      >
                        Tout désélectionner
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {([
                      { key: "financial", label: "Résumé Financier",     desc: "Ventes, revenus, dépenses, net" },
                      { key: "sales",     label: "Rapport de Ventes",    desc: "Tendances et statistiques" },
                      { key: "products",  label: "Rapport des Produits", desc: "Articles vendus et revenus" },
                      { key: "clients",   label: "Rapport Clients",      desc: "Statistiques clients" },
                      { key: "expenses",  label: "Rapport des Dépenses", desc: "Dépenses validées" },
                      { key: "entries",   label: "Rapport d'Entrées",    desc: "Entrées de caisse" },
                    ] as const).map(({ key, label, desc }) => {
                      const checked = reportSections[key];
                      return (
                        <label
                          key={key}
                          className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                            checked
                              ? "bg-blue-50 border-blue-300 shadow-sm"
                              : "bg-gray-50 border-gray-200 hover:bg-gray-100"
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={(e) =>
                              setReportSections((prev) => ({ ...prev, [key]: e.target.checked }))
                            }
                            className="mt-0.5 w-4 h-4 text-blue-600 rounded border-gray-300 flex-shrink-0 cursor-pointer"
                          />
                          <div>
                            <div className="text-sm font-medium text-gray-800">{label}</div>
                            <div className="text-xs text-gray-500">{desc}</div>
                          </div>
                        </label>
                      );
                    })}
                  </div>

                  {/* Selected count badge */}
                  <p className="text-xs text-gray-500">
                    {Object.values(reportSections).filter(Boolean).length} section(s) sélectionnée(s)
                    {Object.values(reportSections).every(Boolean) && (
                      <span className="ml-2 text-blue-600 font-medium">— Rapport complet</span>
                    )}
                  </p>
                </div>

                {/* ── Right: Certification & download ─────────────── */}
                <div className="space-y-4">
                  <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Certification
                  </h4>

                  {/* Admin info (read-only) */}
                  <div className="bg-gray-50 rounded-lg border border-gray-200 p-3">
                    <p className="text-xs text-gray-500 mb-0.5">Administrateur</p>
                    <p className="text-sm font-semibold text-gray-900">{getAdminUsername()}</p>
                  </div>

                  {/* Signature text input */}
                  <div>
                    <label htmlFor="analytics-field-50736" className="block text-xs font-medium text-gray-700 mb-1">
                      Titre / Poste (optionnel)
                    </label>
                    <input id="analytics-field-50736"
                      type="text"
                      value={adminSignatureText}
                      onChange={(e) => setAdminSignatureText(e.target.value)}
                      placeholder="ex: Directeur Général"
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                    />
                  </div>

                  {/* Signature & Stamp toggles */}
                  <div className="space-y-2">
                    <label
                      className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                        hasSignature ? "bg-green-50 border-green-300" : "bg-gray-50 border-gray-200 hover:bg-gray-100"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={hasSignature}
                        onChange={(e) => setHasSignature(e.target.checked)}
                        className="mt-0.5 w-4 h-4 text-green-600 rounded border-gray-300 cursor-pointer"
                      />
                      <div>
                        <div className="text-sm font-medium text-gray-800">Signature officielle</div>
                        <div className="text-xs text-gray-500">Certifier avec signature admin</div>
                      </div>
                    </label>
                    <label
                      className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                        hasStamp ? "bg-green-50 border-green-300" : "bg-gray-50 border-gray-200 hover:bg-gray-100"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={hasStamp}
                        onChange={(e) => setHasStamp(e.target.checked)}
                        className="mt-0.5 w-4 h-4 text-green-600 rounded border-gray-300 cursor-pointer"
                      />
                      <div>
                        <div className="text-sm font-medium text-gray-800">Cachet officiel</div>
                        <div className="text-xs text-gray-500">Inclure le cachet de l'entreprise</div>
                      </div>
                    </label>
                  </div>

                  {/* Validation status badge */}
                  {hasSignature && hasStamp ? (
                    <div className="flex items-start gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                      <Shield className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                      <p className="text-xs text-green-700">
                        Le rapport sera émis en tant que <strong>Document Officiel</strong>.
                      </p>
                    </div>
                  ) : (
                    <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                      <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                      <p className="text-xs text-amber-700">
                        Sans signature <em>et</em> cachet, le rapport sera marqué{" "}
                        <strong>Document Non Officiel</strong>.
                      </p>
                    </div>
                  )}

                  {/* Generate button */}
                  <button
                    type="button"
                    onClick={handleGenerateReport}
                    disabled={
                      generatingReport ||
                      !Object.values(reportSections).some(Boolean)
                    }
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-700 text-white font-semibold rounded-lg hover:bg-blue-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm text-sm"
                  >
                    {generatingReport ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        Génération en cours…
                      </>
                    ) : (
                      <>
                        <FileDown className="w-4 h-4" />
                        Générer &amp; Télécharger PDF
                      </>
                    )}
                  </button>

                  {!Object.values(reportSections).some(Boolean) && (
                    <p className="text-xs text-center text-gray-400">
                      Sélectionnez au moins une section.
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>

    {/* ── Print password confirmation modal ───────────────────────── */}
    {showPrintPasswordModal && (
      <Dialog label="Confirmation Requise" onClose={() => { setShowPrintPasswordModal(false); setPrintPassword(""); setPrintPasswordError(""); }}>
        <div className="bg-white rounded-xl shadow-2xl border border-gray-200 p-6 max-w-sm w-full">
          <div className="text-center mb-5">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <Shield className="w-6 h-6 text-blue-600" />
            </div>
            <h3 className="text-lg font-bold text-gray-900">Confirmation Requise</h3>
            <p className="text-gray-500 text-sm mt-1">
              Confirmez votre mot de passe pour générer le rapport
            </p>
          </div>
          <form onSubmit={handlePrintPasswordVerify} className="space-y-4">
            <input aria-label="Mot de passe"
              type="password"
              value={printPassword}
              onChange={(e) => setPrintPassword(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              placeholder="Mot de passe"
              autoFocus
              required
            />
            {printPasswordError && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-lg text-sm">
                {printPasswordError}
              </div>
            )}
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => { setShowPrintPasswordModal(false); setPrintPassword(""); setPrintPasswordError(""); }}
                className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={printPasswordLoading}
                className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors text-sm font-semibold"
              >
                {printPasswordLoading ? "Vérification..." : "Confirmer"}
              </button>
            </div>
          </form>
        </div>
      </Dialog>
    )}
    </>
  );
}
