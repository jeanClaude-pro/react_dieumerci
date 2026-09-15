import type { ComponentType } from "react";
import { BadgeCheck, BarChart3, Landmark, LayoutDashboard, Package, ScanLine, Shield, ShoppingCart, TrendingUp, Users, Wallet } from "lucide-react";
import type { User } from "../types/auth";

export interface NavigationItem {
  id: string;
  label: string;
  shortLabel?: string;
  icon: ComponentType<{ className?: string; "aria-hidden"?: boolean | "true" | "false" }>;
  path: string;
  badge?: number;
  roles?: string[];
  mobilePrimary?: boolean;
}

export interface NavigationSection {
  title: string;
  items: NavigationItem[];
}

export const navigationSections: NavigationSection[] = [
  { title: "Menu principal", items: [
    { id: "taux", label: "Taux d'échange", shortLabel: "Taux", icon: LayoutDashboard, path: "/rate", roles: ["admin"] },
    { id: "pos", label: "Point de Vente", shortLabel: "Vente", icon: ShoppingCart, path: "/", roles: ["admin", "manager", "cashier_supervisor", "inventory_manager"], mobilePrimary: true },
    { id: "entry", label: "Entrée de caisse", shortLabel: "Entrée", icon: Wallet, path: "/entry", roles: ["admin", "cashier_supervisor", "inventory_manager", "manager"], mobilePrimary: true },
    { id: "sortie", label: "Sortie", icon: Wallet, path: "/sortie", roles: ["admin", "cashier_supervisor", "inventory_manager", "manager"] },
  ] },
  { title: "Stock", items: [
    { id: "products", label: "Articles", icon: Package, path: "/products", roles: ["admin", "manager", "inventory_manager"], mobilePrimary: true },
  ] },
  { title: "Ventes & Rapports", items: [
    { id: "sales", label: "Historique de Vente", shortLabel: "Ventes", icon: TrendingUp, path: "/sales", roles: ["admin", "manager", "cashier_supervisor", "inventory_manager"], mobilePrimary: true },
    { id: "entryhistory", label: "Historique d'Entrée", icon: Wallet, path: "/entryhistory", roles: ["admin", "cashier_supervisor", "inventory_manager", "manager"] },
    { id: "historicsortie", label: "Historique de Sortie", icon: Wallet, path: "/sortiehistory", roles: ["admin", "cashier_supervisor", "inventory_manager", "manager"] },
    { id: "reports", label: "Rapports", icon: BarChart3, path: "/reports", roles: ["admin"] },
  ] },
  { title: "Contrôle paiement", items: [
    { id: "payment-approval", label: "Validation paiement", shortLabel: "Valider", icon: ScanLine, path: "/payment-approval", roles: ["admin", "cashier_supervisor"] },
    { id: "payment-verification", label: "Contrôle paiement", shortLabel: "Contrôle", icon: BadgeCheck, path: "/payment-verification", roles: ["admin", "inventory_manager"] },
  ] },
  { title: "Gestion", items: [
    { id: "customers", label: "Clients", icon: Users, path: "/customers", roles: ["admin", "manager", "cashier_supervisor"] },
    { id: "remboursements", label: "Remboursements", shortLabel: "Dettes", icon: Landmark, path: "/remboursements", roles: ["admin"] },
    { id: "admin", label: "Administration", shortLabel: "Admin", icon: Shield, path: "/admin", roles: ["admin"] },
  ] },
];

const fixedRolePaths = new Set(["/admin", "/payment-approval", "/payment-verification"]);

export function canAccessNavigationItem(item: NavigationItem, user: User | null): boolean {
  if (!item.roles) return true;
  if (!user?.role) return false;
  if (fixedRolePaths.has(item.path)) return item.roles.includes(user.role);
  if (user.permissions && user.permissions.length > 0) return user.permissions.includes(item.path);
  return item.roles.includes(user.role);
}

export function isNavigationItemActive(pathname: string, item: NavigationItem): boolean {
  if (item.id === "pos") return pathname === "/" || pathname === "/new-sale";
  return pathname === item.path;
}
