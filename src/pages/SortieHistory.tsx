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
  const [selectedExpense, setSelectedExpense] = useState<ExpenseItem | null>(
    null
  );
  const [showModal, setShowModal] = useState(false);
  const [showValidationModal, setShowValidationModal] = useState(false);
  const [validatingExpense, setValidatingExpense] =
    useState<ExpenseItem | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Timeframe state
  const [timeframe, setTimeframe] = useState<"day" | "week" | "month" | "year">(
    "day"
  );
  const [selectedYear, setSelectedYear] = useState<number>(
    new Date().getFullYear()
  );
  const [selectedDate, setSelectedDate] = useState<string>(getTodayDate());
  const [initialLoad, setInitialLoad] = useState(true);

  // User role - this should come from your auth context
  const isAdmin = true; // Change this based on actual user role

  useEffect(() => {
    fetchExpenses();
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
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );

        setAllExpenses(sortedExpenses);

        // For regular users, automatically filter to current day
        if (!isAdmin) {
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
    if (!isAdmin) {
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
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
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
    if (!isAdmin) {
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
    if (!isAdmin) return; // Only admin can change timeframe

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

  const closeValidationModal = () => {
    setShowValidationModal(false);
    setValidatingExpense(null);
    setError(null);
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

  return (
    <div className="space-y-6 p-6 flex-1 overflow-auto">
      <div className="flex items-center justify-between flex-wrap gap-4 overflow-auto">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Historique des Sorties de Caisse
          </h1>
          <p className="text-gray-600">
            {isAdmin
              ? "Gestion et validation des dépenses"
              : "Consultation des dépenses du jour"}
          </p>
          {!isAdmin && (
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
      {isAdmin && (
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
      {!isAdmin && (
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
            {isAdmin ? "Dépenses en attente et validées" : "Dépenses du jour"} (
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

                        {/* Admin-only validation buttons */}
                        {isAdmin &&
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

                        {/* Edit button - only admin can edit validated expenses */}
                        {isAdmin && expense.status === "validated" && (
                          <button
                            onClick={() => {
                              /* Implement edit functionality */
                            }}
                            className="text-yellow-600 hover:text-yellow-900 p-1 rounded"
                            title="Modifier la dépense"
                          >
                            <Edit className="w-4 h-4" />
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
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
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
                    <p className="text-sm text-gray-900">
                      {selectedExpense.notes}
                    </p>
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3 pt-4">
                {selectedExpense.status === "validated" && (
                  <button
                    onClick={() => printExpenseReceipt(selectedExpense)}
                    className="flex-1 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors flex items-center justify-center gap-2"
                  >
                    <Printer className="w-4 h-4" />
                    Imprimer Reçu
                  </button>
                )}
                {isAdmin &&
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
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
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
    </div>
  );
}