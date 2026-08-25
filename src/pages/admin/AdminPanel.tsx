/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import { useAuth } from "../../hooks/useAuth";
import { serverUrl } from "../../utils/constants";
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
  { path: "/dashboard", label: "Tableau de bord" },
  { path: "/rate", label: "Taux d'échange" },
  { path: "/", label: "Point de Vente (POS)" },
  { path: "/reservation", label: "Réservation" },
  { path: "/entry", label: "Entrée de caisse" },
  { path: "/sortie", label: "Sortie de caisse" },
  { path: "/products", label: "Articles / Stock" },
  { path: "/sales", label: "Historique de Vente" },
  { path: "/reservationhistory", label: "Historique de Réservation" },
  { path: "/entryhistory", label: "Historique d'Entrée" },
  { path: "/sortiehistory", label: "Historique de Sortie" },
  { path: "/reports", label: "Rapports & Analytiques" },
  { path: "/customers", label: "Clients" },
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
    "/reservation",
    "/entry",
    "/sortie",
    "/products",
    "/sales",
    "/reservationhistory",
    "/entryhistory",
    "/sortiehistory",
    "/customers",
  ],
  inventory_manager: [
    "/",
    "/reservation",
    "/entry",
    "/sortie",
    "/products",
    "/sales",
    "/reservationhistory",
    "/entryhistory",
    "/sortiehistory",
  ],
  cashier_supervisor: [
    "/",
    "/reservation",
    "/entry",
    "/sortie",
    "/sales",
    "/reservationhistory",
    "/entryhistory",
    "/sortiehistory",
    "/customers",
  ],
  staff: ["/"],
};

// Canonical description of what each role can do in the app
const ROLE_CAPABILITIES: Record<AppRole, { pages: string[]; actions: string[] }> = {
  admin: {
    pages: [
      "Toutes les pages de l'application",
      "Panneau d'administration",
    ],
    actions: [
      "Créer, modifier, supprimer des utilisateurs",
      "Définir les rôles et permissions",
      "Configurer les informations du reçu",
      "Modifier les reçus (prix, quantités)",
      "Réimprimer les reçus",
      "Toutes les actions ci-dessous",
    ],
  },
  manager: {
    pages: [
      "Point de Vente (POS)",
      "Réservation & historique",
      "Entrée / Sortie de caisse & historique",
      "Articles / Stock",
      "Historique de Vente",
      "Clients",
    ],
    actions: [
      "Créer des ventes",
      "Gérer les réservations",
      "Enregistrer entrées / sorties de caisse",
      "Gérer le stock (articles)",
      "Consulter l'historique des ventes",
      "Modifier les reçus (si permission accordée)",
    ],
  },
  inventory_manager: {
    pages: [
      "Point de Vente (POS)",
      "Réservation & historique",
      "Entrée / Sortie de caisse & historique",
      "Articles / Stock",
      "Historique de Vente",
    ],
    actions: [
      "Créer des ventes",
      "Gérer les réservations",
      "Enregistrer entrées / sorties de caisse",
      "Gérer le stock (articles)",
      "Consulter l'historique des ventes",
    ],
  },
  cashier_supervisor: {
    pages: [
      "Point de Vente (POS)",
      "Réservation & historique",
      "Entrée / Sortie de caisse & historique",
      "Historique de Vente",
      "Clients",
    ],
    actions: [
      "Créer des ventes",
      "Gérer les réservations",
      "Enregistrer entrées / sorties de caisse",
      "Consulter l'historique des ventes",
      "Gérer les clients",
      "Modifier les reçus (si permission accordée)",
    ],
  },
  staff: {
    pages: ["Point de Vente (POS)"],
    actions: [
      "Créer des ventes uniquement",
      "Impression du reçu après vente",
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
      if (!res.ok) throw new Error("Impossible de charger les utilisateurs");
      const data = await res.json();
      setUsers(data);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchShopSettings = async () => {
    setLoadingSettings(true);
    try {
      const res = await fetch(`${API_BASE}/settings/receipt`, {
        headers: authHeaders(),
      });
      if (!res.ok) throw new Error("Impossible de charger les réglages");
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

  useEffect(() => {
    fetchUsers();
    fetchShopSettings();
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
      toast.error("Le nom d'utilisateur ne peut pas être vide");
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
        throw new Error(d.message || "Échec de la mise à jour");
      }
      const updated = await res.json();
      setUsers((prev) =>
        prev.map((u) =>
          u._id === userId ? { ...u, username: updated.username } : u
        )
      );
      cancelEditUsername();
      toast.success("Nom d'utilisateur mis à jour");
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
        throw new Error(d.message || "Échec du changement de statut");
      }
      const data = await res.json();
      setUsers((prev) =>
        prev.map((u) =>
          u._id === user._id ? { ...u, isActive: data.user.isActive } : u
        )
      );
      toast.success(data.message);
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
        throw new Error(d.message || "Échec de la mise à jour du rôle");
      }
      const updated = await res.json();
      setUsers((prev) =>
        prev.map((u) => (u._id === userId ? { ...u, role: updated.role } : u))
      );
      setEditingRoleId(null);
      toast.success("Rôle mis à jour");
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleDeleteUser = async (user: AppUser) => {
    if (
      !window.confirm(
        `Supprimer l'utilisateur "${user.username}" ? Cette action est irréversible.`
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
        throw new Error(d.message || "Échec de la suppression");
      }
      setUsers((prev) => prev.filter((u) => u._id !== user._id));
      toast.success("Utilisateur supprimé");
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  // ─── Create user ─────────────────────────────────────────────────────────────

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (createForm.password !== createForm.confirmPassword) {
      toast.error("Les mots de passe ne correspondent pas");
      return;
    }
    if (createForm.password.length < 6) {
      toast.error("Le mot de passe doit comporter au moins 6 caractères");
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
        throw new Error(d.message || "Échec de la création");
      }
      toast.success(`Utilisateur "${createForm.username}" créé avec succès`);
      setCreateForm({ username: "", email: "", password: "", confirmPassword: "", role: "staff" });
      fetchUsers();
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
        throw new Error("Échec de la sauvegarde des permissions");
      }
      setUsers((prev) =>
        prev.map((u) =>
          u._id === selectedUserId
            ? { ...u, permissions: permsToSave, actionPermissions: selectedUserActions }
            : u
        )
      );
      toast.success("Permissions mises à jour avec succès");
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
      toast.success("Permissions réinitialisées au rôle par défaut");
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
        throw new Error(d.message || "Échec de la sauvegarde");
      }
      toast.success("Réglages du reçu mis à jour avec succès");
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
    { key: "users" as Tab, label: "Utilisateurs", icon: Users },
    { key: "create" as Tab, label: "Créer un compte", icon: UserPlus },
    { key: "permissions" as Tab, label: "Permissions", icon: Lock },
    { key: "receipt" as Tab, label: "Réglages Reçu", icon: Store },
    { key: "roles" as Tab, label: "Rôles & Droits", icon: BookOpen },
  ] as const;

  return (
    <div className="flex-1 p-6 overflow-auto bg-gray-50 min-h-screen">
      <div className="max-w-6xl mx-auto">

        {/* ─── Header ─── */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-red-700 rounded-xl flex items-center justify-center shadow">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Administration</h1>
              <p className="text-sm text-gray-500">
                Gérez les comptes, rôles, permissions et réglages du système
              </p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4 mt-6">
            <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
              <p className="text-2xl font-bold text-gray-900">{users.length}</p>
              <p className="text-sm text-gray-500 mt-0.5">Comptes totaux</p>
            </div>
            <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
              <p className="text-2xl font-bold text-emerald-600">{activeCount}</p>
              <p className="text-sm text-gray-500 mt-0.5">Actifs</p>
            </div>
            <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
              <p className="text-2xl font-bold text-red-500">
                {users.length - activeCount}
              </p>
              <p className="text-sm text-gray-500 mt-0.5">Désactivés</p>
            </div>
          </div>
        </div>

        {/* ─── Tabs ─── */}
        <div className="flex gap-1 mb-6 bg-white rounded-xl p-1 border border-gray-200 shadow-sm flex-wrap">
          {TABS.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                tab === key
                  ? "bg-blue-600 text-white shadow-sm"
                  : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              <Icon className="w-4 h-4" />
              {label}
            </button>
          ))}
        </div>

        {/* ══════════════ USERS TAB ══════════════ */}
        {tab === "users" && (
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-3 flex-wrap">
              <div className="relative flex-1 min-w-[220px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Rechercher par nom ou email…"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <button
                onClick={fetchUsers}
                disabled={loading}
                className="flex items-center gap-2 px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
                Actualiser
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Utilisateur</th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Rôle</th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Statut</th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Permissions</th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Créé le</th>
                    <th className="text-center px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {loading ? (
                    <tr>
                      <td colSpan={6} className="text-center py-16 text-gray-400">
                        <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 opacity-40" />
                        Chargement…
                      </td>
                    </tr>
                  ) : filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center py-16 text-gray-400">
                        <Users className="w-8 h-8 mx-auto mb-2 opacity-30" />
                        Aucun utilisateur trouvé
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
                                    className="text-sm border border-blue-300 rounded-lg px-2 py-1 focus:ring-1 focus:ring-blue-500 w-36"
                                  />
                                  <button
                                    onClick={() => saveUsername(user._id)}
                                    className="text-emerald-600 hover:text-emerald-800"
                                  >
                                    <Check className="w-3.5 h-3.5" />
                                  </button>
                                  <button
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
                                  <button
                                    onClick={() => startEditUsername(user)}
                                    className="text-gray-300 hover:text-blue-500 transition-colors flex-shrink-0"
                                    title="Modifier le nom d'utilisateur"
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
                              >
                                {(Object.keys(ROLE_LABELS) as AppRole[]).map((r) => (
                                  <option key={r} value={r}>
                                    {ROLE_LABELS[r]}
                                  </option>
                                ))}
                              </select>
                              <button
                                onClick={() => setEditingRoleId(null)}
                                className="text-gray-400 hover:text-gray-600"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => setEditingRoleId(user._id)}
                              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border ${ROLE_COLORS[user.role]} hover:opacity-80 transition-opacity`}
                            >
                              {ROLE_LABELS[user.role]}
                              <Edit3 className="w-3 h-3 opacity-60" />
                            </button>
                          )}
                        </td>

                        {/* Status */}
                        <td className="px-5 py-3.5">
                          <button
                            onClick={() => handleToggleStatus(user)}
                            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                              user.isActive
                                ? "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100"
                                : "bg-red-50 text-red-700 border-red-200 hover:bg-red-100"
                            }`}
                          >
                            {user.isActive ? (
                              <><ToggleRight className="w-3.5 h-3.5" />Actif</>
                            ) : (
                              <><ToggleLeft className="w-3.5 h-3.5" />Désactivé</>
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
                                ? `${user.permissions.length} pages`
                                : "Par rôle"}
                            </span>
                            {user.actionPermissions && user.actionPermissions.length > 0 && (
                              <span className="text-xs px-2.5 py-1 rounded-full border bg-amber-50 text-amber-700 border-amber-200 w-fit">
                                {user.actionPermissions.length} action{user.actionPermissions.length > 1 ? "s" : ""}
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Created at */}
                        <td className="px-5 py-3.5 text-xs text-gray-500">
                          {new Date(user.createdAt).toLocaleDateString("fr-FR")}
                        </td>

                        {/* Actions */}
                        <td className="px-5 py-3.5">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              onClick={() => {
                                handleSelectUserForPerms(user._id);
                                setTab("permissions");
                              }}
                              className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              title="Gérer les permissions"
                            >
                              <Shield className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteUser(user)}
                              className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                              title="Supprimer l'utilisateur"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
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
                    <h2 className="text-lg font-semibold text-gray-900">Créer un utilisateur</h2>
                    <p className="text-sm text-gray-500">Définissez le compte et attribuez un rôle</p>
                  </div>
                </div>
              </div>

              <form onSubmit={handleCreateUser} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Nom d'utilisateur <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={createForm.username}
                    onChange={(e) => setCreateForm((f) => ({ ...f, username: e.target.value }))}
                    placeholder="ex: jean_dupont"
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Adresse email <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    value={createForm.email}
                    onChange={(e) => setCreateForm((f) => ({ ...f, email: e.target.value }))}
                    placeholder="ex: jean@example.com"
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Rôle <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <select
                      value={createForm.role}
                      onChange={(e) => setCreateForm((f) => ({ ...f, role: e.target.value as AppRole }))}
                      className="w-full px-4 py-3 pr-10 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm bg-white appearance-none"
                      required
                    >
                      {(Object.entries(ROLE_LABELS) as [AppRole, string][]).map(([r, label]) => (
                        <option key={r} value={r}>{label}</option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Mot de passe <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={createForm.password}
                      onChange={(e) => setCreateForm((f) => ({ ...f, password: e.target.value }))}
                      placeholder="Minimum 6 caractères"
                      className="w-full px-4 py-3 pr-11 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                      required
                      minLength={6}
                    />
                    <button type="button" onClick={() => setShowPassword((s) => !s)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Confirmer le mot de passe <span className="text-red-500">*</span>
                  </label>
                  <input
                    type={showPassword ? "text" : "password"}
                    value={createForm.confirmPassword}
                    onChange={(e) => setCreateForm((f) => ({ ...f, confirmPassword: e.target.value }))}
                    placeholder="Répétez le mot de passe"
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    required
                  />
                </div>

                {/* Role preview */}
                <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
                  <p className="text-sm font-medium text-blue-800 mb-2">
                    Pages accessibles avec le rôle « {ROLE_LABELS[createForm.role]} » :
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {ROLE_DEFAULT_PAGES[createForm.role].map((path) => {
                      const page = ALL_PAGES.find((p) => p.path === path);
                      return page ? (
                        <span key={path} className="px-2.5 py-0.5 bg-blue-100 text-blue-700 rounded-full text-xs font-medium border border-blue-200">
                          {page.label}
                        </span>
                      ) : null;
                    })}
                  </div>
                </div>

                <button type="submit" disabled={creating}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-semibold text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-2">
                  {creating ? (
                    <><RefreshCw className="w-4 h-4 animate-spin" />Création en cours…</>
                  ) : (
                    <><UserPlus className="w-4 h-4" />Créer l'utilisateur</>
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
                  <h2 className="text-lg font-semibold text-gray-900">Gestion des permissions</h2>
                  <p className="text-sm text-gray-500">Pages accessibles et actions autorisées par utilisateur</p>
                </div>
              </div>
            </div>

            <div className="p-6">
              {/* User selector */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Sélectionner un utilisateur
                </label>
                <div className="relative max-w-sm">
                  <select
                    value={selectedUserId}
                    onChange={(e) => handleSelectUserForPerms(e.target.value)}
                    className="w-full px-4 py-3 pr-10 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm bg-white appearance-none"
                  >
                    <option value="">— Choisir un utilisateur —</option>
                    {users.map((u) => (
                      <option key={u._id} value={u._id}>
                        {u.username} ({ROLE_LABELS[u.role]})
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                </div>
              </div>

              {!selectedUserId && (
                <div className="text-center py-16 text-gray-400">
                  <Shield className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p className="text-sm">Sélectionnez un utilisateur pour gérer ses permissions</p>
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
                      {ROLE_LABELS[selectedUser.role]}
                    </span>
                  </div>

                  {/* ── Section 1: Page permissions ── */}
                  <div className="mb-6">
                    <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                      <Lock className="w-4 h-4 text-blue-500" />
                      Accès aux pages
                    </h3>

                    {/* Custom perms toggle */}
                    <div className="flex items-center justify-between mb-4 p-4 bg-amber-50 border border-amber-200 rounded-xl">
                      <div>
                        <p className="text-sm font-semibold text-amber-800">Permissions personnalisées</p>
                        <p className="text-xs text-amber-600 mt-0.5">
                          {useCustomPerms
                            ? "Les pages cochées ci-dessous remplacent les droits du rôle"
                            : "Cet utilisateur accède aux pages selon son rôle (par défaut)"}
                        </p>
                      </div>
                      <button
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
                              {page.label}
                            </span>
                            {!useCustomPerms && checkedByRole && (
                              <span className="ml-auto text-xs text-emerald-600 font-medium">Rôle</span>
                            )}
                          </label>
                        );
                      })}
                    </div>
                  </div>

                  {/* ── Section 2: Action permissions ── */}
                  <div className="mb-6">
                    <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                      <Shield className="w-4 h-4 text-purple-500" />
                      Permissions d'actions
                    </h3>
                    <p className="text-xs text-gray-500 mb-3">
                      Ces droits s'appliquent indépendamment du rôle et des pages.
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
                                {action.label}
                              </p>
                              <p className="text-xs text-gray-500 mt-0.5">{action.description}</p>
                            </div>
                          </label>
                        );
                      })}
                    </div>
                  </div>

                  {/* Action buttons */}
                  <div className="flex items-center gap-3 pt-4 border-t border-gray-100">
                    <button
                      onClick={handleSavePermissions}
                      disabled={savingPerms}
                      className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      {savingPerms ? (
                        <><RefreshCw className="w-4 h-4 animate-spin" />Sauvegarde…</>
                      ) : (
                        <><Check className="w-4 h-4" />Sauvegarder</>
                      )}
                    </button>

                    {useCustomPerms && (
                      <button
                        onClick={() => handleResetPermissions(selectedUser)}
                        disabled={savingPerms}
                        className="flex items-center gap-2 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-sm font-medium transition-colors disabled:opacity-40"
                      >
                        <X className="w-4 h-4" />
                        Réinitialiser au rôle
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
                    <h2 className="text-lg font-semibold text-gray-900">Réglages du reçu</h2>
                    <p className="text-sm text-gray-500">
                      Ces informations apparaissent sur tous les reçus imprimés
                    </p>
                  </div>
                </div>
              </div>

              {loadingSettings ? (
                <div className="flex items-center justify-center py-16 text-gray-400">
                  <RefreshCw className="w-6 h-6 animate-spin mr-2 opacity-40" />
                  Chargement…
                </div>
              ) : (
                <form onSubmit={handleSaveSettings} className="p-6 space-y-5">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Nom de l'établissement
                    </label>
                    <input
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
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Adresse
                    </label>
                    <input
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
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Numéro(s) de téléphone
                    </label>
                    <input
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
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Numéro d'enregistrement (RCCM)
                    </label>
                    <input
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
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Pied de page du reçu
                    </label>
                    <textarea
                      value={shopSettings.receiptFooter}
                      onChange={(e) =>
                        setShopSettings((s) => ({ ...s, receiptFooter: e.target.value }))
                      }
                      placeholder="Merci pour votre confiance ! À bientôt."
                      rows={3}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm resize-none"
                    />
                    <p className="text-xs text-gray-400 mt-1">
                      Apparaît en bas de chaque reçu imprimé.
                    </p>
                  </div>

                  {/* Live preview */}
                  <div className="bg-gray-50 border border-dashed border-gray-300 rounded-xl p-4">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                      Aperçu de l'en-tête du reçu
                    </p>
                    <div className="bg-white border border-gray-200 rounded-lg p-4 text-center font-mono text-xs leading-relaxed">
                      <p className="font-bold text-base">{shopSettings.shopName || "ETS. DIEU MERCI"}</p>
                      {shopSettings.shopAddress && (
                        <p className="text-gray-600">{shopSettings.shopAddress}</p>
                      )}
                      {shopSettings.shopNumber && (
                        <p className="text-gray-600">TEL: {shopSettings.shopNumber}</p>
                      )}
                      {shopSettings.shopRegistration && (
                        <p className="text-gray-500 text-[10px]">{shopSettings.shopRegistration}</p>
                      )}
                      <div className="border-t border-dashed border-gray-300 my-2" />
                      <p className="text-gray-400 italic text-[10px]">
                        {shopSettings.receiptFooter || "Pied de page du reçu"}
                      </p>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={savingSettings}
                    className="w-full bg-orange-600 hover:bg-orange-700 text-white py-3 rounded-xl font-semibold text-sm transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {savingSettings ? (
                      <><RefreshCw className="w-4 h-4 animate-spin" />Sauvegarde…</>
                    ) : (
                      <><Save className="w-4 h-4" />Enregistrer les réglages</>
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
                  <h2 className="text-lg font-semibold text-gray-900">Rôles & Droits par défaut</h2>
                  <p className="text-sm text-gray-500">
                    Ce tableau décrit ce que chaque rôle peut faire dans l'application par défaut.
                    Les permissions individuelles peuvent outrepasser ces valeurs.
                  </p>
                </div>
              </div>
            </div>

            {(Object.keys(ROLE_LABELS) as AppRole[]).map((role) => {
              const cap = ROLE_CAPABILITIES[role];
              return (
                <div key={role} className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                  <div className={`px-5 py-3 border-b border-gray-100 flex items-center gap-3`}>
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold border ${ROLE_COLORS[role]}`}>
                      {ROLE_LABELS[role]}
                    </span>
                    <span className="text-xs text-gray-400">
                      {cap.pages.length} page{cap.pages.length > 1 ? "s" : ""} • {cap.actions.length} action{cap.actions.length > 1 ? "s" : ""}
                    </span>
                  </div>
                  <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                        Pages accessibles
                      </p>
                      <ul className="space-y-1.5">
                        {cap.pages.map((p, i) => (
                          <li key={i} className="flex items-center gap-2 text-sm text-gray-700">
                            <span className="w-4 h-4 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center flex-shrink-0">
                              <Check className="w-2.5 h-2.5" />
                            </span>
                            {p}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                        Actions autorisées
                      </p>
                      <ul className="space-y-1.5">
                        {cap.actions.map((a, i) => (
                          <li key={i} className="flex items-center gap-2 text-sm text-gray-700">
                            <span className="w-4 h-4 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center flex-shrink-0">
                              <Check className="w-2.5 h-2.5" />
                            </span>
                            {a}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                  {/* Pages grid preview */}
                  <div className="px-5 pb-4">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Routes</p>
                    <div className="flex flex-wrap gap-1.5">
                      {ROLE_DEFAULT_PAGES[role].map((path) => {
                        const page = ALL_PAGES.find((p) => p.path === path);
                        return page ? (
                          <span key={path} className="px-2.5 py-0.5 bg-gray-100 text-gray-600 rounded-full text-xs border border-gray-200">
                            {page.label}
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
              <p className="text-sm font-semibold text-yellow-800 mb-1">Note de sécurité</p>
              <ul className="text-sm text-yellow-700 space-y-1 list-disc list-inside">
                <li>Les mots de passe sont hachés (bcrypt) — jamais stockés en clair.</li>
                <li>Les tokens JWT expirent et sont validés à chaque requête.</li>
                <li>Les comptes désactivés ne peuvent pas se connecter ni accéder aux endpoints.</li>
                <li>Un compte administrateur protégé est masqué et non modifiable par les autres admins.</li>
                <li>L'inscription publique est désactivée — seuls les administrateurs créent des comptes.</li>
              </ul>
            </div>

            {/* Action permissions reference */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
              <p className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                <Shield className="w-4 h-4 text-purple-500" />
                Permissions d'actions disponibles
              </p>
              <div className="space-y-3">
                {ALL_ACTIONS.map((action) => (
                  <div key={action.key} className="flex items-start gap-3 p-3 bg-purple-50 border border-purple-100 rounded-lg">
                    <span className="text-xs font-mono bg-purple-100 text-purple-700 px-2 py-0.5 rounded flex-shrink-0 mt-0.5">
                      {action.key}
                    </span>
                    <div>
                      <p className="text-sm font-medium text-gray-800">{action.label}</p>
                      <p className="text-xs text-gray-500">{action.description}</p>
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
            <Shield className="w-3 h-3" />
            Connecté en tant que{" "}
            <span className="font-semibold text-gray-600">{currentUser.username}</span>
            <span className={`px-2 py-0.5 rounded-full border text-xs font-medium ${ROLE_COLORS[currentUser.role as AppRole]}`}>
              {ROLE_LABELS[currentUser.role as AppRole]}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
