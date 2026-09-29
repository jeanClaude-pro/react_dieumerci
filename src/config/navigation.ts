import type { ComponentType } from "react";
import {
  ArrowLeftRight, BadgeCheck, ChartColumn, CircleArrowDown, CircleArrowUp, ClipboardCheck, FolderDown, FolderUp,
  Home, Landmark, LayoutDashboard, Package, ReceiptText, ScanLine, Shield, ShoppingCart, Users,
} from "lucide-react";
import type { User } from "../types/auth";

export interface NavigationItem {
  id: string;
  label: string;
  /** Compact label for the tablet rail and the phone tab bar. */
  shortLabel?: string;
  /** One-line purpose shown on the welcome launcher. */
  description?: string;
  icon: ComponentType<{ className?: string; "aria-hidden"?: boolean | "true" | "false" }>;
  path: string;
  permissionPath?: string;
  badge?: number;
  roles?: string[];
  /** Lower numbers win a place in the phone tab bar (max 4, then "Plus"). */
  mobilePriority?: number;
}

export interface NavigationSection {
  title: string;
  /** Visually hide the heading (a section holding a single self-explanatory link). */
  hideTitle?: boolean;
  items: NavigationItem[];
}

// Single source of truth for every navigation surface (sidebar, tablet rail,
// phone tab bar, "Plus" sheet and welcome launcher). Role lists and the
// access rule below are unchanged; only grouping and presentation live here.
export const navigationSections: NavigationSection[] = [
  { title: "Accueil", hideTitle: true, items: [
    { id: "home", label: "Accueil", icon: Home, path: "/", mobilePriority: 1 },
  ] },
  { title: "Caisse", items: [
    { id: "pos", label: "Nouvelle vente", shortLabel: "Vente", description: "Panier, encaissement et reçu", icon: ShoppingCart, path: "/new-sale", permissionPath: "/", roles: ["admin", "manager", "cashier_supervisor", "inventory_manager"], mobilePriority: 2 },
    { id: "entry", label: "Entrée de caisse", shortLabel: "Entrée", description: "Enregistrer une entrée d'argent", icon: CircleArrowDown, path: "/entry", roles: ["admin", "cashier_supervisor", "inventory_manager", "manager"], mobilePriority: 6 },
    { id: "sortie", label: "Sortie de caisse", shortLabel: "Sortie", description: "Enregistrer une dépense ou un remboursement", icon: CircleArrowUp, path: "/sortie", roles: ["admin", "cashier_supervisor", "inventory_manager", "manager"], mobilePriority: 7 },
    { id: "taux", label: "Taux d'échange", shortLabel: "Taux", description: "Consulter et mettre à jour le taux USD / FC", icon: ArrowLeftRight, path: "/rate", roles: ["admin"] },
  ] },
  { title: "Historique", items: [
    { id: "sales", label: "Historique des ventes", shortLabel: "Ventes", description: "Retrouver une vente, ses reçus et son statut", icon: ReceiptText, path: "/sales", roles: ["admin", "manager", "cashier_supervisor", "inventory_manager"], mobilePriority: 3 },
    { id: "entryhistory", label: "Historique des entrées", shortLabel: "Entrées", description: "Consulter les mouvements entrants", icon: FolderDown, path: "/entryhistory", roles: ["admin", "cashier_supervisor", "inventory_manager", "manager"] },
    { id: "historicsortie", label: "Historique des sorties", shortLabel: "Sorties", description: "Suivre, valider et contrôler les dépenses", icon: FolderUp, path: "/sortiehistory", roles: ["admin", "cashier_supervisor", "inventory_manager", "manager"] },
  ] },
  { title: "Stock & clients", items: [
    { id: "products", label: "Articles", shortLabel: "Articles", description: "Catalogue, prix et disponibilité", icon: Package, path: "/products", roles: ["admin", "manager", "inventory_manager"], mobilePriority: 4 },
    { id: "customers", label: "Clients", shortLabel: "Clients", description: "Coordonnées et historique d'achat", icon: Users, path: "/customers", roles: ["admin", "manager", "cashier_supervisor"], mobilePriority: 8 },
  ] },
  { title: "Contrôle paiement", items: [
    { id: "payment-approval", label: "Validation paiement", shortLabel: "Valider", description: "Scanner un reçu pour valider le paiement", icon: ScanLine, path: "/payment-approval", roles: ["admin", "cashier_supervisor"], mobilePriority: 5 },
    { id: "payment-verification", label: "Contrôle sortie", shortLabel: "Contrôle", description: "Contrôler un reçu avant la sortie de marchandise", icon: BadgeCheck, path: "/payment-verification", roles: ["admin", "inventory_manager"], mobilePriority: 5 },
  ] },
  { title: "Pilotage", items: [
    { id: "dashboard", label: "Tableau de bord", shortLabel: "Tableau", description: "Stock début / fin, sorties, entrées et alertes", icon: LayoutDashboard, path: "/dashboard", roles: ["admin"] },
    { id: "reports", label: "Rapports & analytique", shortLabel: "Rapports", description: "Indicateurs, périodes et rapports imprimables", icon: ChartColumn, path: "/reports", roles: ["admin"] },
    { id: "remboursements", label: "Remboursements", shortLabel: "Dettes", description: "Créanciers, emprunts et remboursements", icon: Landmark, path: "/remboursements", roles: ["admin"] },
    { id: "sale-edit-approvals", label: "Approbation des modifications", shortLabel: "Approbations", description: "Examiner les modifications de vente en attente", icon: ClipboardCheck, path: "/admin/sale-edit-approvals", roles: ["admin"] },
    { id: "admin", label: "Administration", shortLabel: "Admin", description: "Comptes, permissions et paramètres des reçus", icon: Shield, path: "/admin", roles: ["admin"] },
  ] },
];

// Role-fixed modules: custom page permissions can never open them to another role.
const fixedRolePaths = new Set(["/admin", "/admin/sale-edit-approvals", "/payment-approval", "/payment-verification", "/dashboard"]);

export function canAccessNavigationItem(item: NavigationItem, user: User | null): boolean {
  if (!user) return false;
  // Mirror existing page-level admin guards without granting new access.
  if (["/customers", "/reports", "/remboursements"].includes(item.path) && user.role !== "admin") return false;
  if (!item.roles) return true;
  if (!user?.role) return false;
  if (fixedRolePaths.has(item.path)) return item.roles.includes(user.role);
  if (user.permissions && user.permissions.length > 0) return user.permissions.includes(item.permissionPath || item.path);
  return item.roles.includes(user.role);
}

/** Sections filtered to what this user may open (empty sections removed). */
export function getAccessibleSections(user: User | null): NavigationSection[] {
  return navigationSections
    .map(section => ({ ...section, items: section.items.filter(item => canAccessNavigationItem(item, user)) }))
    .filter(section => section.items.length > 0);
}

/** Up to four permitted destinations for the phone tab bar. */
export function getMobilePrimaryItems(user: User | null): NavigationItem[] {
  return getAccessibleSections(user)
    .flatMap(section => section.items)
    .filter(item => item.mobilePriority !== undefined)
    .sort((a, b) => (a.mobilePriority ?? 99) - (b.mobilePriority ?? 99))
    .slice(0, 4);
}

export function isNavigationItemActive(pathname: string, item: NavigationItem): boolean {
  return pathname === item.path;
}

export const roleLabels: Record<User["role"], string> = {
  admin: "Administrateur", manager: "Gestionnaire", inventory_manager: "Responsable stock",
  cashier_supervisor: "Superviseur caisse", staff: "Personnel",
};
