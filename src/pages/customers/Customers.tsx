"use client";

import type React from "react";

import { useState, useEffect } from "react";
import {
  Users,
  Search,
  Eye,
  Trash2,
  Phone,
  Mail,
  DollarSign,
  ShoppingBag,
  RefreshCw,
  AlertCircle,
} from "lucide-react";

interface Customer {
  _id: string;
  name: string;
  phone: string;
  email: string;
  totalPurchases: number;
  totalSpent: number;
  firstPurchaseDate: string;
  lastPurchaseDate: string;
  createdAt: string;
  updatedAt: string;
}

interface CustomersResponse {
  customers: Customer[];
  totalPages: number;
  currentPage: number;
  total: number;
}

const serverUrl = import.meta.env.VITE_API_URL;

export default function Customers() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(
    null
  );
  const [showModal, setShowModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
  });
  const [refreshing, setRefreshing] = useState(false);
  const [recalculating, setRecalculating] = useState<string | null>(null);

  useEffect(() => {
    fetchCustomers();
  }, [currentPage]);

  // Add this useEffect to refresh customer data periodically
  useEffect(() => {
    const interval = setInterval(() => {
      fetchCustomers();
    }, 30000); // Refresh every 30 seconds

    return () => clearInterval(interval);
  }, []);

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `${serverUrl}/customers?page=${currentPage}&limit=10&timestamp=${Date.now()}`
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: CustomersResponse = await response.json();
      setCustomers(data.customers);
      setTotalPages(data.totalPages);
    } catch (error) {
      console.error("Error fetching customers:", error);
      // Show error message to user
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const refreshCustomers = async () => {
    setRefreshing(true);
    await fetchCustomers();
  };

  // Filter customers based on search term
  const filteredCustomers = customers.filter(
    (customer) =>
      customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.phone.includes(searchTerm) ||
      (customer.email &&
        customer.email.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Calculate total revenue from VALID customers (same logic as dashboard)
  const calculateTotalRevenue = () => {
    return customers.reduce((sum, customer) => sum + customer.totalSpent, 0);
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("fr-FR", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  const handleAddCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch(`${serverUrl}/customers`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        setShowAddModal(false);
        setFormData({ name: "", phone: "", email: "" });
        fetchCustomers();
      } else {
        console.error("Failed to add customer:", response.status);
      }
    } catch (error) {
      console.error("Error adding customer:", error);
    }
  };

  const handleDeleteCustomer = async (customerId: string) => {
    if (confirm("Êtes-vous sûr de vouloir supprimer ce client?")) {
      try {
        const response = await fetch(`${serverUrl}/customers/${customerId}`, {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
          },
        });

        if (response.ok) {
          fetchCustomers();
        } else {
          console.error("Failed to delete customer:", response.status);
        }
      } catch (error) {
        console.error("Error deleting customer:", error);
      }
    }
  };

  const recalculateCustomerStats = async (customerId: string) => {
    try {
      setRecalculating(customerId);

      // First, check if the recalculate endpoint exists
      const response = await fetch(
        `${serverUrl}/customers/${customerId}/recalculate`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
          },
        }
      );

      if (response.ok) {
        // Refresh the customer data
        await fetchCustomers();
        alert("Statistiques recalculées avec succès!");
      } else if (response.status === 404) {
        // Endpoint doesn't exist - show manual instructions
        alert(
          "Fonction de recalcul non disponible. Pour corriger les statistiques:\n\n" +
            "1. Allez dans l'historique des ventes\n" +
            "2. Modifiez puis sauvegardez une vente de ce client\n" +
            "3. Les statistiques seront automatiquement recalculées"
        );
      }
    } catch (error) {
      console.error("Error recalculating customer stats:", error);
      alert(
        "Erreur lors du recalcul. Vérifiez la console pour plus de détails."
      );
    } finally {
      setRecalculating(null);
    }
  };

  const viewCustomerDetails = (customer: Customer) => {
    setSelectedCustomer(customer);
    setShowModal(true);
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Clients</h1>
          <p className="text-gray-600">Gérez vos relations clients</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={refreshCustomers}
            disabled={refreshing}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            <RefreshCw
              className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`}
            />
            {refreshing ? "Actualisation..." : "Actualiser"}
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            Ajouter un Client
          </button>
        </div>
      </div>

      {/* Search and Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="md:col-span-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="rechercher les clients..."
              className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-600" />
            <div>
              <p className="text-sm text-gray-600">Nombre Total de Clients</p>
              <p className="text-xl font-semibold text-gray-900">
                {customers.length}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border">
          <div className="flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-green-600" />
            <div>
              <p className="text-sm text-gray-600">Revenue Totale Clients</p>
              <p className="text-xl font-semibold text-gray-900">
                {formatCurrency(calculateTotalRevenue())}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {customers.filter((c) => c.totalSpent > 0).length} clients
                actifs
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Warning Banner if stats might be inaccurate */}
      {customers.some(
        (customer) =>
          customer.totalPurchases > 0 &&
          (customer.totalSpent === 0 || customer.totalSpent > 100000) // Suspicious values
      ) && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-yellow-600" />
            <div>
              <p className="text-sm font-medium text-yellow-800">
                Attention: Statistiques potentiellement inexactes
              </p>
              <p className="text-sm text-yellow-700">
                Certaines statistiques clients peuvent être incorrectes suite à
                des modifications de ventes. Utilisez "Recalculer les
                statistiques" pour corriger.
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Users className="w-5 h-5" />
            Répertoire clients ({filteredCustomers.length})
          </h2>
          <button
            onClick={refreshCustomers}
            disabled={refreshing}
            className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800"
          >
            <RefreshCw
              className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`}
            />
            Actualiser
          </button>
        </div>

        <div className="overflow-x-auto">
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="text-gray-500 mt-2">Chargement des clients...</p>
            </div>
          ) : filteredCustomers.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Aucun client trouvé</p>
            </div>
          ) : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Client
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Contact
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Nombre d'achats
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Montant total dépensé
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Dernier Achat
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredCustomers.map((customer) => (
                  <tr key={customer._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                            <span className="text-sm font-medium text-blue-600">
                              {customer.name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {customer.name}
                          </div>
                          <div className="text-sm text-gray-500">
                            Client depuis {formatDate(customer.createdAt)}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 flex items-center gap-1">
                        <Phone className="w-3 h-3" />
                        {customer.phone}
                      </div>
                      {customer.email && (
                        <div className="text-sm text-gray-500 flex items-center gap-1">
                          <Mail className="w-3 h-3" />
                          {customer.email}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-1">
                        <ShoppingBag className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-gray-900">
                          {customer.totalPurchases}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {formatCurrency(customer.totalSpent)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(customer.lastPurchaseDate)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex gap-2">
                        <button
                          onClick={() => viewCustomerDetails(customer)}
                          className="text-blue-600 hover:text-blue-900 p-1 rounded"
                          title="Voir les détails du client"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => recalculateCustomerStats(customer._id)}
                          disabled={recalculating === customer._id}
                          className="text-green-600 hover:text-green-900 p-1 rounded disabled:opacity-50"
                          title="Recalculer les statistiques"
                        >
                          <RefreshCw
                            className={`w-4 h-4 ${
                              recalculating === customer._id
                                ? "animate-spin"
                                : ""
                            }`}
                          />
                        </button>
                        <button
                          onClick={() => handleDeleteCustomer(customer._id)}
                          className="text-red-600 hover:text-red-900 p-1 rounded"
                          title="supprimer le client"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
            <div className="text-sm text-gray-700">
              Page {currentPage} sur {totalPages}
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="px-3 py-1 border border-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                Précédent
              </button>
              <button
                onClick={() =>
                  setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                }
                disabled={currentPage === totalPages}
                className="px-3 py-1 border border-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                Suivant
              </button>
            </div>
          </div>
        )}
      </div>

      {showAddModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
          <form
            onSubmit={handleAddCustomer}
            className="bg-white p-6 rounded-lg shadow-lg w-96"
          >
            <h2 className="text-lg font-semibold mb-4">Ajouter un Client</h2>
            <input
              type="text"
              placeholder="Nom"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              className="w-full mb-3 border rounded p-2"
            />
            <input
              type="text"
              placeholder="Téléphone"
              value={formData.phone}
              onChange={(e) =>
                setFormData({ ...formData, phone: e.target.value })
              }
              className="w-full mb-3 border rounded p-2"
            />
            <input
              type="email"
              placeholder="Email"
              value={formData.email}
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
              className="w-full mb-3 border rounded p-2"
            />
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 bg-gray-200 rounded"
              >
                Annuler
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded"
              >
                Ajouter
              </button>
            </div>
          </form>
        </div>
      )}
      {showModal && selectedCustomer && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white p-6 rounded-lg shadow-lg w-96">
            <h2 className="text-lg font-semibold mb-4">Détails Client</h2>
            <p>
              <strong>Nom:</strong> {selectedCustomer.name}
            </p>
            <p>
              <strong>Téléphone:</strong> {selectedCustomer.phone}
            </p>
            <p>
              <strong>Email:</strong> {selectedCustomer.email}
            </p>
            <div className="flex justify-end mt-4">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 bg-blue-600 text-white rounded"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
