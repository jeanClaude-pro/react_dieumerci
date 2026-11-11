"use client";
import ResponsiveTable from "../../components/ui/ResponsiveTable";
import Dialog from "../../components/ui/Dialog";
import { EmptyState, LoadingState, PermissionDenied } from "../../components/ui/States";

import type React from "react";
import { formatDateGMT2, formatDateTimeGMT2 } from "../../utils/dateUtils";
import { useState, useEffect, useRef } from "react";
import { serverUrl } from "../../utils/constants";
import { apiRequest } from "../../lib/api";
import { useTranslation } from "react-i18next";
import PageHeader from "../../components/ui/PageHeader";
import { formatNumber, formatUSD } from "../../i18n/format";
import { serverMessage } from "../../i18n/serverMessages";
import { getVerifiedUserRaw } from "../../lib/sessionManager";
import {
  CheckCircle,
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
  const { t } = useTranslation();
  const [notice, setNotice] = useState<{ kind: "success" | "danger" | "info"; text: string } | null>(null);
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

  // Latest fetchCustomers for the effect below (its trigger list stays unchanged).
  const fetchCustomersRef = useRef<typeof fetchCustomers>(undefined as unknown as typeof fetchCustomers);
  useEffect(() => {
    fetchCustomersRef.current();
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
  fetchCustomersRef.current = fetchCustomers;

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
    if (!dateString || dateString === "null" || dateString === "undefined") return t("common.notAvailable");
    return formatDateGMT2(dateString) || t("common.notAvailable");
  };

  const formatDateTime = (dateString: string) => {
    if (!dateString || dateString === "null" || dateString === "undefined") return t("common.notAvailable");
    return formatDateTimeGMT2(dateString) || t("common.notAvailable");
  };

  const formatCurrency = (amount: number) => formatUSD(amount);

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
        setNotice({ kind: "success", text: t("customers.added") });
        await fetchCustomers();
      } else {
        console.error("Failed to add customer:", response.status);
        const data = await response.json().catch(() => ({}));
        setNotice({ kind: "danger", text: serverMessage(data.error || data.message, t("customers.addFailed")) });
      }
    } catch (error) {
      console.error("Error adding customer:", error);
      setNotice({ kind: "danger", text: t("customers.addFailed") });
    }
  };

  const handleDeleteCustomer = async (customerId: string) => {
    if (confirm(t("customers.confirmDelete"))) {
      try {
        const response = await fetch(`${serverUrl}/customers/${customerId}`, {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
          },
        });

        if (response.ok) {
          setNotice({ kind: "success", text: t("customers.deleted") });
          await fetchCustomers();
        } else {
          console.error("Failed to delete customer:", response.status);
          const data = await response.json().catch(() => ({}));
          setNotice({ kind: "danger", text: serverMessage(data.error || data.message, t("customers.deleteFailed")) });
        }
      } catch (error) {
        console.error("Error deleting customer:", error);
        setNotice({ kind: "danger", text: t("customers.deleteFailed") });
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
        setNotice({ kind: "success", text: t("customers.recalculated") });
      } else if (response.status === 404) {
        setNotice({ kind: "info", text: t("customers.recalcUnavailable") });
      } else {
        setNotice({ kind: "danger", text: t("customers.recalcFailed") });
      }
    } catch (error) {
      console.error("Error recalculating customer stats:", error);
      setNotice({ kind: "danger", text: t("customers.recalcFailed") });
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
      const raw = getVerifiedUserRaw();
      return raw ? JSON.parse(raw).role === "admin" : false;
    } catch { return false; }
  })();

  if (!isAdmin) {
    return (
      <div className="page">
        <PermissionDenied>{t("customers.adminOnly")}</PermissionDenied>
      </div>
    );
  }

  const activeCount = customers.filter((c) => c.totalSpent > 0).length;
  const totalPurchases = customers.reduce((sum, customer) => sum + (customer.totalPurchases || 0), 0);
  const revenue = calculateTotalRevenue();

  return (
    <div className="page space-y-4">
      <PageHeader
        eyebrow={t("nav.sections.stock")}
        icon={<Users aria-hidden="true" />}
        title={t("customers.title")}
        description={t("customers.subtitle")}
        actions={<>
          <button type="button" aria-label={t("customers.refreshLabel")} onClick={refreshCustomers} disabled={refreshing} className="btn btn-secondary">
            <RefreshCw className={refreshing ? "animate-spin" : ""} aria-hidden="true" />
            {refreshing ? t("customers.refreshing") : t("common.refresh")}
          </button>
          <button type="button" onClick={() => setShowAddModal(true)} className="btn btn-primary">
            <Plus aria-hidden="true" />
            {t("customers.new")}
          </button>
        </>}
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="metric-card">
          <span className="metric-label flex items-center gap-1.5"><Users className="w-4 h-4 text-blue-600" aria-hidden="true" />{t("customers.kpi.customers")}</span>
          <span className="metric-value num">{formatNumber(customers.length, 0)}</span>
          <span className="text-xs text-gray-500">{t("customers.kpi.active", { count: activeCount })}</span>
        </div>
        <div className="metric-card">
          <span className="metric-label flex items-center gap-1.5"><DollarSign className="w-4 h-4 text-green-600" aria-hidden="true" />{t("customers.kpi.revenue")}</span>
          <span className="metric-value num">{formatCurrency(revenue)}</span>
          <span className="text-xs text-gray-500">{t("customers.kpi.revenueHint")}</span>
        </div>
        <div className="metric-card">
          <span className="metric-label flex items-center gap-1.5"><ShoppingBag className="w-4 h-4 text-gray-500" aria-hidden="true" />{t("customers.kpi.purchases")}</span>
          <span className="metric-value num">{formatNumber(totalPurchases, 0)}</span>
          <span className="text-xs text-gray-500">{t("customers.kpi.average", { value: formatCurrency(totalPurchases > 0 ? revenue / totalPurchases : 0) })}</span>
        </div>
        <div className="flex items-end">
          <div className="input-group w-full">
            <Search aria-hidden="true" />
            <input aria-label={t("customers.searchLabel")} type="search" placeholder={t("customers.searchPlaceholder")}
              className="input" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
          </div>
        </div>
      </div>

      {notice && (
        <div className={`alert alert-${notice.kind}`} role={notice.kind === "danger" ? "alert" : "status"}>
          {notice.kind === "danger" ? <AlertCircle aria-hidden="true" /> : <CheckCircle aria-hidden="true" />}
          <span className="flex-1 whitespace-pre-line">{notice.text}</span>
          <button type="button" aria-label={t("common.closeMessage")} onClick={() => setNotice(null)} className="btn btn-ghost btn-icon btn-sm -my-1 -mr-1"><X aria-hidden="true" /></button>
        </div>
      )}

      {customers.some((customer) => customer.totalPurchases > 0 && (customer.totalSpent === 0 || customer.totalSpent > 100000)) && (
        <div className="alert alert-warning" role="status">
          <AlertCircle aria-hidden="true" />
          <div>
            <p className="text-sm font-semibold">{t("customers.statsWarnTitle")}</p>
            <p className="text-sm">{t("customers.statsWarnBody")}</p>
          </div>
        </div>
      )}

      <section className="card" aria-labelledby="customers-list-title">
        <div className="card-header">
          <h2 id="customers-list-title" className="section-title flex items-center gap-2">
            <Users className="w-4 h-4 text-gray-500" aria-hidden="true" />
            {t("customers.directory")}
            <span className="badge num">{filteredCustomers.length}</span>
          </h2>
        </div>
        {loading ? (
          <LoadingState label={t("customers.loading")} />
        ) : filteredCustomers.length === 0 ? (
          <EmptyState title={t("customers.emptyTitle")} icon={<Users aria-hidden="true" />}>
            {t("customers.emptyBody")}
          </EmptyState>
        ) : (
          <ResponsiveTable className="report-table" aria-label={t("customers.directory")}>
            <thead>
              <tr>
                <th className="is-text">{t("customers.col.customer")}</th>
                <th className="is-text">{t("customers.col.contact")}</th>
                <th className="is-num">{t("customers.col.purchases")}</th>
                <th className="is-num">{t("customers.col.spent")}</th>
                <th className="is-text">{t("customers.col.last")}</th>
                <th className="is-text is-actions">{t("common.actions")}</th>
              </tr>
            </thead>
            <tbody>
              {filteredCustomers.map((customer) => (
                <tr key={customer._id}>
                  <td className="is-text">
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 shrink-0 rounded-full bg-blue-50 flex items-center justify-center" aria-hidden="true">
                        <span className="text-sm font-medium text-blue-600">{customer.name.charAt(0).toUpperCase()}</span>
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">{customer.name}</div>
                        <div className="text-xs text-gray-500">{t("customers.since", { date: formatDate(customer.createdAt) })}</div>
                      </div>
                    </div>
                  </td>
                  <td className="is-text">
                    <div className="text-gray-900 flex items-center gap-1"><Phone className="w-3 h-3" aria-hidden="true" />{customer.phone}</div>
                    {customer.email && <div className="text-xs text-gray-500 flex items-center gap-1"><Mail className="w-3 h-3" aria-hidden="true" />{customer.email}</div>}
                  </td>
                  <td className="num is-num">{formatNumber(customer.totalPurchases, 0)}</td>
                  <td className="num is-num"><strong>{formatCurrency(customer.totalSpent)}</strong></td>
                  <td className="is-text whitespace-nowrap text-gray-500">{formatDate(customer.lastPurchaseDate)}</td>
                  <td className="is-text is-actions">
                    <div className="flex gap-1 whitespace-nowrap">
                      <button type="button" aria-label={t("customers.viewDetails")} title={t("customers.viewDetails")} onClick={() => viewCustomerDetails(customer)} className="btn btn-ghost btn-sm">
                        <Eye aria-hidden="true" /><span className="ui-action-label">{t("common.details")}</span>
                      </button>
                      <button type="button" aria-label={t("customers.recalculate")} title={t("customers.recalculate")} onClick={() => recalculateCustomerStats(customer._id)} disabled={recalculating === customer._id} className="btn btn-ghost btn-sm">
                        <RefreshCw className={recalculating === customer._id ? "animate-spin" : ""} aria-hidden="true" /><span className="ui-action-label">{t("customers.recalculateShort")}</span>
                      </button>
                      <button type="button" aria-label={t("customers.delete")} title={t("customers.delete")} onClick={() => handleDeleteCustomer(customer._id)} className="btn btn-ghost btn-sm text-red-600">
                        <Trash2 aria-hidden="true" /><span className="ui-action-label">{t("common.delete")}</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </ResponsiveTable>
        )}
      </section>

      {showAddModal && (
        <Dialog label={t("customers.addTitle")} onClose={() => setShowAddModal(false)}>
          <form onSubmit={handleAddCustomer} className="dialog-panel max-w-md">
            <header className="dialog-head">
              <h3 className="dialog-title">{t("customers.addTitle")}</h3>
              <button type="button" aria-label={t("common.close")} onClick={() => setShowAddModal(false)} className="btn btn-ghost btn-icon btn-sm"><X aria-hidden="true" /></button>
            </header>
            <div className="dialog-body space-y-3">
              <label className="field">
                <span className="field-label">{t("entryHistory.name")} *</span>
                <input className="input" type="text" required value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
              </label>
              <label className="field">
                <span className="field-label">{t("entryHistory.phone")} *</span>
                <input className="input" type="tel" required value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} />
              </label>
              <label className="field">
                <span className="field-label">{t("entryHistory.email")} {t("common.optional")}</span>
                <input className="input" type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} />
              </label>
            </div>
            <footer className="dialog-foot">
              <button type="button" onClick={() => setShowAddModal(false)} className="btn btn-secondary">{t("common.cancel")}</button>
              <button type="submit" className="btn btn-primary"><Plus aria-hidden="true" />{t("customers.addSubmit")}</button>
            </footer>
          </form>
        </Dialog>
      )}

      {showModal && selectedCustomer && (
        <Dialog label={t("customers.detailsTitle")} onClose={() => setShowModal(false)}>
          <div className="dialog-panel max-w-2xl">
            <header className="dialog-head">
              <div className="flex items-center gap-3">
                <div className="h-11 w-11 rounded-full bg-blue-100 flex items-center justify-center" aria-hidden="true">
                  <span className="text-lg font-medium text-blue-600">{selectedCustomer.name.charAt(0).toUpperCase()}</span>
                </div>
                <div>
                  <h3 className="dialog-title">{selectedCustomer.name}</h3>
                  <p className="dialog-subtitle">{t("customers.since", { date: formatDate(selectedCustomer.createdAt) })}</p>
                </div>
              </div>
              <button type="button" aria-label={t("common.close")} onClick={() => setShowModal(false)} className="btn btn-ghost btn-icon btn-sm"><X aria-hidden="true" /></button>
            </header>
            <div className="dialog-body space-y-4">
              <dl className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                <div><dt className="text-gray-500">{t("customers.phoneNumber")}</dt><dd className="font-medium flex items-center gap-2"><Phone className="w-4 h-4 text-gray-400" aria-hidden="true" />{selectedCustomer.phone}</dd></div>
                {selectedCustomer.email && <div><dt className="text-gray-500">{t("entryHistory.email")}</dt><dd className="font-medium flex items-center gap-2"><Mail className="w-4 h-4 text-gray-400" aria-hidden="true" />{selectedCustomer.email}</dd></div>}
              </dl>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="metric-card"><span className="metric-label flex items-center gap-1.5"><ShoppingBag className="w-4 h-4" aria-hidden="true" />{t("customers.totalPurchases")}</span><span className="metric-value num">{formatNumber(selectedCustomer.totalPurchases, 0)}</span></div>
                <div className="metric-card"><span className="metric-label flex items-center gap-1.5"><DollarSign className="w-4 h-4" aria-hidden="true" />{t("customers.totalSpent")}</span><span className="metric-value num">{formatCurrency(selectedCustomer.totalSpent)}</span></div>
                <div className="metric-card"><span className="metric-label flex items-center gap-1.5"><Calendar className="w-4 h-4" aria-hidden="true" />{t("customers.firstPurchase")}</span><span className="text-sm font-semibold">{formatDateTime(selectedCustomer.firstPurchaseDate)}</span></div>
                <div className="metric-card"><span className="metric-label flex items-center gap-1.5"><Calendar className="w-4 h-4" aria-hidden="true" />{t("customers.lastPurchase")}</span><span className="text-sm font-semibold">{formatDateTime(selectedCustomer.lastPurchaseDate)}</span></div>
              </div>
            </div>
            <footer className="dialog-foot">
              <button type="button" onClick={() => setShowModal(false)} className="btn btn-secondary">{t("common.close")}</button>
              <button type="button" onClick={() => recalculateCustomerStats(selectedCustomer._id)} disabled={recalculating === selectedCustomer._id} className="btn btn-primary">
                <RefreshCw className={recalculating === selectedCustomer._id ? "animate-spin" : ""} aria-hidden="true" />{t("customers.recalculate")}
              </button>
            </footer>
          </div>
        </Dialog>
      )}
    </div>
  );
}
