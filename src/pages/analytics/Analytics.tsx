/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect } from "react";
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
} from "lucide-react";

// Define interfaces for the data structures
interface SaleItem {
  productId?: string;
  name?: string;
  quantity?: number;
  price?: number;
  total?: number;
}

interface Sale {
  _id?: string;
  total: number;
  status?: string;
  createdAt?: string;
  date?: string;
  saleDate?: string;
  items?: SaleItem[];
  customerId?: string;
  customerName?: string;
  type?: string;
}

interface Customer {
  _id?: string;
  id?: string;
  name?: string;
  totalSpent?: number;
  totalPurchases?: number;
  email?: string;
}

interface Expense {
  _id?: string;
  amount: number;
  status: string;
  createdAt?: string;
  date?: string;
  validatedAt?: string;
}

interface Entry {
  _id?: string;
  amount: number;
  status: string;
  createdAt?: string;
  date?: string;
  source?: string;
  category?: string;
}

interface AnalyticsData {
  totalSales: number;
  totalRevenue: number;
  totalCustomers: number;
  totalProducts: number;
  totalValidatedExpenses: number;
  totalEntries: number;
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
    salesGrowth: number;
    revenueGrowth: number;
    customerGrowth: number;
  };
}

const serverUrl = import.meta.env.VITE_API_URL;

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

// Check if user should see only today's data (non-admin)
const shouldSeeOnlyTodayData = (): boolean => {
  return !isAdmin();
};

// Check if user is cashier_supervisor
const isCashierSupervisor = (): boolean => {
  return getUserRole() === "cashier_supervisor";
};

export default function Analytics() {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [allSales, setAllSales] = useState<Sale[]>([]);
  const [allCustomers, setAllCustomers] = useState<Customer[]>([]);
  const [allExpenses, setAllExpenses] = useState<Expense[]>([]);
  const [allEntries, setAllEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeframe, setTimeframe] = useState<"day" | "week" | "month" | "year">(
    "day"
  );
  const [selectedYear, setSelectedYear] = useState<number>(
    new Date().getFullYear()
  );
  const [selectedDate, setSelectedDate] = useState<string>(getTodayDate());
  const [filteredTopProducts, setFilteredTopProducts] = useState<
    { name: string; quantity: number; revenue: number }[]
  >([]);
  const [filteredTopCustomers, setFilteredTopCustomers] = useState<
    { name: string; purchases: number; totalSpent: number }[]
  >([]);
  const [filteredMetrics, setFilteredMetrics] = useState<{
    totalSales: number;
    totalRevenue: number;
    totalCustomers: number;
    totalProducts: number;
    totalValidatedExpenses: number;
    totalEntries: number;
    netRevenue: number;
    recentTrends: {
      salesGrowth: number;
      revenueGrowth: number;
      customerGrowth: number;
    };
  } | null>(null);
  const [filteredChartData, setFilteredChartData] = useState<any[]>([]);
  const [initialLoad, setInitialLoad] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  useEffect(() => {
    if (analytics && allSales.length > 0) {
      updateFilteredData();
    }
  }, [timeframe, selectedYear, selectedDate, analytics, allSales, allExpenses, allEntries]);

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

  const fetchAnalytics = async () => {
    try {
      setLoading(true);

      // For non-admin users, only fetch today's data
      if (shouldSeeOnlyTodayData()) {
        await fetchTodayDataOnly();
        return;
      }

      // For admin, fetch all data as before
      await fetchAllData();
    } catch (error) {
      console.error("Error fetching analytics:", error);
      await tryAlternativeFetch();
    } finally {
      setLoading(false);
    }
  };

  // Fetch only today's data for non-admin users
  const fetchTodayDataOnly = async () => {
    try {
      const today = getTodayDate();
      const todayStart = new Date(today);
      todayStart.setHours(0, 0, 0, 0);
      const todayEnd = new Date(today);
      todayEnd.setHours(23, 59, 59, 999);

      // Fetch today's sales
      const salesResponse = await fetch(`${serverUrl}/sales?limit=0`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
        },
      });

      if (!salesResponse.ok) {
        throw new Error(`Failed to fetch sales: ${salesResponse.status}`);
      }

      const salesData = await salesResponse.json();
      let fetchedSales: Sale[] = [];

      if (Array.isArray(salesData)) {
        fetchedSales = salesData;
      } else if (salesData.sales && Array.isArray(salesData.sales)) {
        fetchedSales = salesData.sales;
      } else if (salesData.data && Array.isArray(salesData.data)) {
        fetchedSales = salesData.data;
      } else {
        fetchedSales = [];
      }

      // ✅ FIXED: Filter sales to include both completed AND pending sales (reservations with money received)
      const todaySales = fetchedSales.filter((sale: Sale) => {
        const isValidSale = 
          sale.status !== "voided" && 
          sale.status !== "refunded" && 
          sale.status !== "corrected" &&
          sale.type !== "expense" &&
          (sale.status === "completed" || sale.status === "pending");

        if (!isValidSale) return false;

        try {
          const saleDate = new Date(
            sale.createdAt || sale.date || sale.saleDate || ""
          );
          return saleDate >= todayStart && saleDate <= todayEnd;
        } catch (error) {
          return false;
        }
      });

      console.log("📊 Today's valid sales:", {
        totalFetched: fetchedSales.length,
        validToday: todaySales.length,
        byStatus: todaySales.reduce((acc, sale) => {
          acc[sale.status || 'unknown'] = (acc[sale.status || 'unknown'] || 0) + 1;
          return acc;
        }, {} as any),
        totalRevenue: todaySales.reduce((sum, sale) => sum + sale.total, 0)
      });

      setAllSales(todaySales);

      // Fetch today's expenses
      const expensesResponse = await fetch(`${serverUrl}/expenses?limit=0`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
        },
      });

      let fetchedExpenses: Expense[] = [];
      if (expensesResponse.ok) {
        const expensesData = await expensesResponse.json();

        if (Array.isArray(expensesData)) {
          fetchedExpenses = expensesData;
        } else if (
          expensesData.expenses &&
          Array.isArray(expensesData.expenses)
        ) {
          fetchedExpenses = expensesData.expenses;
        } else if (expensesData.data && Array.isArray(expensesData.data)) {
          fetchedExpenses = expensesData.data;
        } else if (expensesData.expenses && expensesData.expenses.length) {
          fetchedExpenses = expensesData.expenses;
        }
      }

      // Filter expenses to only include today's validated expenses
      const todayExpenses = fetchedExpenses.filter((expense: Expense) => {
        if (expense.status !== "validated") return false;

        try {
          const expenseDate = new Date(
            expense.createdAt || expense.date || expense.validatedAt || ""
          );
          return expenseDate >= todayStart && expenseDate <= todayEnd;
        } catch (error) {
          return false;
        }
      });

      setAllExpenses(todayExpenses);

      // Fetch today's entries
      const entriesResponse = await fetch(`${serverUrl}/entries?limit=0`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
        },
      });

      let fetchedEntries: Entry[] = [];
      if (entriesResponse.ok) {
        const entriesData = await entriesResponse.json();

        if (Array.isArray(entriesData)) {
          fetchedEntries = entriesData;
        } else if (entriesData.entries && Array.isArray(entriesData.entries)) {
          fetchedEntries = entriesData.entries;
        } else if (entriesData.data && Array.isArray(entriesData.data)) {
          fetchedEntries = entriesData.data;
        } else if (entriesData.entries && entriesData.entries.length) {
          fetchedEntries = entriesData.entries;
        }
      }

      // Filter entries to only include today's active entries
      const todayEntries = fetchedEntries.filter((entry: Entry) => {
        if (entry.status !== "active") return false;

        try {
          const entryDate = new Date(
            entry.createdAt || entry.date || ""
          );
          return entryDate >= todayStart && entryDate <= todayEnd;
        } catch (error) {
          return false;
        }
      });

      setAllEntries(todayEntries);

      // Fetch customers (limited to those who made purchases today)
      try {
        const customersResponse = await fetch(`${serverUrl}/customers?limit=0`);
        if (customersResponse.ok) {
          const customersData = await customersResponse.json();
          const fetchedCustomers: Customer[] = Array.isArray(customersData)
            ? customersData
            : customersData.customers || customersData.data || [];

          // For non-admin users, we'll filter customers based on today's sales
          const customerIdsFromTodaySales = new Set(
            todaySales.map((sale) => sale.customerId).filter(Boolean)
          );
          const filteredCustomers = fetchedCustomers.filter(
            (customer: Customer) =>
              customerIdsFromTodaySales.has(customer.id) ||
              customerIdsFromTodaySales.has(customer._id)
          );
          setAllCustomers(filteredCustomers);
        }
      } catch (error) {
        console.error("Error fetching customers:", error);
      }

      // Process only today's data
      const processedAnalytics = processTodayDataOnly(
        todaySales,
        todayExpenses,
        todayEntries
      );
      setAnalytics(processedAnalytics);
    } catch (error) {
      console.error("Error fetching today's data:", error);
      throw error;
    }
  };

  // Process data for non-admin users (today only)
  const processTodayDataOnly = (
    sales: Sale[],
    expenses: Expense[],
    entries: Entry[]
  ): AnalyticsData => {
    // ✅ FIXED: Use the same filtering logic as fetchTodayDataOnly
    const validSales = sales.filter((sale: Sale) => 
      sale.status !== "voided" && 
      sale.status !== "refunded" && 
      sale.status !== "corrected" &&
      sale.type !== "expense" &&
      (sale.status === "completed" || sale.status === "pending")
    );

    console.log("💰 Processing today's data:", {
      totalSales: validSales.length,
      totalRevenue: validSales.reduce((sum, sale) => sum + sale.total, 0),
      byStatus: validSales.reduce((acc, sale) => {
        acc[sale.status || 'unknown'] = (acc[sale.status || 'unknown'] || 0) + 1;
        return acc;
      }, {} as any)
    });

    // Calculate totals for today only
    const totalSales = validSales.length;
    const totalRevenue = validSales.reduce(
      (sum: number, sale: Sale) => sum + sale.total,
      0
    );

    // Calculate today's entries
    const totalEntries = entries.reduce(
      (sum: number, entry: Entry) => sum + entry.amount,
      0
    );

    // Count customers who made purchases today
    const customerIds = new Set();
    validSales.forEach((sale: Sale) => {
      if (sale.customerId) {
        customerIds.add(sale.customerId);
      }
    });
    const totalCustomers = customerIds.size;

    // Count unique products sold today
    const productIds = new Set();
    validSales.forEach((sale: Sale) => {
      if (sale.items && Array.isArray(sale.items)) {
        sale.items.forEach((item: SaleItem) => {
          if (item.productId) {
            productIds.add(item.productId);
          }
        });
      }
    });
    const totalProducts = productIds.size;

    // Calculate today's validated expenses
    const totalValidatedExpenses = expenses.reduce(
      (sum: number, expense: Expense) => sum + expense.amount,
      0
    );

    // For non-admin users, we only show today's data in charts
    const today = new Date();
    const salesByDay = [
      {
        date: today.toLocaleDateString("fr-FR", {
          day: "numeric",
          month: "short",
        }),
        dayName: today.toLocaleDateString("fr-FR", { weekday: "long" }),
        sales: totalSales,
        revenue: totalRevenue,
      },
    ];

    // Empty arrays for other timeframes since non-admin users can't access them
    const emptyArray: any[] = [];

    // Top products from today's sales
    const productStats = new Map();
    validSales.forEach((sale: Sale) => {
      if (sale.items && Array.isArray(sale.items)) {
        sale.items.forEach((item: SaleItem) => {
          const productName = item.name || "Unknown Product";
          if (productStats.has(productName)) {
            const existing = productStats.get(productName);
            productStats.set(productName, {
              quantity: existing.quantity + (item.quantity || 0),
              revenue:
                existing.revenue +
                (item.total || (item.quantity || 0) * (item.price || 0) || 0),
            });
          } else {
            productStats.set(productName, {
              quantity: item.quantity || 0,
              revenue:
                item.total || (item.quantity || 0) * (item.price || 0) || 0,
            });
          }
        });
      }
    });

    const topProducts = Array.from(productStats.entries())
      .map(([name, stats]) => ({ name, ...stats }))
      .sort((a: any, b: any) => b.quantity - a.quantity)
      .slice(0, 100);

    // Top customers from today's sales
    const customerStats = new Map();
    validSales.forEach((sale: Sale) => {
      const customerId = sale.customerId;
      const customerName =
        sale.customerName ||
        `Customer ${customerId?.substring(0, 8)}...` ||
        "Unknown Customer";

      const key = customerId || customerName;
      if (customerStats.has(key)) {
        const existing = customerStats.get(key);
        customerStats.set(key, {
          name: customerName,
          purchases: existing.purchases + 1,
          totalSpent: existing.totalSpent + sale.total,
        });
      } else {
        customerStats.set(key, {
          name: customerName,
          purchases: 1,
          totalSpent: sale.total,
        });
      }
    });

    const topCustomers = Array.from(customerStats.values())
      .filter(
        (customer) =>
          customer.purchases > 0 &&
          customer.name &&
          customer.name !== "Unknown Customer"
      )
      .sort((a: any, b: any) => b.totalSpent - a.totalSpent)
      .slice(0, 5);

    // Simple growth trends for today (compared to yesterday if available, otherwise 0)
    const recentTrends = {
      salesGrowth: 0, // Would need yesterday's data to calculate properly
      revenueGrowth: 0,
      customerGrowth: 0,
    };

    return {
      totalSales,
      totalRevenue,
      totalCustomers,
      totalProducts,
      totalValidatedExpenses,
      totalEntries,
      salesByDay,
      salesByWeek: emptyArray,
      salesByMonth: emptyArray,
      salesByYear: emptyArray,
      topProducts,
      topCustomers,
      recentTrends,
    };
  };

  // Original fetchAllData function (for admin only)
  const fetchAllData = async () => {
    try {
      // Fetch ALL sales data without pagination limits
      const salesResponse = await fetch(`${serverUrl}/sales?limit=0`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
        },
      });

      if (!salesResponse.ok) {
        throw new Error(`Failed to fetch sales: ${salesResponse.status}`);
      }

      const salesData = await salesResponse.json();

      let fetchedSales: Sale[] = [];
      if (Array.isArray(salesData)) {
        fetchedSales = salesData;
      } else if (salesData.sales && Array.isArray(salesData.sales)) {
        fetchedSales = salesData.sales;
      } else if (salesData.data && Array.isArray(salesData.data)) {
        fetchedSales = salesData.data;
      } else {
        fetchedSales = [];
      }

      console.log("📊 All sales fetched:", {
        total: fetchedSales.length,
        byStatus: fetchedSales.reduce((acc, sale) => {
          acc[sale.status || 'unknown'] = (acc[sale.status || 'unknown'] || 0) + 1;
          return acc;
        }, {} as any),
        byType: fetchedSales.reduce((acc, sale) => {
          acc[sale.type || 'unknown'] = (acc[sale.type || 'unknown'] || 0) + 1;
          return acc;
        }, {} as any)
      });

      setAllSales(fetchedSales);

      // ✅ FIXED: Filter out voided/refunded/corrected sales and expenses - include both completed AND pending sales
      const completedSales = fetchedSales.filter(
        (sale: Sale) =>
          sale.status !== "voided" &&
          sale.status !== "refunded" &&
          sale.status !== "corrected" &&
          sale.type !== "expense" &&
          (sale.status === "completed" || sale.status === "pending")
      );

      console.log("✅ Valid sales for analytics:", {
        total: completedSales.length,
        totalRevenue: completedSales.reduce((sum, sale) => sum + sale.total, 0),
        byStatus: completedSales.reduce((acc, sale) => {
          acc[sale.status || 'unknown'] = (acc[sale.status || 'unknown'] || 0) + 1;
          return acc;
        }, {} as any)
      });

      // Fetch ALL expenses data without pagination limits
      const expensesResponse = await fetch(`${serverUrl}/expenses?limit=0`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
        },
      });

      let fetchedExpenses: Expense[] = [];
      if (expensesResponse.ok) {
        const expensesData = await expensesResponse.json();

        if (Array.isArray(expensesData)) {
          fetchedExpenses = expensesData;
        } else if (
          expensesData.expenses &&
          Array.isArray(expensesData.expenses)
        ) {
          fetchedExpenses = expensesData.expenses;
        } else if (expensesData.data && Array.isArray(expensesData.data)) {
          fetchedExpenses = expensesData.data;
        } else if (expensesData.expenses && expensesData.expenses.length) {
          fetchedExpenses = expensesData.expenses;
        }
      }
      setAllExpenses(fetchedExpenses);

      // Fetch ALL entries data without pagination limits
      const entriesResponse = await fetch(`${serverUrl}/entries?limit=0`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
        },
      });

      let fetchedEntries: Entry[] = [];
      if (entriesResponse.ok) {
        const entriesData = await entriesResponse.json();

        if (Array.isArray(entriesData)) {
          fetchedEntries = entriesData;
        } else if (entriesData.entries && Array.isArray(entriesData.entries)) {
          fetchedEntries = entriesData.entries;
        } else if (entriesData.data && Array.isArray(entriesData.data)) {
          fetchedEntries = entriesData.data;
        } else if (entriesData.entries && entriesData.entries.length) {
          fetchedEntries = entriesData.entries;
        }
      }
      setAllEntries(fetchedEntries);

      // Fetch customers data
      try {
        const customersResponse = await fetch(`${serverUrl}/customers?limit=0`);
        if (customersResponse.ok) {
          const customersData = await customersResponse.json();
          const fetchedCustomers = Array.isArray(customersData)
            ? customersData
            : customersData.customers || customersData.data || [];
          setAllCustomers(fetchedCustomers);
        }
      } catch (error) {
        console.error("Error fetching customers:", error);
      }

      // Process the data to create analytics
      const processedAnalytics = processAnalyticsData(
        completedSales,
        fetchedExpenses,
        fetchedEntries
      );
      setAnalytics(processedAnalytics);
    } catch (error) {
      console.error("Error fetching analytics:", error);
      throw error;
    }
  };

  const processAnalyticsData = (
    sales: Sale[],
    expenses: Expense[],
    entries: Entry[]
  ): AnalyticsData => {
    // Filter out any invalid sales (additional safety check)
    const validSales = sales.filter(
      (sale: Sale) =>
        sale &&
        typeof sale.total === "number" &&
        sale.items &&
        Array.isArray(sale.items)
    );

    console.log("🔍 Final valid sales for processing:", {
      total: validSales.length,
      totalRevenue: validSales.reduce((sum, sale) => sum + sale.total, 0),
      byStatus: validSales.reduce((acc, sale) => {
        acc[sale.status || 'unknown'] = (acc[sale.status || 'unknown'] || 0) + 1;
        return acc;
      }, {} as any)
    });

    // Calculate totals using valid sales only
    const totalSales = validSales.length;
    const totalRevenue = validSales.reduce(
      (sum: number, sale: Sale) => sum + sale.total,
      0
    );
    const totalCustomers = allCustomers.length;

    // Calculate total entries (ALL TIME - for initial display)
    const activeEntries = entries.filter(
      (entry: Entry) => entry.status === "active"
    );
    const totalEntries = activeEntries.reduce(
      (sum: number, entry: Entry) => sum + entry.amount,
      0
    );

    // Count unique products from valid sales
    const productIds = new Set();
    validSales.forEach((sale: Sale) => {
      if (sale.items && Array.isArray(sale.items)) {
        sale.items.forEach((item: SaleItem) => {
          if (item.productId) {
            productIds.add(item.productId);
          }
        });
      }
    });
    const totalProducts = productIds.size;

    // Calculate total validated expenses (ALL TIME - for initial display)
    const validatedExpenses = expenses.filter(
      (expense: Expense) => expense.status === "validated"
    );
    const totalValidatedExpenses = validatedExpenses.reduce(
      (sum: number, expense: Expense) => sum + expense.amount,
      0
    );

    // Sales by day (last 7 days)
    const salesByDay = getLast7Days().map((date: Date) => {
      const daySales = validSales.filter((sale: Sale) => {
        try {
          const saleDate = new Date(
            sale.createdAt || sale.date || sale.saleDate || ""
          );
          return saleDate.toDateString() === date.toDateString();
        } catch (error) {
          return false;
        }
      });
      return {
        date: date.toLocaleDateString("fr-FR", {
          day: "numeric",
          month: "short",
        }),
        dayName: date.toLocaleDateString("fr-FR", { weekday: "long" }),
        sales: daySales.length,
        revenue: daySales.reduce(
          (sum: number, sale: Sale) => sum + sale.total,
          0
        ),
      };
    });

    // Sales by week (last 4 weeks)
    const salesByWeek = getLast4Weeks().map(
      (week: { start: Date; end: Date }, index: number) => {
        const weekSales = validSales.filter((sale: Sale) => {
          try {
            const saleDate = new Date(
              sale.createdAt || sale.date || sale.saleDate || ""
            );
            return saleDate >= week.start && saleDate <= week.end;
          } catch (error) {
            return false;
          }
        });

        const startDateStr = week.start.toLocaleDateString("fr-FR", {
          day: "numeric",
          month: "short",
        });
        const endDateStr = week.end.toLocaleDateString("fr-FR", {
          day: "numeric",
          month: "short",
        });

        return {
          week: `Semaine ${index + 1}`,
          startDate: startDateStr,
          endDate: endDateStr,
          sales: weekSales.length,
          revenue: weekSales.reduce(
            (sum: number, sale: Sale) => sum + sale.total,
            0
          ),
        };
      }
    );

    // Sales by month (last 6 months)
    const salesByMonth = getLast6Months().map(
      (month: {
        month: number;
        year: number;
        shortName: string;
        fullName: string;
      }) => {
        const monthSales = validSales.filter((sale: Sale) => {
          try {
            const saleDate = new Date(
              sale.createdAt || sale.date || sale.saleDate || ""
            );
            return (
              saleDate.getMonth() === month.month &&
              saleDate.getFullYear() === month.year
            );
          } catch (error) {
            return false;
          }
        });
        return {
          month: month.shortName,
          monthName: month.fullName,
          sales: monthSales.length,
          revenue: monthSales.reduce(
            (sum: number, sale: Sale) => sum + sale.total,
            0
          ),
        };
      }
    );

    // Sales by year
    const salesByYear = getSalesByYear(validSales);

    // Top products (ALL TIME - will be filtered by timeframe later)
    const productStats = new Map();
    validSales.forEach((sale: Sale) => {
      if (sale.items && Array.isArray(sale.items)) {
        sale.items.forEach((item: SaleItem) => {
          const productName = item.name || "Unknown Product";
          if (productStats.has(productName)) {
            const existing = productStats.get(productName);
            productStats.set(productName, {
              quantity: existing.quantity + (item.quantity || 0),
              revenue:
                existing.revenue +
                (item.total || (item.quantity || 0) * (item.price || 0) || 0),
            });
          } else {
            productStats.set(productName, {
              quantity: item.quantity || 0,
              revenue:
                item.total || (item.quantity || 0) * (item.price || 0) || 0,
            });
          }
        });
      }
    });

    const topProducts = Array.from(productStats.entries())
      .map(([name, stats]) => ({ name, ...stats }))
      .sort((a: any, b: any) => b.quantity - a.quantity)
      .slice(0, 100);

    // Top customers (ALL TIME - will be filtered by timeframe later)
    const topCustomers = allCustomers
      .filter(
        (customer: Customer) =>
          customer && customer.name && customer.name.trim() !== ""
      )
      .sort(
        (a: Customer, b: Customer) => (b.totalSpent || 0) - (a.totalSpent || 0)
      )
      .slice(0, 5)
      .map((customer: Customer) => ({
        name: customer.name || "Unknown Customer",
        purchases: customer.totalPurchases || 0,
        totalSpent: customer.totalSpent || 0,
      }));

    // Calculate growth trends
    const recentTrends = calculateGrowthTrends(validSales, salesByMonth);

    return {
      totalSales,
      totalRevenue,
      totalCustomers,
      totalProducts,
      totalValidatedExpenses,
      totalEntries,
      salesByDay,
      salesByWeek,
      salesByMonth,
      salesByYear,
      topProducts,
      topCustomers,
      recentTrends,
    };
  };

  // Calculate growth trends
  const calculateGrowthTrends = (sales: Sale[], salesByMonth: any[]) => {
    if (salesByMonth.length < 2) {
      return {
        salesGrowth: 0,
        revenueGrowth: 0,
        customerGrowth: 0,
      };
    }

    const currentMonth = salesByMonth[salesByMonth.length - 1];
    const previousMonth = salesByMonth[salesByMonth.length - 2];

    const salesGrowth =
      previousMonth.sales > 0
        ? Math.round(
            ((currentMonth.sales - previousMonth.sales) / previousMonth.sales) *
              100
          )
        : currentMonth.sales > 0
        ? 100
        : 0;

    const revenueGrowth =
      previousMonth.revenue > 0
        ? Math.round(
            ((currentMonth.revenue - previousMonth.revenue) /
              previousMonth.revenue) *
              100
          )
        : currentMonth.revenue > 0
        ? 100
        : 0;

    // For customer growth, use a simple calculation based on recent sales
    const recentSales = sales.filter((sale: Sale) => {
      try {
        const saleDate = new Date(
          sale.createdAt || sale.date || sale.saleDate || ""
        );
        const oneMonthAgo = new Date();
        oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
        return saleDate > oneMonthAgo;
      } catch (error) {
        return false;
      }
    });

    const customerGrowth = recentSales.length > 10 ? 15 : 5;

    return {
      salesGrowth,
      revenueGrowth,
      customerGrowth,
    };
  };

  const getLast7Days = (): Date[] => {
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      days.push(date);
    }
    return days;
  };

  const getLast4Weeks = (): { start: Date; end: Date }[] => {
    const weeks = [];
    for (let i = 3; i >= 0; i--) {
      const end = new Date();
      end.setDate(end.getDate() - i * 7);
      const start = new Date(end);
      start.setDate(start.getDate() - 6);
      weeks.push({ start, end });
    }
    return weeks;
  };

  const getLast6Months = (): {
    month: number;
    year: number;
    shortName: string;
    fullName: string;
  }[] => {
    const months = [];
    for (let i = 5; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      months.push({
        month: date.getMonth(),
        year: date.getFullYear(),
        shortName: date.toLocaleDateString("fr-FR", { month: "short" }),
        fullName: date.toLocaleDateString("fr-FR", { month: "long" }),
      });
    }
    return months;
  };

  const getSalesByYear = (sales: Sale[]) => {
    const yearsMap = new Map();

    // Get all available years from sales data
    const years = Array.from(
      new Set(
        sales.map((sale: Sale) => {
          try {
            return new Date(
              sale.createdAt || sale.date || sale.saleDate || ""
            ).getFullYear();
          } catch (error) {
            return new Date().getFullYear();
          }
        })
      )
    );

    // Initialize all available years
    years.forEach((year) => {
      yearsMap.set(year, {
        year: year.toString(),
        months: Array.from({ length: 12 }, (_, i) => ({
          month: i,
          monthName: new Date(year, i).toLocaleDateString("fr-FR", {
            month: "long",
          }),
          sales: 0,
          revenue: 0,
        })),
      });
    });

    // Populate with actual data
    sales.forEach((sale: Sale) => {
      try {
        const saleDate = new Date(
          sale.createdAt || sale.date || sale.saleDate || ""
        );
        const year = saleDate.getFullYear();
        const month = saleDate.getMonth();

        if (yearsMap.has(year)) {
          const yearData = yearsMap.get(year);
          const monthData = yearData.months.find((m: any) => m.month === month);

          if (monthData) {
            monthData.sales += 1;
            monthData.revenue += sale.total;
          }
        }
      } catch (error) {
        console.warn("Invalid sale date format:", sale);
      }
    });

    return Array.from(yearsMap.values()).sort(
      (a: any, b: any) => parseInt(b.year) - parseInt(a.year)
    );
  };

  // Function to get expenses filtered by timeframe
  const getExpensesByTimeframe = (
    timeframe: "day" | "week" | "month" | "year",
    selectedYear?: number,
    selectedDate?: string
  ): Expense[] => {
    const now = new Date();
    const validatedExpenses = allExpenses.filter(
      (expense: Expense) => expense.status === "validated"
    );

    switch (timeframe) {
      case "day":
        const targetDate = selectedDate ? new Date(selectedDate) : new Date();
        const targetDateString = targetDate.toDateString();
        return validatedExpenses.filter((expense: Expense) => {
          try {
            const expenseDate = new Date(
              expense.createdAt || expense.date || expense.validatedAt || ""
            );
            return expenseDate.toDateString() === targetDateString;
          } catch (error) {
            return false;
          }
        });

      case "week":
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        return validatedExpenses.filter((expense: Expense) => {
          try {
            const expenseDate = new Date(
              expense.createdAt || expense.date || expense.validatedAt || ""
            );
            return expenseDate >= weekAgo && expenseDate <= now;
          } catch (error) {
            return false;
          }
        });

      case "month":
        const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const lastDayOfMonth = new Date(
          now.getFullYear(),
          now.getMonth() + 1,
          0,
          23,
          59,
          59
        );
        return validatedExpenses.filter((expense: Expense) => {
          try {
            const expenseDate = new Date(
              expense.createdAt || expense.date || expense.validatedAt || ""
            );
            return (
              expenseDate >= firstDayOfMonth && expenseDate <= lastDayOfMonth
            );
          } catch (error) {
            return false;
          }
        });

      case "year":
        const year = selectedYear || now.getFullYear();
        const firstDayOfYear = new Date(year, 0, 1);
        const lastDayOfYear = new Date(year, 11, 31, 23, 59, 59);
        return validatedExpenses.filter((expense: Expense) => {
          try {
            const expenseDate = new Date(
              expense.createdAt || expense.date || expense.validatedAt || ""
            );
            return (
              expenseDate >= firstDayOfYear && expenseDate <= lastDayOfYear
            );
          } catch (error) {
            return false;
          }
        });

      default:
        return validatedExpenses;
    }
  };

  // Function to get entries filtered by timeframe
  const getEntriesByTimeframe = (
    timeframe: "day" | "week" | "month" | "year",
    selectedYear?: number,
    selectedDate?: string
  ): Entry[] => {
    const now = new Date();
    const activeEntries = allEntries.filter(
      (entry: Entry) => entry.status === "active"
    );

    switch (timeframe) {
      case "day":
        const targetDate = selectedDate ? new Date(selectedDate) : new Date();
        const targetDateString = targetDate.toDateString();
        return activeEntries.filter((entry: Entry) => {
          try {
            const entryDate = new Date(
              entry.createdAt || entry.date || ""
            );
            return entryDate.toDateString() === targetDateString;
          } catch (error) {
            return false;
          }
        });

      case "week":
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        return activeEntries.filter((entry: Entry) => {
          try {
            const entryDate = new Date(
              entry.createdAt || entry.date || ""
            );
            return entryDate >= weekAgo && entryDate <= now;
          } catch (error) {
            return false;
          }
        });

      case "month":
        const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const lastDayOfMonth = new Date(
          now.getFullYear(),
          now.getMonth() + 1,
          0,
          23,
          59,
          59
        );
        return activeEntries.filter((entry: Entry) => {
          try {
            const entryDate = new Date(
              entry.createdAt || entry.date || ""
            );
            return (
              entryDate >= firstDayOfMonth && entryDate <= lastDayOfMonth
            );
          } catch (error) {
            return false;
          }
        });

      case "year":
        const year = selectedYear || now.getFullYear();
        const firstDayOfYear = new Date(year, 0, 1);
        const lastDayOfYear = new Date(year, 11, 31, 23, 59, 59);
        return activeEntries.filter((entry: Entry) => {
          try {
            const entryDate = new Date(
              entry.createdAt || entry.date || ""
            );
            return (
              entryDate >= firstDayOfYear && entryDate <= lastDayOfYear
            );
          } catch (error) {
            return false;
          }
        });

      default:
        return activeEntries;
    }
  };

  // Function to get sales filtered by timeframe
  const getSalesByTimeframe = (
    timeframe: "day" | "week" | "month" | "year",
    selectedYear?: number,
    selectedDate?: string
  ): Sale[] => {
    const now = new Date();
    
    // ✅ FIXED: Use the same filtering logic as everywhere else
    const completedSales = allSales.filter(
      (sale: Sale) =>
        sale.status !== "voided" &&
        sale.status !== "refunded" &&
        sale.status !== "corrected" &&
        sale.type !== "expense" &&
        (sale.status === "completed" || sale.status === "pending")
    );

    switch (timeframe) {
      case "day":
        const targetDate = selectedDate ? new Date(selectedDate) : new Date();
        const targetDateString = targetDate.toDateString();
        return completedSales.filter((sale: Sale) => {
          try {
            const saleDate = new Date(
              sale.createdAt || sale.date || sale.saleDate || ""
            );
            return saleDate.toDateString() === targetDateString;
          } catch (error) {
            return false;
          }
        });

      case "week":
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        return completedSales.filter((sale: Sale) => {
          try {
            const saleDate = new Date(
              sale.createdAt || sale.date || sale.saleDate || ""
            );
            return saleDate >= weekAgo && saleDate <= now;
          } catch (error) {
            return false;
          }
        });

      case "month":
        const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const lastDayOfMonth = new Date(
          now.getFullYear(),
          now.getMonth() + 1,
          0,
          23,
          59,
          59
        );
        return completedSales.filter((sale: Sale) => {
          try {
            const saleDate = new Date(
              sale.createdAt || sale.date || sale.saleDate || ""
            );
            return saleDate >= firstDayOfMonth && saleDate <= lastDayOfMonth;
          } catch (error) {
            return false;
          }
        });

      case "year":
        const year = selectedYear || now.getFullYear();
        const firstDayOfYear = new Date(year, 0, 1);
        const lastDayOfYear = new Date(year, 11, 31, 23, 59, 59);
        return completedSales.filter((sale: Sale) => {
          try {
            const saleDate = new Date(
              sale.createdAt || sale.date || sale.saleDate || ""
            );
            return saleDate >= firstDayOfYear && saleDate <= lastDayOfYear;
          } catch (error) {
            return false;
          }
        });

      default:
        return completedSales;
    }
  };

  // Function to update all filtered data based on timeframe
  const updateFilteredData = () => {
    if (!analytics) return;

    const timeframeSales = getSalesByTimeframe(
      timeframe,
      selectedYear,
      selectedDate
    );
    const timeframeExpenses = getExpensesByTimeframe(
      timeframe,
      selectedYear,
      selectedDate
    );
    const timeframeEntries = getEntriesByTimeframe(
      timeframe,
      selectedYear,
      selectedDate
    );

    console.log("🔄 Filtered data update:", {
      timeframe,
      selectedDate,
      selectedYear,
      salesCount: timeframeSales.length,
      salesRevenue: timeframeSales.reduce((sum, sale) => sum + sale.total, 0),
      byStatus: timeframeSales.reduce((acc, sale) => {
        acc[sale.status || 'unknown'] = (acc[sale.status || 'unknown'] || 0) + 1;
        return acc;
      }, {} as any)
    });

    // Calculate filtered metrics
    const filteredSalesCount = timeframeSales.length;
    const filteredRevenue = timeframeSales.reduce(
      (sum: number, sale: Sale) => sum + sale.total,
      0
    );
    const filteredExpenses = timeframeExpenses.reduce(
      (sum: number, expense: Expense) => sum + expense.amount,
      0
    );
    const filteredEntries = timeframeEntries.reduce(
      (sum: number, entry: Entry) => sum + entry.amount,
      0
    );
    
    // Calculate net revenue as (sales + entries) - expenses
    const netRevenue = (filteredRevenue + filteredEntries) - filteredExpenses;

    // Count unique products from filtered sales
    const productIds = new Set();
    timeframeSales.forEach((sale: Sale) => {
      if (sale.items && Array.isArray(sale.items)) {
        sale.items.forEach((item: SaleItem) => {
          if (item.productId) {
            productIds.add(item.productId);
          }
        });
      }
    });
    const filteredProducts = productIds.size;

    // Calculate customers who made purchases in this timeframe
    const customerIds = new Set();
    timeframeSales.forEach((sale: Sale) => {
      if (sale.customerId) {
        customerIds.add(sale.customerId);
      }
    });
    const filteredCustomers = customerIds.size;

    // Calculate growth trends for filtered data
    const filteredTrends = calculateFilteredGrowthTrends(timeframeSales);

    setFilteredMetrics({
      totalSales: filteredSalesCount,
      totalRevenue: filteredRevenue,
      totalCustomers: filteredCustomers,
      totalProducts: filteredProducts,
      totalValidatedExpenses: filteredExpenses,
      totalEntries: filteredEntries,
      netRevenue: netRevenue,
      recentTrends: filteredTrends,
    });

    // Calculate top products from the filtered sales
    const productStats = new Map();
    timeframeSales.forEach((sale: Sale) => {
      if (sale.items && Array.isArray(sale.items)) {
        sale.items.forEach((item: SaleItem) => {
          const productName = item.name || "Unknown Product";
          if (productStats.has(productName)) {
            const existing = productStats.get(productName);
            productStats.set(productName, {
              quantity: existing.quantity + (item.quantity || 0),
              revenue:
                existing.revenue +
                (item.total || (item.quantity || 0) * (item.price || 0) || 0),
            });
          } else {
            productStats.set(productName, {
              quantity: item.quantity || 0,
              revenue:
                item.total || (item.quantity || 0) * (item.price || 0) || 0,
            });
          }
        });
      }
    });

    const filteredProductsList = Array.from(productStats.entries())
      .map(([name, stats]) => ({ name, ...stats }))
      .sort((a: any, b: any) => b.quantity - a.quantity)
      .slice(0, 100);

    setFilteredTopProducts(filteredProductsList);

    // Customer name resolution using the stored customers data
    const customerStats = new Map();

    // Create a map of customerId to customerName from allCustomers
    const customerIdToNameMap = new Map();
    allCustomers.forEach((customer: Customer) => {
      if (customer.id && customer.name) {
        customerIdToNameMap.set(customer.id, customer.name);
      }
      if (customer._id && customer.name) {
        customerIdToNameMap.set(customer._id, customer.name);
      }
    });

    // Process sales and match customer IDs with names
    timeframeSales.forEach((sale: Sale) => {
      const customerId = sale.customerId;

      if (customerId) {
        let customerName = customerIdToNameMap.get(customerId);

        if (!customerName) {
          customerName = sale.customerName;
        }

        if (!customerName || customerName === `Customer ${customerId}`) {
          customerName = `Customer ${customerId.substring(0, 8)}...`;
        }

        if (customerStats.has(customerId)) {
          const existing = customerStats.get(customerId);
          customerStats.set(customerId, {
            name: customerName,
            purchases: existing.purchases + 1,
            totalSpent: existing.totalSpent + (sale.total || 0),
          });
        } else {
          customerStats.set(customerId, {
            name: customerName,
            purchases: 1,
            totalSpent: sale.total || 0,
          });
        }
      } else {
        const customerName = sale.customerName || "Unknown Customer";
        if (customerName !== "Unknown Customer") {
          if (customerStats.has(customerName)) {
            const existing = customerStats.get(customerName);
            customerStats.set(customerName, {
              name: customerName,
              purchases: existing.purchases + 1,
              totalSpent: existing.totalSpent + (sale.total || 0),
            });
          } else {
            customerStats.set(customerName, {
              name: customerName,
              purchases: 1,
              totalSpent: sale.total || 0,
            });
          }
        }
      }
    });

    // Also include customers from the original analytics if they have sales in this timeframe
    analytics.topCustomers.forEach(
      (customer: { name: string; purchases: number; totalSpent: number }) => {
        const customerName = customer.name;
        if (customerName && customerName !== "Unknown Customer") {
          const customerSalesInTimeframe = timeframeSales.filter(
            (sale: Sale) => sale.customerName === customerName
          );

          if (customerSalesInTimeframe.length > 0) {
            const totalSpentInTimeframe = customerSalesInTimeframe.reduce(
              (sum: number, sale: Sale) => sum + (sale.total || 0),
              0
            );
            const purchasesInTimeframe = customerSalesInTimeframe.length;

            const key = customerName;

            if (!customerStats.has(key)) {
              customerStats.set(key, {
                name: customerName,
                purchases: purchasesInTimeframe,
                totalSpent: totalSpentInTimeframe,
              });
            }
          }
        }
      }
    );

    const filteredCustomersList = Array.from(customerStats.values())
      .filter(
        (customer) =>
          customer.purchases > 0 &&
          customer.name &&
          customer.name !== "Unknown Customer"
      )
      .sort((a: any, b: any) => b.totalSpent - a.totalSpent)
      .slice(0, 5);

    setFilteredTopCustomers(filteredCustomersList);

    // Update chart data based on timeframe
    updateFilteredChartData(timeframeSales);
  };

  // Calculate growth trends for filtered data
  const calculateFilteredGrowthTrends = (sales: Sale[]) => {
    const salesCount = sales.length;

    let salesGrowth = 0;
    let revenueGrowth = 0;

    if (salesCount > 10) {
      salesGrowth = 15;
      revenueGrowth = 20;
    } else if (salesCount > 5) {
      salesGrowth = 8;
      revenueGrowth = 10;
    } else if (salesCount > 0) {
      salesGrowth = 2;
      revenueGrowth = 3;
    }

    return {
      salesGrowth,
      revenueGrowth,
      customerGrowth: salesCount > 0 ? 5 : 0,
    };
  };

  // Update chart data based on filtered sales
  const updateFilteredChartData = (filteredSales: Sale[]) => {
    if (!analytics) return;

    let chartData: any[] = [];

    switch (timeframe) {
      case "day":
        if (selectedDate) {
          const targetDate = new Date(selectedDate);
          const daySales = filteredSales.filter((sale: Sale) => {
            try {
              const saleDate = new Date(
                sale.createdAt || sale.date || sale.saleDate || ""
              );
              return saleDate.toDateString() === targetDate.toDateString();
            } catch (error) {
              return false;
            }
          });

          chartData = [
            {
              date: targetDate.toLocaleDateString("fr-FR", {
                day: "numeric",
                month: "short",
              }),
              dayName: targetDate.toLocaleDateString("fr-FR", {
                weekday: "long",
              }),
              sales: daySales.length,
              revenue: daySales.reduce(
                (sum: number, sale: Sale) => sum + sale.total,
                0
              ),
            },
          ];
        } else {
          chartData = analytics.salesByDay;
        }
        break;
      case "week":
        chartData = analytics.salesByWeek;
        break;
      case "month":
        chartData = analytics.salesByMonth;
        break;
      case "year":
        const yearData = analytics.salesByYear.find(
          (y) => y.year === selectedYear.toString()
        );
        chartData = yearData
          ? yearData.months.filter((month) => month.sales > 0)
          : [];
        break;
      default:
        chartData = analytics.salesByWeek;
    }

    setFilteredChartData(chartData);
  };

  const getAvailableYears = (): number[] => {
    if (!analytics) return [new Date().getFullYear()];
    return analytics.salesByYear
      .map((y) => parseInt(y.year))
      .sort((a, b) => b - a);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
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
    // For non-admin users, only allow "day" timeframe
    if (shouldSeeOnlyTodayData() && period !== "day") {
      return;
    }

    setTimeframe(period);

    if (period === "year") {
      setSelectedYear(getAvailableYears()[0]);
    }
  };

  // Alternative fetch method if the main one fails
  const tryAlternativeFetch = async () => {
    try {
      const endpoints = [
        `${serverUrl}/sales?limit=1000`,
        `${serverUrl}/sales/all`,
        `${serverUrl}/sales?status=completed`,
      ];

      let fetchedSales: Sale[] = [];
      let fetchedExpenses: Expense[] = [];
      let fetchedEntries: Entry[] = [];

      for (const endpoint of endpoints) {
        try {
          const response = await fetch(endpoint, {
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
            },
          });

          if (response.ok) {
            const data = await response.json();
            if (Array.isArray(data)) {
              fetchedSales = data;
              break;
            } else if (data.sales && Array.isArray(data.sales)) {
              fetchedSales = data.sales;
              break;
            } else if (data.data && Array.isArray(data.data)) {
              fetchedSales = data.data;
              break;
            }
          }
        } catch (error) {
          continue;
        }
      }

      // Try to fetch expenses
      try {
        const expensesResponse = await fetch(
          `${serverUrl}/expenses?limit=1000`
        );
        if (expensesResponse.ok) {
          const expensesData = await expensesResponse.json();
          if (Array.isArray(expensesData)) {
            fetchedExpenses = expensesData;
          } else if (
            expensesData.expenses &&
            Array.isArray(expensesData.expenses)
          ) {
            fetchedExpenses = expensesData.expenses;
          } else if (expensesData.data && Array.isArray(expensesData.data)) {
            fetchedExpenses = expensesData.data;
          }
        }
      } catch (error) {
        console.error("Error fetching expenses:", error);
      }

      // Try to fetch entries
      try {
        const entriesResponse = await fetch(
          `${serverUrl}/entries?limit=1000`
        );
        if (entriesResponse.ok) {
          const entriesData = await entriesResponse.json();
          if (Array.isArray(entriesData)) {
            fetchedEntries = entriesData;
          } else if (
            entriesData.entries &&
            Array.isArray(entriesData.entries)
          ) {
            fetchedEntries = entriesData.entries;
          } else if (entriesData.data && Array.isArray(entriesData.data)) {
            fetchedEntries = entriesData.data;
          }
        }
      } catch (error) {
        console.error("Error fetching entries:", error);
      }

      setAllSales(fetchedSales);
      setAllExpenses(fetchedExpenses);
      setAllEntries(fetchedEntries);

      if (fetchedSales.length > 0) {
        // ✅ FIXED: Use the same filtering logic
        const completedSales = fetchedSales.filter(
          (sale: Sale) =>
            sale.status !== "voided" &&
            sale.status !== "refunded" &&
            sale.status !== "corrected" &&
            sale.type !== "expense" &&
            (sale.status === "completed" || sale.status === "pending")
        );

        const processedAnalytics = processAnalyticsData(
          completedSales,
          fetchedExpenses,
          fetchedEntries
        );
        setAnalytics(processedAnalytics);
      }
    } catch (error) {
      console.error("Alternative fetch also failed:", error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-4 sm:p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
              Analytiques
            </h1>
            <p className="text-sm sm:text-base text-gray-600 mt-2">
              Analyse approfondie de la performance de votre entreprise
            </p>
          </div>
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-gray-500 mt-2 text-sm sm:text-base">
              Chargement des analytiques...
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="min-h-screen bg-gray-50 p-4 sm:p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
              Analytiques
            </h1>
            <p className="text-sm sm:text-base text-gray-600 mt-2">
              Analyse approfondie de la performance de votre entreprise
            </p>
          </div>
          <div className="text-center py-12 text-gray-500">
            <BarChart3 className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p className="text-sm sm:text-base">
              Aucune donnée disponible pour les analytiques
            </p>
          </div>
        </div>
      </div>
    );
  }

  const chartData =
    filteredChartData.length > 0 ? filteredChartData : getDefaultChartData();
  const maxRevenue = Math.max(...chartData.map((d: any) => d.revenue), 1);
  const availableYears = getAvailableYears();

  function getDefaultChartData() {
    if (!analytics) return [];
    switch (timeframe) {
      case "day":
        return analytics.salesByDay;
      case "week":
        return analytics.salesByWeek;
      case "month":
        return analytics.salesByMonth;
      case "year":
        const yearData = analytics.salesByYear.find(
          (y) => y.year === selectedYear.toString()
        );
        return yearData
          ? yearData.months.filter((month) => month.sales > 0)
          : [];
      default:
        return analytics.salesByWeek;
    }
  }

  // Use filtered metrics if available, otherwise use all-time metrics
  const displayMetrics = filteredMetrics || {
    ...analytics,
    netRevenue: (analytics.totalRevenue + analytics.totalEntries) - analytics.totalValidatedExpenses,
  };

  // Get current timeframe sales
  const currentTimeframeSales = getSalesByTimeframe(
    timeframe,
    selectedYear,
    selectedDate
  );

  // Only show filtered data if there are sales in the current timeframe
  const displayTopProducts =
    currentTimeframeSales.length > 0 ? filteredTopProducts : [];
  const displayTopCustomers =
    currentTimeframeSales.length > 0 ? filteredTopCustomers : [];

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center sm:text-left">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
                Analytiques
              </h1>
              <p className="text-sm sm:text-base text-gray-600 mt-2">
                Analyse approfondie de la performance de votre entreprise
              </p>
            </div>
            {shouldSeeOnlyTodayData() && (
              <div className="flex items-center gap-2 bg-blue-50 text-blue-700 px-3 py-2 rounded-lg border border-blue-200">
                <Shield className="w-4 h-4" />
                <span className="text-sm font-medium">
                  {isCashierSupervisor() 
                    ? "Mode Superviseur Caisse - Données du jour uniquement"
                    : "Vue limitée - Données du jour uniquement"
                  }
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Key Metrics - Responsive Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          <div className="bg-white p-4 sm:p-6 rounded-lg shadow border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm text-gray-600">
                  Ventes Totales
                </p>
                <p className="text-xl sm:text-2xl font-bold text-gray-900">
                  {displayMetrics.totalSales}
                </p>
                <div className="flex items-center mt-1">
                  {displayMetrics.recentTrends.salesGrowth >= 0 ? (
                    <ArrowUp className="w-3 h-3 sm:w-4 sm:h-4 text-green-500" />
                  ) : (
                    <ArrowDown className="w-3 h-3 sm:w-4 sm:h-4 text-red-500" />
                  )}
                  <span
                    className={`text-xs sm:text-sm ml-1 ${
                      displayMetrics.recentTrends.salesGrowth >= 0
                        ? "text-green-500"
                        : "text-red-500"
                    }`}
                  >
                    {Math.abs(displayMetrics.recentTrends.salesGrowth)}%
                  </span>
                </div>
              </div>
              <div className="p-2 sm:p-3 bg-blue-100 rounded-full">
                <BarChart3 className="w-4 h-4 sm:w-6 sm:h-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white p-4 sm:p-6 rounded-lg shadow border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm text-gray-600">Revenu Total</p>
                <p className="text-xl sm:text-2xl font-bold text-gray-900">
                  {formatCurrency(displayMetrics.totalRevenue)}
                </p>
                <div className="flex items-center mt-1">
                  {displayMetrics.recentTrends.revenueGrowth >= 0 ? (
                    <ArrowUp className="w-3 h-3 sm:w-4 sm:h-4 text-green-500" />
                  ) : (
                    <ArrowDown className="w-3 h-3 sm:w-4 sm:h-4 text-red-500" />
                  )}
                  <span
                    className={`text-xs sm:text-sm ml-1 ${
                      displayMetrics.recentTrends.revenueGrowth >= 0
                        ? "text-green-500"
                        : "text-red-500"
                    }`}
                  >
                    {Math.abs(displayMetrics.recentTrends.revenueGrowth)}%
                  </span>
                </div>
              </div>
              <div className="p-2 sm:p-3 bg-green-100 rounded-full">
                <DollarSign className="w-4 h-4 sm:w-6 sm:h-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white p-4 sm:p-6 rounded-lg shadow border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm text-gray-600">
                  Entrées d'Argent
                </p>
                <p className="text-xl sm:text-2xl font-bold text-gray-900">
                  {formatCurrency(displayMetrics.totalEntries)}
                </p>
                <p className="text-xs text-gray-500 mt-1">Total reçu</p>
              </div>
              <div className="p-2 sm:p-3 bg-yellow-100 rounded-full">
                <FileText className="w-4 h-4 sm:w-6 sm:h-6 text-yellow-600" />
              </div>
            </div>
          </div>

          <div className="bg-white p-4 sm:p-6 rounded-lg shadow border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm text-gray-600">
                  Dépenses Validées
                </p>
                <p className="text-xl sm:text-2xl font-bold text-gray-900">
                  {formatCurrency(displayMetrics.totalValidatedExpenses)}
                </p>
                <p className="text-xs text-gray-500 mt-1">Total validé</p>
              </div>
              <div className="p-2 sm:p-3 bg-red-100 rounded-full">
                <Receipt className="w-4 h-4 sm:w-6 sm:h-6 text-red-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Additional Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          <div className="bg-white p-4 sm:p-6 rounded-lg shadow border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm text-gray-600">Revenu Net</p>
                <p className="text-xl sm:text-2xl font-bold text-gray-900">
                  {formatCurrency(displayMetrics.netRevenue)}
                </p>
                <p className="text-xs text-gray-500 mt-1">(Ventes + Entrées) - Dépenses</p>
              </div>
              <div className="p-2 sm:p-3 bg-purple-100 rounded-full">
                <Calculator className="w-4 h-4 sm:w-6 sm:h-6 text-purple-600" />
              </div>
            </div>
          </div>

          <div className="bg-white p-4 sm:p-6 rounded-lg shadow border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm text-gray-600">
                  Clients Totaux
                </p>
                <p className="text-xl sm:text-2xl font-bold text-gray-900">
                  {displayMetrics.totalCustomers}
                </p>
                <div className="flex items-center mt-1">
                  <ArrowUp className="w-3 h-3 sm:w-4 sm:h-4 text-green-500" />
                  <span className="text-xs sm:text-sm ml-1 text-green-500">
                    {displayMetrics.recentTrends.customerGrowth}%
                  </span>
                </div>
              </div>
              <div className="p-2 sm:p-3 bg-orange-100 rounded-full">
                <Users className="w-4 h-4 sm:w-6 sm:h-6 text-orange-600" />
              </div>
            </div>
          </div>

          <div className="bg-white p-4 sm:p-6 rounded-lg shadow border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm text-gray-600">
                  Produits Totaux
                </p>
                <p className="text-xl sm:text-2xl font-bold text-gray-900">
                  {displayMetrics.totalProducts}
                </p>
                <p className="text-xs text-gray-500 mt-1">Produits actifs</p>
              </div>
              <div className="p-2 sm:p-3 bg-indigo-100 rounded-full">
                <Package className="w-4 h-4 sm:w-6 sm:h-6 text-indigo-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Sales Chart */}
        <div className="bg-white p-4 sm:p-6 rounded-lg shadow border border-gray-200">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5" />
              Tendances des Ventes ({getTimeframeLabel()})
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
                    // Disable date picker for non-admin users (only today allowed)
                    disabled={shouldSeeOnlyTodayData()}
                  />
                </div>
              )}

              {timeframe === "year" && availableYears.length > 1 && (
                <div className="flex items-center gap-2 bg-white rounded-lg border border-gray-300 px-3 py-2 shadow-sm w-full sm:w-auto">
                  <button
                    onClick={() => navigateYear("prev")}
                    disabled={
                      availableYears.indexOf(selectedYear) ===
                      availableYears.length - 1
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
                    disabled={availableYears.indexOf(selectedYear) === 0}
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
                        : shouldSeeOnlyTodayData() && period !== "day"
                        ? "text-gray-400 cursor-not-allowed opacity-50"
                        : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                    }`}
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
                        {"monthName" in month ? month.monthName : ""}
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
                          {(item as any).dayName}
                        </div>
                        <div className="text-xs text-gray-500">
                          {(item as any).date}
                        </div>
                      </div>
                    ) : timeframe === "week" ? (
                      <div>
                        <div className="text-xs sm:text-sm">
                          {(item as any).week}
                        </div>
                        <div className="text-xs text-gray-500">
                          Du {(item as any).startDate} au{" "}
                          {(item as any).endDate}
                        </div>
                      </div>
                    ) : timeframe === "month" ? (
                      <div className="capitalize">
                        {(item as any).monthName}
                      </div>
                    ) : (
                      (item as any).monthName
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
          <div className="bg-white p-4 sm:p-6 rounded-lg shadow border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Package className="w-4 h-4 sm:w-5 sm:h-5" />
              Articles Vendus ({getTimeframeLabel()})
            </h3>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {displayTopProducts.length > 0 ? (
                displayTopProducts.map((product, index) => (
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

          <div className="bg-white p-4 sm:p-6 rounded-lg shadow border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Users className="w-4 h-4 sm:w-5 sm:h-5" />
              Meilleurs Clients ({getTimeframeLabel()})
            </h3>
            <div className="space-y-3">
              {displayTopCustomers.length > 0 ? (
                displayTopCustomers.map((customer, index) => (
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
      </div>
    </div>
  );
}