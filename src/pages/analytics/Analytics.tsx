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
  total: number;
  status?: string;
  createdAt?: string;
  date?: string;
  saleDate?: string;
  items?: SaleItem[];
}

interface Customer {
  name?: string;
  totalSpent?: number;
  totalPurchases?: number;
}

interface AnalyticsData {
  totalSales: number;
  totalRevenue: number;
  totalCustomers: number;
  totalProducts: number;
  salesByDay: { date: string; dayName: string; sales: number; revenue: number }[];
  salesByWeek: { week: string; startDate: string; endDate: string; sales: number; revenue: number }[];
  salesByMonth: { month: string; monthName: string; sales: number; revenue: number }[];
  salesByYear: { year: string; months: { month: string; monthName: string; sales: number; revenue: number }[] }[];
  topProducts: { name: string; quantity: number; revenue: number }[];
  topCustomers: { name: string; purchases: number; totalSpent: number }[];
  recentTrends: {
    salesGrowth: number;
    revenueGrowth: number;
    customerGrowth: number;
  };
}

const serverUrl = import.meta.env.VITE_API_URL;

export default function Analytics() {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeframe, setTimeframe] = useState<"day" | "week" | "month" | "year">("week");
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      
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
      
      // Check if the API returns an array directly or wrapped in an object
      let allSales: Sale[] = [];
      if (Array.isArray(salesData)) {
        allSales = salesData;
      } else if (salesData.sales && Array.isArray(salesData.sales)) {
        allSales = salesData.sales;
      } else if (salesData.data && Array.isArray(salesData.data)) {
        allSales = salesData.data;
      } else {
        console.warn("Unexpected sales data structure:", salesData);
        allSales = [];
      }

      console.log(`Fetched ${allSales.length} sales from API`);

      // Filter out voided sales - only include completed sales
      const completedSales = allSales.filter((sale: Sale) => 
        sale.status !== 'voided' && sale.status !== 'cancelled' && sale.status !== 'refunded'
      );

      console.log(`After filtering voided sales: ${completedSales.length} completed sales`);

      // Fetch customers data
      let allCustomers: Customer[] = [];
      try {
        const customersResponse = await fetch(`${serverUrl}/customers?limit=0`);
        if (customersResponse.ok) {
          const customersData = await customersResponse.json();
          allCustomers = Array.isArray(customersData) ? customersData : 
                        customersData.customers || customersData.data || [];
        }
      } catch (error) {
        console.error("Error fetching customers:", error);
      }

      // Process the data to create analytics
      const processedAnalytics = processAnalyticsData(completedSales, allCustomers);
      setAnalytics(processedAnalytics);
    } catch (error) {
      console.error("Error fetching analytics:", error);
      // Fallback: try alternative API endpoints
      await tryAlternativeFetch();
    } finally {
      setLoading(false);
    }
  };

  // Alternative fetch method if the main one fails
  const tryAlternativeFetch = async () => {
    try {
      console.log("Trying alternative fetch method...");
      
      // Try to fetch sales with different endpoints
      const endpoints = [
        `${serverUrl}/sales?limit=1000`,
        `${serverUrl}/sales/all`,
        `${serverUrl}/sales?status=completed`
      ];
      
      let allSales: Sale[] = [];
      
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
              allSales = data;
              break;
            } else if (data.sales && Array.isArray(data.sales)) {
              allSales = data.sales;
              break;
            } else if (data.data && Array.isArray(data.data)) {
              allSales = data.data;
              break;
            }
          }
        } catch (error) {
          console.warn(`Failed to fetch from ${endpoint}:`, error);
          continue;
        }
      }
      
      console.log(`Alternative fetch got ${allSales.length} sales`);
      
      if (allSales.length > 0) {
        const completedSales = allSales.filter((sale: Sale) => 
          sale.status !== 'voided' && sale.status !== 'cancelled' && sale.status !== 'refunded'
        );
        
        const processedAnalytics = processAnalyticsData(completedSales, []);
        setAnalytics(processedAnalytics);
      }
    } catch (error) {
      console.error("Alternative fetch also failed:", error);
    }
  };

  const processAnalyticsData = (
    sales: Sale[],
    customers: Customer[]
  ): AnalyticsData => {
    console.log(`Processing ${sales.length} sales and ${customers.length} customers`);

    // Filter out any invalid sales (ensure they have required properties)
    const validSales = sales.filter((sale: Sale) => 
      sale && typeof sale.total === 'number' && sale.items && Array.isArray(sale.items)
    );

    console.log(`Valid sales for processing: ${validSales.length}`);

    // Calculate totals using valid sales only
    const totalSales = validSales.length;
    const totalRevenue = validSales.reduce((sum: number, sale: Sale) => sum + sale.total, 0);
    const totalCustomers = customers.length;
    
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

    console.log(`Calculated: ${totalSales} sales, $${totalRevenue} revenue, ${totalProducts} products`);

    // Sales by day (last 7 days) with day names in French
    const salesByDay = getLast7Days().map((date: Date) => {
      const daySales = validSales.filter(
        (sale: Sale) => {
          try {
            const saleDate = new Date(sale.createdAt || sale.date || sale.saleDate || '');
            return saleDate.toDateString() === date.toDateString();
          } catch (error) {
            return false;
          }
        }
      );
      return {
        date: date.toLocaleDateString("fr-FR", {
          day: "numeric",
          month: "short",
        }),
        dayName: date.toLocaleDateString("fr-FR", { weekday: "long" }),
        sales: daySales.length,
        revenue: daySales.reduce((sum: number, sale: Sale) => sum + sale.total, 0),
      };
    });

    // Sales by week (last 4 weeks) with start and end dates in French
    const salesByWeek = getLast4Weeks().map((week: { start: Date; end: Date }, index: number) => {
      const weekSales = validSales.filter((sale: Sale) => {
        try {
          const saleDate = new Date(sale.createdAt || sale.date || sale.saleDate || '');
          return saleDate >= week.start && saleDate <= week.end;
        } catch (error) {
          return false;
        }
      });
      
      const startDateStr = week.start.toLocaleDateString("fr-FR", {
        day: "numeric",
        month: "short"
      });
      const endDateStr = week.end.toLocaleDateString("fr-FR", {
        day: "numeric",
        month: "short"
      });
      
      return {
        week: `Semaine ${index + 1}`,
        startDate: startDateStr,
        endDate: endDateStr,
        sales: weekSales.length,
        revenue: weekSales.reduce((sum: number, sale: Sale) => sum + sale.total, 0),
      };
    });

    // Sales by month (last 6 months) with full month names in French
    const salesByMonth = getLast6Months().map((month: { month: number; year: number; shortName: string; fullName: string }) => {
      const monthSales = validSales.filter((sale: Sale) => {
        try {
          const saleDate = new Date(sale.createdAt || sale.date || sale.saleDate || '');
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
        revenue: monthSales.reduce((sum: number, sale: Sale) => sum + sale.total, 0),
      };
    });

    // Sales by year (group by year with monthly breakdown) in French
    const salesByYear = getSalesByYear(validSales);

    // Top products
    const productStats = new Map();
    validSales.forEach((sale: Sale) => {
      if (sale.items && Array.isArray(sale.items)) {
        sale.items.forEach((item: SaleItem) => {
          const productName = item.name || 'Unknown Product';
          if (productStats.has(productName)) {
            const existing = productStats.get(productName);
            productStats.set(productName, {
              quantity: existing.quantity + (item.quantity || 0),
              revenue: existing.revenue + (item.total || (item.quantity || 0) * (item.price || 0) || 0),
            });
          } else {
            productStats.set(productName, {
              quantity: item.quantity || 0,
              revenue: item.total || (item.quantity || 0) * (item.price || 0) || 0,
            });
          }
        });
      }
    });

    const topProducts = Array.from(productStats.entries())
      .map(([name, stats]) => ({ name, ...stats }))
      .sort((a: any, b: any) => b.quantity - a.quantity)
      .slice(0, 5);

    // Top customers
    const topCustomers = customers
      .filter((customer: Customer) => customer && customer.name)
      .sort((a: Customer, b: Customer) => (b.totalSpent || 0) - (a.totalSpent || 0))
      .slice(0, 5)
      .map((customer: Customer) => ({
        name: customer.name || 'Unknown Customer',
        purchases: customer.totalPurchases || 0,
        totalSpent: customer.totalSpent || 0,
      }));

    // Calculate actual growth trends based on previous period data
    const recentTrends = calculateGrowthTrends(validSales, salesByMonth);

    return {
      totalSales,
      totalRevenue,
      totalCustomers,
      totalProducts,
      salesByDay,
      salesByWeek,
      salesByMonth,
      salesByYear,
      topProducts,
      topCustomers,
      recentTrends,
    };
  };

  // Calculate actual growth trends instead of random numbers
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

    const salesGrowth = previousMonth.sales > 0 
      ? Math.round(((currentMonth.sales - previousMonth.sales) / previousMonth.sales) * 100)
      : currentMonth.sales > 0 ? 100 : 0;

    const revenueGrowth = previousMonth.revenue > 0
      ? Math.round(((currentMonth.revenue - previousMonth.revenue) / previousMonth.revenue) * 100)
      : currentMonth.revenue > 0 ? 100 : 0;

    // For customer growth, we'll use a simple calculation based on recent sales
    const recentSales = sales.filter((sale: Sale) => {
      try {
        const saleDate = new Date(sale.createdAt || sale.date || sale.saleDate || '');
        const oneMonthAgo = new Date();
        oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
        return saleDate > oneMonthAgo;
      } catch (error) {
        return false;
      }
    });

    const customerGrowth = recentSales.length > 10 ? 15 : 5; // Simple heuristic

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

  const getLast6Months = (): { month: number; year: number; shortName: string; fullName: string }[] => {
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
    const years = Array.from(new Set(sales.map((sale: Sale) => {
      try {
        return new Date(sale.createdAt || sale.date || sale.saleDate || '').getFullYear();
      } catch (error) {
        return new Date().getFullYear();
      }
    })));
    
    // Initialize all available years
    years.forEach(year => {
      yearsMap.set(year, {
        year: year.toString(),
        months: Array.from({ length: 12 }, (_, i) => ({
          month: i,
          monthName: new Date(year, i).toLocaleDateString("fr-FR", { month: "long" }),
          sales: 0,
          revenue: 0,
        }))
      });
    });
    
    // Populate with actual data
    sales.forEach((sale: Sale) => {
      try {
        const saleDate = new Date(sale.createdAt || sale.date || sale.saleDate || '');
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
        console.warn('Invalid sale date format:', sale);
      }
    });
    
    return Array.from(yearsMap.values()).sort((a: any, b: any) => parseInt(b.year) - parseInt(a.year));
  };

  const getAvailableYears = (): number[] => {
    if (!analytics) return [new Date().getFullYear()];
    return analytics.salesByYear.map(y => parseInt(y.year)).sort((a, b) => b - a);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  const getChartData = () => {
    if (!analytics) return [];

    switch (timeframe) {
      case "day":
        return analytics.salesByDay;
      case "week":
        return analytics.salesByWeek;
      case "month":
        return analytics.salesByMonth;
      case "year":
        // Get data for selected year only
        const yearData = analytics.salesByYear.find(y => y.year === selectedYear.toString());
        return yearData ? yearData.months.filter(month => month.sales > 0) : [];
      default:
        return analytics.salesByWeek;
    }
  };

  const navigateYear = (direction: 'prev' | 'next') => {
    const years = getAvailableYears();
    const currentIndex = years.indexOf(selectedYear);
    
    if (direction === 'prev' && currentIndex < years.length - 1) {
      setSelectedYear(years[currentIndex + 1]);
    } else if (direction === 'next' && currentIndex > 0) {
      setSelectedYear(years[currentIndex - 1]);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Analytiques</h1>
          <p className="text-gray-600">
            Analyse approfondie de la performance de votre entreprise
          </p>
        </div>
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-gray-500 mt-2">Chargement des analytiques...</p>
        </div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Analytiques</h1>
          <p className="text-gray-600">
            Analyse approfondie de la performance de votre entreprise
          </p>
        </div>
        <div className="text-center py-12 text-gray-500">
          <BarChart3 className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>Aucune donnée disponible pour les analytiques</p>
        </div>
      </div>
    );
  }

  const chartData = getChartData();
  const maxRevenue = Math.max(...chartData.map((d: any) => d.revenue), 1);
  const availableYears = getAvailableYears();

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Analytiques</h1>
        <p className="text-gray-600">
          Analyse approfondie de la performance de votre entreprise
        </p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Ventes Totales</p>
              <p className="text-2xl font-bold text-gray-900">
                {analytics.totalSales}
              </p>
              <div className="flex items-center mt-1">
                {analytics.recentTrends.salesGrowth >= 0 ? (
                  <ArrowUp className="w-4 h-4 text-green-500" />
                ) : (
                  <ArrowDown className="w-4 h-4 text-red-500" />
                )}
                <span
                  className={`text-sm ml-1 ${
                    analytics.recentTrends.salesGrowth >= 0
                      ? "text-green-500"
                      : "text-red-500"
                  }`}
                >
                  {Math.abs(analytics.recentTrends.salesGrowth)}%
                </span>
              </div>
            </div>
            <div className="p-3 bg-blue-100 rounded-full">
              <BarChart3 className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Revenu Total</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatCurrency(analytics.totalRevenue)}
              </p>
              <div className="flex items-center mt-1">
                {analytics.recentTrends.revenueGrowth >= 0 ? (
                  <ArrowUp className="w-4 h-4 text-green-500" />
                ) : (
                  <ArrowDown className="w-4 h-4 text-red-500" />
                )}
                <span
                  className={`text-sm ml-1 ${
                    analytics.recentTrends.revenueGrowth >= 0
                      ? "text-green-500"
                      : "text-red-500"
                  }`}
                >
                  {Math.abs(analytics.recentTrends.revenueGrowth)}%
                </span>
              </div>
            </div>
            <div className="p-3 bg-green-100 rounded-full">
              <DollarSign className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Clients Totaux</p>
              <p className="text-2xl font-bold text-gray-900">
                {analytics.totalCustomers}
              </p>
              <div className="flex items-center mt-1">
                <ArrowUp className="w-4 h-4 text-green-500" />
                <span className="text-sm ml-1 text-green-500">
                  {analytics.recentTrends.customerGrowth}%
                </span>
              </div>
            </div>
            <div className="p-3 bg-purple-100 rounded-full">
              <Users className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Produits Totaux</p>
              <p className="text-2xl font-bold text-gray-900">
                {analytics.totalProducts}
              </p>
              <p className="text-sm text-gray-500 mt-1">Produits actifs</p>
            </div>
            <div className="p-3 bg-orange-100 rounded-full">
              <Package className="w-6 h-6 text-orange-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Sales Chart */}
      <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Tendances des Ventes
          </h3>
          <div className="flex items-center gap-2">
            {timeframe === "year" && availableYears.length > 1 && (
              <div className="flex items-center gap-2 mr-4">
                <button
                  onClick={() => navigateYear('prev')}
                  disabled={availableYears.indexOf(selectedYear) === availableYears.length - 1}
                  className="p-1 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="text-sm font-medium">{selectedYear}</span>
                <button
                  onClick={() => navigateYear('next')}
                  disabled={availableYears.indexOf(selectedYear) === 0}
                  className="p-1 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
            <div className="flex gap-2">
              {(["day", "week", "month", "year"] as const).map((period) => (
                <button
                  key={period}
                  onClick={() => {
                    setTimeframe(period);
                    if (period === "year") {
                      setSelectedYear(availableYears[0]);
                    }
                  }}
                  className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                    timeframe === period
                      ? "bg-blue-600 text-white"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
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

        <div className="space-y-4">
          {timeframe === "year" ? (
            // Yearly view with months for selected year
            <div className="mb-6">
              <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Année {selectedYear}
              </h4>
              <div className="space-y-4 ml-4">
                {chartData.map((month: any, index: number) => (
                  <div key={index} className="flex items-center gap-4">
                    <div className="w-40 text-sm text-gray-600 font-medium capitalize">
                      {"monthName" in month ? month.monthName : ""}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm text-gray-700">
                          {month.sales} ventes
                        </span>
                        <span className="text-sm font-medium text-gray-900">
                          {formatCurrency(month.revenue)}
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${(month.revenue / maxRevenue) * 100}%` }}
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
              <div key={index} className="flex items-center gap-4">
                <div className="w-48 text-sm text-gray-600 font-medium">
                  {timeframe === "day" ? (
                    <div>
                      <div className="capitalize">{(item as any).dayName}</div>
                      <div className="text-xs text-gray-500">{(item as any).date}</div>
                    </div>
                  ) : timeframe === "week" ? (
                    <div>
                      <div>{(item as any).week}</div>
                      <div className="text-xs text-gray-500">
                        Du {(item as any).startDate} au {(item as any).endDate}
                      </div>
                    </div>
                  ) : timeframe === "month" ? (
                    <div className="capitalize">{(item as any).monthName}</div>
                  ) : (
                    (item as any).monthName
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-gray-700">
                      {item.sales} ventes
                    </span>
                    <span className="text-sm font-medium text-gray-900">
                      {formatCurrency(item.revenue)}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${(item.revenue / maxRevenue) * 100}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Top Products and Customers */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Package className="w-5 h-5" />
            Produits les Plus Vendus
          </h3>
          <div className="space-y-3">
            {analytics.topProducts.map((product, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
              >
                <div>
                  <p className="font-medium text-gray-900">{product.name}</p>
                  <p className="text-sm text-gray-600">
                    {product.quantity} unités vendues
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-medium text-gray-900">
                    {formatCurrency(product.revenue)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Users className="w-5 h-5" />
            Meilleurs Clients
          </h3>
          <div className="space-y-3">
            {analytics.topCustomers.map((customer, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                    <span className="text-sm font-medium text-blue-600">
                      {customer.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{customer.name}</p>
                    <p className="text-sm text-gray-600">
                      {customer.purchases} achats
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-medium text-gray-900">
                    {formatCurrency(customer.totalSpent)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}