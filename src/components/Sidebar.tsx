"use client";

import type React from "react";

import { useState, useEffect, useRef } from "react";
import { formatTimeGMT2, formatDayGMT2 } from "../utils/dateUtils";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  BarChart3,
  Users,
  Settings,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  Bell,
  LogOut,
  LogIn,
  User,
  Clock,
  Wallet,
  Shield,
  ScanLine,
  BadgeCheck,
  Landmark,
} from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { canAccessNavigationItem } from "../config/navigation";

const clsx = (...classes: (string | undefined | null | false)[]): string => {
  return classes.filter(Boolean).join(" ");
};

interface SidebarItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  path: string;
  badge?: number;
  roles?: string[];
}

interface SidebarSection {
  title: string;
  items: SidebarItem[];
}

const sidebarSections: SidebarSection[] = [
  {
    title: "Menu principal",
    items: [
      {
        id: "taux",
        label: "Taux d'echange",
        icon: LayoutDashboard,
        path: "/rate",
        roles: ["admin"]
      },
      {
        id: "pos",
        label: "Point de Vente",
        icon: ShoppingCart,
        path: "/",
        roles: ["admin", "manager", "cashier_supervisor", "inventory_manager"]
      },
      {
        id: "entry",
        label: "Entrée de caisse",
        icon: Wallet,
        path: "/entry",
        roles: ["admin", "cashier_supervisor", "inventory_manager", "manager"]
      },
      {
        id: "sortie",
        label: "Sortie",
        icon: Wallet,
        path: "/sortie",
        roles: ["admin", "cashier_supervisor", "inventory_manager", "manager"]
      },
    ],
  },
  {
    title: "Stock",
    items: [
      {
        id: "products",
        label: "Articles",
        icon: Package,
        path: "/products",
        roles: ["admin", "manager", "inventory_manager"]
      },
    ],
  },
  {
    title: "Ventes & Rapports",
    items: [
      {
        id: "sales",
        label: "Historique de Vente",
        icon: TrendingUp,
        path: "/sales",
        roles: ["admin", "manager", "cashier_supervisor", "inventory_manager"]
      },
      {
        id: "entryhistory",
        label: "Historique d'Entrée",
        icon: Wallet,
        path: "/entryhistory",
        roles: ["admin", "cashier_supervisor", "inventory_manager", "manager"]
      },
      {
        id: "historicsortie",
        label: "Historique de Sortie",
        icon: Wallet,
        path: "/sortiehistory",
        roles: ["admin","cashier_supervisor", "inventory_manager", "manager"]
      },
      {
        id: "reports",
        label: "Rapports",
        icon: BarChart3,
        path: "/reports",
        roles: ["admin"]
      },
    ],
  },
  {
    title: "Contrôle paiement",
    items: [
      {
        id: "payment-approval",
        label: "Validation paiement",
        icon: ScanLine,
        path: "/payment-approval",
        roles: ["admin", "cashier_supervisor"]
      },
      {
        id: "payment-verification",
        label: "Contrôle paiement",
        icon: BadgeCheck,
        path: "/payment-verification",
        roles: ["admin", "inventory_manager"]
      },
    ],
  },
  {
    title: "Gestion",
    items: [
      {
        id: "customers",
        label: "Clients",
        icon: Users,
        path: "/customers",
        roles: ["admin", "manager", "cashier_supervisor"]
      },
      {
        id: "remboursements",
        label: "Remboursements",
        icon: Landmark,
        path: "/remboursements",
        roles: ["admin"]
      },
      {
        id: "admin",
        label: "Administration",
        icon: Shield,
        path: "/admin",
        roles: ["admin"]
      },
    ],
  },
];

export default function Sidebar() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isMobile, setIsMobile] = useState(false);
  const location = useLocation();
  const { token, user, clearAuth } = useAuth();

  const sidebarRef = useRef<HTMLElement>(null);
  const touchStartX = useRef(0);
  const touchStartY = useRef(0);
  const touchEndX = useRef(0);

  const isAuthed = Boolean(token && user);

  // Check if mobile device and set appropriate initial state
  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);

      if (mobile) {
        setIsCollapsed(true);
        setIsMobileOpen(false);
      } else {
        setIsMobileOpen(false);
      }
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);

    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Update current time every minute
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);

    return () => clearInterval(timer);
  }, []);

  // Close mobile sidebar when route changes
  useEffect(() => {
    if (isMobile) {
      setIsMobileOpen(false);
    }
  }, [location.pathname, isMobile]);

  // Touch event handlers for swipe gestures
  useEffect(() => {
    const sidebarElement = sidebarRef.current;
    if (!sidebarElement || !isMobile) return;

    const handleTouchStart = (e: TouchEvent) => {
      touchStartX.current = e.touches[0].clientX;
      touchStartY.current = e.touches[0].clientY;
    };

    const handleTouchMove = (e: TouchEvent) => {
      touchEndX.current = e.touches[0].clientX;
    };

    const handleTouchEnd = () => {
      const touchDiffX = touchEndX.current - touchStartX.current;
      const touchDiffY = Math.abs(touchEndX.current - touchStartX.current);

      if (Math.abs(touchDiffX) > 50 && touchDiffY < 100) {
        if (touchDiffX > 0) {
          setIsMobileOpen(true);
        } else {
          setIsMobileOpen(false);
        }
      }
    };

    sidebarElement.addEventListener('touchstart', handleTouchStart);
    sidebarElement.addEventListener('touchmove', handleTouchMove);
    sidebarElement.addEventListener('touchend', handleTouchEnd);

    return () => {
      sidebarElement.removeEventListener('touchstart', handleTouchStart);
      sidebarElement.removeEventListener('touchmove', handleTouchMove);
      sidebarElement.removeEventListener('touchend', handleTouchEnd);
    };
  }, [isMobile]);

  const hasAccess = (item: SidebarItem): boolean => {
    return canAccessNavigationItem(item, user);
  };

  const toggleSidebar = () => {
    if (isMobile) {
      setIsMobileOpen(!isMobileOpen);
    } else {
      setIsCollapsed(!isCollapsed);
    }
  };

  const handleLogout = () => {
    clearAuth();
    window.location.href = "/login";
  };

  const formatTime = formatTimeGMT2;
  const formatDay = formatDayGMT2;

  return (
    <>
      {/* Sidebar */}
      <motion.aside
        ref={sidebarRef}
        initial={false}
        animate={{
          width: isMobile ? (isMobileOpen ? 280 : 0) : (isCollapsed ? 70 : 280),
          x: isMobile ? (isMobileOpen ? 0 : -280) : 0
        }}
        transition={{ duration: 0.3, ease: "easeInOut" }}
        className="hidden md:flex bg-[linear-gradient(180deg,#070f1f_0%,#0f172a_48%,#111827_100%)] border-r border-white/10 flex-col h-screen min-h-0 z-50 flex-shrink-0 overflow-hidden shadow-2xl shadow-slate-950/25"
        style={{
          touchAction: "pan-y",
          position: isMobile ? "fixed" : "sticky",
          top: 0,
          left: isMobile ? 0 : "auto"
        }}
      >
        {/* Header */}
        <div className="p-4 border-b border-white/10 flex-shrink-0 bg-white/[0.035]">
          <div className="flex items-center justify-between">
            <AnimatePresence mode="wait">
              {(!isCollapsed && !isMobile) || (isMobile && isMobileOpen) ? (
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.2 }}
                  className="flex items-center gap-3"
                >
                  <div className="w-10 h-10 rounded-lg overflow-hidden bg-white ring-1 ring-white/20 shadow-sm flex items-center justify-center">
                    <img src="/logo.jpeg" alt="" className="h-full w-full object-cover" />
                  </div>
                  <div>
                    <h1 className="text-[15px] font-bold text-white tracking-wide leading-tight">
                      ETS. DIEU MERCI
                    </h1>
                    <p className="text-xs text-slate-400">Gestion commerciale</p>
                  </div>
                </motion.div>
              ) : !isMobile ? (
                <div className="w-10 h-10 rounded-lg overflow-hidden bg-white ring-1 ring-white/20 mx-auto">
                  <img src="/logo.jpeg" alt="" className="h-full w-full object-cover" />
                </div>
              ) : null}
            </AnimatePresence>

            {/* Desktop toggle button - hidden on mobile */}
            {!isMobile && (
              <button
                onClick={toggleSidebar}
                className="p-1.5 rounded-md text-slate-400 hover:bg-white/10 hover:text-white transition-colors ring-1 ring-transparent hover:ring-white/10"
                aria-label={isCollapsed ? "Etendre le menu" : "Reduire le menu"}
              >
                {isCollapsed ? (
                  <ChevronRight className="w-4 h-4" />
                ) : (
                  <ChevronLeft className="w-4 h-4" />
                )}
              </button>
            )}
          </div>

          {/* Time and Date Display - Only show when expanded */}
          <AnimatePresence mode="wait">
            {((!isCollapsed && !isMobile) || (isMobile && isMobileOpen)) && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="mt-3 rounded-lg border border-white/10 bg-white/[0.055] px-3 py-2 text-center shadow-inner shadow-black/10"
              >
                <div className="text-xs text-slate-300 flex items-center justify-center gap-1">
                  <Clock className="w-3 h-3" />
                  {formatTime(currentTime)}
                </div>
                <div className="text-xs text-slate-500 mt-1">
                  {formatDay(currentTime)}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* User Info Section - Only show when authenticated and sidebar is expanded */}
          <AnimatePresence mode="wait">
            {isAuthed && ((!isCollapsed && !isMobile) || (isMobile && isMobileOpen)) && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="mt-4 pt-4 border-t border-white/10"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center bg-blue-500/20 text-blue-200 ring-1 ring-blue-300/20">
                    <User className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-white truncate">
                      {user?.username || "Utilisateur"}
                    </p>
                    <p className="text-xs capitalize text-blue-300">
                      {user?.role || "Non défini"}
                    </p>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Collapsed User Info - Show only icon when collapsed on desktop */}
          <AnimatePresence mode="wait">
            {isAuthed && isCollapsed && !isMobile && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="mt-4 pt-4 border-t border-white/10 flex justify-center"
              >
                <div className="relative group">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center bg-blue-500/20 text-blue-200 ring-1 ring-blue-300/20">
                    <User className="w-4 h-4" />
                  </div>

                  {/* Tooltip showing user info when hovered */}
                  <div className="absolute left-full ml-2 px-3 py-2 bg-slate-900 text-white text-sm rounded-lg shadow-xl opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50 border border-white/10">
                    <div className="text-center">
                      <div className="font-medium">
                        {user?.username || "Utilisateur"}
                      </div>
                      <div className="capitalize text-xs text-blue-300">
                        {user?.role || "Non défini"}
                      </div>
                      <div className="text-gray-300 text-xs mt-1">
                        {formatTime(currentTime)}
                      </div>
                      <div className="text-gray-400 text-xs">
                        {formatDay(currentTime)}
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* If NOT authenticated → show only Login */}
        {!isAuthed ? (
          <div className="flex-1 min-h-0 overflow-y-auto p-4">
            <Link
              to="/login"
              className={clsx(
                "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group relative",
                "bg-blue-600 text-white hover:bg-blue-700 shadow-sm"
              )}
            >
              <LogIn className="w-5 h-5 flex-shrink-0" />
              <AnimatePresence mode="wait">
                {(!isCollapsed && !isMobile) || (isMobile && isMobileOpen) ? (
                  <motion.span
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    transition={{ duration: 0.2 }}
                    className="font-medium text-sm"
                  >
                    Se connecter
                  </motion.span>
                ) : null}
              </AnimatePresence>

              {/* Tooltip for collapsed state */}
              {(isCollapsed && !isMobile) && (
                <div className="absolute left-full ml-2 px-3 py-2 bg-slate-900 text-white text-sm rounded-lg shadow-xl opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50 border border-white/10">
                  Se connecter
                </div>
              )}
            </Link>
          </div>
        ) : (
          <>
            {/* Navigation (only when authenticated) */}
            <nav className="flex-1 min-h-0 overflow-y-auto p-3 space-y-5">
              {sidebarSections.map((section) => {
                const accessibleItems = section.items.filter(hasAccess);

                if (accessibleItems.length === 0) return null;

                return (
                  <div key={section.title}>
                    <AnimatePresence mode="wait">
                      {((!isCollapsed && !isMobile) || (isMobile && isMobileOpen)) && (
                        <motion.h3
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          transition={{ duration: 0.2 }}
                          className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-2 px-2"
                        >
                          {section.title}
                        </motion.h3>
                      )}
                    </AnimatePresence>

                    <ul className="space-y-1">
                      {accessibleItems.map((item) => {
                        const isActive = location.pathname === item.path;
                        const Icon = item.icon;

                        return (
                          <li key={item.id}>
                            <Link
                              to={item.path}
                              onClick={() => {
                                if (isMobile) {
                                  setIsMobileOpen(false);
                                }
                              }}
                              className={clsx(
                                "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group relative",
                                isActive
                                  ? "bg-white text-slate-950 shadow-sm ring-1 ring-white/20"
                                  : "text-slate-300 hover:bg-white/10 hover:text-white"
                              )}
                            >
                              <Icon
                                className={clsx(
                                  "w-5 h-5 flex-shrink-0",
                                  isActive
                                    ? "text-blue-700"
                                    : "text-slate-500 group-hover:text-white"
                                )}
                              />

                              <AnimatePresence mode="wait">
                                {((!isCollapsed && !isMobile) || (isMobile && isMobileOpen)) && (
                                  <motion.span
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -10 }}
                                    transition={{ duration: 0.2 }}
                                    className="font-medium text-sm"
                                  >
                                    {item.label}
                                  </motion.span>
                                )}
                              </AnimatePresence>

                              {item.badge && (
                                <AnimatePresence mode="wait">
                                  {((!isCollapsed && !isMobile) || (isMobile && isMobileOpen)) && (
                                    <motion.span
                                      initial={{ opacity: 0, scale: 0.8 }}
                                      animate={{ opacity: 1, scale: 1 }}
                                      exit={{ opacity: 0, scale: 0.8 }}
                                      className="ml-auto bg-red-600 text-white text-xs px-2 py-0.5 rounded-full"
                                    >
                                      {item.badge}
                                    </motion.span>
                                  )}
                                </AnimatePresence>
                              )}

                              {/* Tooltip for collapsed state on desktop */}
                              {(isCollapsed && !isMobile) && (
                                <div className="absolute left-full ml-2 px-3 py-2 bg-slate-900 text-white text-sm rounded-lg shadow-xl opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50 border border-white/10">
                                  {item.label}
                                </div>
                              )}
                            </Link>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                );
              })}
            </nav>

            {/* Footer (only when authenticated) */}
            <div className="p-3 border-t border-white/10 space-y-2 flex-shrink-0 bg-white/[0.035]">
              {/* Logout Button */}
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-300 hover:bg-red-500/15 hover:text-red-100 transition-colors group relative"
              >
                <LogOut className="w-5 h-5 text-slate-500 group-hover:text-red-200" />
                <AnimatePresence mode="wait">
                  {((!isCollapsed && !isMobile) || (isMobile && isMobileOpen)) && (
                    <motion.span
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -10 }}
                      transition={{ duration: 0.2 }}
                      className="font-medium text-sm"
                    >
                      Se déconnecter
                    </motion.span>
                  )}
                </AnimatePresence>
                {(isCollapsed && !isMobile) && (
                  <div className="absolute left-full ml-2 px-2 py-1 bg-gray-800 text-white text-sm rounded-md shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
                    Se déconnecter
                  </div>
                )}
              </button>
              {/* Notifications - For admin, manager, and cashier_supervisor */}
              {["admin", "manager", "cashier_supervisor"].includes(user?.role || "") && (
                <Link
                  to="/notifications"
                  onClick={() => isMobile && setIsMobileOpen(false)}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-300 hover:bg-white/10 hover:text-white transition-colors group relative"
                >
                  <Bell className="w-5 h-5 text-slate-500 group-hover:text-white" />
                  <AnimatePresence mode="wait">
                    {((!isCollapsed && !isMobile) || (isMobile && isMobileOpen)) && (
                      <motion.span
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -10 }}
                        transition={{ duration: 0.2 }}
                        className="font-medium text-sm"
                      >
                        Notifications
                      </motion.span>
                    )}
                  </AnimatePresence>
                  {(isCollapsed && !isMobile) && (
                    <div className="absolute left-full ml-2 px-2 py-1 bg-gray-800 text-white text-sm rounded-md shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
                      Notifications
                    </div>
                  )}
                </Link>
              )}

              {/* Settings - For admin and manager */}
              {["admin", "manager"].includes(user?.role || "") && (
                <Link
                  to="/settings"
                  onClick={() => isMobile && setIsMobileOpen(false)}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-300 hover:bg-white/10 hover:text-white transition-colors group relative"
                >
                  <Settings className="w-5 h-5 text-slate-500 group-hover:text-white" />
                  <AnimatePresence mode="wait">
                    {((!isCollapsed && !isMobile) || (isMobile && isMobileOpen)) && (
                      <motion.span
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -10 }}
                        transition={{ duration: 0.2 }}
                        className="font-medium text-sm"
                      >
                        Paramètres
                      </motion.span>
                    )}
                  </AnimatePresence>
                  {(isCollapsed && !isMobile) && (
                    <div className="absolute left-full ml-2 px-2 py-1 bg-gray-800 text-white text-sm rounded-md shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
                      Paramètres
                    </div>
                  )}
                </Link>
              )}
            </div>
          </>
        )}
      </motion.aside>
    </>
  );
}
