"use client";
import ResponsiveTable from "../../components/ui/ResponsiveTable";
import Dialog from "../../components/ui/Dialog";
import { EmptyState, LoadingState } from "../../components/ui/States";
import PeriodPicker from "../../components/inventory/PeriodPicker";

import { useState, useEffect, useCallback, useRef } from "react";
import { useAuth } from "../../hooks/useAuth";
import { formatDateTimeGMT2 } from "../../utils/dateUtils";
import { useTranslation } from "react-i18next";
import PageHeader from "../../components/ui/PageHeader";
import { formatFC, formatNumber, formatUSD } from "../../i18n/format";
import { serverMessage } from "../../i18n/serverMessages";
import { pdfSafe } from "../../utils/pdfText";
import { WALK_IN_LABEL } from "../../utils/saleCustomer";
import { initialPeriodSelection, usePeriodRange } from "../../hooks/usePeriodRange";
import { describePeriod } from "../../utils/dashboardPeriod";
import { serverUrl } from "../../utils/constants";
import {
  Search,
  FileText,
  Eye,
  Download,
  User,
  Package,
  Edit,
  Trash2,
  Plus,
  Minus,
  RefreshCw,
  Printer,
  Calendar,
  History,
  Filter,
  ChevronDown,
  Shield,
  BadgeCheck,
  ScanLine,
  CheckCircle,
  AlertTriangle,
  X,
} from "lucide-react";
import jsPDF from "jspdf";
import QRCode from "qrcode";
import {
  getItemOriginalCurrency,
  getItemOriginalTotal,
  getItemOriginalUnitPrice,
  getItemFcTotal,
  getItemFcUnitPrice,
  getSaleFcTotal,
  getItemUsdTotal,
  getItemUsdUnitPrice,
  type SaleCurrency,
} from "../../utils/salePricing";
import type { AppliedFilters, FieldChange, FieldChanges, SalesSummaryStats } from "../../types/records";
import { FESTIVE_GREETING_CSS, festiveGreetingHtml } from "../../utils/festiveGreeting";
import { getVerifiedUserRaw } from "../../lib/sessionManager";
import { printAndClose } from "../../utils/printWindow";

interface SaleItem {
  productId: string;
  name: string;
  quantity: number;
  price: number;
  total: number;
  _id: string;
  enteredPrice?: number;
  enteredCurrency?: SaleCurrency;
  priceUSD?: number;
  priceFC?: number;
  exchangeRate?: number;
}

interface EditHistoryEntry {
  editedBy: string;
  editedAt: string;
  changes: FieldChanges;
  reason: string;
  _id?: string;
}

interface Sale {
  _id: string;
  saleId: string;
  customer: {
    name: string;
    phone: string;
    email: string;
  };
  items: SaleItem[];
  subtotal: number;
  total: number;
  paymentMethod: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  salesPerson?: string;
  editedBy?: string;
  editedAt?: string;
  editHistory?: EditHistoryEntry[];
  type?: string;
  isWalkIn?: boolean;
  exchangeRate?: number;
  receiptToken?: string;
  receiptVerification?: {
    version: number;
    paymentStatus: "pending" | "approved" | "rejected";
    approvedAt?: string | null;
    approvedBy?: { username: string } | null;
    exitVerification?: {
      verified: boolean;
      verifiedAt?: string | null;
      verifiedBy?: { username: string } | null;
    };
  };
  saleEditApproval?: {
    status: "pending" | "approved" | "rejected";
    requestedByName: string;
    requestedAt: string;
    reason: string;
  };
}

interface Product {
  _id: string;
  name: string;
  price: number;
  sku?: string;
}

// User interface for role checking — matches what the server returns
interface User {
  _id?: string;
  id?: string;
  name?: string;
  username?: string;
  email: string;
  role: string;
  permissions?: string[];
  actionPermissions?: string[];
}

// Timeframe metadata interface
interface TimeframeMetadata {
  description: string;
  start: string;
  end: string;
  query: {
    from: string | null;
    to: string | null;
    date: string | null;
    year: string | null;
    month: string | null;
  };
}

// Response interface for timeframe API
interface SalesResponse {
  success: boolean;
  data: Sale[];
  pagination: {
    page: number;
    limit: number;
    totalRecords: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
  timeframe: TimeframeMetadata;
  summary: {
    totalRecords: number;
    revenue: number;
    expenses: number;
    net: number;
    salesCount: number;
    expensesCount: number;
  };
  filtersApplied: {
    customerPhone: string;
    status: string;
    type: string;
  };
  performanceNote: string | null;
}

interface ScanStats {
  total: number;
  paymentApproved: number;
  paymentPending: number;
  exitControlled: number;
  awaitingExitControl: number;
}

// Helper function to get today's date in correct format
const getTodayDate = (): string => {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// Helper function to get current month in YYYY-MM format
const getCurrentMonth = (): string => {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
};

// Helper function to get current year
const getCurrentYear = (): number => {
  return new Date().getFullYear();
};

// 2026-09-04 00:00 in Africa/Lubumbashi (UTC+02:00).
const RECEIPT_SCANNER_CUTOFF = new Date("2026-09-03T22:00:00.000Z").getTime();
const isLegacyReceiptSale = (sale: Sale) => new Date(sale.createdAt).getTime() < RECEIPT_SCANNER_CUTOFF;
const isPaymentApprovedForDisplay = (sale: Sale) =>
  isLegacyReceiptSale(sale) || sale.receiptVerification?.paymentStatus === "approved";
const isExitControlledForDisplay = (sale: Sale) =>
  isLegacyReceiptSale(sale) || sale.receiptVerification?.exitVerification?.verified === true;


export default function SalesHistory() {
  const { token: authToken } = useAuth();
  const { t } = useTranslation();

  // Always prefer the React auth context token; fall back to localStorage
  const getToken = useCallback(
    () => authToken || localStorage.getItem("token") || "",
    [authToken]
  );
  // Latest getToken for the effect below (its trigger list stays unchanged).
  const getTokenRef = useRef(getToken);
  getTokenRef.current = getToken;

  // Ref always points to the latest fetchSales — prevents stale closure in event listener
  const fetchSalesRef = useRef<() => void>(() => {});
  const fetchScanStatsRef = useRef<() => void>(() => {});

  const [sales, setSales] = useState<Sale[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [shopSettings, setShopSettings] = useState({
    shopName: "ETS. DIEU MERCI",
    shopAddress: "Av Manono Coin Munama N°39, C. Kenya, Lubumbashi",
    shopNumber: "+243 977 771 421 / +243 853 549 102",
    shopRegistration: "RCCM: 14-A-017885",
    // Empty = the printed footer uses the translated default.
    receiptFooter: "",
  });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingSale, setEditingSale] = useState<Sale | null>(null);
  const [editForm, setEditForm] = useState({
    customer: { name: "", phone: "", email: "" },
    items: [] as SaleItem[],
    paymentMethod: "cash",
    reason: "",
    isWalkIn: false,
  });
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loadingProducts, setLoadingProducts] = useState(false);

  // User state for role checking
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  // Reprinting an existing receipt is available to every authenticated user.
  // This flag is intentionally independent from all edit/void/override rights.
  const canReprintSale = (sale: Sale) => Boolean(currentUser) && sale.saleEditApproval?.status !== "pending";

  // Timeframe state - Updated to match backend query parameters
  const [timeframeType, setTimeframeType] = useState<
    "custom" | "day" | "month" | "year" | "today"
  >("today");
  const [periodSelection, setPeriodSelection] = useState(() => initialPeriodSelection("today"));
  const periodRange = usePeriodRange(periodSelection);
  
  // Query parameters for timeframe
  const [queryParams, setQueryParams] = useState({
    from: "",
    to: "",
    date: getTodayDate(),
    year: getCurrentYear().toString(),
    month: getCurrentMonth().split('-')[1],
    type: "",
    status: "",
    customerPhone: "",
    controlStatus: ""
  });

  // NEW: Edited sales filter state
  const [showEditedSales, setShowEditedSales] = useState(false);
  const [editedSales, setEditedSales] = useState<Sale[]>([]);
  const [selectedEditedSale, setSelectedEditedSale] = useState<Sale | null>(null);
  const [showEditedDetailsModal, setShowEditedDetailsModal] = useState(false);

  // Timeframe metadata
  const [, setTimeframeMetadata] = useState<TimeframeMetadata | null>(null);
  const [summaryStats, setSummaryStats] = useState<SalesSummaryStats | null>(null);
  const [appliedFilters, setAppliedFilters] = useState<AppliedFilters | null>(null);

  // UI state
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState<SalesResponse["pagination"] | null>(null);
  const [scanStats, setScanStats] = useState<ScanStats | null>(null);
  const [scanStatsError, setScanStatsError] = useState(false);

  // Admin-only manual receipt-control override (row selection + bulk submit)
  const [selectedOverrideIds, setSelectedOverrideIds] = useState<Set<string>>(new Set());
  const [overrideSubmitting, setOverrideSubmitting] = useState(false);

  // Fetch current user on component mount
  // Latest fetchCurrentUser for the effect below (its trigger list stays unchanged).
  const fetchCurrentUserRef = useRef<typeof fetchCurrentUser>(undefined as unknown as typeof fetchCurrentUser);
  // Latest fetchProducts for the effect below (its trigger list stays unchanged).
  const fetchProductsRef = useRef<typeof fetchProducts>(undefined as unknown as typeof fetchProducts);
  useEffect(() => {
    fetchCurrentUserRef.current();
    fetchSalesRef.current();
    fetchProductsRef.current();
    fetch(`${serverUrl}/settings/receipt`, {
      headers: { Authorization: `Bearer ${getTokenRef.current()}` },
    })
      .then((r) => r.ok ? r.json() : null)
      .then((data) => {
        if (data) {
          setShopSettings({
            shopName: data.shopName || "ETS. DIEU MERCI",
            shopAddress: data.shopAddress || "",
            shopNumber: data.shopNumber || "",
            shopRegistration: data.shopRegistration || "",
            receiptFooter: data.receiptFooter || "",
          });
        }
      })
      .catch(() => {});
    const handleSalesUpdate = () => {
      fetchSalesRef.current();
      fetchScanStatsRef.current();
    };

    window.addEventListener("salesUpdated", handleSalesUpdate);

    return () => {
      window.removeEventListener("salesUpdated", handleSalesUpdate);
    };
  }, []);

  // Fetch sales when query params change
  useEffect(() => {
    if (Object.keys(queryParams).length > 0) {
      fetchSalesRef.current();
    }
  }, [queryParams, currentPage, searchTerm]);

  // Scan totals depend on the complete matching period, never on pagination.
  useEffect(() => {
    fetchScanStatsRef.current();
  }, [queryParams, searchTerm]);

  useEffect(() => {
    setCurrentPage(1);
  }, [queryParams, searchTerm]);

  useEffect(() => {
    if (!periodRange) return;
    setTimeframeType("custom");
    setQueryParams((previous) => ({
      ...previous,
      from: periodRange.from,
      to: periodRange.to,
      date: "",
      year: "",
      month: "",
    }));
  }, [periodRange]);

  // Fetch current user from localStorage (with API fallback)
  const fetchCurrentUser = async () => {
    try {
      const storedUser = getVerifiedUserRaw();
      if (storedUser) {
        const userData = JSON.parse(storedUser);
        setCurrentUser(userData);
        setIsAdmin(userData.role === "admin");
        return;
      }

      // Fallback: /users/me is the correct endpoint
      const res = await fetch(`${serverUrl}/users/me`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getToken()}`,
        },
      });

      if (res.ok) {
        const userData = await res.json();
        setCurrentUser(userData);
        setIsAdmin(userData.role === "admin");
      }
    } catch (error) {
      console.error("Error fetching user data:", error);
      setIsAdmin(false);
    }
  };
  fetchCurrentUserRef.current = fetchCurrentUser;

  // Keep invalidated normal sales visible so their receipt-control state is explicit.
  const filterValidSales = (sales: Sale[]): Sale[] => {
    return sales.filter((sale: Sale) => {
      const nonSaleStatuses = ['expense', 'depense'];
      const isValidStatus = !nonSaleStatuses.includes(sale.status?.toLowerCase());
      
      // Also check if it's a sale (has saleId and customer structure)
      const isSaleStructure = sale.saleId && sale.customer && sale.items;
      
      return isValidStatus && isSaleStructure;
    });
  };

  // Build query string from queryParams
  const buildQueryString = () => {
    const params = new URLSearchParams();
    params.set("page", String(currentPage));
    params.set("limit", "50");
    params.set("type", "sale");
    
    // Add timeframe parameters based on timeframeType
    switch(timeframeType) {
      case "custom":
        if (queryParams.from) params.append("from", queryParams.from);
        if (queryParams.to) params.append("to", queryParams.to);
        break;
      case "day":
        if (queryParams.date) params.append("date", queryParams.date);
        break;
      case "month":
        if (queryParams.year) params.append("year", queryParams.year);
        if (queryParams.month) params.append("month", queryParams.month);
        break;
      case "year":
        if (queryParams.year) params.append("year", queryParams.year);
        break;
      case "today":
        // No parameters needed - backend defaults to today
        break;
    }
    
    // Add additional filters
    if (queryParams.status) params.append("status", queryParams.status);
    if (queryParams.customerPhone) params.append("customerPhone", queryParams.customerPhone);
    if (queryParams.controlStatus) params.append("controlStatus", queryParams.controlStatus);
    if (searchTerm.trim()) params.append("search", searchTerm.trim());
    
    return params.toString();
  };

  const fetchSales = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const queryString = buildQueryString();
      const url = `${serverUrl}/sales${queryString ? `?${queryString}` : ''}`;
      
      console.log("Fetching sales from:", url);
      
      const res = await fetch(url, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getToken()}`,
        },
      });

      if (res.ok) {
        const data: SalesResponse = await res.json();
        
        if (data.success && data.data && Array.isArray(data.data)) {
          const fetchedSales = data.data;
          
          console.log(`Fetched ${fetchedSales.length} sales from API`);
          console.log("Timeframe metadata:", data.timeframe);
          console.log("Summary stats:", data.summary);
          
          // Filter out expenses and invalid sales
          const validSales = filterValidSales(fetchedSales);
          console.log(`After filtering: ${validSales.length} valid sales`);
          
          // Update sales state
          setSales(validSales);
          setPagination(data.pagination || null);
          
          // Update metadata
          setTimeframeMetadata(data.timeframe);
          setSummaryStats(data.summary);
          setAppliedFilters(data.filtersApplied);
          
          // Update edited sales
          updateEditedSales(validSales);
        } else {
          console.warn("Unexpected sales data structure:", data);
          setError(t("entryHistory.unexpectedFormat"));
        }
      } else {
        console.error("Sales fetch failed:", res.status);
        const errorData = await res.json().catch(() => ({}));
        setError(serverMessage(errorData.error || errorData.message, t("salesHistory.loadFailedStatus", { status: res.status })));
      }
    } catch (error) {
      console.error("Error loading sales:", error);
      setError(t("salesHistory.loadFailed"));
    } finally {
      setLoading(false);
    }
  };

  // Keep ref pointing to latest fetchSales so event listeners never use a stale closure
  fetchSalesRef.current = fetchSales;

  // Update edited sales when sales change
  const updateEditedSales = (salesList: Sale[]) => {
    // Filter sales that have editHistory or editedBy field
    const edited = salesList.filter(sale => 
      (sale.editHistory && sale.editHistory.length > 0) || sale.editedBy
    );

    // Sort by edit date (newest first)
    const sortedEditedSales = edited.sort((a, b) => {
      const dateA = a.editedAt ? new Date(a.editedAt).getTime() : new Date(a.updatedAt).getTime();
      const dateB = b.editedAt ? new Date(b.editedAt).getTime() : new Date(b.updatedAt).getTime();
      return dateB - dateA;
    });

    setEditedSales(sortedEditedSales);
  };

  // Handle query parameter changes
  const handleQueryParamChange = (key: keyof typeof queryParams, value: string) => {
    setQueryParams(prev => ({
      ...prev,
      [key]: value
    }));
  };

  // Clear all filters
  const clearAllFilters = () => {
    setQueryParams({
      from: "",
      to: "",
      date: getTodayDate(),
      year: getCurrentYear().toString(),
      month: getCurrentMonth().split('-')[1],
      type: "",
      status: "",
      customerPhone: "",
      controlStatus: ""
    });
    setTimeframeType("today");
    setPeriodSelection(initialPeriodSelection("today"));
    setShowEditedSales(false);
    setSearchTerm("");
  };

  // A sale can be manually overridden only if it is a real, still-valid, non-legacy
  // receipt sale that is genuinely missing payment approval and/or exit control —
  // mirrors the eligibility checks the backend independently re-verifies.
  const isOverrideEligible = (sale: Sale): boolean =>
    (sale.type ?? "sale") === "sale" &&
    !["voided", "corrected", "refunded"].includes(sale.status) &&
    !isLegacyReceiptSale(sale) &&
    (!isPaymentApprovedForDisplay(sale) || !isExitControlledForDisplay(sale));

  const toggleOverrideSelection = (saleId: string) => {
    setSelectedOverrideIds((prev) => {
      const next = new Set(prev);
      if (next.has(saleId)) next.delete(saleId);
      else next.add(saleId);
      return next;
    });
  };

  const selectAllVisibleEligible = () => {
    setSelectedOverrideIds((prev) => {
      const next = new Set(prev);
      filteredSales.filter(isOverrideEligible).forEach((sale) => next.add(sale._id));
      return next;
    });
  };

  const clearOverrideSelection = () => setSelectedOverrideIds(new Set());

  const submitAdminOverride = async () => {
    if (selectedOverrideIds.size === 0) return;
    setOverrideSubmitting(true);
    setError(null);
    setMessage(null);
    try {
      const res = await fetch(`${serverUrl}/sales/receipt-control/admin-mark-complete`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getToken()}`,
        },
        body: JSON.stringify({
          saleIds: Array.from(selectedOverrideIds),
          reason: "Admin bulk override (SalesHistory)",
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(serverMessage(data.error, t("salesHistory.override.failed")));
        return;
      }
      setMessage(t("salesHistory.override.result", { updated: data.updated, complete: data.alreadyComplete, rejected: data.rejected }));
      clearOverrideSelection();
      fetchSalesRef.current();
      fetchScanStatsRef.current();
    } catch (err) {
      console.error("Admin override error:", err);
      setError(t("entryHistory.connectionFailed"));
    } finally {
      setOverrideSubmitting(false);
    }
  };

  const fetchProducts = async () => {
    try {
      setLoadingProducts(true);
      const res = await fetch(`${serverUrl}/products?availability=sellable`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getToken()}`,
        },
      });

      if (res.ok) {
        const data = await res.json();
        let productsArray: Product[] = [];

        if (Array.isArray(data)) {
          productsArray = data;
        } else if (data && Array.isArray(data.products)) {
          productsArray = data.products;
        } else if (data && typeof data === "object") {
          productsArray = [data];
        }

        console.log("Processed products:", productsArray.length);
        setProducts(productsArray);
      } else {
        console.error("Products API Error:", res.status, res.statusText);
      }
    } catch (error) {
      console.error("Error loading products:", error);
    } finally {
      setLoadingProducts(false);
    }
  };
  fetchProductsRef.current = fetchProducts;

  const filteredSales = showEditedSales 
    ? editedSales.filter(sale =>
        sale.saleId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        sale.customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        sale.customer.phone.includes(searchTerm) ||
        (sale.salesPerson && sale.salesPerson.toLowerCase().includes(searchTerm.toLowerCase()))
      )
    : sales.filter(sale =>
        sale.saleId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        sale.customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        sale.customer.phone.includes(searchTerm) ||
        (sale.salesPerson && sale.salesPerson.toLowerCase().includes(searchTerm.toLowerCase()))
      );

  const formatDate = (dateString: string) => formatDateTimeGMT2(dateString);

  const formatCurrency = (amount: number) => formatUSD(amount);
  const formatFc = (amount: number) => formatFC(amount);

  const compactDualUnit = (item: SaleItem, saleRate?: number) => {
    const fc = getItemFcUnitPrice(item, saleRate);
    return `${getItemUsdUnitPrice(item).toFixed(2)}$${fc === undefined ? "" : ` / ${formatFc(fc)}`}`;
  };

  const compactDualTotal = (item: SaleItem, saleRate?: number) => {
    const fc = getItemFcTotal(item, saleRate);
    return `${getItemUsdTotal(item).toFixed(2)}$${fc === undefined ? "" : ` / ${formatFc(fc)}`}`;
  };

  const compactDualSaleTotal = (total: number, items: SaleItem[], saleRate?: number) => {
    const fc = getSaleFcTotal(total, items, saleRate);
    return `${total.toFixed(2)}$${fc === undefined ? "" : ` / ${formatFc(fc)}`}`;
  };

  const formatOriginalItemUnitPrice = (item: SaleItem) =>
    getItemOriginalCurrency(item) === "FC"
      ? formatFc(getItemOriginalUnitPrice(item))
      : formatCurrency(getItemOriginalUnitPrice(item));

  const formatOriginalItemTotal = (item: SaleItem) =>
    getItemOriginalCurrency(item) === "FC"
      ? formatFc(getItemOriginalTotal(item))
      : formatCurrency(getItemOriginalTotal(item));

  // NEW: Function to view edited sale details
  const viewEditedSaleDetails = (sale: Sale) => {
    setSelectedEditedSale(sale);
    setShowEditedDetailsModal(true);
  };

  // NEW: Function to render change comparison
  const renderChangeComparison = (sale: Sale) => {
    if (!sale.editHistory || sale.editHistory.length === 0) return null;

    const latestEdit = sale.editHistory[sale.editHistory.length - 1];
    const changes = latestEdit.changes;

    return (
      <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <h4 className="font-medium text-yellow-800 mb-2 flex items-center gap-2">
          <History className="w-4 h-4" aria-hidden="true" />
          {t("entryHistory.lastEdit")}
        </h4>
        
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-yellow-700">{t("entryHistory.editedBy")}</span>
            <span className="font-medium">{latestEdit.editedBy || sale.editedBy || t("common.unknown")}</span>
          </div>
          
          <div className="flex justify-between">
            <span className="text-yellow-700">{t("entryHistory.editDate")}</span>
            <span className="font-medium">{formatDate(latestEdit.editedAt || sale.editedAt || sale.updatedAt)}</span>
          </div>
          
          <div className="flex justify-between">
            <span className="text-yellow-700">{t("entryHistory.reason")}</span>
            <span className="font-medium text-right">{latestEdit.reason}</span>
          </div>

          {changes && Object.keys(changes).length > 0 && (
            <div className="mt-3 pt-3 border-t border-yellow-200">
              <h5 className="font-medium text-yellow-800 mb-2">{t("entryHistory.changesTitle")}</h5>
              {Object.entries(changes).map(([field, changeData]: [string, FieldChange]) => (
                <div key={field} className="mb-2 last:mb-0">
                  <div className="font-medium text-yellow-700">{fieldLabel(field)}</div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="bg-red-50 p-2 rounded">
                      <div className="text-red-600 font-medium">{t("entryHistory.before")}</div>
                      <div className="truncate">{changeValue(changeData.from)}</div>
                    </div>
                    <div className="bg-green-50 p-2 rounded">
                      <div className="text-green-600 font-medium">{t("entryHistory.after")}</div>
                      <div className="truncate">{changeValue(changeData.to)}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  };

  const getReceiptQr = async (sale: Sale): Promise<{ receiptToken: string; qrDataUrl: string }> => {
    let receiptToken = sale.receiptToken;
    if (!receiptToken) {
      const response = await fetch(`${serverUrl}/sales/${sale._id}/receipt-token`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || !data.receiptToken) {
        throw new Error(serverMessage(data.message, t("salesHistory.qrUnavailable")));
      }
      receiptToken = data.receiptToken;
    }
    if (!receiptToken) throw new Error(t("salesHistory.qrUnavailable"));
    const qrDataUrl = await (QRCode.toDataURL(receiptToken, {
      errorCorrectionLevel: "M",
      margin: 4,
      width: 320,
      color: { dark: "#000000", light: "#ffffff" },
    }) as Promise<string>);
    return {
      receiptToken,
      qrDataUrl,
    };
  };

  const buildScanStatsQueryString = () => {
    const params = new URLSearchParams();
    switch (timeframeType) {
      case "custom":
        if (queryParams.from) params.set("from", queryParams.from);
        if (queryParams.to) params.set("to", queryParams.to);
        break;
      case "day":
        if (queryParams.date) params.set("date", queryParams.date);
        break;
      case "month":
        if (queryParams.year) params.set("year", queryParams.year);
        if (queryParams.month) params.set("month", queryParams.month);
        break;
      case "year":
        if (queryParams.year) params.set("year", queryParams.year);
        break;
      case "today":
        break;
    }
    if (queryParams.customerPhone) params.set("customerPhone", queryParams.customerPhone);
    if (searchTerm.trim()) params.set("search", searchTerm.trim());
    return params.toString();
  };

  const fetchScanStats = async () => {
    try {
      setScanStatsError(false);
      const query = buildScanStatsQueryString();
      const response = await fetch(`${serverUrl}/sales/scan-stats${query ? `?${query}` : ""}`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      if (!response.ok) throw new Error(`Scan statistics request failed (${response.status})`);
      setScanStats(await response.json() as ScanStats);
    } catch (fetchError) {
      console.error("Error loading receipt-control statistics:", fetchError);
      setScanStatsError(true);
    }
  };

  fetchScanStatsRef.current = fetchScanStats;

  // Print function for ESC/POS receipt - opens print dialog
  const printESC_POSReceipt = async (sale: Sale) => {
    let qrDataUrl: string;
    try {
      ({ qrDataUrl } = await getReceiptQr(sale));
    } catch (error) {
      setError(error instanceof Error ? error.message : t("salesHistory.qrUnavailable"));
      return;
    }
    const printWindow = window.open("", "_blank", "width=320,height=600");
    if (printWindow) {
      printWindow.document.write(`
<html>
  <head>
    <title>${t("newSale.receipt.title")}</title>
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
      * {
        margin: 0;
        padding: 0;
        box-sizing: border-box;
      }
      body {
        font-family: 'Courier New', Courier, monospace;
        margin: 0;
        padding: 0;
        font-size: 12px;
        font-weight: bold;
        line-height: 1.2;
        width: 80mm;
        background-color: white;
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }
      .receipt-container {
        width: 78mm;
        margin: 0 auto;
        padding: 1mm 2mm;
        border: none;
        text-align: center;
        position: relative;
      }
      .logo-watermark {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background-image: url('${window.location.origin}/logo.jpeg');
        background-repeat: no-repeat;
        background-position: center;
        background-size: 65%;
        opacity: 0.18;
        pointer-events: none;
        z-index: 0;
      }
      .content-wrapper {
        position: relative;
        z-index: 1;
      }
      .header {
        text-align: center;
        margin-bottom: 2mm;
        padding-bottom: 1mm;
        border-bottom: 2px double #000;
      }
      .shop-name {
        font-size: 15px;
        font-weight: bold;
        margin-bottom: 0.5mm;
        text-transform: uppercase;
      }
      .shop-details {
        font-size: 11px;
        margin-bottom: 0.3mm;
        line-height: 1;
        font-weight: bold;
      }
      .receipt-info {
        margin: 2mm 0;
        padding: 1mm 2mm;
        background-color: #f8f8f8;
        border-left: 3px solid #000;
        text-align: left;
      }
      .receipt-title {
        font-size: 11px;
        font-weight: bold;
        margin: 1mm 0;
        text-transform: uppercase;
        background-color: #000;
        color: white;
        padding: 1mm 2mm;
        border-radius: 2px;
        text-align: center;
      }
      .items-section {
        margin: 0;
        padding: 0;
        background-color: #fafafa;
        border: none;
        border-top: none;
      }
      .items-col-header {
        display: flex;
        justify-content: space-between;
        background-color: #e0e0e0;
        padding: 1mm 2mm;
        font-weight: bold;
        text-transform: uppercase;
        font-size: 10px;
        margin: 0;
        border-bottom: 1px solid #999;
      }
      .col-article {
        flex: 2;
        text-align: left;
      }
      .col-qte {
        width: 10mm;
        text-align: center;
      }
      .col-pu {
        width: 18mm;
        text-align: right;
      }
      .col-pt {
        width: 18mm;
        text-align: right;
      }
      .item-row {
        display: flex;
        justify-content: space-between;
        margin-bottom: 0.5mm;
        padding: 0.5mm 2mm;
        border-bottom: 1px dotted #ddd;
        font-size: 10px;
      }
      .item-name {
        flex: 2;
        text-align: left;
        font-weight: bold;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        padding-right: 1mm;
      }
      .item-quantity {
        width: 10mm;
        text-align: center;
        font-weight: bold;
      }
      .item-unit-price {
        width: 18mm;
        text-align: right;
        font-weight: bold;
      }
      .item-line-total {
        width: 18mm;
        text-align: right;
        font-weight: bold;
      }
      .total-section {
        font-weight: bold;
        margin-top: 2mm;
        padding: 1mm 2mm;
        background-color: #f0f0f0;
        border: 1px solid #ddd;
        border-radius: 3px;
      }
      .total-row {
        display: flex;
        justify-content: space-between;
        margin-bottom: 0.5mm;
        font-size: 11px;
        padding: 0 1mm;
      }
      .payment-method {
        text-transform: uppercase;
        font-weight: bold;
        font-size: 11px;
        color: #000;
      }
      .footer {
        text-align: center;
        margin-top: 2mm;
        font-size: 10px;
        font-weight: bold;
        padding: 1mm 2mm;
        background-color: #f8f8f8;
        border-top: 1px dashed #000;
      }
      .sales-person {
        margin-top: 2mm;
        text-align: center;
        font-weight: bold;
        font-size: 10px;
        padding: 1mm 2mm;
        background-color: #e8e8e8;
        border: 1px solid #ccc;
        border-radius: 2px;
      }
      .receipt-qr { text-align: center; margin: 2mm auto; padding: 1mm; background: #fff; }
      .receipt-qr img { width: 42mm; height: 42mm; image-rendering: pixelated; }
      .qr-promo { margin-top: 0.5mm; font-size: 9px; line-height: 1.15; text-align: center; }
      .customer-info {
        margin: 2mm 0;
        padding: 1mm 2mm;
        font-weight: bold;
        text-align: left;
        background-color: #f5f5f5;
        border: 1px solid #ddd;
        border-radius: 3px;
        font-size: 10px;
      }
      .customer-field {
        margin-bottom: 0.3mm;
        font-size: 10px;
      }
      .separator {
        border-top: 1px dashed #000;
        margin: 1mm 0;
      }
      .cut-line {
        text-align: center;
        margin: 1mm 0;
        font-weight: bold;
        font-size: 11px;
        color: #000;
        letter-spacing: 1px;
      }
      .thank-you {
        font-weight: bold;
        margin: 0.5mm 0;
        font-size: 12px;
      }
      .warning {
        font-size: 10px;
        color: #000;
        margin: 0.3mm 0;
        font-weight: bold;
      }
      .section-divider {
        height: 2px;
        background: linear-gradient(to right, transparent, #000, transparent);
        margin: 1mm 0;
      }
      @media print {
        @page {
          margin: 0 !important;
          size: 80mm auto !important;
        }
        body {
          margin: 0 !important;
          padding: 0 !important;
          width: 80mm !important;
          font-size: 12px !important;
          background: white !important;
          font-weight: bold !important;
          height: auto !important;
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
        }
        .receipt-container {
          border: none !important;
          box-shadow: none !important;
          margin: 0 auto !important;
          padding: 1mm 2mm !important;
          width: 78mm !important;
        }
        .cut-line {
          page-break-after: always !important;
          margin-bottom: 0 !important;
        }
        body::after,
        body::before {
          display: none !important;
          content: none !important;
        }
      }
    ${FESTIVE_GREETING_CSS}
    </style>
  </head>
  <body>
    <div class="receipt-container">
      <div class="logo-watermark"></div>
      <div class="content-wrapper">
      <div class="header">
        <div class="shop-name"><strong>${shopSettings.shopName}</strong></div>
        <div class="shop-details"><strong>${shopSettings.shopAddress}</strong></div>
        <div class="shop-details">${t("receipt.tel")}: <strong>${shopSettings.shopNumber}</strong></div>
        <div class="shop-details"><strong>${shopSettings.shopRegistration}</strong></div>
      </div>
      
      <div class="section-divider"></div>
      
      <div class="receipt-info">
        <div class="shop-details">${t("receipt.date")}: <strong>${formatDate(sale.createdAt)}</strong></div>
        <div class="shop-details">${t("newSale.receipt.receiptNo")}: <strong>${sale.saleId}</strong></div>
      </div>
      
      <div class="customer-info">
        <div class="customer-field">${t("newSale.receipt.customer")}: <strong>${(sale.customer.name === WALK_IN_LABEL ? t("newSale.walkInName") : sale.customer.name).toUpperCase()}</strong></div>
        ${
          sale.customer.phone
            ? `<div class="customer-field">${t("newSale.receipt.phone")}: <strong>${sale.customer.phone}</strong></div>`
            : ""
        }
        ${
          sale.customer.email
            ? `<div class="customer-field">${t("receipt.email")}: <strong>${sale.customer.email}</strong></div>`
            : ""
        }
      </div>
      
      <div class="receipt-title">${t("newSale.receipt.itemsBought")}</div>

      <div class="items-col-header">
        <span class="col-article">${t("newSale.receipt.item")}</span>
        <span class="col-qte">${t("newSale.receipt.qty")}</span>
      </div>

      <div class="items-section">
      ${sale.items
        .map(
          (item) => `
        <div class="item-row" style="flex-wrap:wrap">
          <div class="item-name"><strong>${item.name}</strong></div>
          <div class="item-quantity"><strong>${item.quantity}</strong></div>
          <div style="width:100%;text-align:left;padding-left:2mm"><strong>${item.quantity} x ${compactDualUnit(item, sale.exchangeRate)} = ${compactDualTotal(item, sale.exchangeRate)}</strong></div>
        </div>
      `
        )
        .join("")}
      </div>
      
      <div class="total-section">
        <div class="total-row">
          <div><strong>${t("newSale.receipt.subtotal")}:</strong></div>
          <div><strong>${compactDualSaleTotal(sale.subtotal, sale.items, sale.exchangeRate)}</strong></div>
        </div>
        <div class="total-row">
          <div><strong>${t("newSale.receipt.total")}:</strong></div>
          <div><strong>${compactDualSaleTotal(sale.total, sale.items, sale.exchangeRate)}</strong></div>
        </div>
        <div class="total-row">
          <div><strong>${t("receipt.payment")}:</strong></div>
          <div class="payment-method"><strong>${sale.paymentMethod.toUpperCase()}</strong></div>
        </div>
      </div>
      
      <div class="sales-person">
        ${t("newSale.receipt.agent")}: <strong>${(sale.salesPerson || t("entryHistory.notSpecified")).toUpperCase()}</strong>
      </div>
      
      <div class="receipt-qr"><img src="${qrDataUrl}" alt="${t("newSale.receipt.qrAlt")}" /><div class="qr-promo"><div><strong>${t("newSale.receipt.promoTitle")}</strong></div><div>${t("newSale.receipt.promoBody")}</div><div><strong>WhatsApp : +243 844 311 550</strong></div></div></div>

      ${festiveGreetingHtml()}
      <div class="footer">
        <div class="thank-you"><strong>${shopSettings.receiptFooter || t("newSale.receipt.thanks")}</strong></div>
        <div class="warning"><strong>${t("newSale.receipt.noExchange")}</strong></div>
        <div class="warning"><strong>${t("newSale.receipt.noRefund")}</strong></div>
      </div>

      <!-- PAPER CUT INDICATOR -->
      <div class="cut-line">
        ✄ ────────────────────────── ✄
      </div>
      </div>
    </div>
  </body>
</html>
`);
      printWindow.document.close();
      printAndClose(printWindow);
    }
  };

  const generateReceiptPDF = async (sale: Sale) => {
    let qrDataUrl: string;
    try {
      ({ qrDataUrl } = await getReceiptQr(sale));
    } catch (error) {
      setError(error instanceof Error ? error.message : t("salesHistory.qrUnavailable"));
      return;
    }
    const doc = new jsPDF();

    // Header
    doc.setFontSize(20);
    doc.text("ETS. DIEU MERCI", 105, 10, { align: "center" });
    doc.setFontSize(10);
    doc.text("<<Chez Dan Collection>>", 105, 15, { align: "center" });
    const P = (text: string) => pdfSafe(text);
    doc.setFontSize(12);
    doc.text("RCCM: 14-A-017885", 105, 20, { align: "center" });
    doc.text(P(`${t("entryHistory.pdf.tel")}: +243 977 771 421 / +243 853 549 102`), 105, 25, {
      align: "center",
    });
    doc.text(P("Av Manono Coin Munama N°39,C.Kenya, Lubumbashi"), 105, 30, {
      align: "center",
    });

    doc.setFontSize(16);
    doc.text(P(t("newSale.receipt.title")), 105, 35, { align: "center" });

    // Sale Info
    doc.setFontSize(10);
    doc.text(P(`${t("common.date")}: ${formatDate(sale.createdAt)}`), 20, 45);
    doc.text(P(`${t("entryHistory.pdf.receiptNo")}: ${sale.saleId}`), 20, 52);
    doc.text(P(`${t("entryHistory.col.payment")}: ${t(`payment.${sale.paymentMethod}`, { defaultValue: sale.paymentMethod }).toUpperCase()}`), 20, 59);
    doc.text(P(`${t("common.status")}: ${t(`salesHistory.status.${sale.status}`, { defaultValue: sale.status }).toUpperCase()}`), 20, 66);

    // Sales Person Info
    doc.text(P(`${t("newSale.receipt.agent")}: ${sale.salesPerson || t("entryHistory.notSpecified")}`), 20, 73);

    // Customer Info
    doc.setFontSize(12);
    doc.text(P(`${t("salesHistory.customerInfo")}:`), 20, 85);
    doc.setFontSize(10);
    doc.text(P(`${t("entryHistory.name")}: ${sale.customer.name === WALK_IN_LABEL ? t("newSale.walkInName") : sale.customer.name}`), 20, 92);
    if (sale.customer.phone) {
      doc.text(P(`${t("entryHistory.phone")}: ${sale.customer.phone}`), 20, 99);
    }
    if (sale.customer.email) {
      doc.text(P(`${t("entryHistory.email")}: ${sale.customer.email}`), 20, 106);
    }

    // Items
    doc.setFontSize(12);
    doc.text(P(`${t("salesHistory.col.items")}:`), 20, 113);
    doc.setFontSize(10);
    let yPos = 120;

    sale.items.forEach((item, index) => {
      if (yPos > 250) {
        doc.addPage();
        yPos = 20;
      }

      doc.text(P(`${index + 1}. ${item.name}`), 20, yPos);
      doc.text(
        P(`${t("salesHistory.pdf.qty")}: ${item.quantity} x ${compactDualUnit(item, sale.exchangeRate)} = ${compactDualTotal(item, sale.exchangeRate)}`),
        25,
        yPos + 6
      );
      yPos += 15;
    });

    // Totals
    yPos += 7;
    doc.text(P(`${t("salesHistory.subtotal")} ${compactDualSaleTotal(sale.subtotal, sale.items, sale.exchangeRate)}`), 20, yPos);
    doc.text(P(`${t("common.total")}: ${compactDualSaleTotal(sale.total, sale.items, sale.exchangeRate)}`), 20, yPos + 5);
    doc.addImage(qrDataUrl, "PNG", 84, yPos + 10, 42, 42);
    doc.setFontSize(8);
    doc.setFont("helvetica", "bold");
    doc.text(P(t("newSale.receipt.promoTitle")), 105, yPos + 56, { align: "center" });
    doc.setFont("helvetica", "normal");
    doc.text(P(t("newSale.receipt.promoBody")), 105, yPos + 60, { align: "center" });
    doc.setFont("helvetica", "bold");
    doc.text("WhatsApp : +243 844 311 550", 105, yPos + 64, { align: "center" });
    yPos += 53;

    // Footer
    doc.setFontSize(10);
    doc.text(P(t("salesHistory.pdf.thanks")), 105, yPos + 20, {
      align: "center",
    });
    doc.text(
      P(t("salesHistory.pdf.noReturn")),
      105,
      yPos + 30,
      {
        align: "center",
      }
    );
    doc.text(P(t("salesHistory.pdf.seeYou")), 105, yPos + 40, {
      align: "center",
    });

    doc.save(`receipt-${sale.saleId}.pdf`);
  };

  const viewSaleDetails = (sale: Sale) => {
    setSelectedSale(sale);
    setShowModal(true);
    setError(null);
  };

  const openEditModal = async (sale: Sale) => {
    if (sale.status === "voided" || sale.status === "corrected") {
      setError(t("salesHistory.cannotEdit"));
      return;
    }

    setEditingSale(sale);
    setEditForm({
      customer: { ...sale.customer },
      items: sale.items.map((item) => ({ ...item })),
      paymentMethod: sale.paymentMethod,
      reason: "",
      isWalkIn: Boolean(sale.isWalkIn),
    });
    setShowEditModal(true);
    setError(null);

    // Ensure products are loaded
    if (products.length === 0) {
      await fetchProducts();
    }
  };

  const closeEditModal = () => {
    setShowEditModal(false);
    setEditingSale(null);
    setEditForm({
      customer: { name: "", phone: "", email: "" },
      items: [],
      paymentMethod: "cash",
      reason: "",
      isWalkIn: false,
    });
    setError(null);
  };

  const toggleEditWalkIn = () => {
    setEditForm((prev) => ({
      ...prev,
      isWalkIn: !prev.isWalkIn,
      // A walk-in keeps its optional display name but never contact details.
      customer: prev.isWalkIn
        ? prev.customer
        : { name: prev.customer.name, phone: "", email: "" },
    }));
  };

  const updateItemQuantity = (index: number, newQuantity: number) => {
    if (newQuantity < 1) return;

    const updatedItems = [...editForm.items];
    updatedItems[index].quantity = newQuantity;
    updatedItems[index].total = newQuantity * updatedItems[index].price;

    setEditForm((prev) => ({
      ...prev,
      items: updatedItems,
    }));
    setError(null);
  };

  const updateItemPrice = (index: number, newPrice: number) => {
    if (newPrice < 0) return;

    const updatedItems = [...editForm.items];
    const itemRate =
      updatedItems[index].exchangeRate ?? editingSale?.exchangeRate;
    updatedItems[index] = {
      ...updatedItems[index],
      price: newPrice,
      total: newPrice * updatedItems[index].quantity,
      enteredPrice: newPrice,
      enteredCurrency: "USD",
      priceUSD: newPrice,
      priceFC: itemRate ? Math.round(newPrice * itemRate) : undefined,
      exchangeRate: itemRate,
    };

    setEditForm((prev) => ({
      ...prev,
      items: updatedItems,
    }));
  };

  const removeItem = (index: number) => {
    const updatedItems = editForm.items.filter((_, i) => i !== index);
    setEditForm((prev) => ({
      ...prev,
      items: updatedItems,
    }));
  };

  const addNewItem = () => {
    if (products.length === 0) {
      setError(t("salesHistory.noProductsRefresh"));
      return;
    }

    const defaultProduct = products[0];
    const newItem: SaleItem = {
      productId: defaultProduct._id,
      name: defaultProduct.name,
      quantity: 1,
      price: defaultProduct.price,
      total: defaultProduct.price,
      enteredPrice: defaultProduct.price,
      enteredCurrency: "USD",
      priceUSD: defaultProduct.price,
      priceFC: editingSale?.exchangeRate
        ? Math.round(defaultProduct.price * editingSale.exchangeRate)
        : undefined,
      exchangeRate: editingSale?.exchangeRate,
      _id: `temp-${Date.now()}`,
    };

    setEditForm((prev) => ({
      ...prev,
      items: [...prev.items, newItem],
    }));
  };

  const updateItemProduct = (index: number, productId: string) => {
    const product = products.find((p) => p._id === productId);
    if (!product) {
      setError(t("salesHistory.productNotFound"));
      return;
    }

    const updatedItems = [...editForm.items];
    const itemRate =
      updatedItems[index].exchangeRate ?? editingSale?.exchangeRate;
    updatedItems[index] = {
      ...updatedItems[index],
      productId,
      name: product.name,
      price: product.price,
      total: product.price * updatedItems[index].quantity,
      enteredPrice: product.price,
      enteredCurrency: "USD",
      priceUSD: product.price,
      priceFC: itemRate ? Math.round(product.price * itemRate) : undefined,
      exchangeRate: itemRate,
    };

    setEditForm((prev) => ({
      ...prev,
      items: updatedItems,
    }));
    setError(null);
  };

  const calculateTotals = () => {
    const subtotal = editForm.items.reduce((sum, item) => sum + item.total, 0);
    return { subtotal, total: subtotal };
  };

  const handleEditSale = async () => {
    if (!editingSale) return;

    if (editForm.items.length === 0) {
      setError(t("salesHistory.needItem"));
      return;
    }

    if (!editForm.isWalkIn && (!editForm.customer.name || !editForm.customer.phone)) {
      setError(t("newSale.hintCustomer"));
      return;
    }

    if (!editForm.reason) {
      setError(t("salesHistory.reasonRequired"));
      return;
    }

    try {
      setLoading(true);

      // Calculate totals properly
      const { subtotal, total } = calculateTotals();

      // Make sure we're sending the correct data structure
      const updateData = {
        customer: editForm.isWalkIn
          ? { name: editForm.customer.name.trim() || "Client de passage", phone: "", email: "" }
          : editForm.customer,
        isWalkIn: editForm.isWalkIn,
        items: editForm.items.map((item) => ({
          productId: item.productId,
          name: item.name,
          quantity: item.quantity,
          price: item.price,
          total: item.total,
          enteredPrice: item.enteredPrice,
          enteredCurrency: item.enteredCurrency,
          priceUSD: item.priceUSD,
          priceFC: item.priceFC,
          exchangeRate: item.exchangeRate,
        })),
        subtotal: subtotal,
        total: total,
        exchangeRate: editingSale.exchangeRate,
        paymentMethod: editForm.paymentMethod,
        reason: editForm.reason,
        // Include the original sale ID to ensure update, not create
        _id: editingSale._id,
        saleId: editingSale.saleId, // Keep the same sale ID
      };

      const response = await fetch(
        `${serverUrl}/sales/${editingSale._id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${getToken()}`,
          },
          body: JSON.stringify(updateData),
        }
      );

      if (response.ok) {
        const result = await response.json();
        setMessage(response.status === 202
          ? t("salesHistory.editPending")
          : serverMessage(result.message, t("salesHistory.updated")));

        // Refresh the sales list immediately
        await fetchSales();

        // Also refresh customers to update their statistics
        setTimeout(() => {
          window.dispatchEvent(new Event("salesUpdated"));
        }, 1000);

        closeEditModal();
      } else {
        const errorData = await response.json().catch(() => ({}));
        setError(serverMessage(errorData.error || errorData.message, t("salesHistory.updateFailedStatus", { status: response.status })));
      }
    } catch (error) {
      console.error("Error updating sale:", error);
      setError(t("salesHistory.updateFailed"));
    } finally {
      setLoading(false);
    }
  };

  const handleVoidSale = async (sale: Sale) => {
    if (sale.status === "voided") {
      setError(t("salesHistory.alreadyVoided"));
      return;
    }

    if (
      !window.confirm(
        t("salesHistory.confirmVoid", { id: sale.saleId })
      )
    ) {
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(
        `${serverUrl}/sales/${sale._id}/void`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${getToken()}`,
          },
          body: JSON.stringify({
            reason: "Sale voided by admin",
          }),
        }
      );

      if (response.ok) {
        setMessage(t("salesHistory.voided"));
        await fetchSales();
        setShowModal(false);
      } else {
        const errorData = await response.json().catch(() => ({}));
        setError(serverMessage(errorData.error, t("salesHistory.voidFailed")));
      }
    } catch (error) {
      setError(t("salesHistory.voidFailed"));
      console.error("Error voiding sale:", error);
    } finally {
      setLoading(false);
    }
  };

  const { subtotal, total } = calculateTotals();

  const isInvalidated = (sale: Sale) => ["voided", "corrected", "refunded"].includes(sale.status);
  const paymentLabel = (method?: string) => (method ? t(`payment.${method}`, { defaultValue: method }) : "");
  const statusLabel = (sale: Sale) => sale.saleEditApproval?.status === "pending"
    ? t("salesHistory.status.awaitingApproval")
    : t(`salesHistory.status.${sale.status}`, { defaultValue: sale.status });
  const paymentControlLabel = (sale: Sale, long = false) => isInvalidated(sale)
    ? t("salesHistory.control.invalidated")
    : isPaymentApprovedForDisplay(sale)
      ? (isLegacyReceiptSale(sale) ? t(long ? "salesHistory.control.validatedLegacyLong" : "salesHistory.control.validatedLegacy") : t("salesHistory.control.approved"))
      : t("salesHistory.control.pending");
  const exitControlLabel = (sale: Sale, long = false) => isInvalidated(sale)
    ? t("salesHistory.control.notAllowed")
    : isExitControlledForDisplay(sale)
      ? (isLegacyReceiptSale(sale) ? t(long ? "salesHistory.control.checkedLegacyLong" : "salesHistory.control.checkedLegacy") : t("salesHistory.control.verified"))
      : t("salesHistory.control.notDone");
  const fieldLabel = (field: string) => t(`salesHistory.fields.${field}`, { defaultValue: field.replace(/([A-Z])/g, " $1").toLowerCase() });
  const changeValue = (value: unknown) => value === null || value === undefined || value === ""
    ? t("common.notAvailable")
    : typeof value === "object" ? JSON.stringify(value, null, 2) : String(value);
  const editLocked = (sale: Sale) => sale.status === "voided" || sale.status === "corrected" || sale.saleEditApproval?.status === "pending";
  const listTitle = showEditedSales ? t("salesHistory.editedSales") : t("salesHistory.allSales");

  return (
    <div className="page space-y-4">
      <PageHeader
        eyebrow={t("nav.sections.history")}
        icon={<History aria-hidden="true" />}
        title={t("salesHistory.title")}
        description={t("salesHistory.subtitle")}
        actions={<>
          <div className="input-group flex-1 sm:flex-none sm:w-72">
            <Search aria-hidden="true" />
            <input aria-label={t("salesHistory.searchLabel")} type="search" placeholder={t("salesHistory.searchPlaceholder")}
              className="input" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
          </div>
          <button type="button" onClick={() => setShowEditedSales(!showEditedSales)} aria-pressed={showEditedSales}
            className={`btn ${showEditedSales ? "btn-primary" : "btn-secondary"}`}>
            <Filter aria-hidden="true" />
            {showEditedSales ? t("salesHistory.allSales") : t("salesHistory.editedSales")}
            {showEditedSales && <span className="badge num" style={{ background: "rgb(255 255 255 / 0.2)", color: "inherit", borderColor: "transparent" }}>{editedSales.length}</span>}
          </button>
        </>}
      />

      {isAdmin && summaryStats && (
        <section aria-labelledby="sales-summary-title" className="grid gap-3">
          <h2 id="sales-summary-title" className="eyebrow">
            <Shield aria-hidden="true" />
            {t("sortieHistory.summaryTitle")}
          </h2>
          <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
            <div className="metric-card"><span className="metric-label">{t("salesHistory.kpi.revenue")}</span><span className="metric-value num text-green-700">{formatCurrency(summaryStats.revenue)}</span></div>
            <div className="metric-card"><span className="metric-label">{t("salesHistory.kpi.net")}</span><span className="metric-value num text-blue-700">{formatCurrency(summaryStats.net)}</span></div>
            <div className="metric-card"><span className="metric-label">{t("salesHistory.kpi.expenses")}</span><span className="metric-value num text-red-700">{formatCurrency(summaryStats.expenses)}</span></div>
            <div className="metric-card"><span className="metric-label">{t("salesHistory.kpi.records")}</span><span className="metric-value num">{formatNumber(summaryStats.totalRecords, 0)}</span></div>
            <div className="metric-card"><span className="metric-label">{t("salesHistory.kpi.sales")}</span><span className="metric-value num">{formatNumber(summaryStats.salesCount, 0)}</span></div>
            <div className="metric-card"><span className="metric-label">{t("salesHistory.kpi.expenseCount")}</span><span className="metric-value num">{formatNumber(summaryStats.expensesCount, 0)}</span></div>
          </div>
        </section>
      )}

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5" role="group" aria-label={t("salesHistory.controlFilter")}>
        {([
          { value: "", label: t("salesHistory.tiles.all"), count: scanStats?.total, icon: FileText, tone: "text-gray-500", title: undefined },
          { value: "payment_pending", label: t("salesHistory.tiles.paymentPending"), count: scanStats?.paymentPending, icon: BadgeCheck, tone: "text-amber-600", title: t("salesHistory.tiles.paymentPendingHint") },
          { value: "exit_unverified", label: t("salesHistory.tiles.exitUnverified"), count: scanStats?.awaitingExitControl, icon: ScanLine, tone: "text-orange-600", title: t("salesHistory.tiles.exitUnverifiedHint") },
          { value: "payment_approved", label: t("salesHistory.tiles.paymentApproved"), count: scanStats?.paymentApproved, icon: BadgeCheck, tone: "text-green-600", title: undefined },
          { value: "exit_verified", label: t("salesHistory.tiles.exitVerified"), count: scanStats?.exitControlled, icon: ScanLine, tone: "text-blue-600", title: undefined },
        ]).map((tile, index) => {
          const Icon = tile.icon;
          const active = queryParams.controlStatus === tile.value;
          return (
            <button key={tile.value || "all"} type="button" onClick={() => handleQueryParamChange("controlStatus", tile.value)} title={tile.title} aria-pressed={active}
              className={`metric-card text-left transition-colors ${index === 0 ? "col-span-2 sm:col-span-1" : ""} ${active ? "!border-blue-600 ring-2 ring-blue-600/20 !bg-blue-50" : "hover:!bg-gray-50"}`}>
              <span className="flex items-center justify-between gap-2">
                <span className="metric-label">{tile.label}</span>
                <Icon className={`w-4 h-4 shrink-0 ${tile.tone}`} aria-hidden="true" />
              </span>
              <span className="metric-value num">{scanStatsError ? "—" : (tile.count ?? "…")}</span>
            </button>
          );
        })}
        {scanStatsError && <p className="text-sm text-amber-700 col-span-2 sm:col-span-3 lg:col-span-5">{t("salesHistory.statsUnavailable")}</p>}
      </div>

      <section className="card" aria-labelledby="sales-period-title">
        <div className="card-header">
          <h2 id="sales-period-title" className="section-title flex items-center gap-2 min-w-0">
            <Calendar className="w-4 h-4 text-gray-500 shrink-0" aria-hidden="true" />
            <span className="truncate">{listTitle} · {periodRange ? describePeriod(periodRange) : t("period.invalidShort")}</span>
          </h2>
          <button type="button" onClick={clearAllFilters} className="btn btn-ghost btn-sm">
            <RefreshCw aria-hidden="true" />
            {t("sortieHistory.reset")}
          </button>
        </div>
        <div className="card-body empty:hidden">
          <PeriodPicker value={periodSelection} onChange={setPeriodSelection} range={periodRange} />
          <div className="mt-3">
            <button type="button" onClick={() => setShowAdvancedFilters(!showAdvancedFilters)} aria-expanded={showAdvancedFilters} className="btn btn-ghost btn-sm -ml-3 text-blue-700">
              {showAdvancedFilters ? t("sortieHistory.advancedHide") : t("sortieHistory.advancedShow")}
              <ChevronDown className={`w-4 h-4 transition-transform ${showAdvancedFilters ? "rotate-180" : ""}`} aria-hidden="true" />
            </button>
            {showAdvancedFilters && (
              <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 p-3 bg-gray-50 border border-gray-200 rounded-xl">
                <label className="field"><span className="field-label">{t("salesHistory.filters.control")}</span>
                  <select value={queryParams.controlStatus} onChange={(event) => handleQueryParamChange("controlStatus", event.target.value)} className="input">
                    <option value="">{t("common.all")}</option>
                    <option value="payment_pending">{t("salesHistory.filters.paymentPending")}</option>
                    <option value="payment_approved">{t("salesHistory.filters.paymentApproved")}</option>
                    <option value="exit_unverified">{t("salesHistory.tiles.exitUnverified")}</option>
                    <option value="exit_verified">{t("salesHistory.filters.exitVerified")}</option>
                  </select>
                </label>
                <label className="field"><span className="field-label">{t("salesHistory.filters.type")}</span>
                  <select value={queryParams.type} onChange={(event) => handleQueryParamChange("type", event.target.value)} className="input">
                    <option value="">{t("salesHistory.filters.allTypes")}</option>
                    <option value="sale">{t("salesHistory.filters.sale")}</option>
                    <option value="expense">{t("salesHistory.filters.expense")}</option>
                  </select>
                </label>
                <label className="field"><span className="field-label">{t("common.status")}</span>
                  <select value={queryParams.status} onChange={(event) => handleQueryParamChange("status", event.target.value)} className="input">
                    <option value="">{t("sortieHistory.allStatuses")}</option>
                    <option value="completed">{t("salesHistory.status.completed")}</option>
                    <option value="pending">{t("salesHistory.status.pending")}</option>
                    <option value="expense">{t("salesHistory.status.expense")}</option>
                  </select>
                </label>
                <label className="field"><span className="field-label">{t("salesHistory.filters.customerPhone")}</span>
                  <input type="text" value={queryParams.customerPhone} onChange={(event) => handleQueryParamChange("customerPhone", event.target.value)} placeholder="+243 …" className="input" />
                </label>
              </div>
            )}
          </div>
          {appliedFilters && (
            <p className="mt-3 text-sm text-gray-600">
              <span className="font-medium">{t("sortieHistory.appliedFilters")}</span>{" "}
              {t("sortieHistory.filterStatus", { value: appliedFilters.status && appliedFilters.status !== "all" && appliedFilters.status !== "none" ? t(`salesHistory.status.${appliedFilters.status}`, { defaultValue: appliedFilters.status }) : t("common.all") })}
              {" · "}{t("salesHistory.filterType", { value: appliedFilters.type && appliedFilters.type !== "all" && appliedFilters.type !== "none" ? t(`salesHistory.filters.${appliedFilters.type}`, { defaultValue: appliedFilters.type }) : t("common.all") })}
              {appliedFilters.customerPhone !== "none" && <>{" · "}{t("salesHistory.filterPhone", { value: appliedFilters.customerPhone })}</>}
            </p>
          )}
        </div>
      </section>

      {message && (
        <div className="alert alert-success" role="status">
          <CheckCircle className="w-5 h-5" aria-hidden="true" />
          <span className="flex-1">{message}</span>
          <button type="button" aria-label={t("common.closeMessage")} onClick={() => setMessage(null)} className="btn btn-ghost btn-icon btn-sm -my-1 -mr-1"><X aria-hidden="true" /></button>
        </div>
      )}
      {error && !showEditModal && (
        <div className="alert alert-danger" role="alert">
          <AlertTriangle className="w-5 h-5" aria-hidden="true" />
          <span className="flex-1">{error}</span>
          <button type="button" aria-label={t("common.closeMessage")} onClick={() => setError(null)} className="btn btn-ghost btn-icon btn-sm -my-1 -mr-1"><X aria-hidden="true" /></button>
        </div>
      )}

      <section className="card" aria-labelledby="sales-list-title">
        <div className="card-header">
          <h2 id="sales-list-title" className="section-title flex items-center gap-2">
            <FileText className="w-4 h-4 text-gray-500" aria-hidden="true" />
            {showEditedSales ? t("salesHistory.editedSales") : t("salesHistory.transactions")}
            <span className="badge num">{filteredSales.length}</span>
          </h2>
        </div>

        {isAdmin && !showEditedSales && (
          <div className="flex flex-wrap items-center gap-2 px-4 sm:px-5 py-3 bg-gray-50 border-b border-gray-200">
            <span className="flex items-center gap-1.5 text-sm font-medium text-gray-800 mr-auto">
              <Shield className="w-4 h-4 text-gray-500" aria-hidden="true" />
              {selectedOverrideIds.size > 0 ? t("salesHistory.override.selected", { count: selectedOverrideIds.size }) : t("salesHistory.override.title")}
            </span>
            <button type="button" onClick={selectAllVisibleEligible} className="btn btn-secondary btn-sm">{t("salesHistory.override.selectVisible")}</button>
            <button type="button" onClick={clearOverrideSelection} disabled={selectedOverrideIds.size === 0} className="btn btn-ghost btn-sm">{t("salesHistory.override.clear")}</button>
            <button type="button" onClick={submitAdminOverride} disabled={selectedOverrideIds.size === 0 || overrideSubmitting} className="btn btn-primary btn-sm">
              {overrideSubmitting && <RefreshCw className="w-4 h-4 animate-spin" aria-hidden="true" />}
              {t("salesHistory.override.submit")}
            </button>
          </div>
        )}

        <div className="sales-table-region">
          {loading ? (
            <LoadingState label={t("salesHistory.loading")} />
          ) : filteredSales.length === 0 ? (
            <EmptyState title={showEditedSales ? t("salesHistory.noEdited") : t("salesHistory.noSales")} icon={<FileText aria-hidden="true" />}>
              {t("salesHistory.noResult")}
            </EmptyState>
          ) : (
            <ResponsiveTable className="report-table" aria-label={listTitle}>
              <thead>
                <tr>
                  {isAdmin && !showEditedSales && (
                    <th className="is-text">
                      <input type="checkbox" aria-label={t("salesHistory.override.selectVisibleLabel")} className="w-4 h-4"
                        checked={filteredSales.some(isOverrideEligible) && filteredSales.filter(isOverrideEligible).every((sale) => selectedOverrideIds.has(sale._id))}
                        onChange={(e) => (e.target.checked ? selectAllVisibleEligible() : clearOverrideSelection())} />
                    </th>
                  )}
                  <th className="is-text">{t("salesHistory.col.id")}</th>
                  <th className="is-text">{t("customers.col.customer")}</th>
                  <th className="is-num">{t("salesHistory.col.items")}</th>
                  <th className="is-num">{t("common.total")}</th>
                  <th className="is-text">{t("entryHistory.col.payment")}</th>
                  <th className="is-text">{t("salesHistory.col.paymentApproved")}</th>
                  <th className="is-text">{t("salesHistory.col.exitControl")}</th>
                  <th className="is-text">{t("common.status")}</th>
                  <th className="is-text">{t("salesHistory.col.dateAgent")}</th>
                  <th className="is-text is-actions">{t("common.actions")}</th>
                </tr>
              </thead>
              <tbody>
                {filteredSales.map((sale) => {
                  const modifier = (sale.editHistory && sale.editHistory.length > 0 ? sale.editHistory[sale.editHistory.length - 1].editedBy : null) || sale.editedBy;
                  return (
                    <tr key={sale._id}>
                      {isAdmin && !showEditedSales && (
                        <td className="is-text">
                          <input type="checkbox" aria-label={t("salesHistory.override.selectSale", { id: sale.saleId })} className="w-4 h-4"
                            disabled={!isOverrideEligible(sale)} checked={selectedOverrideIds.has(sale._id)} onChange={() => toggleOverrideSelection(sale._id)} />
                        </td>
                      )}
                      <td className="is-text mono whitespace-nowrap"><strong>{sale.saleId}</strong></td>
                      <td className="is-text">
                        <div className="text-gray-900 flex items-center gap-2">
                          {sale.customer.name === WALK_IN_LABEL ? t("newSale.walkInName") : sale.customer.name}
                          {sale.isWalkIn && <span className="badge badge-warning">{t("salesHistory.walkInBadge")}</span>}
                        </div>
                        <div className="text-xs text-gray-500 whitespace-nowrap">{sale.customer.phone}</div>
                      </td>
                      <td className="num is-num whitespace-nowrap">{t("salesHistory.itemCount", { count: sale.items.length })}</td>
                      <td className="num is-num whitespace-nowrap"><strong>{formatCurrency(sale.total)}</strong></td>
                      <td className="is-text"><span className="badge">{paymentLabel(sale.paymentMethod)}</span></td>
                      <td className="is-text text-xs">
                        <span className={`badge ${isInvalidated(sale) ? "badge-danger" : isPaymentApprovedForDisplay(sale) ? "badge-success" : "badge-warning"}`}>{paymentControlLabel(sale)}</span>
                        {sale.receiptVerification?.approvedBy?.username && (
                          <div className="mt-1 text-gray-500">{sale.receiptVerification.approvedBy.username}{sale.receiptVerification.approvedAt ? ` · ${formatDate(sale.receiptVerification.approvedAt)}` : ""}</div>
                        )}
                      </td>
                      <td className="is-text text-xs">
                        <span className={`badge ${isInvalidated(sale) ? "badge-danger" : isExitControlledForDisplay(sale) ? "badge-info" : ""}`}>{exitControlLabel(sale)}</span>
                        {sale.receiptVerification?.exitVerification?.verifiedBy?.username && (
                          <div className="mt-1 text-gray-500">{sale.receiptVerification.exitVerification.verifiedBy.username}{sale.receiptVerification.exitVerification.verifiedAt ? ` · ${formatDate(sale.receiptVerification.exitVerification.verifiedAt)}` : ""}</div>
                        )}
                      </td>
                      <td className="is-text">
                        <span className={`badge ${sale.saleEditApproval?.status === "pending" ? "badge-warning" : sale.status === "completed" ? "badge-success" : sale.status === "voided" ? "badge-danger" : "badge-warning"}`}>{statusLabel(sale)}</span>
                        {modifier && <div className="mt-1"><span className="badge badge-warning" title={t("salesHistory.col.editedBy")}><Edit className="w-3 h-3" aria-hidden="true" />{modifier}</span></div>}
                      </td>
                      <td className="is-text whitespace-nowrap">
                        <div className="text-gray-700">{formatDate(sale.createdAt)}</div>
                        <div className="text-xs text-gray-500">{sale.salesPerson || t("entryHistory.notSpecified")}</div>
                      </td>
                      <td className="is-text is-actions">
                        <div className="flex gap-1 whitespace-nowrap">
                          {showEditedSales ? (
                            <button type="button" aria-label={t("entryHistory.viewChanges")} title={t("entryHistory.viewChanges")} onClick={() => viewEditedSaleDetails(sale)} className="btn btn-ghost btn-sm">
                              <History aria-hidden="true" /><span className="ui-action-label">{t("entryHistory.changes")}</span>
                            </button>
                          ) : (
                            <button type="button" aria-label={t("salesHistory.viewDetails")} title={t("salesHistory.viewDetails")} onClick={() => viewSaleDetails(sale)} className="btn btn-ghost btn-sm">
                              <Eye aria-hidden="true" /><span className="ui-action-label">{t("common.details")}</span>
                            </button>
                          )}
                          {!showEditedSales && (
                            <>
                              <button type="button" aria-label={t("salesHistory.editSale")} title={t("salesHistory.editSale")} onClick={() => openEditModal(sale)} disabled={editLocked(sale)} className="btn btn-ghost btn-sm">
                                <Edit aria-hidden="true" /><span className="ui-action-label">{t("common.edit")}</span>
                              </button>
                              {canReprintSale(sale) && (
                                <>
                                  <button type="button" aria-label={t("salesHistory.downloadPdf")} title={t("salesHistory.downloadPdf")} onClick={() => generateReceiptPDF(sale)} className="btn btn-ghost btn-sm">
                                    <Download aria-hidden="true" /><span className="ui-action-label">PDF</span>
                                  </button>
                                  <button type="button" aria-label={t("entryHistory.printReceipt")} title={t("salesHistory.printEscPos")} onClick={() => printESC_POSReceipt(sale)} className="btn btn-ghost btn-sm">
                                    <Printer aria-hidden="true" /><span className="ui-action-label">{t("common.print")}</span>
                                  </button>
                                </>
                              )}
                              <button type="button" aria-label={t("salesHistory.voidSale")} title={t("salesHistory.voidSale")} onClick={() => handleVoidSale(sale)} disabled={sale.status === "voided" || sale.saleEditApproval?.status === "pending"} className="btn btn-ghost btn-sm text-red-600">
                                <Trash2 aria-hidden="true" /><span className="ui-action-label">{t("salesHistory.void")}</span>
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </ResponsiveTable>
          )}
        </div>
      </section>

      {pagination && pagination.totalPages > 1 && (
        <nav className="card flex flex-wrap items-center justify-between gap-3 px-4 py-3" aria-label={t("salesHistory.pagination")}>
          <span className="text-sm text-gray-600 num">
            {t("common.page", { page: pagination.page, pages: pagination.totalPages })} · {t("salesHistory.recordCount", { count: pagination.totalRecords })}
          </span>
          <div className="flex gap-2">
            <button type="button" disabled={!pagination.hasPreviousPage} onClick={() => setCurrentPage((page) => Math.max(1, page - 1))} className="btn btn-secondary btn-sm">{t("common.previous")}</button>
            <button type="button" disabled={!pagination.hasNextPage} onClick={() => setCurrentPage((page) => page + 1)} className="btn btn-secondary btn-sm">{t("common.next")}</button>
          </div>
        </nav>
      )}

      {showModal && selectedSale && (
        <Dialog label={t("salesHistory.detailsTitle")} onClose={() => setShowModal(false)}>
          <div className="dialog-panel max-w-3xl">
            <header className="dialog-head">
              <div>
                <h3 className="dialog-title">{t("salesHistory.detailsTitle")}</h3>
                <p className="dialog-subtitle mono">{selectedSale.saleId}</p>
              </div>
              <button type="button" aria-label={t("common.close")} onClick={() => setShowModal(false)} className="btn btn-ghost btn-icon btn-sm"><X aria-hidden="true" /></button>
            </header>
            <div className="dialog-body space-y-4">
              <dl className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
                <div><dt className="text-gray-500">{t("common.date")}</dt><dd className="font-medium">{formatDate(selectedSale.createdAt)}</dd></div>
                <div><dt className="text-gray-500">{t("sortie.paymentMethod")}</dt><dd className="font-medium">{paymentLabel(selectedSale.paymentMethod)}</dd></div>
                <div><dt className="text-gray-500">{t("common.status")}</dt><dd><span className={`badge ${selectedSale.status === "completed" ? "badge-success" : selectedSale.status === "voided" ? "badge-danger" : "badge-warning"}`}>{t(`salesHistory.status.${selectedSale.status}`, { defaultValue: selectedSale.status })}</span></dd></div>
                <div><dt className="text-gray-500">{t("newSale.receipt.agent")}</dt><dd className="font-medium">{selectedSale.salesPerson || t("entryHistory.notSpecified")}</dd></div>
                {selectedSale.editedBy && (
                  <div className="col-span-2 sm:col-span-4"><dt className="text-gray-500">{t("entryHistory.lastEdit")}</dt>
                    <dd className="font-medium">{t("entryHistory.editedByAt", { name: selectedSale.editedBy, date: selectedSale.editedAt ? formatDate(selectedSale.editedAt) : t("common.notAvailable") })}</dd></div>
                )}
              </dl>

              <section className="form-section">
                <h4 className="section-title flex items-center gap-2">
                  <User className="w-4 h-4" aria-hidden="true" />{t("salesHistory.customerInfo")}
                  {selectedSale.isWalkIn && <span className="badge badge-warning">{t("newSale.walkInName")}</span>}
                </h4>
                <dl className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
                  <div><dt className="text-gray-500">{t("entryHistory.name")}</dt><dd className="font-medium">{selectedSale.customer.name === WALK_IN_LABEL ? t("newSale.walkInName") : selectedSale.customer.name}</dd></div>
                  <div><dt className="text-gray-500">{t("entryHistory.phone")}</dt><dd className="font-medium">{selectedSale.customer.phone || "—"}</dd></div>
                  {selectedSale.customer.email && <div><dt className="text-gray-500">{t("entryHistory.email")}</dt><dd className="font-medium">{selectedSale.customer.email}</dd></div>}
                </dl>
              </section>

              <section className="form-section">
                <h4 className="section-title flex items-center gap-2"><Package className="w-4 h-4" aria-hidden="true" />{t("salesHistory.itemsTitle", { count: selectedSale.items.length })}</h4>
                <ul className="divide-y divide-gray-200">
                  {selectedSale.items.map((item, index) => (
                    <li key={index} className="flex justify-between items-start gap-3 py-2">
                      <div>
                        <p className="font-medium text-gray-900">{item.name}</p>
                        <p className="text-sm text-gray-600 num">{t("salesHistory.piecesTimes", { count: item.quantity })} {formatOriginalItemUnitPrice(item)}</p>
                      </div>
                      <p className="font-medium text-gray-900 text-right num">
                        {formatOriginalItemTotal(item)}
                        {item.enteredCurrency === "FC" && <span className="block text-xs font-normal text-gray-500">{t("salesHistory.receivedUsd", { value: formatCurrency(getItemUsdTotal(item)) })}</span>}
                      </p>
                    </li>
                  ))}
                </ul>
              </section>

              {selectedSale.editHistory && selectedSale.editHistory.length > 0 && renderChangeComparison(selectedSale)}

              {selectedSale.type !== "expense" && (
                <dl className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm grid gap-1">
                  <div className="flex justify-between"><dt>{t("salesHistory.receiptVersion")}</dt><dd className="font-semibold">{selectedSale.receiptVerification?.version ? `v${selectedSale.receiptVerification.version}` : t("salesHistory.legacy")}</dd></div>
                  <div className="flex justify-between"><dt>{t("salesHistory.paymentValidation")}</dt><dd className={`font-semibold ${isPaymentApprovedForDisplay(selectedSale) ? "text-emerald-700" : "text-amber-700"}`}>{isPaymentApprovedForDisplay(selectedSale) ? paymentControlLabel({ ...selectedSale, status: "completed" }, true) : t("salesHistory.control.pending")}</dd></div>
                  {selectedSale.receiptVerification?.approvedBy?.username && (
                    <div className="flex justify-between"><dt>{t("salesHistory.validatedBy")}</dt><dd className="font-semibold">{selectedSale.receiptVerification.approvedBy.username}{selectedSale.receiptVerification.approvedAt ? ` · ${formatDate(selectedSale.receiptVerification.approvedAt)}` : ""}</dd></div>
                  )}
                  <div className="flex justify-between"><dt>{t("salesHistory.col.exitControl")}</dt><dd className={`font-semibold ${isExitControlledForDisplay(selectedSale) ? "text-blue-700" : "text-slate-600"}`}>{isExitControlledForDisplay(selectedSale) ? exitControlLabel({ ...selectedSale, status: "completed" }, true) : t("salesHistory.control.notDone")}</dd></div>
                  {selectedSale.receiptVerification?.exitVerification?.verifiedBy?.username && (
                    <div className="flex justify-between"><dt>{t("salesHistory.exitVerifiedBy")}</dt><dd className="font-semibold">{selectedSale.receiptVerification.exitVerification.verifiedBy.username}{selectedSale.receiptVerification.exitVerification.verifiedAt ? ` · ${formatDate(selectedSale.receiptVerification.exitVerification.verifiedAt)}` : ""}</dd></div>
                  )}
                </dl>
              )}

              <div className="border-t border-gray-200 pt-3 num">
                <div className="flex justify-between items-center text-sm text-gray-600"><span>{t("salesHistory.subtotal")}</span><span className="text-gray-900">{formatCurrency(selectedSale.subtotal)}</span></div>
                <div className="flex justify-between items-center text-lg font-semibold"><span>{t("common.total")}</span><span>{formatCurrency(selectedSale.total)}</span></div>
              </div>
            </div>
            <footer className="dialog-foot flex-wrap">
              <button type="button" onClick={() => setShowModal(false)} className="btn btn-ghost">{t("common.close")}</button>
              <button type="button" onClick={() => openEditModal(selectedSale)} disabled={editLocked(selectedSale)} className="btn btn-secondary"><Edit aria-hidden="true" />{t("salesHistory.editSale")}</button>
              {canReprintSale(selectedSale) && <button type="button" onClick={() => generateReceiptPDF(selectedSale)} className="btn btn-secondary"><Download aria-hidden="true" />{t("entryHistory.downloadPdf")}</button>}
              {canReprintSale(selectedSale) && <button type="button" onClick={() => printESC_POSReceipt(selectedSale)} className="btn btn-primary"><Printer aria-hidden="true" />{t("entryHistory.printReceipt")}</button>}
            </footer>
          </div>
        </Dialog>
      )}

      {showEditedDetailsModal && selectedEditedSale && (
        <Dialog label={t("entryHistory.changeDetails")} onClose={() => setShowEditedDetailsModal(false)}>
          <div className="dialog-panel max-w-4xl">
            <header className="dialog-head">
              <div>
                <h3 className="dialog-title">{t("entryHistory.changeDetails")}</h3>
                <p className="dialog-subtitle mono">{selectedEditedSale.saleId}</p>
              </div>
              <button type="button" aria-label={t("common.close")} onClick={() => setShowEditedDetailsModal(false)} className="btn btn-ghost btn-icon btn-sm"><X aria-hidden="true" /></button>
            </header>
            <div className="dialog-body space-y-4">
              <section className="form-section">
                <h4 className="section-title">{t("salesHistory.currentState")}</h4>
                <dl className="grid grid-cols-2 lg:grid-cols-4 gap-3 text-sm">
                  <div><dt className="text-gray-500">{t("customers.col.customer")}</dt><dd className="font-medium">{selectedEditedSale.customer.name} {selectedEditedSale.customer.phone && `(${selectedEditedSale.customer.phone})`}</dd></div>
                  <div><dt className="text-gray-500">{t("salesHistory.currentTotal")}</dt><dd className="font-semibold num">{formatCurrency(selectedEditedSale.total)}</dd></div>
                  <div><dt className="text-gray-500">{t("sortie.paymentMethod")}</dt><dd className="font-medium">{paymentLabel(selectedEditedSale.paymentMethod)}</dd></div>
                  <div><dt className="text-gray-500">{t("salesHistory.col.items")}</dt><dd className="font-medium">{t("salesHistory.itemCount", { count: selectedEditedSale.items.length })}</dd></div>
                </dl>
              </section>
              <section className="space-y-3">
                <h4 className="section-title">{t("entryHistory.editHistory")}</h4>
                {selectedEditedSale.editHistory && selectedEditedSale.editHistory.length > 0 ? (
                  selectedEditedSale.editHistory.map((edit, index) => (
                    <article key={edit._id || index} className="border border-gray-200 rounded-lg p-3 bg-gray-50">
                      <div className="flex flex-wrap justify-between gap-2 mb-2">
                        <div>
                          <h5 className="font-medium text-gray-900">{t("entryHistory.editNumber", { n: selectedEditedSale.editHistory!.length - index })}</h5>
                          <p className="text-sm text-gray-600">{formatDate(edit.editedAt)}</p>
                        </div>
                        <div className="text-right text-sm">
                          <p className="font-medium text-gray-900">{t("entryHistory.by", { name: edit.editedBy })}</p>
                          <p className="text-gray-600">{t("entryHistory.reasonValue", { reason: edit.reason })}</p>
                        </div>
                      </div>
                      {edit.changes && Object.keys(edit.changes).length > 0 && (
                        <div className="space-y-2">
                          {Object.entries(edit.changes).map(([field, changeData]: [string, FieldChange]) => (
                            <div key={field} className="border-l-4 border-blue-500 pl-3">
                              <div className="font-medium text-gray-700 text-sm mb-1">{fieldLabel(field)}</div>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                                <div className="bg-red-50 p-2 rounded border border-red-200">
                                  <div className="text-red-700 font-medium">{t("entryHistory.before")}</div>
                                  <div className="text-red-600 break-words whitespace-pre-wrap">{changeValue(changeData.from)}</div>
                                </div>
                                <div className="bg-green-50 p-2 rounded border border-green-200">
                                  <div className="text-green-700 font-medium">{t("entryHistory.after")}</div>
                                  <div className="text-green-600 break-words whitespace-pre-wrap">{changeValue(changeData.to)}</div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </article>
                  ))
                ) : (
                  <EmptyState title={t("entryHistory.noChangeDetails")} icon={<History aria-hidden="true" />} />
                )}
              </section>
            </div>
            <footer className="dialog-foot">
              <button type="button" onClick={() => setShowEditedDetailsModal(false)} className="btn btn-secondary">{t("common.close")}</button>
            </footer>
          </div>
        </Dialog>
      )}

      {showEditModal && editingSale && (
        <Dialog label={t("salesHistory.editSale")} onClose={closeEditModal}>
          <div className="dialog-panel max-w-4xl">
            <header className="dialog-head">
              <div>
                <h3 className="dialog-title">{t("salesHistory.editSale")}</h3>
                <p className="dialog-subtitle mono">{editingSale.saleId}</p>
              </div>
              <button type="button" aria-label={t("common.close")} onClick={closeEditModal} className="btn btn-ghost btn-icon btn-sm"><X aria-hidden="true" /></button>
            </header>
            <div className="dialog-body space-y-4">
              {error && <div className="alert alert-danger" role="alert"><AlertTriangle aria-hidden="true" /><span>{error}</span></div>}

              <fieldset className="form-section">
                <legend>{t("salesHistory.customerInfo")}</legend>
                <label className="flex items-center gap-2 p-2 bg-gray-50 border border-gray-200 rounded-lg cursor-pointer select-none w-fit">
                  <input type="checkbox" checked={editForm.isWalkIn} onChange={toggleEditWalkIn} className="w-4 h-4" />
                  <span className="text-sm font-medium text-gray-700">{t("salesHistory.walkInToggle")}</span>
                </label>
                <div className="form-row">
                  <label className="field">
                    <span className="field-label">{t("entryHistory.name")} {editForm.isWalkIn ? <span className="font-normal text-gray-400">{t("common.optional")}</span> : <span className="text-red-600" aria-hidden="true">*</span>}</span>
                    <input className="input" type="text" value={editForm.customer.name} required={!editForm.isWalkIn} placeholder={editForm.isWalkIn ? t("newSale.walkInName") : undefined}
                      onChange={(e) => setEditForm((prev) => ({ ...prev, customer: { ...prev.customer, name: e.target.value } }))} />
                  </label>
                  <label className="field">
                    <span className="field-label">{t("customers.phoneNumber")}</span>
                    <input className="input" type="tel" value={editForm.customer.phone} disabled={editForm.isWalkIn} required={!editForm.isWalkIn}
                      onChange={(e) => setEditForm((prev) => ({ ...prev, customer: { ...prev.customer, phone: e.target.value } }))} />
                  </label>
                  <label className="field">
                    <span className="field-label">{t("entryHistory.email")}</span>
                    <input className="input" type="email" value={editForm.customer.email} disabled={editForm.isWalkIn}
                      onChange={(e) => setEditForm((prev) => ({ ...prev, customer: { ...prev.customer, email: e.target.value } }))} />
                  </label>
                  <label className="field">
                    <span className="field-label">{t("sortie.paymentMethod")}</span>
                    <select className="input" value={editForm.paymentMethod} onChange={(e) => setEditForm((prev) => ({ ...prev, paymentMethod: e.target.value }))}>
                      {(["cash", "card", "transfer", "other"] as const).map((method) => <option key={method} value={method}>{paymentLabel(method)}</option>)}
                    </select>
                  </label>
                </div>
              </fieldset>

              <fieldset className="form-section">
                <div className="flex flex-wrap justify-between items-center gap-2">
                  <legend className="section-title">{t("salesHistory.col.items")}</legend>
                  <div className="flex gap-2">
                    <button type="button" onClick={fetchProducts} disabled={loadingProducts} className="btn btn-secondary btn-sm">
                      <RefreshCw className={loadingProducts ? "animate-spin" : ""} aria-hidden="true" />{t("salesHistory.refreshProducts")}
                    </button>
                    <button type="button" onClick={addNewItem} disabled={products.length === 0} className="btn btn-primary btn-sm">
                      <Plus aria-hidden="true" />{t("newSale.addItem")}
                    </button>
                  </div>
                </div>
                {products.length === 0 && !loadingProducts && (
                  <div className="alert alert-warning" role="note"><AlertTriangle aria-hidden="true" /><span>{t("salesHistory.noProducts")}</span></div>
                )}
                <div className="space-y-2">
                  {editForm.items.map((item, index) => (
                    <div key={item._id} className="border rounded-lg p-3 bg-gray-50 grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
                      <label className="field md:col-span-4">
                        <span className="field-label">{t("newSale.item")}</span>
                        {loadingProducts ? (
                          <div className="input bg-gray-100 text-gray-600">{t("salesHistory.loadingProducts")}</div>
                        ) : products.length === 0 ? (
                          <input className="input" aria-label={t("salesHistory.productName")} type="text" value={item.name} placeholder={t("salesHistory.productName")}
                            onChange={(e) => {
                              const updatedItems = [...editForm.items];
                              updatedItems[index].name = e.target.value;
                              setEditForm((prev) => ({ ...prev, items: updatedItems }));
                            }} />
                        ) : (
                          <select className="input" value={item.productId} onChange={(e) => updateItemProduct(index, e.target.value)}>
                            {products.map((product) => <option key={product._id} value={product._id}>{product.name} — {formatCurrency(product.price)}</option>)}
                          </select>
                        )}
                      </label>
                      <label className="field md:col-span-2">
                        <span className="field-label">{t("salesHistory.price")}</span>
                        <input className="input num" type="number" min="0" step="0.01" value={item.price} onChange={(e) => updateItemPrice(index, parseFloat(e.target.value) || 0)} />
                      </label>
                      <div className="field md:col-span-2">
                        <span className="field-label">{t("salesHistory.pieces")}</span>
                        <div className="flex items-center border rounded-lg bg-white">
                          <button aria-label={t("salesHistory.decrease")} type="button" onClick={() => updateItemQuantity(index, item.quantity - 1)} className="p-2 hover:bg-gray-100" disabled={item.quantity <= 1}><Minus className="w-3 h-3" aria-hidden="true" /></button>
                          <input aria-label={t("salesHistory.pieces")} type="number" min="1" value={item.quantity} onChange={(e) => updateItemQuantity(index, parseInt(e.target.value) || 1)} className="w-full p-2 text-center border-0 num" />
                          <button aria-label={t("salesHistory.increase")} type="button" onClick={() => updateItemQuantity(index, item.quantity + 1)} className="p-2 hover:bg-gray-100"><Plus className="w-3 h-3" aria-hidden="true" /></button>
                        </div>
                      </div>
                      <div className="field md:col-span-2">
                        <span className="field-label">{t("common.total")}</span>
                        <div className="readonly-field num font-medium">{formatCurrency(item.total)}</div>
                      </div>
                      <div className="md:col-span-2">
                        <button type="button" onClick={() => removeItem(index)} className="btn btn-danger btn-sm w-full"><Trash2 aria-hidden="true" />{t("common.delete")}</button>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="border-t border-gray-200 pt-3 num">
                  <div className="flex justify-between items-center text-sm text-gray-600"><span>{t("salesHistory.subtotal")}</span><span className="text-gray-900">{formatCurrency(subtotal)}</span></div>
                  <div className="flex justify-between items-center text-lg font-semibold"><span>{t("common.total")}</span><span>{formatCurrency(total)}</span></div>
                </div>
              </fieldset>

              <label className="field">
                <span className="field-label">{t("entryHistory.editReason")} *</span>
                <textarea className="input" rows={2} required value={editForm.reason} placeholder={t("salesHistory.editReasonPlaceholder")}
                  onChange={(e) => setEditForm((prev) => ({ ...prev, reason: e.target.value }))} />
              </label>
            </div>
            <footer className="dialog-foot">
              <button type="button" onClick={closeEditModal} className="btn btn-secondary">{t("common.cancel")}</button>
              <button type="button" onClick={handleEditSale} disabled={loading || editForm.items.length === 0} className="btn btn-primary">
                {loading ? <RefreshCw className="animate-spin" aria-hidden="true" /> : <Edit aria-hidden="true" />}
                {loading ? t("entryHistory.updating") : t("salesHistory.update")}
              </button>
            </footer>
          </div>
        </Dialog>
      )}
    </div>
  );
}
