"use client";

import { useState, useEffect } from "react";
import {
  Search,
  FileText,
  Eye,
  CheckCircle,
  XCircle,
  Edit,
  Printer,
  Calendar,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  User,
  DollarSign,
  Trash2,
  Save,
  X,
  AlertCircle,
  History,
} from "lucide-react";

interface ExpenseItem {
  _id: string;
  expenseId: string;
  reason: string;
  recipientName: string;
  recipientPhone: string;
  amount: number;
  paymentMethod: string;
  status: string;
  recordedBy: string;
  createdAt: string;
  updatedAt: string;
  notes?: string;
  validatedBy?: string;
  validatedAt?: string;
}

// Helper function to get today's date in correct format
const getTodayDate = (): string => {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

export default function SortieHistory() {
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
  const [expenseHistory, setExpenseHistory] = useState<any[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  // Timeframe state
  const [timeframe, setTimeframe] = useState<"day" | "week" | "month" | "year">("day");
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [selectedDate, setSelectedDate] = useState<string>(getTodayDate());
  const [initialLoad, setInitialLoad] = useState(true);

  // User role - this should come from your auth context
  const isAdmin = true; // Change this based on actual user role

  // Fetch user permissions
  const [userPermissions, setUserPermissions] = useState({
    isAdmin: false,
    canValidate: false,
    canEditAll: false,
    canDeleteAll: false,
    userId: "",
    userName: "",
  });

  useEffect(() => {
    fetchExpenses();
    fetchUserPermissions();
  }, []);

  useEffect(() => {
    if (allExpenses.length > 0) {
      updateFilteredExpenses();
    }
  }, [timeframe, selectedYear, selectedDate, allExpenses, isAdmin]);

  // Auto-set to today's date when timeframe changes to "day"
  useEffect(() => {
    if (!initialLoad && timeframe === "day") {
      const today = getTodayDate();
      setSelectedDate(today);
    }
  }, [timeframe, initialLoad]);

  const fetchUserPermissions = async () => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/expenses/permissions/me`, {
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
      const res = await fetch(`${import.meta.env.VITE_API_URL}/expenses`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
        },
      });

      if (res.ok) {
        const data = await res.json();

        let fetchedExpenses: ExpenseItem[] = [];
        if (Array.isArray(data)) {
          fetchedExpenses = data;
        } else if (data.expenses && Array.isArray(data.expenses)) {
          fetchedExpenses = data.expenses;
        } else if (data.data && Array.isArray(data.data)) {
          fetchedExpenses = data.data;
        } else {
          console.warn("Unexpected expenses data structure:", data);
          fetchedExpenses = [];
        }

        console.log(`Fetched ${fetchedExpenses.length} expenses from API`);

        // Sort expenses by date - newest first
        const sortedExpenses = fetchedExpenses.sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );

        setAllExpenses(sortedExpenses);

        // For regular users, automatically filter to current day
        if (!userPermissions.isAdmin) {
          const todayExpenses = getExpensesByTimeframe("day");
          setExpenses(todayExpenses);
        } else {
          setExpenses(sortedExpenses);
        }
      } else {
        console.error("Expenses fetch failed:", res.status);
        setError("Failed to load expenses");
      }
    } catch (error) {
      console.error("Error loading expenses:", error);
      setError("Failed to load expenses");
    } finally {
      setLoading(false);
      setInitialLoad(false);
    }
  };

  // Function to get expenses filtered by timeframe - FIXED VERSION
  const getExpensesByTimeframe = (
    timeframe: "day" | "week" | "month" | "year",
    selectedYear?: number,
    selectedDate?: string
  ): ExpenseItem[] => {
    const now = new Date();

    switch (timeframe) {
      case "day":
        const targetDate = selectedDate ? new Date(selectedDate) : new Date();
        
        // Create start and end of the target day
        const startOfDay = new Date(targetDate);
        startOfDay.setHours(0, 0, 0, 0);
        
        const endOfDay = new Date(targetDate);
        endOfDay.setHours(23, 59, 59, 999);

        return allExpenses.filter((expense: ExpenseItem) => {
          try {
            const expenseDate = new Date(expense.createdAt);
            return expenseDate >= startOfDay && expenseDate <= endOfDay;
          } catch (error) {
            console.error("Error parsing expense date:", expense.createdAt, error);
            return false;
          }
        });

      case "week":
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        weekAgo.setHours(0, 0, 0, 0);
        
        return allExpenses.filter((expense: ExpenseItem) => {
          try {
            const expenseDate = new Date(expense.createdAt);
            return expenseDate >= weekAgo && expenseDate <= now;
          } catch (error) {
            console.error("Error parsing expense date:", expense.createdAt, error);
            return false;
          }
        });

      case "month":
        const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        firstDayOfMonth.setHours(0, 0, 0, 0);
        
        return allExpenses.filter((expense: ExpenseItem) => {
          try {
            const expenseDate = new Date(expense.createdAt);
            return expenseDate >= firstDayOfMonth && expenseDate <= now;
          } catch (error) {
            console.error("Error parsing expense date:", expense.createdAt, error);
            return false;
          }
        });

      case "year":
        const year = selectedYear || now.getFullYear();
        const firstDayOfYear = new Date(year, 0, 1);
        firstDayOfYear.setHours(0, 0, 0, 0);
        
        const lastDayOfYear = new Date(year, 11, 31, 23, 59, 59, 999);
        
        return allExpenses.filter((expense: ExpenseItem) => {
          try {
            const expenseDate = new Date(expense.createdAt);
            return (
              expenseDate >= firstDayOfYear && expenseDate <= lastDayOfYear
            );
          } catch (error) {
            console.error("Error parsing expense date:", expense.createdAt, error);
            return false;
          }
        });

      default:
        return allExpenses;
    }
  };

  // Function to update filtered expenses based on timeframe
  const updateFilteredExpenses = () => {
    // Regular users can only see current day
    if (!userPermissions.isAdmin) {
      const todayExpenses = getExpensesByTimeframe("day");
      setExpenses(todayExpenses);
      return;
    }

    // Admin can see all timeframes
    const timeframeExpenses = getExpensesByTimeframe(
      timeframe,
      selectedYear,
      selectedDate
    );

    // Sort the filtered expenses by date - newest first
    const sortedExpenses = timeframeExpenses.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    setExpenses(sortedExpenses);
  };

  const getAvailableYears = (): number[] => {
    const years = Array.from(
      new Set(
        allExpenses.map((expense: ExpenseItem) => {
          try {
            return new Date(expense.createdAt).getFullYear();
          } catch (error) {
            return new Date().getFullYear();
          }
        })
      )
    );

    return years.sort((a, b) => b - a);
  };

  const navigateYear = (direction: "prev" | "next") => {
    const years = getAvailableYears();
    const currentIndex = years.indexOf(selectedYear);

    if (direction === "prev" && currentIndex < years.length - 1) {
      setSelectedYear(years[currentIndex + 1]);
    } else if (direction === "next" && currentIndex > 0) {
      setSelectedYear(years[currentIndex - 1]);
    }
  };

  const getTimeframeLabel = () => {
    if (!userPermissions.isAdmin) {
      return "Aujourd'hui";
    }

    switch (timeframe) {
      case "day":
        if (selectedDate) {
          const date = new Date(selectedDate);
          return date.toLocaleDateString("fr-FR", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
          });
        }
        return "Aujourd'hui";
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
    if (!userPermissions.isAdmin) return; // Only admin can change timeframe

    setTimeframe(period);

    if (period === "year") {
      const years = getAvailableYears();
      setSelectedYear(years[0] || new Date().getFullYear());
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("fr-FR", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

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
        `${import.meta.env.VITE_API_URL}/expenses/${expenseId}/history`,
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
        setError("Failed to load expense history");
      }
    } catch (error) {
      console.error("Error fetching expense history:", error);
      setError("Failed to load expense history");
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
          `${import.meta.env.VITE_API_URL}/expenses/${validatingExpense._id}`,
          {
            method: "DELETE",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
            },
          }
        );

        if (response.ok) {
          setMessage("❌ Dépense rejetée et suppression en cours...");
          closeValidationModal();

          // Wait 3 seconds before refreshing
          setTimeout(() => {
            fetchExpenses();
            setMessage(null);
          }, 3000);
        } else {
          const errorData = await response.json();
          setError(errorData.error || "Failed to delete expense");
        }
      } else {
        const response = await fetch(
          `${import.meta.env.VITE_API_URL}/expenses/${
            validatingExpense._id
          }/validate`,
          {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
            },
            body: JSON.stringify({
              validatedBy: "admin",
            }),
          }
        );

        if (response.ok) {
          setMessage("✅ Dépense validée avec succès !");
          closeValidationModal();
          fetchExpenses();
        } else {
          const errorData = await response.json();
          setError(errorData.error || "Failed to validate expense");
        }
      }
    } catch (error) {
      console.error("Error processing expense:", error);
      setError("Failed to process expense");
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
        setError("La raison de la mise à jour est requise pour les dépenses validées/rejetées");
        setActionLoading(null);
        return;
      }

      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/expenses/${editingExpense._id}`,
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
        setMessage("✅ Dépense mise à jour avec succès !");
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
        const errorData = await response.json();
        setError(errorData.error || "Failed to update expense");
      }
    } catch (error) {
      console.error("Error updating expense:", error);
      setError("Failed to update expense");
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeleteExpense = async () => {
    if (!deletingExpense) return;

    setActionLoading(`deleting-${deletingExpense._id}`);
    setError(null);

    try {
      let endpoint = `${import.meta.env.VITE_API_URL}/expenses/${deletingExpense._id}`;
      
      // If expense is not pending and user is admin, use admin delete endpoint
      if (deletingExpense.status !== "pending" && userPermissions.isAdmin) {
        endpoint = `${import.meta.env.VITE_API_URL}/expenses/${deletingExpense._id}/admin`;
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
        setMessage("✅ " + (result.message || "Dépense supprimée avec succès"));
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
        const errorData = await response.json();
        setError(errorData.error || "Failed to delete expense");
      }
    } catch (error) {
      console.error("Error deleting expense:", error);
      setError("Failed to delete expense");
    } finally {
      setActionLoading(null);
    }
  };

  // Print function for expense receipt
  const printExpenseReceipt = (expense: ExpenseItem) => {
    const printWindow = window.open("", "_blank", "width=320,height=600");
    if (printWindow) {
      // Format the amount directly for the print window
      const formattedAmount = new Intl.NumberFormat("fr-FR", {
        style: "currency",
        currency: "USD",
      }).format(expense.amount);

      // Format the date directly for the print window
      const formattedDate = new Date(expense.createdAt).toLocaleDateString(
        "fr-FR",
        {
          year: "numeric",
          month: "short",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        }
      );

      const validatedDate = expense.validatedAt
        ? new Date(expense.validatedAt).toLocaleDateString("fr-FR", {
            year: "numeric",
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          })
        : formattedDate;

      printWindow.document.write(`
<html>
  <head>
    <title>Expense Receipt</title>
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
    </style>
  </head>
  <body>
    <div class="receipt-container">
      <div class="header">
        <div class="shop-name"><strong>ETS. DIEU MERCI</strong></div>
        <div class="shop-details"><strong>Av Manono Coin Munama N°39, C. Kenya, Lubumbashi</strong></div>
        <div class="shop-details">TEL: <strong>+243 977 771 421 / +243 853 549 102</strong></div>
        <div class="shop-details"><strong>RCCM: 14-A-017885</strong></div>
      </div>
      
      <div class="section-divider"></div>
      
      <div class="receipt-info">
        <div class="shop-details">DATE: <strong>${formattedDate}</strong></div>
        <div class="shop-details">RECU #: <strong>${
          expense.expenseId
        }</strong></div>
      </div>
      
      <div class="receipt-title">RECU DE SORTIE DE CAISSE</div>
      
      <div class="expense-details">
        <div class="detail-row">
          <div class="detail-label"><strong>RAISON:</strong></div>
          <div class="detail-value"><strong>${expense.reason.toUpperCase()}</strong></div>
        </div>
        <div class="detail-row">
          <div class="detail-label"><strong>BÉNÉFICIAIRE:</strong></div>
          <div class="detail-value"><strong>${expense.recipientName.toUpperCase()}</strong></div>
        </div>
        <div class="detail-row">
          <div class="detail-label"><strong>TÉLÉPHONE:</strong></div>
          <div class="detail-value"><strong>${
            expense.recipientPhone
          }</strong></div>
        </div>
        <div class="detail-row">
          <div class="detail-label"><strong>MONTANT:</strong></div>
          <div class="detail-value"><strong>${formattedAmount}</strong></div>
        </div>
        <div class="detail-row">
          <div class="detail-label"><strong>PAIEMENT:</strong></div>
          <div class="detail-value"><strong>${expense.paymentMethod.toUpperCase()}</strong></div>
        </div>
      </div>
      
      <div class="total-section">
        <div class="total-row">
          <div><strong>MONTANT TOTAL:</strong></div>
          <div><strong>${formattedAmount}</strong></div>
        </div>
      </div>
      
      <div class="validation-info">
        Validé par: <strong>${expense.validatedBy || "ADMIN"}</strong><br>
        Le: <strong>${validatedDate}</strong>
      </div>
      
      <div class="footer">
        <div class="thank-you"><strong>SOUCHE DE SORTIE DE CAISSE</strong></div>
        <div class="warning"><strong>Conserver cette souche</strong></div>
        <div class="warning">Reçu #: <strong>${
          expense.expenseId
        }</strong></div>
        <div class="warning">Date: <strong>${formattedDate}</strong></div>
      </div>
      
      <!-- PAPER CUT INDICATOR -->
      <div class="cut-line">
        ✄ ────────────────────────── ✄
      </div>
    </div>
    <script>
      window.onload = function() {
        try {
          window.print();
        } catch(e) {
          console.error('Print error:', e);
        }
        setTimeout(() => {
          window.close();
        }, 1000);
      };
    </script>
  </body>
</html>
`);
      printWindow.document.close();
    }
  };

  // Check if user can edit this expense
  const canEditExpense = (expense: ExpenseItem): boolean => {
    if (userPermissions.isAdmin) {
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
    if (userPermissions.isAdmin) {
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
    return expense.status !== "pending" && userPermissions.isAdmin;
  };

  return (
    <div className="space-y-6 p-6 flex-1 overflow-auto">
      <div className="flex items-center justify-between flex-wrap gap-4 overflow-auto">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Historique des Sorties de Caisse
          </h1>
          <p className="text-gray-600">
            {userPermissions.isAdmin
              ? "Gestion et validation des dépenses"
              : "Consultation des dépenses du jour"}
          </p>
          {!userPermissions.isAdmin && (
            <div className="mt-2 text-sm text-blue-600 bg-blue-50 px-3 py-1 rounded-md inline-block">
              🔒 Vue limitée aux dépenses d'aujourd'hui uniquement
            </div>
          )}
        </div>
        <div className="flex gap-3">
          <button
            onClick={fetchExpenses}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            Actualiser
          </button>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Rechercher des dépenses..."
              className="pl-10 w-64 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Timeframe Filter Section - Only show for admin */}
      {userPermissions.isAdmin && (
        <div className="bg-white p-4 sm:p-6 rounded-lg shadow border border-gray-200">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Calendar className="w-4 h-4 sm:w-5 sm:h-5" />
              Filtre par période ({getTimeframeLabel()})
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
                  />
                </div>
              )}

              {timeframe === "year" && getAvailableYears().length > 1 && (
                <div className="flex items-center gap-2 bg-white rounded-lg border border-gray-300 px-3 py-2 shadow-sm w-full sm:w-auto">
                  <button
                    onClick={() => navigateYear("prev")}
                    disabled={
                      getAvailableYears().indexOf(selectedYear) ===
                      getAvailableYears().length - 1
                    }
                    className="p-1 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronLeft className="w-3 h-3 sm:w-4 sm:h-4" />
                  </button>
                  <span className="text-xs sm:text-sm font-medium text-gray-900 px-2 min-w-[60px] sm:min-w-[80px] text-center">
                    {selectedYear}
                  </span>
                  <button
                    onClick={() => navigateYear("next")}
                    disabled={getAvailableYears().indexOf(selectedYear) === 0}
                    className="p-1 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronRight className="w-3 h-3 sm:w-4 sm:h-4" />
                  </button>
                </div>
              )}

              <div className="flex gap-1 bg-gray-100 p-1 rounded-lg w-full sm:w-auto">
                {(["day", "week", "month", "year"] as const).map((period) => (
                  <button
                    key={period}
                    onClick={() => handleTimeframeChange(period)}
                    className={`px-3 py-2 rounded-md text-xs sm:text-sm font-medium transition-all duration-200 flex-1 sm:flex-none ${
                      timeframe === period
                        ? "bg-blue-500 text-white shadow-sm"
                        : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                    }`}
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
      )}

      {/* User restriction notice */}
      {!userPermissions.isAdmin && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg
                className="h-5 w-5 text-yellow-400"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-yellow-800">
                Accès limité
              </h3>
              <div className="mt-1 text-sm text-yellow-700">
                <p>
                  Vous ne pouvez voir que les dépenses d'aujourd'hui. Seul
                  l'administrateur peut accéder à l'historique complet.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {message && (
        <div className="mb-4 p-3 bg-green-100 text-green-700 rounded-lg border border-green-200">
          {message}
          <button
            onClick={() => setMessage(null)}
            className="float-right text-green-700 hover:text-green-900"
          >
            ×
          </button>
        </div>
      )}

      {error && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg border border-red-200">
          {error}
          <button
            onClick={() => setError(null)}
            className="float-right text-red-700 hover:text-red-900"
          >
            ×
          </button>
        </div>
      )}

      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <FileText className="w-5 h-5" />
            {userPermissions.isAdmin ? "Dépenses en attente et validées" : "Dépenses du jour"} (
            {filteredExpenses.length})
          </h2>
        </div>

        <div className="overflow-x-auto">
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="text-gray-500 mt-2">Chargement des dépenses...</p>
            </div>
          ) : filteredExpenses.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Aucune dépense trouvée</p>
              <p className="text-sm">pour la période sélectionnée</p>
            </div>
          ) : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    ID Dépense
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Raison
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Bénéficiaire
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Montant
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Paiement
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Statut
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredExpenses.map((expense) => (
                  <tr key={expense._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {expense.expenseId}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {expense.reason}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {expense.recipientName}
                      </div>
                      <div className="text-sm text-gray-500">
                        {expense.recipientPhone}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {formatCurrency(expense.amount)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {expense.paymentMethod}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${
                          expense.status === "validated"
                            ? "bg-green-100 text-green-800"
                            : expense.status === "rejected"
                            ? "bg-red-100 text-red-800"
                            : "bg-yellow-100 text-yellow-800"
                        }`}
                      >
                        {expense.status === "validated"
                          ? "Validé"
                          : expense.status === "rejected"
                          ? "Rejeté"
                          : "En attente"}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(expense.createdAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex gap-2">
                        <button
                          onClick={() => viewExpenseDetails(expense)}
                          className="text-blue-600 hover:text-blue-900 p-1 rounded"
                          title="Voir les détails"
                        >
                          <Eye className="w-4 h-4" />
                        </button>

                        {/* History button */}
                        <button
                          onClick={() => fetchExpenseHistory(expense._id)}
                          className="text-gray-600 hover:text-gray-900 p-1 rounded"
                          title="Voir l'historique"
                        >
                          <History className="w-4 h-4" />
                        </button>

                        {/* Admin-only validation buttons */}
                        {userPermissions.canValidate &&
                          expense.status !== "validated" &&
                          expense.status !== "rejected" && (
                            <>
                              <button
                                onClick={() => openValidationModal(expense)}
                                disabled={
                                  actionLoading === `validating-${expense._id}`
                                }
                                className="text-green-600 hover:text-green-900 p-1 rounded disabled:opacity-50"
                                title="Valider la dépense"
                              >
                                <CheckCircle className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => openValidationModal(expense)}
                                disabled={
                                  actionLoading === `validating-${expense._id}`
                                }
                                className="text-red-600 hover:text-red-900 p-1 rounded disabled:opacity-50"
                                title="Rejeter la dépense"
                              >
                                <XCircle className="w-4 h-4" />
                              </button>
                            </>
                          )}

                        {/* Edit button - show if user has permission */}
                        {canEditExpense(expense) && (
                          <button
                            onClick={() => openEditModal(expense)}
                            className="text-yellow-600 hover:text-yellow-900 p-1 rounded"
                            title="Modifier la dépense"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                        )}

                        {/* Delete button - show if user has permission */}
                        {canDeleteExpense(expense) && (
                          <button
                            onClick={() => openDeleteModal(expense)}
                            className="text-red-600 hover:text-red-900 p-1 rounded"
                            title="Supprimer la dépense"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}

                        {/* Print button - only show for validated expenses */}
                        {expense.status === "validated" && (
                          <button
                            onClick={() => printExpenseReceipt(expense)}
                            className="text-purple-600 hover:text-purple-900 p-1 rounded"
                            title="Imprimer le reçu"
                          >
                            <Printer className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Expense Details Modal */}
      {showModal && selectedExpense && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">
                Détails de la Dépense
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Expense Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    ID Dépense
                  </label>
                  <p className="text-sm text-gray-900">
                    {selectedExpense.expenseId}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Date
                  </label>
                  <p className="text-sm text-gray-900">
                    {formatDate(selectedExpense.createdAt)}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Méthode de Paiement
                  </label>
                  <p className="text-sm text-gray-900 capitalize">
                    {selectedExpense.paymentMethod}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Statut
                  </label>
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${
                      selectedExpense.status === "validated"
                        ? "bg-green-100 text-green-800"
                        : selectedExpense.status === "rejected"
                        ? "bg-red-100 text-red-800"
                        : "bg-yellow-100 text-yellow-800"
                    }`}
                  >
                    {selectedExpense.status === "validated"
                      ? "Validé"
                      : selectedExpense.status === "rejected"
                      ? "Rejeté"
                      : "En attente"}
                  </span>
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Enregistré par
                  </label>
                  <p className="text-sm text-gray-900">
                    {selectedExpense.recordedBy}
                  </p>
                </div>
              </div>

              {/* Reason and Amount */}
              <div>
                <h4 className="text-md font-medium text-gray-900 mb-3 flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  Détails de la Dépense
                </h4>
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Raison
                      </label>
                      <p className="text-sm text-gray-900">
                        {selectedExpense.reason}
                      </p>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Montant
                        </label>
                        <p className="text-lg font-semibold text-gray-900">
                          {formatCurrency(selectedExpense.amount)}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Recipient Information */}
              <div>
                <h4 className="text-md font-medium text-gray-900 mb-3 flex items-center gap-2">
                  <User className="w-4 h-4" />
                  Information du Bénéficiaire
                </h4>
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Nom
                      </label>
                      <p className="text-sm text-gray-900">
                        {selectedExpense.recipientName}
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Téléphone
                      </label>
                      <p className="text-sm text-gray-900">
                        {selectedExpense.recipientPhone}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Notes */}
              {selectedExpense.notes && (
                <div>
                  <h4 className="text-md font-medium text-gray-900 mb-3">
                    Notes supplémentaires
                  </h4>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-sm text-gray-900 whitespace-pre-line">
                      {selectedExpense.notes}
                    </p>
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3 pt-4">
                {/* History button */}
                <button
                  onClick={() => fetchExpenseHistory(selectedExpense._id)}
                  className="flex-1 bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors flex items-center justify-center gap-2"
                >
                  <History className="w-4 h-4" />
                  Historique
                </button>
                
                {selectedExpense.status === "validated" && (
                  <button
                    onClick={() => printExpenseReceipt(selectedExpense)}
                    className="flex-1 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors flex items-center justify-center gap-2"
                  >
                    <Printer className="w-4 h-4" />
                    Imprimer Reçu
                  </button>
                )}
                {userPermissions.canValidate &&
                  selectedExpense.status !== "validated" &&
                  selectedExpense.status !== "rejected" && (
                    <button
                      onClick={() => openValidationModal(selectedExpense)}
                      className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
                    >
                      <CheckCircle className="w-4 h-4" />
                      Valider/Rejeter
                    </button>
                  )}
                {canEditExpense(selectedExpense) && (
                  <button
                    onClick={() => openEditModal(selectedExpense)}
                    className="flex-1 bg-yellow-600 text-white px-4 py-2 rounded-lg hover:bg-yellow-700 transition-colors flex items-center justify-center gap-2"
                  >
                    <Edit className="w-4 h-4" />
                    Modifier
                  </button>
                )}
                {canDeleteExpense(selectedExpense) && (
                  <button
                    onClick={() => openDeleteModal(selectedExpense)}
                    className="flex-1 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors flex items-center justify-center gap-2"
                  >
                    <Trash2 className="w-4 h-4" />
                    Supprimer
                  </button>
                )}
                <button
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Fermer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Validation Modal */}
      {showValidationModal && validatingExpense && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg max-w-md w-full mx-4">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">
                Validation de Dépense
              </h3>
              <button
                onClick={closeValidationModal}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6">
              <div className="text-center mb-6">
                <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-blue-100 mb-4">
                  <DollarSign className="h-6 w-6 text-blue-600" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Confirmer la validation
                </h3>
                <p className="text-sm text-gray-500">
                  Voulez-vous valider ou rejeter cette dépense ?
                </p>
                <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm font-medium text-gray-900">
                    {validatingExpense.reason}
                  </p>
                  <p className="text-lg font-bold text-gray-900 mt-1">
                    {formatCurrency(validatingExpense.amount)}
                  </p>
                  <p className="text-sm text-gray-600 mt-1">
                    Pour: {validatingExpense.recipientName}
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => validateExpense(false)}
                  disabled={
                    actionLoading === `validating-${validatingExpense._id}`
                  }
                  className="flex-1 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
                >
                  {actionLoading === `validating-${validatingExpense._id}` ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <XCircle className="w-4 h-4" />
                  )}
                  Rejeter
                </button>
                <button
                  onClick={() => validateExpense(true)}
                  disabled={
                    actionLoading === `validating-${validatingExpense._id}`
                  }
                  className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
                >
                  {actionLoading === `validating-${validatingExpense._id}` ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <CheckCircle className="w-4 h-4" />
                  )}
                  Valider
                </button>
              </div>

              <div className="mt-4 text-center">
                <p className="text-xs text-gray-500">
                  <strong>Rejeter:</strong> La dépense sera supprimée dans 3
                  secondes
                  <br />
                  <strong>Valider:</strong> Le reçu deviendra disponible pour
                  impression
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Expense Modal */}
      {showEditModal && editingExpense && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">
                Modifier la Dépense
              </h3>
              <button
                onClick={closeEditModal}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {requiresUpdateReason(editingExpense) && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-5 h-5 text-yellow-600" />
                    <span className="text-sm font-medium text-yellow-800">
                      Modification d'une dépense {editingExpense.status}
                    </span>
                  </div>
                  <p className="text-sm text-yellow-700 mt-2">
                    Vous modifiez une dépense {editingExpense.status}. Veuillez
                    fournir une raison pour cette modification.
                  </p>
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Raison de la dépense *
                  </label>
                  <input
                    type="text"
                    value={editForm.reason}
                    onChange={(e) =>
                      setEditForm({ ...editForm, reason: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nom du bénéficiaire *
                    </label>
                    <input
                      type="text"
                      value={editForm.recipientName}
                      onChange={(e) =>
                        setEditForm({ ...editForm, recipientName: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Téléphone du bénéficiaire *
                    </label>
                    <input
                      type="tel"
                      value={editForm.recipientPhone}
                      onChange={(e) =>
                        setEditForm({ ...editForm, recipientPhone: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Montant (USD) *
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={editForm.amount}
                      onChange={(e) =>
                        setEditForm({ ...editForm, amount: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Méthode de paiement *
                    </label>
                    <select
                      value={editForm.paymentMethod}
                      onChange={(e) =>
                        setEditForm({ ...editForm, paymentMethod: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="cash">Espèces</option>
                      <option value="card">Carte</option>
                      <option value="bank">Virement bancaire</option>
                      <option value="mpesa">M-Pesa</option>
                      <option value="other">Autre</option>
                    </select>
                  </div>
                </div>

                {requiresUpdateReason(editingExpense) && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Raison de la modification *
                    </label>
                    <textarea
                      value={editForm.updateReason}
                      onChange={(e) =>
                        setEditForm({ ...editForm, updateReason: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      rows={3}
                      placeholder="Expliquez pourquoi vous modifiez cette dépense..."
                      required
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Cette raison sera enregistrée dans l'historique de la
                      dépense.
                    </p>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Notes supplémentaires (optionnel)
                  </label>
                  <textarea
                    value={editForm.notes}
                    onChange={(e) =>
                      setEditForm({ ...editForm, notes: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows={3}
                    placeholder="Ajoutez des notes supplémentaires..."
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={handleEditExpense}
                  disabled={actionLoading === `editing-${editingExpense._id}`}
                  className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
                >
                  {actionLoading === `editing-${editingExpense._id}` ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  Enregistrer les modifications
                </button>
                <button
                  onClick={closeEditModal}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Annuler
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Expense Modal */}
      {showDeleteModal && deletingExpense && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg max-w-md w-full mx-4">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">
                Supprimer la Dépense
              </h3>
              <button
                onClick={closeDeleteModal}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6">
              <div className="text-center mb-6">
                <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
                  <Trash2 className="h-6 w-6 text-red-600" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Confirmer la suppression
                </h3>
                <p className="text-sm text-gray-500">
                  Êtes-vous sûr de vouloir supprimer cette dépense ?
                </p>
                <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm font-medium text-gray-900">
                    {deletingExpense.reason}
                  </p>
                  <p className="text-lg font-bold text-gray-900 mt-1">
                    {formatCurrency(deletingExpense.amount)}
                  </p>
                  <p className="text-sm text-gray-600 mt-1">
                    Pour: {deletingExpense.recipientName}
                  </p>
                  <p className="text-sm text-gray-600 mt-1">
                    Statut:{" "}
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium capitalize ${
                        deletingExpense.status === "validated"
                          ? "bg-green-100 text-green-800"
                          : deletingExpense.status === "rejected"
                          ? "bg-red-100 text-red-800"
                          : "bg-yellow-100 text-yellow-800"
                      }`}
                    >
                      {deletingExpense.status === "validated"
                        ? "Validé"
                        : deletingExpense.status === "rejected"
                        ? "Rejeté"
                        : "En attente"}
                    </span>
                  </p>
                </div>

                {deletingExpense.status !== "pending" && (
                  <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <div className="flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-yellow-600" />
                      <span className="text-sm font-medium text-yellow-800">
                        Attention: Dépense {deletingExpense.status}
                      </span>
                    </div>
                    <p className="text-xs text-yellow-700 mt-1">
                      Vous êtes sur le point de supprimer une dépense{" "}
                      {deletingExpense.status}. Cette action est permanente et
                      enverra une notification aux administrateurs.
                    </p>
                  </div>
                )}

                {userPermissions.isAdmin &&
                  deletingExpense.status !== "pending" && (
                    <div className="mt-4">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Raison de la suppression (optionnel)
                      </label>
                      <textarea
                        value={deleteReason}
                        onChange={(e) => setDeleteReason(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        rows={2}
                        placeholder="Expliquez pourquoi vous supprimez cette dépense..."
                      />
                    </div>
                  )}
              </div>

              <div className="flex gap-3">
                <button
                  onClick={handleDeleteExpense}
                  disabled={actionLoading === `deleting-${deletingExpense._id}`}
                  className="flex-1 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
                >
                  {actionLoading === `deleting-${deletingExpense._id}` ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <Trash2 className="w-4 h-4" />
                  )}
                  Supprimer définitivement
                </button>
                <button
                  onClick={closeDeleteModal}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Annuler
                </button>
              </div>

              <div className="mt-4 text-center">
                <p className="text-xs text-gray-500">
                  <strong>Note:</strong> Cette action ne peut pas être annulée.
                  {deletingExpense.status === "validated" &&
                    " Les administrateurs seront notifiés par email."}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Expense History Modal */}
      {showHistoryModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">
                Historique de la Dépense
              </h3>
              <button
                onClick={closeHistoryModal}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6">
              {historyLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="text-gray-500 mt-2">Chargement de l'historique...</p>
                </div>
              ) : expenseHistory.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <History className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>Aucun historique disponible</p>
                  <p className="text-sm">pour cette dépense</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-sm font-medium text-gray-900">
                      Dépense: {selectedExpense?.expenseId || "N/A"}
                    </p>
                    <p className="text-sm text-gray-600 mt-1">
                      Statut actuel:{" "}
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium capitalize ${
                          selectedExpense?.status === "validated"
                            ? "bg-green-100 text-green-800"
                            : selectedExpense?.status === "rejected"
                            ? "bg-red-100 text-red-800"
                            : "bg-yellow-100 text-yellow-800"
                        }`}
                      >
                        {selectedExpense?.status === "validated"
                          ? "Validé"
                          : selectedExpense?.status === "rejected"
                          ? "Rejeté"
                          : "En attente"}
                      </span>
                    </p>
                  </div>

                  <div className="space-y-3">
                    <h4 className="text-md font-medium text-gray-900">
                      Journal des modifications
                    </h4>
                    <div className="space-y-3">
                      {expenseHistory.map((item, index) => (
                        <div
                          key={index}
                          className="border-l-4 border-blue-500 pl-4 py-2"
                        >
                          <div className="flex justify-between items-start">
                            <p className="text-sm text-gray-900 font-medium">
                              {item.action}
                            </p>
                            <span className="text-xs text-gray-500">
                              {item.formattedDate}
                            </span>
                          </div>
                          <p className="text-xs text-gray-600 mt-1">
                            {new Date(item.timestamp).toLocaleTimeString("fr-FR")}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              <div className="flex gap-3 pt-6">
                <button
                  onClick={closeHistoryModal}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Fermer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}