"use client";
import ResponsiveTable from "../../components/ui/ResponsiveTable";
import Dialog from "../../components/ui/Dialog";
import { EmptyState, LoadingState, PermissionDenied } from "../../components/ui/States";

import type React from "react";
import { formatDateGMT2, formatDateTimeGMT2 } from "../../utils/dateUtils";
import { useState, useEffect } from "react";
import { serverUrl } from "../../utils/constants";
import { apiRequest } from "../../lib/api";
import {
  Users,
  Search,
  Eye,
  Trash2,
  Phone,
  Mail,
  Calendar,
  DollarSign,
  ShoppingBag,
  RefreshCw,
  AlertCircle,
  Plus, X } from "lucide-react";

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

export default function Customers() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
  });
  const [refreshing, setRefreshing] = useState(false);
  const [recalculating, setRecalculating] = useState<string | null>(null);

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      // Remove pagination - fetch ALL customers at once
      const response = await apiRequest(
        `customers?limit=0&timestamp=${Date.now()}`
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      // Handle different response formats
      let allCustomers: Customer[] = [];
      if (Array.isArray(data)) {
        allCustomers = data;
      } else if (data.customers && Array.isArray(data.customers)) {
        allCustomers = data.customers;
      } else if (data.data && Array.isArray(data.data)) {
        allCustomers = data.data;
      } else {
        console.warn("Unexpected customers data structure:", data);
        allCustomers = [];
      }

      console.log(`Fetched ${allCustomers.length} customers from API`);
      setCustomers(allCustomers);
    } catch (error) {
      console.error("Error fetching customers:", error);
      // Try alternative endpoints
      await tryAlternativeFetch();
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Alternative fetch method if the main one fails
  const tryAlternativeFetch = async () => {
    try {
      console.log("Customers: Trying alternative fetch method...");
      
      const endpoints = [
        "customers?limit=1000",
        "customers/all",
      ];
      
      let allCustomers: Customer[] = [];
      
      for (const endpoint of endpoints) {
        try {
          const response = await apiRequest(endpoint);
          if (response.ok) {
            const data = await response.json();
            if (Array.isArray(data)) {
              allCustomers = data;
              break;
            } else if (data.customers && Array.isArray(data.customers)) {
              allCustomers = data.customers;
              break;
            } else if (data.data && Array.isArray(data.data)) {
              allCustomers = data.data;
              break;
            }
          }
        } catch (error) {
          console.warn(`Failed to fetch from ${endpoint}:`, error);
          continue;
        }
      }
      
      console.log(`Customers: Alternative fetch got ${allCustomers.length} customers`);
      setCustomers(allCustomers);
    } catch (error) {
      console.error("Customers: Alternative fetch also failed:", error);
    }
  };

  const refreshCustomers = async () => {
    setRefreshing(true);
    await fetchCustomers();
  };

  const filteredCustomers = customers.filter(
    (customer) =>
      customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.phone.includes(searchTerm) ||
      (customer.email && customer.email.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const calculateTotalRevenue = () => {
    return customers.reduce((sum, customer) => sum + customer.totalSpent, 0);
  };

  const formatDate = (dateString: string) => {
    if (!dateString || dateString === "null" || dateString === "undefined") return "N/A";
    return formatDateGMT2(dateString) || "N/A";
  };

  const formatDateTime = (dateString: string) => {
    if (!dateString || dateString === "null" || dateString === "undefined") return "N/A";
    return formatDateTimeGMT2(dateString) || "N/A";
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
        await fetchCustomers();
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
          await fetchCustomers();
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
        await fetchCustomers();
        alert("Statistiques recalculées avec succès!");
      } else if (response.status === 404) {
        alert(
          "Fonction de recalcul non disponible. Pour corriger les statistiques:\n\n" +
            "1. Allez dans l'historique des ventes\n" +
            "2. Modifiez puis sauvegardez une vente de ce client\n" +
            "3. Les statistiques seront automatiquement recalculées"
        );
      }
    } catch (error) {
      console.error("Error recalculating customer stats:", error);
      alert("Erreur lors du recalcul. Vérifiez la console pour plus de détails.");
    } finally {
      setRecalculating(null);
    }
  };

  const viewCustomerDetails = (customer: Customer) => {
    setSelectedCustomer(customer);
    setShowModal(true);
  };

  // Admin-only: block non-admin users after all hooks and functions are defined
  const isAdmin = (() => {
    try {
      const raw = localStorage.getItem("user");
      return raw ? JSON.parse(raw).role === "admin" : false;
    } catch { return false; }
  })();

  if (!isAdmin) {
    return (
      <div className="page">
        <PermissionDenied>Cette section est réservée aux administrateurs.</PermissionDenied>
      </div>
    );
  }

  return (
    <div className="page space-y-5">
      <header className="page-header">
        <div>
          <h1 className="page-title">Clients</h1>
          <p className="page-subtitle">Coordonnées et historique d'achat des clients enregistrés.</p>
        </div>
        <div className="page-actions">
          <button type="button" aria-label="Actualiser la liste des clients"
            onClick={refreshCustomers}
            disabled={refreshing}
            className="btn btn-secondary"
          >
            <RefreshCw className={refreshing ? "animate-spin" : ""} aria-hidden="true" />
            {refreshing ? "Actualisation…" : "Actualiser"}
          </button>
          <button type="button"
            onClick={() => setShowAddModal(true)}
            className="btn btn-primary"
          >
            <Plus aria-hidden="true" />
            Nouveau client
          </button>
        </div>
      </header>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="metric-card">
          <span className="metric-label flex items-center gap-1.5"><Users className="w-4 h-4 text-blue-600" aria-hidden="true" />Clients</span>
          <span className="metric-value">{customers.length}</span>
        </div>
        <div className="metric-card">
          <span className="metric-label flex items-center gap-1.5"><DollarSign className="w-4 h-4 text-green-600" aria-hidden="true" />Chiffre d'affaires clients</span>
          <span className="metric-value">{formatCurrency(calculateTotalRevenue())}</span>
          <span className="text-xs text-gray-500">{customers.filter((c) => c.totalSpent > 0).length} clients actifs</span>
        </div>
        <div className="col-span-2 flex items-end">
          <div className="input-group w-full">
            <Search aria-hidden="true" />
            <input aria-label="Rechercher un client"
              type="search"
              placeholder="Nom, téléphone ou e-mail…"
              className="input"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </div>

      {customers.some(
        (customer) =>
          customer.totalPurchases > 0 &&
          (customer.totalSpent === 0 || customer.totalSpent > 100000)
      ) && (
        <div className="alert alert-warning" role="status">
          <AlertCircle aria-hidden="true" />
          <div>
            <div>
              <p className="text-sm font-semibold">
                Statistiques potentiellement inexactes
              </p>
              <p className="text-sm">
                Certaines statistiques clients peuvent être incorrectes suite à
                des modifications de ventes. Utilisez "Recalculer les
                statistiques" pour corriger.
              </p>
            </div>
          </div>
        </div>
      )}

      <section className="card" aria-labelledby="customers-list-title">
        <div className="card-header">
          <h2 id="customers-list-title" className="section-title flex items-center gap-2">
            <Users className="w-4 h-4 text-gray-500" aria-hidden="true" />
            Répertoire clients
            <span className="badge num">{filteredCustomers.length}</span>
          </h2>
        </div>

        <div>
          {loading ? (
            <LoadingState label="Chargement des clients…" />
          ) : filteredCustomers.length === 0 ? (
            <EmptyState title="Aucun client trouvé" icon={<Users aria-hidden="true" />}>
              Modifiez la recherche ou ajoutez un nouveau client.
            </EmptyState>
          ) : (
            <ResponsiveTable className="min-w-full divide-y divide-gray-200">
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
                    Dernier achat
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
                          <div className="h-10 w-10 rounded-full bg-blue-50 flex items-center justify-center" aria-hidden="true">
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
                        <Phone className="w-3 h-3" aria-hidden="true" />
                        {customer.phone}
                      </div>
                      {customer.email && (
                        <div className="text-sm text-gray-500 flex items-center gap-1">
                          <Mail className="w-3 h-3" aria-hidden="true" />
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
                        <button aria-label="Voir les détails du client"
                          onClick={() => viewCustomerDetails(customer)}
                          className="text-blue-600 hover:text-blue-900 p-1 rounded"
                          title="Voir les détails du client"
                        >
                          <Eye className="w-4 h-4" aria-hidden="true" /><span className="ui-action-label">Détails</span>
                        </button>
                        <button aria-label="Recalculer les statistiques"
                          onClick={() => recalculateCustomerStats(customer._id)}
                          disabled={recalculating === customer._id}
                          className="text-green-600 hover:text-green-900 p-1 rounded disabled:opacity-50"
                          title="Recalculer les statistiques"
                        >
                          <RefreshCw
                            className={`w-4 h-4 ${
                              recalculating === customer._id ? "animate-spin" : ""
                            }`}
                            aria-hidden="true"
                          /><span className="ui-action-label">Recalculer</span>
                        </button>
                        <button aria-label="Supprimer le client"
                          onClick={() => handleDeleteCustomer(customer._id)}
                          className="text-red-600 hover:text-red-900 p-1 rounded"
                          title="Supprimer le client"
                        >
                          <Trash2 className="w-4 h-4" aria-hidden="true" /><span className="ui-action-label">Supprimer</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </ResponsiveTable>
          )}
        </div>

      </section>

      {showAddModal && (
        <Dialog label="Ajouter un Nouveau Client" onClose={() => setShowAddModal(false)}>
          <div className="bg-white rounded-lg max-w-md w-full mx-4">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Ajouter un Nouveau Client</h3>
              <button type="button" aria-label="Fermer"
                onClick={() => setShowAddModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" aria-hidden="true" />
              </button>
            </div>

            <form onSubmit={handleAddCustomer} className="p-6 space-y-4">
              <div>
                <label htmlFor="customers-field-20210" className="block text-sm font-medium text-gray-700 mb-1">Nom *</label>
                <input id="customers-field-20210"
                  type="text"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>

              <div>
                <label htmlFor="customers-field-20728" className="block text-sm font-medium text-gray-700 mb-1">Téléphone *</label>
                <input id="customers-field-20728"
                  type="tel"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
              </div>

              <div>
                <label htmlFor="customers-field-21241" className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input id="customers-field-21241"
                  type="email"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Ajouter le Client
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Annuler
                </button>
              </div>
            </form>
          </div>
        </Dialog>
      )}

      {showModal && selectedCustomer && (
        <Dialog label="Détails du client" onClose={() => setShowModal(false)}>
          <div className="bg-white rounded-lg max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Détails du client</h3>
              <button type="button" aria-label="Fermer"
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" aria-hidden="true" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div className="flex items-center gap-4">
                <div className="h-16 w-16 rounded-full bg-blue-100 flex items-center justify-center">
                  <span className="text-xl font-medium text-blue-600">
                    {selectedCustomer.name.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div>
                  <h4 className="text-xl font-semibold text-gray-900">{selectedCustomer.name}</h4>
                  <p className="text-gray-600">
                    Client depuis {formatDate(selectedCustomer.createdAt)}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Numéro de téléphone</label>
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-900">{selectedCustomer.phone}</span>
                  </div>
                </div>
                {selectedCustomer.email && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-gray-900">{selectedCustomer.email}</span>
                    </div>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-blue-50 rounded-lg p-4">
                  <div className="flex items-center gap-2">
                    <ShoppingBag className="w-5 h-5 text-blue-600" />
                    <div>
                      <p className="text-sm text-blue-600">Nombre total d'achats</p>
                      <p className="text-xl font-semibold text-blue-900">{selectedCustomer.totalPurchases}</p>
                    </div>
                  </div>
                </div>
                <div className="bg-green-50 rounded-lg p-4">
                  <div className="flex items-center gap-2">
                    <DollarSign className="w-5 h-5 text-green-600" />
                    <div>
                      <p className="text-sm text-green-600">Somme dépensée</p>
                      <p className="text-xl font-semibold text-green-900">
                        {formatCurrency(selectedCustomer.totalSpent)}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="bg-purple-50 rounded-lg p-4">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-purple-600" />
                    <div>
                      <p className="text-sm text-purple-600">Premier Achat</p>
                      <p className="text-sm font-semibold text-purple-900">
                        {formatDateTime(selectedCustomer.firstPurchaseDate)}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="bg-orange-50 rounded-lg p-4">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-orange-600" />
                    <div>
                      <p className="text-sm text-orange-600">Dernier Achat</p>
                      <p className="text-sm font-semibold text-orange-900">
                        {formatDateTime(selectedCustomer.lastPurchaseDate)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => recalculateCustomerStats(selectedCustomer._id)}
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  <RefreshCw className="w-4 h-4" />
                  Recalculer les Statistiques
                </button>
                <button
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Fermer
                </button>
              </div>
            </div>
          </div>
        </Dialog>
      )}
    </div>
  );
}
