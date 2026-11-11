"use client";
import ResponsiveTable from "../components/ui/ResponsiveTable";
import Dialog from "../components/ui/Dialog";
import { EmptyState, LoadingState } from "../components/ui/States";
import PeriodPicker from "../components/inventory/PeriodPicker";

import { useState, useEffect, useRef } from "react";
import { formatDateTimeGMT2, formatTimeGMT2 } from "../utils/dateUtils";
import { useTranslation } from "react-i18next";
import PageHeader from "../components/ui/PageHeader";
import { formatNumber, formatPercent, formatUSD } from "../i18n/format";
import { activeLocale } from "../i18n/translate";
import { serverMessage } from "../i18n/serverMessages";
import { uiPaymentLabel } from "../utils/entryLabels";
import { serverUrl } from "../utils/constants";
import { initialPeriodSelection, usePeriodRange } from "../hooks/usePeriodRange";
import { describePeriod } from "../utils/dashboardPeriod";
import {
  Search,
  FileText,
  Eye,
  CheckCircle,
  XCircle,
  Edit,
  Printer,
  Calendar,
  RefreshCw,
  User,
  DollarSign,
  Trash2,
  Save,
  X,
  AlertCircle,
  History,
  ChevronDown,
  Shield,
  Lock,
  AlertTriangle,
} from "lucide-react";
import type { AppliedFilters, ExpenseHistoryEntry, ExpenseSummaryStats } from "../types/records";
import { FESTIVE_GREETING_CSS, festiveGreetingHtml } from "../utils/festiveGreeting";
import { getVerifiedUserRaw } from "../lib/sessionManager";
import { printAndClose } from "../utils/printWindow";

interface ExpenseItem {
  _id: string;
  expenseId: string;
  reason: string;
  recipientName: string;
  recipientPhone: string;
  amount: number;
  enteredAmount?: number;
  enteredCurrency?: "USD" | "FC";
  amountUSD?: number;
  amountFC?: number;
  exchangeRate?: number;
  paymentMethod: string;
  status: string;
  recordedBy: string;
  createdAt: string;
  updatedAt: string;
  notes?: string;
  validatedBy?: string;
  validatedAt?: string;
  expenseType?: "normal" | "repayment";
  creditorSnapshot?: { name?: string; type?: string };
}

interface ExpensesResponse {
  success: boolean;
  data: ExpenseItem[];
  pagination: {
    page: number;
    limit: number;
    totalRecords: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
  timeframe: {
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
  };
  summary: {
    totalRecords: number;
    totalAmount: number;
    pending: {
      count: number;
      amount: number;
    };
    validated: {
      count: number;
      amount: number;
    };
    rejected: {
      count: number;
      amount: number;
    };
  };
  filtersApplied: {
    status: string;
    paymentMethod: string;
    recordedBy: string;
    search: string;
  };
}

interface UserPermissions {
  isAdmin: boolean;
  canValidate: boolean;
  canEditAll: boolean;
  canDeleteAll: boolean;
  userId: string;
  userName: string;
}

// User interface for role checking
interface User {
  _id: string;
  name: string;
  email: string;
  role: string;
  username?: string;
  permissions?: string[];
}

// Helper function to get today's date in correct format
const getTodayDate = (): string => {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");
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

export default function SortieHistory() {
  const { t } = useTranslation();
  const [expenses, setExpenses] = useState<ExpenseItem[]>([]);
  const [allExpenses, setAllExpenses] = useState<ExpenseItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedExpense, setSelectedExpense] = useState<ExpenseItem | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [showValidationModal, setShowValidationModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [validatingExpense, setValidatingExpense] = useState<ExpenseItem | null>(null);
  const [editingExpense, setEditingExpense] = useState<ExpenseItem | null>(null);
  const [deletingExpense, setDeletingExpense] = useState<ExpenseItem | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({
    reason: "",
    recipientName: "",
    recipientPhone: "",
    amount: "",
    paymentMethod: "cash",
    notes: "",
    updateReason: "",
  });
  const [deleteReason, setDeleteReason] = useState("");
  const [expenseHistory, setExpenseHistory] = useState<ExpenseHistoryEntry[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  // User state for role checking
  const [, setCurrentUser] = useState<User | null>(null);

  // Timeframe state - Updated to match backend query parameters
  const [timeframeType, setTimeframeType] = useState<
    "custom" | "day" | "month" | "year" | "today"
  >("today");
  const [periodSelection, setPeriodSelection] = useState(() => initialPeriodSelection("today"));
  const periodRange = usePeriodRange(periodSelection);
  
  const [queryParams, setQueryParams] = useState({
    from: "",
    to: "",
    date: getTodayDate(),
    year: getCurrentYear().toString(),
    month: getCurrentMonth().split('-')[1],
    status: "",
    paymentMethod: "",
    recordedBy: "",
    search: ""
  });

  const [initialLoad, setInitialLoad] = useState(true);
  const [summaryStats, setSummaryStats] = useState<ExpenseSummaryStats | null>(null);
  const [appliedFilters, setAppliedFilters] = useState<AppliedFilters | null>(null);
  const [timeframeDescription, setTimeframeDescription] = useState<string>("Today");
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState<ExpensesResponse["pagination"] | null>(null);

  // User permissions
  const [userPermissions, setUserPermissions] = useState<UserPermissions>({
    isAdmin: false,
    canValidate: false,
    canEditAll: false,
    canDeleteAll: false,
    userId: "",
    userName: "",
  });

  // Build query string from queryParams
  const buildQueryString = () => {
    const params = new URLSearchParams();
    params.set("page", String(currentPage));
    params.set("limit", "50");
    
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
    if (queryParams.paymentMethod) params.append("paymentMethod", queryParams.paymentMethod);
    if (queryParams.recordedBy) params.append("recordedBy", queryParams.recordedBy);
    if (searchTerm.trim()) params.append("search", searchTerm.trim());
    
    return params.toString();
  };

  // Fetch current user on component mount
  // Latest fetchExpenses for the effect below (its trigger list stays unchanged).
  const fetchExpensesRef = useRef<typeof fetchExpenses>(undefined as unknown as typeof fetchExpenses);
  useEffect(() => {
    fetchCurrentUser();
    fetchUserPermissions();
    fetchExpensesRef.current();
  }, []);

  // Fetch data when query params change
  useEffect(() => {
    if (Object.keys(queryParams).length > 0) {
      fetchExpensesRef.current();
    }
  }, [queryParams, currentPage, searchTerm]);

  useEffect(() => {
    setCurrentPage(1);
  }, [queryParams, searchTerm]);

  useEffect(() => {
    if (!userPermissions.isAdmin || !periodRange) return;
    setTimeframeType("custom");
    setQueryParams((previous) => ({
      ...previous,
      from: periodRange.from,
      to: periodRange.to,
      date: "",
      year: "",
      month: "",
    }));
  }, [periodRange, userPermissions.isAdmin]);

  // Effect to automatically set to today's date when timeframe changes to "day"
  // Latest setSelectedDate for the effect below (its trigger list stays unchanged).
  const setSelectedDateRef = useRef<typeof setSelectedDate>(undefined as unknown as typeof setSelectedDate);
  useEffect(() => {
    if (!initialLoad && timeframeType === "day") {
      const today = getTodayDate();
      setSelectedDateRef.current(today);
    }
  }, [timeframeType, initialLoad]);

  // Effect to enforce day-only view for non-admin users
  useEffect(() => {
    if (!userPermissions.isAdmin && timeframeType !== "day") {
      setTimeframeType("day");
      setQueryParams(prev => ({
        ...prev,
        date: getTodayDate(),
        from: "",
        to: "",
        year: "",
        month: ""
      }));
    }
  }, [timeframeType, userPermissions.isAdmin]);

  // Effect to mark initial load as complete
  useEffect(() => {
    if (expenses.length > 0) {
      setInitialLoad(false);
    }
  }, [expenses]);

  // Fetch current user from API or localStorage
  const fetchCurrentUser = async () => {
    try {
      // Try to get user from localStorage first
      const storedUser = getVerifiedUserRaw();
      if (storedUser) {
        const userData = JSON.parse(storedUser);
        setCurrentUser(userData);
      } else {
        // Fallback to API call
        const res = await fetch(`${serverUrl}/users/me`, {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
          },
        });

        if (res.ok) {
          const userData = await res.json();
          setCurrentUser(userData);
        }
      }
    } catch (error) {
      console.error("Error fetching user data:", error);
    }
  };

  const fetchUserPermissions = async () => {
    try {
      const res = await fetch(`${serverUrl}/expenses/permissions/me`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
        },
      });

      if (res.ok) {
        const data = await res.json();
        setUserPermissions(data);
      }
    } catch (error) {
      console.error("Error fetching user permissions:", error);
    }
  };

  const fetchExpenses = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const queryString = buildQueryString();
      const url = `${serverUrl}/expenses${queryString ? `?${queryString}` : ''}`;
      
      console.log("Fetching expenses from:", url);
      
      const res = await fetch(url, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
        },
      });

      if (res.ok) {
        const data: ExpensesResponse = await res.json();
        
        if (data.success && data.data && Array.isArray(data.data)) {
          const fetchedExpenses = data.data;
          
          console.log(`Fetched ${fetchedExpenses.length} expenses from API`);
          console.log("Timeframe metadata:", data.timeframe);
          console.log("Summary stats:", data.summary);
          
          // Sort expenses by date - newest first
          const sortedExpenses = fetchedExpenses.sort(
            (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );

          setExpenses(sortedExpenses);
          setAllExpenses(sortedExpenses);
          setPagination(data.pagination || null);
          
          // Update metadata
          setTimeframeDescription(data.timeframe.description);
          setSummaryStats(data.summary);
          setAppliedFilters(data.filtersApplied);
          
        } else {
          console.warn("Unexpected expenses data structure:", data);
          setError(t("entryHistory.unexpectedFormat"));
        }
      } else {
        console.error("Expenses fetch failed:", res.status);
        const errorData = await res.json().catch(() => ({}));
        setError(serverMessage(errorData.error || errorData.message, t("sortieHistory.loadFailedStatus", { status: res.status })));
      }
    } catch (error) {
      console.error("Error loading expenses:", error);
      setError(t("sortieHistory.loadFailed"));
    } finally {
      setLoading(false);
    }
  };
  fetchExpensesRef.current = fetchExpenses;

  const getTimeframeLabel = () => {
    if (!userPermissions.isAdmin) {
      return t("period.presets.today");
    }
    
    return timeframeDescription;
  };

  const handleQueryParamChange = (key: keyof typeof queryParams, value: string) => {
    setQueryParams(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const clearAllFilters = () => {
    setQueryParams({
      from: "",
      to: "",
      date: getTodayDate(),
      year: getCurrentYear().toString(),
      month: getCurrentMonth().split('-')[1],
      status: "",
      paymentMethod: "",
      recordedBy: "",
      search: ""
    });
    setTimeframeType("today");
    setPeriodSelection(initialPeriodSelection("today"));
    setSearchTerm("");
    setShowAdvancedFilters(false);
  };

  // Helper function to set selected date (for day view)
  const setSelectedDate = (date: string) => {
    handleQueryParamChange("date", date);
  };
  setSelectedDateRef.current = setSelectedDate;

  const formatDate = (dateString: string) => formatDateTimeGMT2(dateString);

  const formatCurrency = (amount: number) => formatUSD(amount);

  const formatOriginalAmount = (expense: ExpenseItem) =>
    expense.enteredCurrency === "FC"
      ? `${(expense.enteredAmount ?? expense.amountFC ?? 0).toLocaleString(activeLocale())} FC (${t("entryHistory.equiv")} ${formatCurrency(expense.amountUSD ?? expense.amount)})`
      : formatCurrency(expense.enteredAmount ?? expense.amount);

  const filteredExpenses = expenses.filter(
    (expense) =>
      expense.expenseId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      expense.reason.toLowerCase().includes(searchTerm.toLowerCase()) ||
      expense.recipientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      expense.recipientPhone.includes(searchTerm) ||
      expense.recordedBy.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const viewExpenseDetails = (expense: ExpenseItem) => {
    setSelectedExpense(expense);
    setShowModal(true);
    setError(null);
  };

  const openValidationModal = (expense: ExpenseItem) => {
    setValidatingExpense(expense);
    setShowValidationModal(true);
    setError(null);
  };

  const openEditModal = (expense: ExpenseItem) => {
    setEditingExpense(expense);
    setEditForm({
      reason: expense.reason,
      recipientName: expense.recipientName,
      recipientPhone: expense.recipientPhone,
      amount: expense.amount.toString(),
      paymentMethod: expense.paymentMethod,
      notes: expense.notes || "",
      updateReason: "",
    });
    setShowEditModal(true);
    setError(null);
  };

  const openDeleteModal = (expense: ExpenseItem) => {
    setDeletingExpense(expense);
    setDeleteReason("");
    setShowDeleteModal(true);
    setError(null);
  };

  const closeValidationModal = () => {
    setShowValidationModal(false);
    setValidatingExpense(null);
    setError(null);
  };

  const closeEditModal = () => {
    setShowEditModal(false);
    setEditingExpense(null);
    setEditForm({
      reason: "",
      recipientName: "",
      recipientPhone: "",
      amount: "",
      paymentMethod: "cash",
      notes: "",
      updateReason: "",
    });
    setError(null);
  };

  const closeDeleteModal = () => {
    setShowDeleteModal(false);
    setDeletingExpense(null);
    setDeleteReason("");
    setError(null);
  };

  const closeHistoryModal = () => {
    setShowHistoryModal(false);
    setExpenseHistory([]);
  };

  const fetchExpenseHistory = async (expenseId: string) => {
    try {
      setHistoryLoading(true);
      const res = await fetch(
        `${serverUrl}/expenses/${expenseId}/history`,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
          },
        }
      );

      if (res.ok) {
        const data = await res.json();
        setExpenseHistory(data.history || []);
        setShowHistoryModal(true);
      } else {
        setError(t("sortieHistory.historyFailed"));
      }
    } catch (error) {
      console.error("Error fetching expense history:", error);
      setError(t("sortieHistory.historyFailed"));
    } finally {
      setHistoryLoading(false);
    }
  };

  const validateExpense = async (isValid: boolean) => {
    if (!validatingExpense) return;

    setActionLoading(`validating-${validatingExpense._id}`);
    setError(null);

    try {
      if (!isValid) {
        const response = await fetch(
          `${serverUrl}/expenses/${validatingExpense._id}`,
          {
            method: "DELETE",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
            },
          }
        );

        if (response.ok) {
          setMessage(t("sortieHistory.rejected"));
          closeValidationModal();

          // Wait 3 seconds before refreshing
          setTimeout(() => {
            fetchExpenses();
            setMessage(null);
          }, 3000);
        } else {
          const errorData = await response.json().catch(() => ({}));
          setError(serverMessage(errorData.error, t("sortieHistory.deleteFailed")));
        }
      } else {
        const response = await fetch(
          `${serverUrl}/expenses/${
            validatingExpense._id
          }/validate`,
          {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
            },
            body: JSON.stringify({
              validatedBy: userPermissions.userName || "admin",
            }),
          }
        );

        if (response.ok) {
          setMessage(t("sortieHistory.validated"));
          closeValidationModal();
          fetchExpenses();
        } else {
          const errorData = await response.json().catch(() => ({}));
          setError(serverMessage(errorData.error, t("sortieHistory.validateFailed")));
        }
      }
    } catch (error) {
      console.error("Error processing expense:", error);
      setError(t("sortieHistory.processFailed"));
    } finally {
      setActionLoading(null);
    }
  };

  const handleEditExpense = async () => {
    if (!editingExpense) return;

    setActionLoading(`editing-${editingExpense._id}`);
    setError(null);

    try {
      // Check if update reason is required (for validated/rejected expenses)
      const requiresUpdateReason = editingExpense.status !== "pending" && userPermissions.isAdmin;
      if (requiresUpdateReason && !editForm.updateReason.trim()) {
        setError(t("sortieHistory.updateReasonRequired"));
        setActionLoading(null);
        return;
      }

      const response = await fetch(
        `${serverUrl}/expenses/${editingExpense._id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
          },
          body: JSON.stringify({
            reason: editForm.reason,
            recipientName: editForm.recipientName,
            recipientPhone: editForm.recipientPhone,
            amount: parseFloat(editForm.amount),
            paymentMethod: editForm.paymentMethod,
            notes: editForm.notes,
            updateReason: editForm.updateReason,
          }),
        }
      );

      if (response.ok) {
        const updatedExpense = await response.json();
        setMessage(t("sortieHistory.updated"));
        closeEditModal();
        
        // Update the expense in the local state
        setExpenses(expenses.map(exp => 
          exp._id === editingExpense._id ? { ...exp, ...updatedExpense } : exp
        ));
        setAllExpenses(allExpenses.map(exp => 
          exp._id === editingExpense._id ? { ...exp, ...updatedExpense } : exp
        ));
        
        // Also update selected expense if it's the same one
        if (selectedExpense && selectedExpense._id === editingExpense._id) {
          setSelectedExpense({ ...selectedExpense, ...updatedExpense });
        }
      } else {
        const errorData = await response.json().catch(() => ({}));
        setError(serverMessage(errorData.error, t("sortieHistory.updateFailed")));
      }
    } catch (error) {
      console.error("Error updating expense:", error);
      setError(t("sortieHistory.updateFailed"));
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeleteExpense = async () => {
    if (!deletingExpense) return;

    setActionLoading(`deleting-${deletingExpense._id}`);
    setError(null);

    try {
      let endpoint = `${serverUrl}/expenses/${deletingExpense._id}`;
      
      // If expense is not pending and user is admin, use admin delete endpoint
      if (deletingExpense.status !== "pending" && userPermissions.isAdmin) {
        endpoint = `${serverUrl}/expenses/${deletingExpense._id}/admin`;
      }

      const response = await fetch(endpoint, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
        },
      });

      if (response.ok) {
        const result = await response.json();
        setMessage(serverMessage(result.message, t("sortieHistory.deleted")));
        closeDeleteModal();
        
        // Remove the expense from the local state
        setExpenses(expenses.filter(exp => exp._id !== deletingExpense._id));
        setAllExpenses(allExpenses.filter(exp => exp._id !== deletingExpense._id));
        
        // Clear selected expense if it's the same one
        if (selectedExpense && selectedExpense._id === deletingExpense._id) {
          setSelectedExpense(null);
          setShowModal(false);
        }
      } else {
        const errorData = await response.json().catch(() => ({}));
        setError(serverMessage(errorData.error, t("sortieHistory.deleteFailed")));
      }
    } catch (error) {
      console.error("Error deleting expense:", error);
      setError(t("sortieHistory.deleteFailed"));
    } finally {
      setActionLoading(null);
    }
  };

  // Print function for expense receipt
  const esc = (value: unknown) => String(value ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c] as string));
  const L = (key: string) => esc(t(`receipt.${key}`));
  const printExpenseReceipt = (expense: ExpenseItem) => {
    const printWindow = window.open("", "_blank", "width=320,height=600");
    if (printWindow) {
      // Format the amount directly for the print window
      const formattedAmount = expense.enteredCurrency === "FC"
        ? `${(expense.enteredAmount ?? expense.amountFC ?? 0).toLocaleString(activeLocale())} FC (${t("entryHistory.equiv")} $${(expense.amountUSD ?? expense.amount).toFixed(2)})`
        : formatUSD(expense.enteredAmount ?? expense.amount);

      const formattedDate = formatDateTimeGMT2(expense.createdAt);
      const validatedDate = expense.validatedAt
        ? formatDateTimeGMT2(expense.validatedAt)
        : formattedDate;

      printWindow.document.write(`
<html>
  <head>
    <title>${L("expenseReceiptTitle")}</title>
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
        font-size: 13px;
        font-weight: bold;
        line-height: 1.1;
        width: 72mm;
        background-color: white;
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
        display: flex;
        justify-content: center;
      }
      .receipt-container { 
        width: 70mm;
        margin: 0 auto;
        padding: 0.5mm;
        border: none;
        text-align: center;
      }
      .header { 
        text-align: center; 
        margin-bottom: 1mm; 
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
        margin: 1mm 0;
        padding: 1mm;
        background-color: #f8f8f8;
        border-left: 3px solid #000;
      }
      .receipt-title {
        font-size: 13px;
        font-weight: bold;
        margin: 1mm 0;
        text-transform: uppercase;
        background-color: #000;
        color: white;
        padding: 1mm;
        border-radius: 2px;
      }
      .expense-details {
        margin: 1mm 0;
        padding: 1mm;
        background-color: #fafafa;
        border: 1px solid #eee;
      }
      .detail-row { 
        display: flex;
        justify-content: space-between;
        margin-bottom: 0.5mm;
        padding: 0 1mm;
        border-bottom: 1px dotted #ddd;
      }
      .detail-label {
        text-align: left;
        font-weight: bold;
        font-size: 12px;
        flex: 1;
      }
      .detail-value {
        text-align: right;
        font-weight: bold;
        font-size: 12px;
        flex: 1;
      }
      .total-section { 
        font-weight: bold; 
        margin-top: 1mm;
        padding: 1mm;
        background-color: #f0f0f0;
        border: 1px solid #ddd;
        border-radius: 3px;
      }
      .total-row {
        display: flex;
        justify-content: space-between;
        margin-bottom: 0.3mm;
        font-size: 13px;
        padding: 0 1mm;
      }
      .payment-method {
        text-transform: uppercase;
        font-weight: bold;
        font-size: 13px;
        color: #000;
      }
      .footer { 
        text-align: center; 
        margin-top: 1mm; 
        font-size: 11px;
        font-weight: bold;
        padding: 1mm;
        background-color: #f8f8f8;
        border-top: 1px dashed #000;
      }
      .validation-info {
        margin-top: 1mm;
        text-align: center;
        font-weight: bold;
        font-size: 12px;
        padding: 1mm;
        background-color: #e8f5e8;
        border: 1px solid #4caf50;
        border-radius: 2px;
      }
      .section-divider {
        height: 2px;
        background: linear-gradient(to right, transparent, #000, transparent);
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
      @media print {
        @page {
          margin: 0 !important;
          size: 72mm auto !important;
        }
        body { 
          margin: 0 !important; 
          padding: 0 !important; 
          width: 72mm !important;
          font-size: 13px !important;
          background: white !important;
          font-weight: bold !important;
          height: auto !important;
          overflow: hidden !important;
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
          display: flex !important;
          justify-content: center !important;
        }
        .receipt-container { 
          border: none !important; 
          box-shadow: none !important; 
          margin: 0 auto !important;
          padding: 0.5mm !important;
          width: 70mm !important;
          page-break-after: avoid !important;
          page-break-inside: avoid !important;
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
      <div class="header">
        <div class="shop-name"><strong>ETS. DIEU MERCI</strong></div>
        <div class="shop-details"><strong>Av Manono Coin Munama N°39, C. Kenya, Lubumbashi</strong></div>
        <div class="shop-details">${L("tel")}: <strong>+243 977 771 421 / +243 853 549 102</strong></div>
        <div class="shop-details"><strong>RCCM: 14-A-017885</strong></div>
      </div>
      
      <div class="section-divider"></div>
      
      <div class="receipt-info">
        <div class="shop-details">${L("date")}: <strong>${formattedDate}</strong></div>
        <div class="shop-details">${L("receiptNo")}: <strong>${esc(expense.expenseId)}</strong></div>
      </div>
      
      <div class="receipt-title">${L("expenseReceipt")}</div>
      
      <div class="expense-details">
        <div class="detail-row">
          <div class="detail-label"><strong>${L("reason")}:</strong></div>
          <div class="detail-value"><strong>${esc(expense.reason.toUpperCase())}</strong></div>
        </div>
        <div class="detail-row">
          <div class="detail-label"><strong>${L("recipient")}:</strong></div>
          <div class="detail-value"><strong>${esc(expense.recipientName.toUpperCase())}</strong></div>
        </div>
        <div class="detail-row">
          <div class="detail-label"><strong>${L("phone")}:</strong></div>
          <div class="detail-value"><strong>${esc(expense.recipientPhone)}</strong></div>
        </div>
        <div class="detail-row">
          <div class="detail-label"><strong>${L("amount")}:</strong></div>
          <div class="detail-value"><strong>${formattedAmount}</strong></div>
        </div>
        <div class="detail-row">
          <div class="detail-label"><strong>${L("payment")}:</strong></div>
          <div class="detail-value"><strong>${esc(uiPaymentLabel(t, expense.paymentMethod).toUpperCase())}</strong></div>
        </div>
      </div>
      
      <div class="total-section">
        <div class="total-row">
          <div><strong>${L("totalAmount")}:</strong></div>
          <div><strong>${formattedAmount}</strong></div>
        </div>
      </div>
      
      <div class="validation-info">
        ${L("validatedBy")}: <strong>${esc(expense.validatedBy || "ADMIN")}</strong><br>
        ${L("on")}: <strong>${validatedDate}</strong>
      </div>
      
      ${festiveGreetingHtml()}
      <div class="footer">
        <div class="thank-you"><strong>${L("expenseStub")}</strong></div>
        <div class="warning"><strong>${L("keepStub")}</strong></div>
        <div class="warning">${L("receiptNo")}: <strong>${esc(expense.expenseId)}</strong></div>
        <div class="warning">${L("date")}: <strong>${formattedDate}</strong></div>
      </div>
      
      <!-- PAPER CUT INDICATOR -->
      <div class="cut-line">
        ✄ ────────────────────────── ✄
      </div>
    </div>
  </body>
</html>
`);
      printWindow.document.close();
      printAndClose(printWindow);
    }
  };

  // Check if user can edit this expense
  const canEditExpense = (expense: ExpenseItem): boolean => {
    if (userPermissions.isAdmin || userPermissions.canEditAll) {
      return true; // Admin can edit any expense
    }
    
    // Regular users can only edit their own pending expenses
    if (expense.status === "pending" && expense.recordedBy === userPermissions.userId) {
      return true;
    }
    
    return false;
  };

  // Check if user can delete this expense
  const canDeleteExpense = (expense: ExpenseItem): boolean => {
    if (userPermissions.isAdmin || userPermissions.canDeleteAll) {
      return true; // Admin can delete any expense
    }
    
    // Regular users can only delete their own pending expenses
    if (expense.status === "pending" && expense.recordedBy === userPermissions.userId) {
      return true;
    }
    
    return false;
  };

  // Check if update reason is required for editing
  const requiresUpdateReason = (expense: ExpenseItem | null): boolean => {
    if (!expense) return false;
    return expense.status !== "pending" && (userPermissions.isAdmin || userPermissions.canEditAll);
  };

  const statusLabel = (status?: string) => t(`expenses.status.${status === "validated" || status === "rejected" ? status : "pending"}`);
  const statusBadge = (status?: string) => (
    <span className={`badge ${status === "validated" ? "badge-success" : status === "rejected" ? "badge-danger" : "badge-warning"}`}>
      {statusLabel(status)}
    </span>
  );
  const filterValue = (value?: string) => (!value || value === "none" || value === "all" ? t("common.all") : value);

  // Summary Statistics component - Only visible to admins
  const SummaryStats = () => {
    // Double-guard: API permission AND localStorage role must both confirm admin
    const localIsAdmin = (() => {
      try {
        const raw = getVerifiedUserRaw();
        return raw ? JSON.parse(raw).role === "admin" : false;
      } catch { return false; }
    })();
    if (!summaryStats || !userPermissions.isAdmin || !localIsAdmin) return null;
    const average = summaryStats.totalRecords > 0 ? summaryStats.totalAmount / summaryStats.totalRecords : 0;
    const rate = summaryStats.totalRecords > 0 ? (summaryStats.validated.count / summaryStats.totalRecords) * 100 : 0;

    return (
      <section aria-labelledby="expenses-summary-title" className="grid gap-3">
        <h2 id="expenses-summary-title" className="eyebrow">
          <Shield aria-hidden="true" />
          {t("sortieHistory.summaryTitle")}
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-7 gap-3">
          <div className="metric-card">
            <span className="metric-label flex items-center gap-1.5"><FileText className="w-4 h-4 text-gray-500" aria-hidden="true" />{t("sortieHistory.kpi.expenses")}</span>
            <span className="metric-value num">{formatNumber(summaryStats.totalRecords, 0)}</span>
            <span className="text-xs text-gray-500 num">{formatCurrency(summaryStats.totalAmount)}</span>
          </div>
          <div className="metric-card">
            <span className="metric-label flex items-center gap-1.5"><CheckCircle className="w-4 h-4 text-green-600" aria-hidden="true" />{t("sortieHistory.kpi.validated")}</span>
            <span className="metric-value num text-green-700">{formatNumber(summaryStats.validated.count, 0)}</span>
            <span className="text-xs text-gray-500 num">{formatCurrency(summaryStats.validated.amount)}</span>
          </div>
          <div className="metric-card">
            <span className="metric-label flex items-center gap-1.5"><AlertCircle className="w-4 h-4 text-amber-600" aria-hidden="true" />{t("sortieHistory.kpi.pending")}</span>
            <span className="metric-value num text-amber-700">{formatNumber(summaryStats.pending.count, 0)}</span>
            <span className="text-xs text-gray-500 num">{formatCurrency(summaryStats.pending.amount)}</span>
          </div>
          <div className="metric-card">
            <span className="metric-label flex items-center gap-1.5"><XCircle className="w-4 h-4 text-red-600" aria-hidden="true" />{t("sortieHistory.kpi.rejected")}</span>
            <span className="metric-value num text-red-700">{formatNumber(summaryStats.rejected?.count || 0, 0)}</span>
            <span className="text-xs text-gray-500 num">{formatCurrency(summaryStats.rejected?.amount || 0)}</span>
          </div>
          <div className="metric-card">
            <span className="metric-label">{t("sortieHistory.kpi.average")}</span>
            <span className="metric-value num">{formatCurrency(average)}</span>
          </div>
          <div className="metric-card">
            <span className="metric-label">{t("sortieHistory.kpi.validationRate")}</span>
            <span className="metric-value num text-green-700">{formatPercent(rate)}</span>
          </div>
          <div className="metric-card">
            <span className="metric-label">{t("sortieHistory.kpi.shown")}</span>
            <span className="metric-value num">{filteredExpenses.length} / {expenses.length}</span>
            <span className="text-xs text-gray-500 num">{t("sortieHistory.kpi.updated")} {formatTimeGMT2(new Date())}</span>
          </div>
        </div>
      </section>
    );
  };

  const busy = (kind: string, id: string) => actionLoading === `${kind}-${id}`;

  return (
    <div className="page space-y-4">
      <PageHeader
        eyebrow={t("nav.sections.history")}
        icon={<History aria-hidden="true" />}
        title={t("sortieHistory.title")}
        description={<>
          {userPermissions.isAdmin ? t("sortieHistory.subtitleAdmin") : t("sortieHistory.subtitleUser")}
          {!userPermissions.isAdmin && <span className="badge badge-info ml-2"><Lock aria-hidden="true" />{t("sortieHistory.limitedBadge")}</span>}
        </>}
        actions={<>
          <div className="input-group flex-1 sm:flex-none sm:w-72">
            <Search aria-hidden="true" />
            <input aria-label={t("sortieHistory.searchLabel")} type="search" placeholder={t("sortieHistory.searchPlaceholder")}
              className="input" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
          </div>
          <button type="button" onClick={fetchExpenses} disabled={loading} className="btn btn-secondary">
            <RefreshCw className={loading ? "animate-spin" : ""} aria-hidden="true" />
            {t("common.refresh")}
          </button>
        </>}
      />

      <SummaryStats />

      <section className="card" aria-labelledby="expenses-period-title">
        <div className="card-header">
          <h2 id="expenses-period-title" className="section-title flex items-center gap-2 min-w-0">
            <Calendar className="w-4 h-4 text-gray-500 shrink-0" aria-hidden="true" />
            <span className="truncate">{t("sortieHistory.period")} · {userPermissions.isAdmin && periodRange ? describePeriod(periodRange) : getTimeframeLabel()}</span>
          </h2>
          <button type="button" onClick={clearAllFilters} className="btn btn-ghost btn-sm">
            <RefreshCw aria-hidden="true" />
            {t("sortieHistory.reset")}
          </button>
        </div>
        <div className="card-body empty:hidden">
          {userPermissions.isAdmin && <PeriodPicker value={periodSelection} onChange={setPeriodSelection} range={periodRange} />}

          {userPermissions.isAdmin && (
            <div className="mt-3">
              <button type="button" onClick={() => setShowAdvancedFilters(!showAdvancedFilters)} aria-expanded={showAdvancedFilters} className="btn btn-ghost btn-sm -ml-3 text-blue-700">
                {showAdvancedFilters ? t("sortieHistory.advancedHide") : t("sortieHistory.advancedShow")}
                <ChevronDown className={`w-4 h-4 transition-transform ${showAdvancedFilters ? "rotate-180" : ""}`} aria-hidden="true" />
              </button>
              {showAdvancedFilters && (
                <div className="mt-2 grid grid-cols-1 sm:grid-cols-3 gap-3 p-3 bg-gray-50 border border-gray-200 rounded-xl">
                  <label className="field"><span className="field-label">{t("common.status")}</span>
                    <select value={queryParams.status} onChange={(event) => handleQueryParamChange("status", event.target.value)} className="input">
                      <option value="">{t("sortieHistory.allStatuses")}</option>
                      {(["pending", "validated", "rejected"] as const).map((status) => <option key={status} value={status}>{statusLabel(status)}</option>)}
                    </select>
                  </label>
                  <label className="field"><span className="field-label">{t("sortie.paymentMethod")}</span>
                    <select value={queryParams.paymentMethod} onChange={(event) => handleQueryParamChange("paymentMethod", event.target.value)} className="input">
                      <option value="">{t("common.all")}</option>
                      {(["cash", "card", "transfer", "other"] as const).map((method) => <option key={method} value={method}>{uiPaymentLabel(t, method)}</option>)}
                    </select>
                  </label>
                  <label className="field"><span className="field-label">{t("sortie.recordedBy")}</span>
                    <input type="text" value={queryParams.recordedBy} placeholder={t("sortieHistory.recordedByPlaceholder")} onChange={(event) => handleQueryParamChange("recordedBy", event.target.value)} className="input" />
                  </label>
                </div>
              )}
            </div>
          )}

          {appliedFilters && (
            <p className="mt-3 text-sm text-gray-600">
              <span className="font-medium">{t("sortieHistory.appliedFilters")}</span>{" "}
              {t("sortieHistory.filterStatus", { value: appliedFilters.status && appliedFilters.status !== "all" && appliedFilters.status !== "none" ? statusLabel(appliedFilters.status) : t("common.all") })}
              {" · "}{t("sortieHistory.filterPayment", { value: appliedFilters.paymentMethod && appliedFilters.paymentMethod !== "all" && appliedFilters.paymentMethod !== "none" ? uiPaymentLabel(t, appliedFilters.paymentMethod) : t("common.all") })}
              {appliedFilters.recordedBy !== "none" && <>{" · "}{t("sortieHistory.filterRecorder", { value: filterValue(appliedFilters.recordedBy) })}</>}
              {appliedFilters.search !== "none" && <>{" · "}{t("sortieHistory.filterSearch", { value: filterValue(appliedFilters.search) })}</>}
            </p>
          )}
        </div>
      </section>

      {!userPermissions.isAdmin && (
        <div className="alert alert-warning" role="note">
          <AlertCircle aria-hidden="true" />
          <div>
            <h3 className="text-sm font-semibold">{t("sortieHistory.limitedTitle")}</h3>
            <p className="mt-0.5 text-sm">{t("sortieHistory.limitedBody")}</p>
          </div>
        </div>
      )}

      {message && (
        <div className="alert alert-success" role="status">
          <CheckCircle className="w-5 h-5" aria-hidden="true" />
          <span className="flex-1">{message}</span>
          <button type="button" aria-label={t("common.closeMessage")} onClick={() => setMessage(null)} className="btn btn-ghost btn-icon btn-sm -my-1 -mr-1"><X aria-hidden="true" /></button>
        </div>
      )}
      {error && (
        <div className="alert alert-danger" role="alert">
          <AlertTriangle className="w-5 h-5" aria-hidden="true" />
          <span className="flex-1">{error}</span>
          <button type="button" aria-label={t("common.closeMessage")} onClick={() => setError(null)} className="btn btn-ghost btn-icon btn-sm -my-1 -mr-1"><X aria-hidden="true" /></button>
        </div>
      )}

      <section className="card" aria-labelledby="expenses-list-title">
        <div className="card-header">
          <h2 id="expenses-list-title" className="section-title flex items-center gap-2">
            <FileText className="w-4 h-4 text-gray-500" aria-hidden="true" />
            {userPermissions.isAdmin ? t("sortieHistory.listAdmin") : t("sortieHistory.listUser")}
            <span className="badge num">{filteredExpenses.length}</span>
          </h2>
        </div>
        {loading ? (
          <LoadingState label={t("sortieHistory.loading")} />
        ) : filteredExpenses.length === 0 ? (
          <EmptyState title={t("sortieHistory.empty")} icon={<FileText aria-hidden="true" />}>
            {t("entryHistory.noResultPeriod")}
          </EmptyState>
        ) : (
          <ResponsiveTable className="report-table" aria-label={t("sortieHistory.title")}>
            <thead>
              <tr>
                <th className="is-text">{t("sortieHistory.col.id")}</th>
                <th className="is-text">{t("sortieHistory.col.reason")}</th>
                <th className="is-text">{t("sortieHistory.col.recipient")}</th>
                <th className="is-num">{t("sortie.amount")}</th>
                <th className="is-text">{t("entryHistory.col.payment")}</th>
                <th className="is-text">{t("common.status")}</th>
                <th className="is-text">{t("common.date")}</th>
                <th className="is-text is-actions">{t("common.actions")}</th>
              </tr>
            </thead>
            <tbody>
              {filteredExpenses.map((expense) => (
                <tr key={expense._id}>
                  <td className="is-text mono whitespace-nowrap"><strong>{expense.expenseId}</strong></td>
                  <td className="is-text">
                    {expense.reason}
                    {expense.expenseType === "repayment" && <div><span className="badge badge-warning mt-1">{t("sortieHistory.repaymentOf", { name: expense.creditorSnapshot?.name || t("sortie.creditor") })}</span></div>}
                  </td>
                  <td className="is-text">
                    <div className="text-gray-900">{expense.recipientName}</div>
                    <div className="text-xs text-gray-500 whitespace-nowrap">{expense.recipientPhone}</div>
                  </td>
                  <td className="num is-num whitespace-nowrap"><strong>{formatOriginalAmount(expense)}</strong></td>
                  <td className="is-text"><span className="badge">{uiPaymentLabel(t, expense.paymentMethod)}</span></td>
                  <td className="is-text">{statusBadge(expense.status)}</td>
                  <td className="is-text whitespace-nowrap text-gray-500">{formatDate(expense.createdAt)}</td>
                  <td className="is-text is-actions">
                    <div className="flex gap-1 whitespace-nowrap">
                      <button type="button" aria-label={t("entryHistory.viewDetails")} title={t("entryHistory.viewDetails")} onClick={() => viewExpenseDetails(expense)} className="btn btn-ghost btn-sm">
                        <Eye aria-hidden="true" /><span className="ui-action-label">{t("common.details")}</span>
                      </button>
                      <button type="button" aria-label={t("sortieHistory.viewHistory")} title={t("sortieHistory.viewHistory")} onClick={() => fetchExpenseHistory(expense._id)} className="btn btn-ghost btn-sm">
                        <History aria-hidden="true" /><span className="ui-action-label">{t("sortieHistory.history")}</span>
                      </button>
                      {userPermissions.canValidate && expense.status !== "validated" && expense.status !== "rejected" && (
                        <>
                          <button type="button" aria-label={t("sortieHistory.validateExpense")} title={t("sortieHistory.validateExpense")} onClick={() => openValidationModal(expense)} disabled={busy("validating", expense._id)} className="btn btn-ghost btn-sm text-green-700">
                            <CheckCircle aria-hidden="true" /><span className="ui-action-label">{t("sortieHistory.validate")}</span>
                          </button>
                          <button type="button" aria-label={t("sortieHistory.rejectExpense")} title={t("sortieHistory.rejectExpense")} onClick={() => openValidationModal(expense)} disabled={busy("validating", expense._id)} className="btn btn-ghost btn-sm text-red-600">
                            <XCircle aria-hidden="true" /><span className="ui-action-label">{t("sortieHistory.reject")}</span>
                          </button>
                        </>
                      )}
                      {canEditExpense(expense) && (
                        <button type="button" aria-label={t("sortieHistory.editExpense")} title={t("sortieHistory.editExpense")} onClick={() => openEditModal(expense)} className="btn btn-ghost btn-sm">
                          <Edit aria-hidden="true" /><span className="ui-action-label">{t("common.edit")}</span>
                        </button>
                      )}
                      {canDeleteExpense(expense) && (
                        <button type="button" aria-label={t("sortieHistory.deleteExpense")} title={t("sortieHistory.deleteExpense")} onClick={() => openDeleteModal(expense)} className="btn btn-ghost btn-sm text-red-600">
                          <Trash2 aria-hidden="true" /><span className="ui-action-label">{t("common.delete")}</span>
                        </button>
                      )}
                      {expense.status === "validated" && (
                        <button type="button" aria-label={t("entryHistory.printReceipt")} title={t("entryHistory.printReceipt")} onClick={() => printExpenseReceipt(expense)} className="btn btn-ghost btn-sm">
                          <Printer aria-hidden="true" /><span className="ui-action-label">{t("common.print")}</span>
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </ResponsiveTable>
        )}
      </section>

      {pagination && pagination.totalPages > 1 && (
        <nav className="card flex flex-wrap items-center justify-between gap-3 px-4 py-3" aria-label={t("sortieHistory.pagination")}>
          <span className="text-sm text-gray-600 num">
            {t("common.page", { page: pagination.page, pages: pagination.totalPages })} · {t("sortieHistory.recordCount", { count: pagination.totalRecords })}
          </span>
          <div className="flex gap-2">
            <button type="button" disabled={!pagination.hasPreviousPage} onClick={() => setCurrentPage((page) => Math.max(1, page - 1))} className="btn btn-secondary btn-sm">{t("common.previous")}</button>
            <button type="button" disabled={!pagination.hasNextPage} onClick={() => setCurrentPage((page) => page + 1)} className="btn btn-secondary btn-sm">{t("common.next")}</button>
          </div>
        </nav>
      )}

      {showModal && selectedExpense && (
        <Dialog label={t("sortieHistory.detailsTitle")} onClose={() => setShowModal(false)}>
          <div className="dialog-panel max-w-2xl">
            <header className="dialog-head">
              <div>
                <h3 className="dialog-title">{t("sortieHistory.detailsTitle")}</h3>
                <p className="dialog-subtitle mono">{selectedExpense.expenseId}</p>
              </div>
              <button type="button" aria-label={t("common.close")} onClick={() => setShowModal(false)} className="btn btn-ghost btn-icon btn-sm"><X aria-hidden="true" /></button>
            </header>
            <div className="dialog-body space-y-4">
              <dl className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
                <div><dt className="text-gray-500">{t("common.date")}</dt><dd className="font-medium">{formatDate(selectedExpense.createdAt)}</dd></div>
                <div><dt className="text-gray-500">{t("sortie.paymentMethod")}</dt><dd className="font-medium">{uiPaymentLabel(t, selectedExpense.paymentMethod)}</dd></div>
                <div><dt className="text-gray-500">{t("common.status")}</dt><dd>{statusBadge(selectedExpense.status)}</dd></div>
                <div><dt className="text-gray-500">{t("sortie.recordedBy")}</dt><dd className="font-medium">{selectedExpense.recordedBy}</dd></div>
              </dl>
              <section className="form-section">
                <h4 className="section-title flex items-center gap-2"><FileText className="w-4 h-4" aria-hidden="true" />{t("sortieHistory.detailsTitle")}</h4>
                <dl className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
                  <div className="sm:col-span-2"><dt className="text-gray-500">{t("sortieHistory.col.reason")}</dt><dd className="font-medium">{selectedExpense.reason}</dd></div>
                  <div><dt className="text-gray-500">{t("sortie.amount")}</dt><dd className="text-lg font-semibold num">{formatOriginalAmount(selectedExpense)}</dd></div>
                </dl>
              </section>
              <section className="form-section">
                <h4 className="section-title flex items-center gap-2"><User className="w-4 h-4" aria-hidden="true" />{t("sortieHistory.recipientInfo")}</h4>
                <dl className="grid grid-cols-2 gap-3 text-sm">
                  <div><dt className="text-gray-500">{t("entryHistory.name")}</dt><dd className="font-medium">{selectedExpense.recipientName}</dd></div>
                  <div><dt className="text-gray-500">{t("entryHistory.phone")}</dt><dd className="font-medium">{selectedExpense.recipientPhone}</dd></div>
                </dl>
              </section>
              {selectedExpense.notes && (
                <section className="form-section">
                  <h4 className="section-title">{t("sortie.notes")}</h4>
                  <p className="text-sm text-gray-900 whitespace-pre-line">{selectedExpense.notes}</p>
                </section>
              )}
            </div>
            <footer className="dialog-foot flex-wrap">
              <button type="button" onClick={() => setShowModal(false)} className="btn btn-secondary">{t("common.close")}</button>
              <button type="button" onClick={() => fetchExpenseHistory(selectedExpense._id)} className="btn btn-secondary"><History aria-hidden="true" />{t("sortieHistory.history")}</button>
              {canDeleteExpense(selectedExpense) && <button type="button" onClick={() => openDeleteModal(selectedExpense)} className="btn btn-secondary text-red-600"><Trash2 aria-hidden="true" />{t("common.delete")}</button>}
              {canEditExpense(selectedExpense) && <button type="button" onClick={() => openEditModal(selectedExpense)} className="btn btn-secondary"><Edit aria-hidden="true" />{t("common.edit")}</button>}
              {userPermissions.canValidate && selectedExpense.status !== "validated" && selectedExpense.status !== "rejected" && (
                <button type="button" onClick={() => openValidationModal(selectedExpense)} className="btn btn-primary"><CheckCircle aria-hidden="true" />{t("sortieHistory.validateOrReject")}</button>
              )}
              {selectedExpense.status === "validated" && <button type="button" onClick={() => printExpenseReceipt(selectedExpense)} className="btn btn-primary"><Printer aria-hidden="true" />{t("entryHistory.printReceipt")}</button>}
            </footer>
          </div>
        </Dialog>
      )}

      {showValidationModal && validatingExpense && (
        <Dialog label={t("sortieHistory.validationTitle")} onClose={closeValidationModal}>
          <div className="dialog-panel max-w-md">
            <header className="dialog-head">
              <h3 className="dialog-title">{t("sortieHistory.validationTitle")}</h3>
              <button type="button" aria-label={t("common.close")} onClick={closeValidationModal} className="btn btn-ghost btn-icon btn-sm"><X aria-hidden="true" /></button>
            </header>
            <div className="dialog-body space-y-3 text-center">
              <div className="mx-auto flex items-center justify-center h-11 w-11 rounded-full bg-blue-100"><DollarSign className="h-5 w-5 text-blue-600" aria-hidden="true" /></div>
              <p className="text-sm text-gray-600">{t("sortieHistory.validationQuestion")}</p>
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-sm font-medium text-gray-900">{validatingExpense.reason}</p>
                <p className="text-lg font-bold text-gray-900 num">{formatOriginalAmount(validatingExpense)}</p>
                <p className="text-sm text-gray-600">{t("sortieHistory.forName", { name: validatingExpense.recipientName })}</p>
              </div>
              <p className="text-xs text-gray-500">{t("sortieHistory.rejectHint")}<br />{t("sortieHistory.validateHint")}</p>
            </div>
            <footer className="dialog-foot">
              <button type="button" onClick={() => validateExpense(false)} disabled={busy("validating", validatingExpense._id)} className="btn btn-danger">
                {busy("validating", validatingExpense._id) ? <RefreshCw className="animate-spin" aria-hidden="true" /> : <XCircle aria-hidden="true" />}
                {t("sortieHistory.reject")}
              </button>
              <button type="button" onClick={() => validateExpense(true)} disabled={busy("validating", validatingExpense._id)} className="btn btn-primary">
                {busy("validating", validatingExpense._id) ? <RefreshCw className="animate-spin" aria-hidden="true" /> : <CheckCircle aria-hidden="true" />}
                {t("sortieHistory.validate")}
              </button>
            </footer>
          </div>
        </Dialog>
      )}

      {showEditModal && editingExpense && (
        <Dialog label={t("sortieHistory.editExpense")} onClose={closeEditModal}>
          <div className="dialog-panel max-w-2xl">
            <header className="dialog-head">
              <div>
                <h3 className="dialog-title">{t("sortieHistory.editExpense")}</h3>
                <p className="dialog-subtitle mono">{editingExpense.expenseId}</p>
              </div>
              <button type="button" aria-label={t("common.close")} onClick={closeEditModal} className="btn btn-ghost btn-icon btn-sm"><X aria-hidden="true" /></button>
            </header>
            <div className="dialog-body space-y-4">
              {requiresUpdateReason(editingExpense) && (
                <div className="alert alert-warning" role="note">
                  <AlertCircle aria-hidden="true" />
                  <div>
                    <strong className="text-sm">{t("sortieHistory.editingStatus", { status: statusLabel(editingExpense.status).toLowerCase() })}</strong>
                    <p className="text-sm">{t("sortieHistory.editingStatusBody", { status: statusLabel(editingExpense.status).toLowerCase() })}</p>
                  </div>
                </div>
              )}
              <label className="field">
                <span className="field-label">{t("sortie.reason")} *</span>
                <input className="input" type="text" required value={editForm.reason} onChange={(e) => setEditForm({ ...editForm, reason: e.target.value })} />
              </label>
              <div className="form-row">
                <label className="field">
                  <span className="field-label">{t("sortie.recipientName")} *</span>
                  <input className="input" type="text" required value={editForm.recipientName} onChange={(e) => setEditForm({ ...editForm, recipientName: e.target.value })} />
                </label>
                <label className="field">
                  <span className="field-label">{t("sortie.recipientPhone")} *</span>
                  <input className="input" type="tel" required value={editForm.recipientPhone} onChange={(e) => setEditForm({ ...editForm, recipientPhone: e.target.value })} />
                </label>
                <label className="field">
                  <span className="field-label">{t("entryHistory.amountUsd")} *</span>
                  <input className="input num" type="number" step="0.01" min="0" required value={editForm.amount} onChange={(e) => setEditForm({ ...editForm, amount: e.target.value })} />
                </label>
                <label className="field">
                  <span className="field-label">{t("sortie.paymentMethod")} *</span>
                  <select className="input" value={editForm.paymentMethod} onChange={(e) => setEditForm({ ...editForm, paymentMethod: e.target.value })}>
                    {(["cash", "card", "bank", "mpesa", "other"] as const).map((method) => <option key={method} value={method}>{uiPaymentLabel(t, method)}</option>)}
                  </select>
                </label>
              </div>
              {requiresUpdateReason(editingExpense) && (
                <label className="field">
                  <span className="field-label">{t("sortieHistory.updateReason")} *</span>
                  <textarea className="input" rows={2} required value={editForm.updateReason} placeholder={t("sortieHistory.updateReasonPlaceholder")} onChange={(e) => setEditForm({ ...editForm, updateReason: e.target.value })} />
                  <span className="field-hint">{t("sortieHistory.updateReasonHint")}</span>
                </label>
              )}
              <label className="field">
                <span className="field-label">{t("sortie.notes")} {t("common.optional")}</span>
                <textarea className="input" rows={2} value={editForm.notes} placeholder={t("sortieHistory.notesPlaceholder")} onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })} />
              </label>
            </div>
            <footer className="dialog-foot">
              <button type="button" onClick={closeEditModal} className="btn btn-secondary">{t("common.cancel")}</button>
              <button type="button" onClick={handleEditExpense} disabled={busy("editing", editingExpense._id)} className="btn btn-primary">
                {busy("editing", editingExpense._id) ? <RefreshCw className="animate-spin" aria-hidden="true" /> : <Save aria-hidden="true" />}
                {t("sortieHistory.saveChanges")}
              </button>
            </footer>
          </div>
        </Dialog>
      )}

      {showDeleteModal && deletingExpense && (
        <Dialog label={t("sortieHistory.deleteTitle")} onClose={closeDeleteModal}>
          <div className="dialog-panel max-w-md">
            <header className="dialog-head">
              <h3 className="dialog-title">{t("sortieHistory.deleteTitle")}</h3>
              <button type="button" aria-label={t("common.close")} onClick={closeDeleteModal} className="btn btn-ghost btn-icon btn-sm"><X aria-hidden="true" /></button>
            </header>
            <div className="dialog-body space-y-3">
              <div className="text-center">
                <div className="mx-auto flex items-center justify-center h-11 w-11 rounded-full bg-red-100 mb-2"><Trash2 className="h-5 w-5 text-red-600" aria-hidden="true" /></div>
                <p className="text-sm text-gray-600">{t("sortieHistory.deleteQuestion")}</p>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg text-sm space-y-1">
                <p className="font-medium text-gray-900">{deletingExpense.reason}</p>
                <p className="text-lg font-bold text-gray-900 num">{formatOriginalAmount(deletingExpense)}</p>
                <p className="text-gray-600">{t("sortieHistory.forName", { name: deletingExpense.recipientName })}</p>
                <p className="text-gray-600">{t("common.status")} : {statusBadge(deletingExpense.status)}</p>
              </div>
              {deletingExpense.status !== "pending" && (
                <div className="alert alert-warning" role="note">
                  <AlertCircle aria-hidden="true" />
                  <div>
                    <strong className="text-sm">{t("sortieHistory.deleteWarnTitle", { status: statusLabel(deletingExpense.status).toLowerCase() })}</strong>
                    <p className="text-xs">{t("sortieHistory.deleteWarnBody", { status: statusLabel(deletingExpense.status).toLowerCase() })}</p>
                  </div>
                </div>
              )}
              {userPermissions.isAdmin && deletingExpense.status !== "pending" && (
                <label className="field">
                  <span className="field-label">{t("sortieHistory.deleteReason")} {t("common.optional")}</span>
                  <textarea className="input" rows={2} value={deleteReason} placeholder={t("sortieHistory.deleteReasonPlaceholder")} onChange={(e) => setDeleteReason(e.target.value)} />
                </label>
              )}
              <p className="text-xs text-gray-500 text-center">
                {t("sortieHistory.deleteNote")}
                {deletingExpense.status === "validated" && ` ${t("sortieHistory.deleteNoteEmail")}`}
              </p>
            </div>
            <footer className="dialog-foot">
              <button type="button" onClick={closeDeleteModal} className="btn btn-secondary">{t("common.cancel")}</button>
              <button type="button" onClick={handleDeleteExpense} disabled={busy("deleting", deletingExpense._id)} className="btn btn-danger">
                {busy("deleting", deletingExpense._id) ? <RefreshCw className="animate-spin" aria-hidden="true" /> : <Trash2 aria-hidden="true" />}
                {t("sortieHistory.deleteForever")}
              </button>
            </footer>
          </div>
        </Dialog>
      )}

      {showHistoryModal && (
        <Dialog label={t("sortieHistory.historyTitle")} onClose={closeHistoryModal}>
          <div className="dialog-panel max-w-2xl">
            <header className="dialog-head">
              <h3 className="dialog-title">{t("sortieHistory.historyTitle")}</h3>
              <button type="button" aria-label={t("common.close")} onClick={closeHistoryModal} className="btn btn-ghost btn-icon btn-sm"><X aria-hidden="true" /></button>
            </header>
            <div className="dialog-body space-y-3">
              {historyLoading ? (
                <LoadingState label={t("sortieHistory.historyLoading")} />
              ) : expenseHistory.length === 0 ? (
                <EmptyState title={t("sortieHistory.historyEmpty")} icon={<History aria-hidden="true" />} />
              ) : (
                <>
                  <div className="bg-gray-50 rounded-lg p-3 text-sm">
                    <p className="font-medium text-gray-900">{t("sortieHistory.historyExpense", { id: selectedExpense?.expenseId || t("common.notAvailable") })}</p>
                    <p className="text-gray-600 mt-1">{t("sortieHistory.currentStatus")} {statusBadge(selectedExpense?.status)}</p>
                  </div>
                  <h4 className="section-title">{t("sortieHistory.changeLog")}</h4>
                  <ol className="space-y-2">
                    {expenseHistory.map((item, index) => (
                      <li key={index} className="border-l-4 border-blue-500 pl-3 py-1">
                        <div className="flex justify-between items-start gap-2">
                          <p className="text-sm text-gray-900 font-medium">{item.action}</p>
                          <span className="text-xs text-gray-500 whitespace-nowrap">{formatDate(item.timestamp)}</span>
                        </div>
                      </li>
                    ))}
                  </ol>
                </>
              )}
            </div>
            <footer className="dialog-foot">
              <button type="button" onClick={closeHistoryModal} className="btn btn-secondary">{t("common.close")}</button>
            </footer>
          </div>
        </Dialog>
      )}
    </div>
  );
}
