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
      // Fetch sales data
      const salesResponse = await fetch(`${serverUrl}/sales`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
        },
      });
      const salesData = await salesResponse.json();

      // Fetch customers data
      const customersResponse = await fetch(`${serverUrl}/customers`);
      const customersData = await customersResponse.json();

      // Process the data to create analytics
      const processedAnalytics = processAnalyticsData(
        salesData.sales,
        customersData.customers
      );
      setAnalytics(processedAnalytics);
    } catch (error) {
      console.error("Error fetching analytics:", error);
    } finally {
      setLoading(false);
    }
  };

  const processAnalyticsData = (
    sales: any[],
    customers: any[]
  ): AnalyticsData => {
    // Calculate totals
    const totalSales = sales.length;
    const totalRevenue = sales.reduce((sum, sale) => sum + sale.total, 0);
    const totalCustomers = customers.length;
    const totalProducts = new Set(
      sales.flatMap((sale) => sale.items.map((item: any) => item.productId))
    ).size;

    // Sales by day (last 7 days) with day names in French
    const salesByDay = getLast7Days().map((date) => {
      const daySales = sales.filter(
        (sale) =>
          new Date(sale.createdAt).toDateString() === date.toDateString()
      );
      return {
        date: date.toLocaleDateString("fr-FR", {
          day: "numeric",
          month: "short",
        }),
        dayName: date.toLocaleDateString("fr-FR", { weekday: "long" }),
        sales: daySales.length,
        revenue: daySales.reduce((sum, sale) => sum + sale.total, 0),
      };
    });

    // Sales by week (last 4 weeks) with start and end dates in French
    const salesByWeek = getLast4Weeks().map((week, index) => {
      const weekSales = sales.filter((sale) => {
        const saleDate = new Date(sale.createdAt);
        return saleDate >= week.start && saleDate <= week.end;
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
        revenue: weekSales.reduce((sum, sale) => sum + sale.total, 0),
      };
    });

    // Sales by month (last 6 months) with full month names in French
    const salesByMonth = getLast6Months().map((month) => {
      const monthSales = sales.filter((sale) => {
        const saleDate = new Date(sale.createdAt);
        return (
          saleDate.getMonth() === month.month &&
          saleDate.getFullYear() === month.year
        );
      });
      return {
        month: month.shortName,
        monthName: month.fullName,
        sales: monthSales.length,
        revenue: monthSales.reduce((sum, sale) => sum + sale.total, 0),
      };
    });

    // Sales by year (group by year with monthly breakdown) in French
    const salesByYear = getSalesByYear(sales);

    // Top products
    const productStats = new Map();
    sales.forEach((sale) => {
      sale.items.forEach((item: any) => {
        if (productStats.has(item.name)) {
          const existing = productStats.get(item.name);
          productStats.set(item.name, {
            quantity: existing.quantity + item.quantity,
            revenue: existing.revenue + item.total,
          });
        } else {
          productStats.set(item.name, {
            quantity: item.quantity,
            revenue: item.total,
          });
        }
      });
    });

    const topProducts = Array.from(productStats.entries())
      .map(([name, stats]) => ({ name, ...stats }))
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 5);

    // Top customers
    const topCustomers = customers
      .sort((a, b) => b.totalSpent - a.totalSpent)
      .slice(0, 5)
      .map((customer) => ({
        name: customer.name,
        purchases: customer.totalPurchases,
        totalSpent: customer.totalSpent,
      }));

    // Mock growth trends (in real app, compare with previous period)
    const recentTrends = {
      salesGrowth: Math.floor(Math.random() * 20) - 10, // -10 to +10
      revenueGrowth: Math.floor(Math.random() * 25) - 5, // -5 to +20
      customerGrowth: Math.floor(Math.random() * 15) + 5, // +5 to +20
    };

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

  const getLast7Days = () => {
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      days.push(date);
    }
    return days;
  };

  const getLast4Weeks = () => {
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

  const getLast6Months = () => {
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

  const getSalesByYear = (sales: any[]) => {
    const yearsMap = new Map();
    
    // Get all available years from sales data
    const years = Array.from(new Set(sales.map(sale => new Date(sale.createdAt).getFullYear())));
    
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
    sales.forEach((sale) => {
      const saleDate = new Date(sale.createdAt);
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
    });
    
    return Array.from(yearsMap.values()).sort((a, b) => parseInt(b.year) - parseInt(a.year));
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
  const maxRevenue = Math.max(...chartData.map((d) => d.revenue), 1);
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
                {chartData.map((month, index) => (
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
            chartData.map((item, index) => (
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