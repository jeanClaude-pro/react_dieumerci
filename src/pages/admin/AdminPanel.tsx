"use client";
import ResponsiveTable from "../../components/ui/ResponsiveTable";
import { EmptyState, LoadingState } from "../../components/ui/States";
/* eslint-disable @typescript-eslint/no-explicit-any */

import React, { useState, useEffect, useRef } from "react";
import { toast } from "react-toastify";
import { useAuth } from "../../hooks/useAuth";
import { serverUrl } from "../../utils/constants";
import { useTranslation } from "react-i18next";
import { formatDate } from "../../i18n/format";
import { roleLabel } from "../../i18n/nav";
import { serverMessage } from "../../i18n/serverMessages";
import {
  Users,
  UserPlus,
  Shield,
  Eye,
  EyeOff,
  Trash2,
  Edit3,
  Check,
  X,
  RefreshCw,
  Search,
  ToggleLeft,
  ToggleRight,
  Lock,
  ChevronDown,
  Store,
  BookOpen,
  Save,
  Pencil,
} from "lucide-react";
import { tr } from "../../i18n/translate";

const API_BASE = serverUrl;

type AppRole =
  | "admin"
  | "manager"
  | "inventory_manager"
  | "cashier_supervisor"
  | "staff";

interface AppUser {
  _id: string;
  username: string;
  email: string;
  role: AppRole;
  isActive: boolean;
  permissions: string[];
  actionPermissions: string[];
  createdAt: string;
}

interface ShopSettings {
  shopName: string;
  shopAddress: string;
  shopNumber: string;
  shopRegistration: string;
  receiptFooter: string;
}

const ALL_PAGES = [
  { path: "/dashboard", key: "dashboard", label: "Tableau de bord" },
  { path: "/rate", key: "rate", label: "Taux d'échange" },
  { path: "/", key: "pos", label: "Point de Vente (POS)" },
  { path: "/entry", key: "entry", label: "Entrée de caisse" },
  { path: "/sortie", key: "sortie", label: "Sortie de caisse" },
  { path: "/products", key: "products", label: "Articles / Stock" },
  { path: "/sales", key: "sales", label: "Historique de Vente" },
  { path: "/entryhistory", key: "entryhistory", label: "Historique d'Entrée" },
  { path: "/sortiehistory", key: "sortiehistory", label: "Historique de Sortie" },
  { path: "/reports", key: "reports", label: "Rapports & Analytiques" },
  { path: "/customers", key: "customers", label: "Clients" },
];

const ALL_ACTIONS = [
  {
    key: "edit_receipts",
    label: "Modifier les reçus",
    description: "Peut surcharger les prix et quantités dans le panier avant impression",
  },
  {
    key: "reprint_receipts",
    label: "Réimprimer les reçus",
    description: "Peut réimprimer les anciens reçus depuis l'historique des ventes",
  },
];

const ROLE_LABELS: Record<AppRole, string> = {
  admin: "Administrateur",
  manager: "Gestionnaire",
  inventory_manager: "Responsable Stock",
  cashier_supervisor: "Superviseur Caisse",
  staff: "Personnel",
};

const ROLE_COLORS: Record<AppRole, string> = {
  admin: "bg-red-100 text-red-800 border-red-200",
  manager: "bg-purple-100 text-purple-800 border-purple-200",
  inventory_manager: "bg-blue-100 text-blue-800 border-blue-200",
  cashier_supervisor: "bg-emerald-100 text-emerald-800 border-emerald-200",
  staff: "bg-gray-100 text-gray-700 border-gray-200",
};

const ROLE_DEFAULT_PAGES: Record<AppRole, string[]> = {
  admin: ALL_PAGES.map((p) => p.path),
  manager: [
    "/",
    "/entry",
    "/sortie",
    "/products",
    "/sales",
    "/entryhistory",
    "/sortiehistory",
    "/customers",
  ],
  inventory_manager: [
    "/",
    "/entry",
    "/sortie",
    "/products",
    "/sales",
    "/entryhistory",
    "/sortiehistory",
  ],
  cashier_supervisor: [
    "/",
    "/entry",
    "/sortie",
    "/sales",
    "/entryhistory",
    "/sortiehistory",
    "/customers",
  ],
  staff: ["/"],
};

// Canonical description of what each role can do in the app
// Canonical description of what each role can do in the app (translation keys: admin.cap.*)
const ROLE_CAPABILITIES: Record<AppRole, { pages: string[]; actions: string[] }> = {
  admin: {
    pages: [
      "allPages",
      "adminPanel",
    ],
    actions: [
      "manageUsers",
      "setRoles",
      "receiptSettings",
      "editReceipts",
      "reprint",
      "allActions",
    ],
  },
  manager: {
    pages: [
      "pos",
      "reservations",
      "cash",
      "stock",
      "salesHistory",
      "customers",
    ],
    actions: [
      "createSales",
      "manageReservations",
      "recordCash",
      "manageStock",
      "viewSales",
      "editReceiptsIfAllowed",
    ],
  },
  inventory_manager: {
    pages: [
      "pos",
      "reservations",
      "cash",
      "stock",
      "salesHistory",
    ],
    actions: [
      "createSales",
      "manageReservations",
      "recordCash",
      "manageStock",
      "viewSales",
    ],
  },
  cashier_supervisor: {
    pages: [
      "pos",
      "reservations",
      "cash",
      "salesHistory",
      "customers",
    ],
    actions: [
      "createSales",
      "manageReservations",
      "recordCash",
      "viewSales",
      "manageCustomers",
      "editReceiptsIfAllowed",
    ],
  },
  staff: {
    pages: ["pos"],
    actions: [
      "salesOnly",
      "printAfterSale",
    ],
  },
};

const AVATAR_COLORS = [
  "from-blue-500 to-indigo-600",
  "from-purple-500 to-pink-600",
  "from-green-500 to-teal-600",
  "from-orange-500 to-red-600",
  "from-teal-500 to-cyan-600",
];

function avatarColor(username: string) {
  return AVATAR_COLORS[username.charCodeAt(0) % AVATAR_COLORS.length];
}

type Tab = "users" | "create" | "permissions" | "receipt" | "roles";

export default function AdminPanel() {
  const { t } = useTranslation();
  const pageLabel = (page: { key: string; label: string }) => t(`admin.pages.${page.key}`, { defaultValue: page.label });
  const ROLE_NAME = (role: AppRole) => roleLabel(t, role);
  const [tab, setTab] = useState<Tab>("users");
  const [users, setUsers] = useState<AppUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  // Create user form
  const [createForm, setCreateForm] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: "staff" as AppRole,
  });
  const [creating, setCreating] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Inline role editing
  const [editingRoleId, setEditingRoleId] = useState<string | null>(null);

  // Inline username editing
  const [editingUsernameId, setEditingUsernameId] = useState<string | null>(null);
  const [editingUsernameValue, setEditingUsernameValue] = useState("");

  // Permissions tab
  const [selectedUserId, setSelectedUserId] = useState<string>("");
  const [selectedUserPerms, setSelectedUserPerms] = useState<string[]>([]);
  const [useCustomPerms, setUseCustomPerms] = useState(false);
  const [selectedUserActions, setSelectedUserActions] = useState<string[]>([]);
  const [savingPerms, setSavingPerms] = useState(false);

  // Receipt settings
  const [shopSettings, setShopSettings] = useState<ShopSettings>({
    shopName: "",
    shopAddress: "",
    shopNumber: "",
    shopRegistration: "",
    receiptFooter: "",
  });
  const [savingSettings, setSavingSettings] = useState(false);
  const [loadingSettings, setLoadingSettings] = useState(false);

  const { token, user: currentUser } = useAuth();

  const authHeaders = () => ({
    "Content-Type": "application/json",
    Authorization: `Bearer ${token || localStorage.getItem("token") || ""}`,
  });

  // ─── Data fetching ───────────────────────────────────────────────────────────

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/users`, { headers: authHeaders() });
      if (!res.ok) throw new Error(tr("admin.err.loadUsers", "Impossible de charger les utilisateurs"));
      const data = await res.json();
      setUsers(data);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };
  // Latest fetchUsers for the effect below (its trigger list stays unchanged).
  const fetchUsersRef = useRef(fetchUsers);
  fetchUsersRef.current = fetchUsers;

  const fetchShopSettings = async () => {
    setLoadingSettings(true);
    try {
      const res = await fetch(`${API_BASE}/settings/receipt`, {
        headers: authHeaders(),
      });
      if (!res.ok) throw new Error(tr("admin.err.loadSettings", "Impossible de charger les réglages"));
      const data = await res.json();
      setShopSettings({
        shopName: data.shopName || "",
        shopAddress: data.shopAddress || "",
        shopNumber: data.shopNumber || "",
        shopRegistration: data.shopRegistration || "",
        receiptFooter: data.receiptFooter || "",
      });
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoadingSettings(false);
    }
  };
  // Latest fetchShopSettings for the effect below (its trigger list stays unchanged).
  const fetchShopSettingsRef = useRef(fetchShopSettings);
  fetchShopSettingsRef.current = fetchShopSettings;

  useEffect(() => {
    fetchUsersRef.current();
    fetchShopSettingsRef.current();
  }, []);

  // ─── Username editing ────────────────────────────────────────────────────────

  const startEditUsername = (user: AppUser) => {
    setEditingUsernameId(user._id);
    setEditingUsernameValue(user.username);
  };

  const cancelEditUsername = () => {
    setEditingUsernameId(null);
    setEditingUsernameValue("");
  };

  const saveUsername = async (userId: string) => {
    if (!editingUsernameValue.trim()) {
      toast.error(t("admin.err.usernameEmpty"));
      return;
    }
    try {
      const res = await fetch(`${API_BASE}/users/${userId}/username`, {
        method: "PUT",
        headers: authHeaders(),
        body: JSON.stringify({ username: editingUsernameValue.trim() }),
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(serverMessage(d.message, t("admin.err.update")));
      }
      const updated = await res.json();
      setUsers((prev) =>
        prev.map((u) =>
          u._id === userId ? { ...u, username: updated.username } : u
        )
      );
      cancelEditUsername();
      toast.success(t("admin.ok.username"));
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  // ─── Status / role / delete ──────────────────────────────────────────────────

  const handleToggleStatus = async (user: AppUser) => {
    try {
      const res = await fetch(`${API_BASE}/users/${user._id}/status`, {
        method: "PUT",
        headers: authHeaders(),
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(serverMessage(d.message, t("admin.err.status")));
      }
      const data = await res.json();
      setUsers((prev) =>
        prev.map((u) =>
          u._id === user._id ? { ...u, isActive: data.user.isActive } : u
        )
      );
      toast.success(serverMessage(data.message, data.user.isActive ? t("admin.ok.activated") : t("admin.ok.deactivated")));
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleUpdateRole = async (userId: string, role: AppRole) => {
    try {
      const res = await fetch(`${API_BASE}/users/${userId}/role`, {
        method: "PUT",
        headers: authHeaders(),
        body: JSON.stringify({ role }),
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(serverMessage(d.message, t("admin.err.role")));
      }
      const updated = await res.json();
      setUsers((prev) =>
        prev.map((u) => (u._id === userId ? { ...u, role: updated.role } : u))
      );
      setEditingRoleId(null);
      toast.success(t("admin.ok.role"));
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleDeleteUser = async (user: AppUser) => {
    if (
      !window.confirm(
        t("admin.confirmDelete", { name: user.username })
      )
    )
      return;
    try {
      const res = await fetch(`${API_BASE}/users/${user._id}`, {
        method: "DELETE",
        headers: authHeaders(),
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(serverMessage(d.message, t("admin.err.delete")));
      }
      setUsers((prev) => prev.filter((u) => u._id !== user._id));
      toast.success(t("admin.ok.deleted"));
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  // ─── Create user ─────────────────────────────────────────────────────────────

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (createForm.password !== createForm.confirmPassword) {
      toast.error(t("admin.err.passwordMismatch"));
      return;
    }
    if (createForm.password.length < 10 || createForm.password.length > 128) {
      toast.error(t("admin.err.passwordLength"));
      return;
    }
    setCreating(true);
    try {
      const res = await fetch(`${API_BASE}/users`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({
          username: createForm.username.trim(),
          email: createForm.email.trim().toLowerCase(),
          password: createForm.password,
          role: createForm.role,
        }),
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(serverMessage(d.message, t("admin.err.create")));
      }
      const createdUser = (await res.json()) as AppUser;
      setUsers((previousUsers) => [createdUser, ...previousUsers]);
      toast.success(t("admin.ok.created", { name: createdUser.username }));
      setCreateForm({ username: "", email: "", password: "", confirmPassword: "", role: "staff" });
      setTab("users");
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setCreating(false);
    }
  };

  // ─── Permissions ─────────────────────────────────────────────────────────────

  const handleSelectUserForPerms = (userId: string) => {
    setSelectedUserId(userId);
    const user = users.find((u) => u._id === userId);
    if (user) {
      const hasCustom = user.permissions && user.permissions.length > 0;
      setUseCustomPerms(hasCustom);
      setSelectedUserPerms(
        hasCustom ? user.permissions : [...ROLE_DEFAULT_PAGES[user.role]]
      );
      setSelectedUserActions(user.actionPermissions || []);
    }
  };

  const handleSavePermissions = async () => {
    if (!selectedUserId) return;
    setSavingPerms(true);
    try {
      const permsToSave = useCustomPerms ? selectedUserPerms : [];
      const [permRes, actionRes] = await Promise.all([
        fetch(`${API_BASE}/users/${selectedUserId}/permissions`, {
          method: "PUT",
          headers: authHeaders(),
          body: JSON.stringify({ permissions: permsToSave }),
        }),
        fetch(`${API_BASE}/users/${selectedUserId}/actions`, {
          method: "PUT",
          headers: authHeaders(),
          body: JSON.stringify({ actionPermissions: selectedUserActions }),
        }),
      ]);
      if (!permRes.ok || !actionRes.ok) {
        throw new Error(t("admin.err.permissions"));
      }
      setUsers((prev) =>
        prev.map((u) =>
          u._id === selectedUserId
            ? { ...u, permissions: permsToSave, actionPermissions: selectedUserActions }
            : u
        )
      );
      toast.success(t("admin.ok.permissions"));
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSavingPerms(false);
    }
  };

  const handleResetPermissions = async (user: AppUser) => {
    setSavingPerms(true);
    try {
      await fetch(`${API_BASE}/users/${user._id}/permissions`, {
        method: "PUT",
        headers: authHeaders(),
        body: JSON.stringify({ permissions: [] }),
      });
      setUsers((prev) =>
        prev.map((u) => (u._id === user._id ? { ...u, permissions: [] } : u))
      );
      setUseCustomPerms(false);
      setSelectedUserPerms([...ROLE_DEFAULT_PAGES[user.role]]);
      toast.success(t("admin.ok.permissionsReset"));
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSavingPerms(false);
    }
  };

  const toggleActionPerm = (key: string) => {
    setSelectedUserActions((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  };

  // ─── Receipt settings ─────────────────────────────────────────────────────────

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingSettings(true);
    try {
      const res = await fetch(`${API_BASE}/settings/receipt`, {
        method: "PUT",
        headers: authHeaders(),
        body: JSON.stringify(shopSettings),
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(serverMessage(d.message, t("admin.err.save")));
      }
      toast.success(t("admin.ok.settings"));
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSavingSettings(false);
    }
  };

  // ─── Derived values ───────────────────────────────────────────────────────────

  const filteredUsers = users.filter(
    (u) =>
      u.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase())
  );
  const activeCount = users.filter((u) => u.isActive).length;
  const selectedUser = users.find((u) => u._id === selectedUserId);

  const TABS = [
    { key: "users" as Tab, label: t("admin.tabs.users"), icon: Users },
    { key: "create" as Tab, label: t("admin.tabs.create"), icon: UserPlus },
    { key: "permissions" as Tab, label: t("admin.tabs.permissions"), icon: Lock },
    { key: "receipt" as Tab, label: t("admin.tabs.receipt"), icon: Store },
    { key: "roles" as Tab, label: t("admin.tabs.roles"), icon: BookOpen },
  ] as const;

  return (
    <div className="page">
      <div>
        <header className="page-header">
          <div>
            <div className="eyebrow"><Shield aria-hidden="true" />{t("approvals.eyebrow")}</div>
            <h1 className="page-title">{t("admin.title")}</h1>
            <p className="page-subtitle">{t("admin.subtitle")}</p>
          </div>
        </header>

        <div className="grid grid-cols-3 gap-3 mb-5">
          <div className="metric-card">
            <span className="metric-label">{t("admin.kpi.accounts")}</span>
            <span className="metric-value">{users.length}</span>
          </div>
          <div className="metric-card">
            <span className="metric-label">{t("admin.kpi.active")}</span>
            <span className="metric-value text-green-700">{activeCount}</span>
          </div>
          <div className="metric-card">
            <span className="metric-label">{t("admin.kpi.disabled")}</span>
            <span className="metric-value text-red-700">{users.length - activeCount}</span>
          </div>
        </div>

        {/* ─── Tabs ─── */}
        <div className="segmented flex! w-full overflow-x-auto mb-5" role="tablist" aria-label={t("admin.sections")}>
          {TABS.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              type="button"
              role="tab"
              aria-selected={tab === key}
              onClick={() => setTab(key)}
              className="shrink-0 grow"
            >
              <Icon aria-hidden="true" />
              {label}
            </button>
          ))}
        </div>

        {/* ══════════════ USERS TAB ══════════════ */}
        {tab === "users" && (
          <div className="card overflow-hidden" role="tabpanel" aria-label={t("admin.tabs.users")}>
            <div className="card-header">
              <div className="input-group flex-1 min-w-0 sm:min-w-[16rem]">
                <Search aria-hidden="true" />
                <input aria-label={t("admin.searchLabel")}
                  type="search"
                  placeholder={t("admin.searchPlaceholder")}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="input"
                />
              </div>
              <button
                type="button"
                onClick={fetchUsers}
                disabled={loading}
                className="btn btn-secondary"
              >
                <RefreshCw className={loading ? "animate-spin" : ""} aria-hidden="true" />
                {t("common.refresh")}
              </button>
            </div>

            <div className="overflow-x-auto">
              <ResponsiveTable className="w-full">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">{t("admin.col.user")}</th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">{t("admin.col.role")}</th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">{t("common.status")}</th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">{t("admin.tabs.permissions")}</th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">{t("admin.col.created")}</th>
                    <th className="text-center px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">{t("common.actions")}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {loading ? (
                    <tr>
                      <td colSpan={6}>
                        <LoadingState label={t("admin.loadingUsers")} />
                      </td>
                    </tr>
                  ) : filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan={6}>
                        <EmptyState title={t("admin.noUsers")} icon={<Users aria-hidden="true" />} />
                      </td>
                    </tr>
                  ) : (
                    filteredUsers.map((user) => (
                      <tr
                        key={user._id}
                        className={`hover:bg-gray-50 transition-colors ${!user.isActive ? "opacity-50" : ""}`}
                      >
                        {/* User info + inline username edit */}
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-3">
                            <div
                              className={`w-9 h-9 rounded-full bg-gradient-to-br ${avatarColor(user.username)} flex items-center justify-center text-white font-semibold text-sm flex-shrink-0`}
                            >
                              {user.username.charAt(0).toUpperCase()}
                            </div>
                            <div className="min-w-0">
                              {editingUsernameId === user._id ? (
                                <div className="flex items-center gap-1.5">
                                  <input
                                    value={editingUsernameValue}
                                    onChange={(e) =>
                                      setEditingUsernameValue(e.target.value)
                                    }
                                    onKeyDown={(e) => {
                                      if (e.key === "Enter") saveUsername(user._id);
                                      if (e.key === "Escape") cancelEditUsername();
                                    }}
                                    autoFocus
                                    aria-label={t("admin.newUsernameFor", { name: user.username })}
                                    className="text-sm border border-blue-300 rounded-lg px-2 py-1 focus:ring-1 focus:ring-blue-500 w-36"
                                  />
                                  <button type="button" aria-label={t("admin.saveUsername")} title={t("common.save")}
                                    onClick={() => saveUsername(user._id)}
                                    className="text-emerald-600 hover:text-emerald-800"
                                  >
                                    <Check className="w-3.5 h-3.5" aria-hidden="true" />
                                  </button>
                                  <button type="button" aria-label={t("admin.cancelEdit")} title={t("common.cancel")}
                                    onClick={cancelEditUsername}
                                    className="text-gray-400 hover:text-gray-600"
                                  >
                                    <X className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              ) : (
                                <div className="flex items-center gap-1.5">
                                  <p className="font-medium text-gray-900 text-sm truncate">
                                    {user.username}
                                  </p>
                                  <button type="button" aria-label={t("admin.editUsername")}
                                    onClick={() => startEditUsername(user)}
                                    className="text-gray-400 hover:text-blue-600 transition-colors flex-shrink-0 rounded p-0.5"
                                    title={t("admin.editUsername")}
                                  >
                                    <Pencil className="w-3 h-3" />
                                  </button>
                                </div>
                              )}
                              <p className="text-xs text-gray-500 truncate">{user.email}</p>
                            </div>
                          </div>
                        </td>

                        {/* Role (inline editable) */}
                        <td className="px-5 py-3.5">
                          {editingRoleId === user._id ? (
                            <div className="flex items-center gap-2">
                              <select
                                defaultValue={user.role}
                                onChange={(e) =>
                                  handleUpdateRole(user._id, e.target.value as AppRole)
                                }
                                className="text-xs border border-gray-300 rounded-lg px-2 py-1.5 focus:ring-1 focus:ring-blue-500 bg-white"
                                autoFocus
                                aria-label={t("admin.roleOf", { name: user.username })}
                              >
                                {(Object.keys(ROLE_LABELS) as AppRole[]).map((r) => (
                                  <option key={r} value={r}>
                                    {ROLE_NAME(r)}
                                  </option>
                                ))}
                              </select>
                              <button type="button" aria-label={t("admin.cancelRole")}
                                onClick={() => setEditingRoleId(null)}
                                className="text-gray-400 hover:text-gray-600"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ) : (
                            <button type="button" aria-label={t("admin.roleEditLabel", { role: ROLE_NAME(user.role) })} title={t("admin.editRole")}
                              onClick={() => setEditingRoleId(user._id)}
                              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border ${ROLE_COLORS[user.role]} hover:opacity-80 transition-opacity`}
                            >
                              {ROLE_NAME(user.role)}
                              <Edit3 className="w-3 h-3 opacity-60" aria-hidden="true" />
                            </button>
                          )}
                        </td>

                        {/* Status */}
                        <td className="px-5 py-3.5">
                          <button
                            type="button"
                            onClick={() => handleToggleStatus(user)}
                            aria-label={user.isActive ? t("admin.deactivateLabel", { name: user.username }) : t("admin.activateLabel", { name: user.username })}
                            title={user.isActive ? t("admin.deactivate") : t("admin.activate")}
                            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                              user.isActive
                                ? "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100"
                                : "bg-red-50 text-red-700 border-red-200 hover:bg-red-100"
                            }`}
                          >
                            {user.isActive ? (
                              <><ToggleRight className="w-3.5 h-3.5" aria-hidden="true" />{t("common.active")}</>
                            ) : (
                              <><ToggleLeft className="w-3.5 h-3.5" aria-hidden="true" />{t("admin.disabled")}</>
                            )}
                          </button>
                        </td>

                        {/* Permissions badge */}
                        <td className="px-5 py-3.5">
                          <div className="flex flex-col gap-1">
                            <span
                              className={`text-xs px-2.5 py-1 rounded-full border w-fit ${
                                user.permissions && user.permissions.length > 0
                                  ? "bg-blue-50 text-blue-700 border-blue-200"
                                  : "bg-gray-50 text-gray-500 border-gray-200"
                              }`}
                            >
                              {user.permissions && user.permissions.length > 0
                                ? t("admin.pageCount", { count: user.permissions.length })
                                : t("admin.byRole")}
                            </span>
                            {user.actionPermissions && user.actionPermissions.length > 0 && (
                              <span className="text-xs px-2.5 py-1 rounded-full border bg-amber-50 text-amber-700 border-amber-200 w-fit">
                                {t("admin.actionCount", { count: user.actionPermissions.length })}
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Created at */}
                        <td className="px-5 py-3.5 text-xs text-gray-500">
                          {formatDate(user.createdAt)}
                        </td>

                        {/* Actions */}
                        <td className="px-5 py-3.5">
                          <div className="flex items-center justify-center gap-1">
                            <button type="button" aria-label={t("admin.managePermissions")}
                              onClick={() => {
                                handleSelectUserForPerms(user._id);
                                setTab("permissions");
                              }}
                              className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              title={t("admin.managePermissions")}
                            >
                              <Shield className="w-4 h-4" aria-hidden="true" /><span className="ui-action-label">{t("admin.tabs.permissions")}</span>
                            </button>
                            <button type="button" aria-label={t("admin.deleteUser")}
                              onClick={() => handleDeleteUser(user)}
                              className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                              title={t("admin.deleteUser")}
                            >
                              <Trash2 className="w-4 h-4" aria-hidden="true" /><span className="ui-action-label">{t("common.delete")}</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </ResponsiveTable>
            </div>
          </div>
        )}

        {/* ══════════════ CREATE USER TAB ══════════════ */}
        {tab === "create" && (
          <div className="max-w-lg mx-auto">
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="p-6 border-b border-gray-100">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-blue-100 rounded-xl flex items-center justify-center">
                    <UserPlus className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900">{t("admin.create.title")}</h2>
                    <p className="text-sm text-gray-500">{t("admin.create.subtitle")}</p>
                  </div>
                </div>
              </div>

              <form onSubmit={handleCreateUser} className="p-6 space-y-4">
                <div>
                  <label htmlFor="adminpanel-field-33777" className="block text-sm font-medium text-gray-700 mb-1.5">
                    {t("admin.create.username")} <span className="text-red-500">*</span>
                  </label>
                  <input id="adminpanel-field-33777"
                    type="text"
                    value={createForm.username}
                    onChange={(e) => setCreateForm((f) => ({ ...f, username: e.target.value }))}
                    placeholder={t("admin.create.usernamePlaceholder")}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="adminpanel-field-34474" className="block text-sm font-medium text-gray-700 mb-1.5">
                    {t("admin.create.email")} <span className="text-red-500">*</span>
                  </label>
                  <input id="adminpanel-field-34474"
                    type="email"
                    value={createForm.email}
                    onChange={(e) => setCreateForm((f) => ({ ...f, email: e.target.value }))}
                    placeholder={t("admin.create.emailPlaceholder")}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="adminpanel-field-35210" className="block text-sm font-medium text-gray-700 mb-1.5">
                    {t("admin.col.role")} <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <select id="adminpanel-field-35210"
                      value={createForm.role}
                      onChange={(e) => setCreateForm((f) => ({ ...f, role: e.target.value as AppRole }))}
                      className="w-full px-4 py-3 pr-10 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm bg-white appearance-none"
                      required
                    >
                      {(Object.keys(ROLE_LABELS) as AppRole[]).map((r) => (
                        <option key={r} value={r}>{ROLE_NAME(r)}</option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                  </div>
                </div>

                <div>
                  <label htmlFor="adminpanel-field-36298" className="block text-sm font-medium text-gray-700 mb-1.5">
                    {t("admin.create.password")} <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input id="adminpanel-field-36298"
                      type={showPassword ? "text" : "password"}
                      value={createForm.password}
                      onChange={(e) => setCreateForm((f) => ({ ...f, password: e.target.value }))}
                      placeholder={t("admin.create.passwordPlaceholder")}
                      className="w-full px-4 py-3 pr-11 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                      required
                      minLength={10}
                      maxLength={128}
                    />
                    <button aria-label={showPassword ? t("admin.create.hidePassword") : t("admin.create.showPassword")} type="button" onClick={() => setShowPassword((s) => !s)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label htmlFor="adminpanel-field-37494" className="block text-sm font-medium text-gray-700 mb-1.5">
                    {t("admin.create.confirm")} <span className="text-red-500">*</span>
                  </label>
                  <input id="adminpanel-field-37494"
                    type={showPassword ? "text" : "password"}
                    value={createForm.confirmPassword}
                    onChange={(e) => setCreateForm((f) => ({ ...f, confirmPassword: e.target.value }))}
                    placeholder={t("admin.create.confirmPlaceholder")}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    required
                    minLength={10}
                    maxLength={128}
                  />
                </div>

                {/* Role preview */}
                <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
                  <p className="text-sm font-medium text-blue-800 mb-2">
                    {t("admin.create.rolePreview", { role: ROLE_NAME(createForm.role) })}
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {ROLE_DEFAULT_PAGES[createForm.role].map((path) => {
                      const page = ALL_PAGES.find((p) => p.path === path);
                      return page ? (
                        <span key={path} className="px-2.5 py-0.5 bg-blue-100 text-blue-700 rounded-full text-xs font-medium border border-blue-200">
                          {pageLabel(page)}
                        </span>
                      ) : null;
                    })}
                  </div>
                </div>

                <button type="submit" disabled={creating}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-semibold text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-2">
                  {creating ? (
                    <><RefreshCw className="w-4 h-4 animate-spin" aria-hidden="true" />{t("admin.create.creating")}</>
                  ) : (
                    <><UserPlus className="w-4 h-4" aria-hidden="true" />{t("admin.create.submit")}</>
                  )}
                </button>
              </form>
            </div>
          </div>
        )}

        {/* ══════════════ PERMISSIONS TAB ══════════════ */}
        {tab === "permissions" && (
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-purple-100 rounded-xl flex items-center justify-center">
                  <Lock className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">{t("admin.perm.title")}</h2>
                  <p className="text-sm text-gray-500">{t("admin.perm.subtitle")}</p>
                </div>
              </div>
            </div>

            <div className="p-6">
              {/* User selector */}
              <div className="mb-6">
                <label htmlFor="adminpanel-field-40763" className="block text-sm font-medium text-gray-700 mb-2">
                  {t("admin.perm.selectUser")}
                </label>
                <div className="relative max-w-sm">
                  <select id="adminpanel-field-40763"
                    value={selectedUserId}
                    onChange={(e) => handleSelectUserForPerms(e.target.value)}
                    className="w-full px-4 py-3 pr-10 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm bg-white appearance-none"
                  >
                    <option value="">{t("admin.perm.choose")}</option>
                    {users.map((u) => (
                      <option key={u._id} value={u._id}>
                        {u.username} ({ROLE_NAME(u.role)})
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                </div>
              </div>

              {!selectedUserId && (
                <div className="text-center py-16 text-gray-400">
                  <Shield className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p className="text-sm">{t("admin.perm.empty")}</p>
                </div>
              )}

              {selectedUserId && selectedUser && (
                <div>
                  {/* Selected user card */}
                  <div className="flex items-center gap-3 mb-5 p-3 bg-gray-50 rounded-xl border border-gray-100">
                    <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${avatarColor(selectedUser.username)} flex items-center justify-center text-white font-semibold text-sm flex-shrink-0`}>
                      {selectedUser.username.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-gray-900 text-sm">{selectedUser.username}</p>
                      <p className="text-xs text-gray-500">{selectedUser.email}</p>
                    </div>
                    <span className={`text-xs px-2.5 py-1 rounded-full border font-medium ${ROLE_COLORS[selectedUser.role]}`}>
                      {ROLE_NAME(selectedUser.role)}
                    </span>
                  </div>

                  {/* ── Section 1: Page permissions ── */}
                  <div className="mb-6">
                    <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                      <Lock className="w-4 h-4 text-blue-500" aria-hidden="true" />
                      {t("admin.perm.pages")}
                    </h3>

                    {/* Custom perms toggle */}
                    <div className="flex items-center justify-between mb-4 p-4 bg-amber-50 border border-amber-200 rounded-xl">
                      <div>
                        <p className="text-sm font-semibold text-amber-800">{t("admin.perm.custom")}</p>
                        <p className="text-xs text-amber-600 mt-0.5">
                          {useCustomPerms
                            ? t("admin.perm.customOn")
                            : t("admin.perm.customOff")}
                        </p>
                      </div>
                      <button
                        type="button"
                        role="switch"
                        aria-checked={useCustomPerms}
                        aria-label={t("admin.perm.custom")}
                        onClick={() => {
                          const next = !useCustomPerms;
                          setUseCustomPerms(next);
                          if (next && selectedUserPerms.length === 0) {
                            setSelectedUserPerms([...ROLE_DEFAULT_PAGES[selectedUser.role]]);
                          }
                        }}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors flex-shrink-0 ${useCustomPerms ? "bg-amber-500" : "bg-gray-300"}`}
                      >
                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${useCustomPerms ? "translate-x-6" : "translate-x-1"}`} />
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                      {ALL_PAGES.map((page) => {
                        const checkedByRole = ROLE_DEFAULT_PAGES[selectedUser.role].includes(page.path);
                        const checkedCustom = selectedUserPerms.includes(page.path);
                        const isChecked = useCustomPerms ? checkedCustom : checkedByRole;

                        return (
                          <label
                            key={page.path}
                            className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all select-none ${
                              isChecked
                                ? useCustomPerms
                                  ? "border-blue-300 bg-blue-50"
                                  : "border-emerald-200 bg-emerald-50"
                                : "border-gray-200 bg-white hover:bg-gray-50"
                            } ${!useCustomPerms ? "cursor-default" : ""}`}
                          >
                            <input
                              type="checkbox"
                              checked={isChecked}
                              disabled={!useCustomPerms}
                              onChange={(e) => {
                                if (!useCustomPerms) return;
                                setSelectedUserPerms((prev) =>
                                  e.target.checked
                                    ? [...prev, page.path]
                                    : prev.filter((p) => p !== page.path)
                                );
                              }}
                              className="w-4 h-4 rounded text-blue-600 border-gray-300 focus:ring-blue-500 flex-shrink-0"
                            />
                            <span className={`text-sm ${isChecked ? "text-gray-800 font-medium" : "text-gray-500"}`}>
                              {pageLabel(page)}
                            </span>
                            {!useCustomPerms && checkedByRole && (
                              <span className="ml-auto text-xs text-emerald-600 font-medium">{t("admin.col.role")}</span>
                            )}
                          </label>
                        );
                      })}
                    </div>
                  </div>

                  {/* ── Section 2: Action permissions ── */}
                  <div className="mb-6">
                    <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                      <Shield className="w-4 h-4 text-purple-500" aria-hidden="true" />
                      {t("admin.perm.actions")}
                    </h3>
                    <p className="text-xs text-gray-500 mb-3">
                      {t("admin.perm.actionsHint")}
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {ALL_ACTIONS.map((action) => {
                        const isGranted = selectedUserActions.includes(action.key);
                        return (
                          <label
                            key={action.key}
                            className={`flex items-start gap-3 p-4 rounded-xl border cursor-pointer transition-all select-none ${
                              isGranted
                                ? "border-purple-300 bg-purple-50"
                                : "border-gray-200 bg-white hover:bg-gray-50"
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={isGranted}
                              onChange={() => toggleActionPerm(action.key)}
                              className="w-4 h-4 mt-0.5 rounded text-purple-600 border-gray-300 focus:ring-purple-500 flex-shrink-0"
                            />
                            <div>
                              <p className={`text-sm font-medium ${isGranted ? "text-purple-800" : "text-gray-700"}`}>
                                {t(`admin.actions.${action.key}.label`, { defaultValue: action.label })}
                              </p>
                              <p className="text-xs text-gray-500 mt-0.5">{t(`admin.actions.${action.key}.description`, { defaultValue: action.description })}</p>
                            </div>
                          </label>
                        );
                      })}
                    </div>
                  </div>

                  {/* Action buttons */}
                  <div className="flex items-center gap-3 pt-4 border-t border-gray-100">
                    <button
                      type="button"
                      onClick={handleSavePermissions}
                      disabled={savingPerms}
                      className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      {savingPerms ? (
                        <><RefreshCw className="w-4 h-4 animate-spin" aria-hidden="true" />{t("common.saving")}</>
                      ) : (
                        <><Check className="w-4 h-4" aria-hidden="true" />{t("common.save")}</>
                      )}
                    </button>

                    {useCustomPerms && (
                      <button
                        type="button"
                        onClick={() => handleResetPermissions(selectedUser)}
                        disabled={savingPerms}
                        className="flex items-center gap-2 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-sm font-medium transition-colors disabled:opacity-40"
                      >
                        <X className="w-4 h-4" aria-hidden="true" />
                        {t("admin.perm.reset")}
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ══════════════ RECEIPT SETTINGS TAB ══════════════ */}
        {tab === "receipt" && (
          <div className="max-w-2xl mx-auto">
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="p-6 border-b border-gray-100">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-orange-100 rounded-xl flex items-center justify-center">
                    <Store className="w-5 h-5 text-orange-600" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900">{t("admin.receipt.title")}</h2>
                    <p className="text-sm text-gray-500">{t("admin.receipt.subtitle")}</p>
                  </div>
                </div>
              </div>

              {loadingSettings ? (
                <div className="flex items-center justify-center py-16 text-gray-400">
                  <RefreshCw className="w-6 h-6 animate-spin mr-2 opacity-40" aria-hidden="true" />
                  {t("newSale.loading")}
                </div>
              ) : (
                <form onSubmit={handleSaveSettings} className="p-6 space-y-5">
                  <div>
                    <label htmlFor="adminpanel-field-52350" className="block text-sm font-medium text-gray-700 mb-1.5">
                      {t("admin.receipt.shopName")}
                    </label>
                    <input id="adminpanel-field-52350"
                      type="text"
                      value={shopSettings.shopName}
                      onChange={(e) =>
                        setShopSettings((s) => ({ ...s, shopName: e.target.value }))
                      }
                      placeholder="ETS. DIEU MERCI"
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                      required
                    />
                  </div>

                  <div>
                    <label htmlFor="adminpanel-field-53080" className="block text-sm font-medium text-gray-700 mb-1.5">
                      {t("admin.receipt.address")}
                    </label>
                    <input id="adminpanel-field-53080"
                      type="text"
                      value={shopSettings.shopAddress}
                      onChange={(e) =>
                        setShopSettings((s) => ({ ...s, shopAddress: e.target.value }))
                      }
                      placeholder="Av Manono Coin Munama N°39, C. Kenya, Lubumbashi"
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    />
                  </div>

                  <div>
                    <label htmlFor="adminpanel-field-53832" className="block text-sm font-medium text-gray-700 mb-1.5">
                      {t("admin.receipt.phones")}
                    </label>
                    <input id="adminpanel-field-53832"
                      type="text"
                      value={shopSettings.shopNumber}
                      onChange={(e) =>
                        setShopSettings((s) => ({ ...s, shopNumber: e.target.value }))
                      }
                      placeholder="+243 977 771 421 / +243 853 549 102"
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    />
                  </div>

                  <div>
                    <label htmlFor="adminpanel-field-54577" className="block text-sm font-medium text-gray-700 mb-1.5">
                      {t("admin.receipt.registration")}
                    </label>
                    <input id="adminpanel-field-54577"
                      type="text"
                      value={shopSettings.shopRegistration}
                      onChange={(e) =>
                        setShopSettings((s) => ({ ...s, shopRegistration: e.target.value }))
                      }
                      placeholder="RCCM: 14-A-017885"
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    />
                  </div>

                  <div>
                    <label htmlFor="adminpanel-field-55306" className="block text-sm font-medium text-gray-700 mb-1.5">
                      {t("admin.receipt.footer")}
                    </label>
                    <textarea id="adminpanel-field-55306"
                      value={shopSettings.receiptFooter}
                      onChange={(e) =>
                        setShopSettings((s) => ({ ...s, receiptFooter: e.target.value }))
                      }
                      placeholder={t("receipt.defaultFooter")}
                      rows={3}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm resize-none"
                    />
                    <p className="text-xs text-gray-400 mt-1">
                      {t("admin.receipt.footerHint")}
                    </p>
                  </div>

                  {/* Live preview */}
                  <div className="bg-gray-50 border border-dashed border-gray-300 rounded-xl p-4">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                      {t("admin.receipt.preview")}
                    </p>
                    <div className="bg-white border border-gray-200 rounded-lg p-4 text-center font-mono text-xs leading-relaxed">
                      <p className="font-bold text-base">{shopSettings.shopName || "ETS. DIEU MERCI"}</p>
                      {shopSettings.shopAddress && (
                        <p className="text-gray-600">{shopSettings.shopAddress}</p>
                      )}
                      {shopSettings.shopNumber && (
                        <p className="text-gray-600">{t("receipt.tel")}: {shopSettings.shopNumber}</p>
                      )}
                      {shopSettings.shopRegistration && (
                        <p className="text-gray-500 text-[10px]">{shopSettings.shopRegistration}</p>
                      )}
                      <div className="border-t border-dashed border-gray-300 my-2" />
                      <p className="text-gray-400 italic text-[10px]">
                        {shopSettings.receiptFooter || t("admin.receipt.footer")}
                      </p>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={savingSettings}
                    className="w-full bg-orange-600 hover:bg-orange-700 text-white py-3 rounded-xl font-semibold text-sm transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {savingSettings ? (
                      <><RefreshCw className="w-4 h-4 animate-spin" aria-hidden="true" />{t("common.saving")}</>
                    ) : (
                      <><Save className="w-4 h-4" aria-hidden="true" />{t("admin.receipt.save")}</>
                    )}
                  </button>
                </form>
              )}
            </div>
          </div>
        )}

        {/* ══════════════ ROLES & RIGHTS TAB ══════════════ */}
        {tab === "roles" && (
          <div className="space-y-4">
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 mb-2">
              <div className="flex items-center gap-3 mb-1">
                <div className="w-9 h-9 bg-indigo-100 rounded-xl flex items-center justify-center">
                  <BookOpen className="w-5 h-5 text-indigo-600" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">{t("admin.roles.title")}</h2>
                  <p className="text-sm text-gray-500">{t("admin.roles.subtitle")}</p>
                </div>
              </div>
            </div>

            {(Object.keys(ROLE_LABELS) as AppRole[]).map((role) => {
              const cap = ROLE_CAPABILITIES[role];
              return (
                <div key={role} className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                  <div className={`px-5 py-3 border-b border-gray-100 flex items-center gap-3`}>
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold border ${ROLE_COLORS[role]}`}>
                      {ROLE_NAME(role)}
                    </span>
                    <span className="text-xs text-gray-400">
                      {t("admin.pageCount", { count: cap.pages.length })} • {t("admin.actionCount", { count: cap.actions.length })}
                    </span>
                  </div>
                  <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                        {t("admin.roles.pages")}
                      </p>
                      <ul className="space-y-1.5">
                        {cap.pages.map((p, i) => (
                          <li key={i} className="flex items-center gap-2 text-sm text-gray-700">
                            <span className="w-4 h-4 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center flex-shrink-0">
                              <Check className="w-2.5 h-2.5" aria-hidden="true" />
                            </span>
                            {t(`admin.cap.${p}`)}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                        {t("admin.roles.actions")}
                      </p>
                      <ul className="space-y-1.5">
                        {cap.actions.map((a, i) => (
                          <li key={i} className="flex items-center gap-2 text-sm text-gray-700">
                            <span className="w-4 h-4 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center flex-shrink-0">
                              <Check className="w-2.5 h-2.5" aria-hidden="true" />
                            </span>
                            {t(`admin.cap.${a}`)}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                  {/* Pages grid preview */}
                  <div className="px-5 pb-4">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">{t("admin.roles.routes")}</p>
                    <div className="flex flex-wrap gap-1.5">
                      {ROLE_DEFAULT_PAGES[role].map((path) => {
                        const page = ALL_PAGES.find((p) => p.path === path);
                        return page ? (
                          <span key={path} className="px-2.5 py-0.5 bg-gray-100 text-gray-600 rounded-full text-xs border border-gray-200">
                            {pageLabel(page)}
                          </span>
                        ) : null;
                      })}
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Security note */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-5">
              <p className="text-sm font-semibold text-yellow-800 mb-1">{t("admin.security.title")}</p>
              <ul className="text-sm text-yellow-700 space-y-1 list-disc list-inside">
                <li>{t("admin.security.s1")}</li>
                <li>{t("admin.security.s2")}</li>
                <li>{t("admin.security.s3")}</li>
                <li>{t("admin.security.s4")}</li>
                <li>{t("admin.security.s5")}</li>
                <li>{t("admin.security.s6")}</li>
              </ul>
            </div>

            {/* Action permissions reference */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
              <p className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                <Shield className="w-4 h-4 text-purple-500" aria-hidden="true" />
                {t("admin.perm.available")}
              </p>
              <div className="space-y-3">
                {ALL_ACTIONS.map((action) => (
                  <div key={action.key} className="flex items-start gap-3 p-3 bg-purple-50 border border-purple-100 rounded-lg">
                    <span className="text-xs font-mono bg-purple-100 text-purple-700 px-2 py-0.5 rounded flex-shrink-0 mt-0.5">
                      {action.key}
                    </span>
                    <div>
                      <p className="text-sm font-medium text-gray-800">{t(`admin.actions.${action.key}.label`, { defaultValue: action.label })}</p>
                      <p className="text-xs text-gray-500">{t(`admin.actions.${action.key}.description`, { defaultValue: action.description })}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Current user info footer */}
        {currentUser && (
          <div className="mt-6 flex items-center gap-2 text-xs text-gray-400">
            <Shield className="w-3 h-3" aria-hidden="true" />
            {t("admin.signedInAs")}{" "}
            <span className="font-semibold text-gray-600">{currentUser.username}</span>
            <span className={`px-2 py-0.5 rounded-full border text-xs font-medium ${ROLE_COLORS[currentUser.role as AppRole]}`}>
              {ROLE_NAME(currentUser.role as AppRole)}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
