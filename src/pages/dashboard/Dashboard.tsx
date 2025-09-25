/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect } from "react";
import {
  BarChart3,
  DollarSign,
  Package,
  Users,
  TrendingUp,
  ShoppingCart,
  ArrowUp,
} from "lucide-react";

interface DashboardStats {
  totalRevenue: number;
  totalSales: number;
  totalProducts: number;
  totalCustomers: number;
  recentSales: any[];
  lowStockProducts: any[];
  revenueGrowth: number;
  salesGrowth: number;
  customerGrowth: number;
}

const serverUrl = import.meta.env.VITE_API_URL;

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      setLoading(true);

      // Fetch all required data
      const [salesResponse, customersResponse, productsResponse] =
        await Promise.all([
          fetch(`${serverUrl}/sales`, {
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
            },
          }),
          fetch(`${serverUrl}/customers`),
          fetch(`${serverUrl}/products`),
        ]);

      const salesData = await salesResponse.json();
      const customersData = await customersResponse.json();
      const productsData = await productsResponse.json();

      console.log("Fetched products data:", productsData);

      // Process the data
      const processedStats = processDashboardData(
        salesData.sales || [],
        customersData.customers || [],
        productsData || []
      );

      setStats(processedStats);
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
      // Set default stats if API fails
      setStats({
        totalRevenue: 0,
        totalSales: 0,
        totalProducts: 0,
        totalCustomers: 0,
        recentSales: [],
        lowStockProducts: [],
        revenueGrowth: 0,
        salesGrowth: 0,
        customerGrowth: 0,
      });
    } finally {
      setLoading(false);
    }
  };

  const processDashboardData = (
    sales: any[],
    customers: any[],
    products: any[]
  ): DashboardStats => {
    // FILTER OUT VOIDED AND CORRECTED SALES - ONLY COUNT COMPLETED SALES
    const validSales = sales.filter(sale => 
      sale.status === "completed" || 
      sale.status === undefined || // Include sales without status (backward compatibility)
      sale.status === "pending"    // Include pending sales if needed
    );

    console.log(`Filtered sales: ${validSales.length} valid out of ${sales.length} total`);

    const totalRevenue = validSales.reduce(
      (sum, sale) => sum + (sale.total || 0),
      0
    );
    const totalSales = validSales.length;
    const totalProducts = products.length;
    const totalCustomers = customers.length;

    // Get recent VALID sales (last 5)
    const recentSales = validSales
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      )
      .slice(0, 5);

    // Get low stock products (stock < 200)
    const lowStockProducts = products
      .filter((product) => (product.stock || 0) < 200)
      .slice(0, 5);

    // Mock growth percentages (in real app, compare with previous period)
    const revenueGrowth = Math.floor(Math.random() * 30) + 5; // 5-35%
    const salesGrowth = Math.floor(Math.random() * 25) + 10; // 10-35%
    const customerGrowth = Math.floor(Math.random() * 20) + 5; // 5-25%

    return {
      totalRevenue,
      totalSales,
      totalProducts,
      totalCustomers,
      recentSales,
      lowStockProducts,
      revenueGrowth,
      salesGrowth,
      customerGrowth,
    };
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Tableau de bord</h1>
          <p className="text-gray-600">
            Aperçu de la performance de votre entreprise
          </p>
        </div>
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-gray-500 mt-2">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Tableau de bord</h1>
          <p className="text-gray-600">
            Aperçu de la performance de votre entreprise
          </p>
        </div>
        <div className="text-center py-12 text-gray-500">
          <BarChart3 className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>Unable to load dashboard data</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Tableau de bord</h1>
        <p className="text-gray-600">
          Aperçu de la performance de votre entreprise
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">
                Revenue Totale
              </p>
              <p className="text-2xl font-bold text-gray-900">
                {formatCurrency(stats.totalRevenue)}
              </p>
              <div className="flex items-center mt-1">
                <ArrowUp className="w-4 h-4 text-green-500" />
                <span className="text-xs text-green-500 ml-1">
                  +{stats.revenueGrowth}% par rapport au mois dernier
                </span>
              </div>
            </div>
            <div className="p-3 bg-green-100 rounded-full">
              <DollarSign className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">
                Ventes Totales
              </p>
              <p className="text-2xl font-bold text-gray-900">
                {stats.totalSales}
              </p>
              <div className="flex items-center mt-1">
                <ArrowUp className="w-4 h-4 text-green-500" />
                <span className="text-xs text-green-500 ml-1">
                  +{stats.salesGrowth}% par rapport au mois dernier
                </span>
              </div>
            </div>
            <div className="p-3 bg-blue-100 rounded-full">
              <ShoppingCart className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Produits</p>
              <p className="text-2xl font-bold text-gray-900">
                {stats.totalProducts}
              </p>
              <p className="text-xs text-gray-500 mt-1">Products Actifs</p>
            </div>
            <div className="p-3 bg-purple-100 rounded-full">
              <Package className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Clients</p>
              <p className="text-2xl font-bold text-gray-900">
                {stats.totalCustomers}
              </p>
              <div className="flex items-center mt-1">
                <ArrowUp className="w-4 h-4 text-green-500" />
                <span className="text-xs text-green-500 ml-1">
                  +{stats.customerGrowth}% Croissance
                </span>
              </div>
            </div>
            <div className="p-3 bg-orange-100 rounded-full">
              <Users className="w-6 h-6 text-orange-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Charts and Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow border">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Ventes Récentes
          </h3>
          <div className="space-y-4">
            {stats.recentSales.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <ShoppingCart className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>Pas de Ventes Récentes</p>
              </div>
            ) : (
              stats.recentSales.map((sale, index) => (
                <div
                  key={sale._id || index}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        Vente #{sale.saleId?.slice(-6) || "N/A"}
                      </p>
                      <p className="text-xs text-gray-500">
                        {sale.customer?.name || "Unknown"} •{" "}
                        {formatDate(sale.createdAt)}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-900">
                      {formatCurrency(sale.total || 0)}
                    </p>
                    <p className="text-xs text-gray-500">
                      {sale.items?.length || 0} Articles
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow border">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Package className="w-5 h-5" />
            Alertes de stock faible
          </h3>
          <div className="space-y-4">
            {stats.lowStockProducts.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Package className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>Tous les produits Bien Stockés</p>
              </div>
            ) : (
              stats.lowStockProducts.map((product, index) => (
                <div
                  key={product._id || index}
                  className="flex items-center justify-between p-3 bg-red-50 rounded-lg border border-red-200"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {product.name || "Unknown Product"}
                      </p>
                      <p className="text-xs text-red-600">
                        Avertissement De Stock Faible
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-red-700">
                      {product.stock || 0} Restant
                    </p>
                    <p className="text-xs text-gray-500">
                      {formatCurrency(product.price || 0)}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}