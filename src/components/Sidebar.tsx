"use client";

import type React from "react";

import { useState, useEffect, useRef } from "react";
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
  Store,
  TrendingUp,
  Bell,
  LogOut,
  LogIn,
  User,
  Clock,
  Calendar,
  History,
} from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

const clsx = (...classes: (string | undefined | null | false)[]): string => {
  return classes.filter(Boolean).join(" ");
};

interface SidebarItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  path: string;
  badge?: number;
  roles?: string[]; // Add roles property to define access
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
        id: "dashboard",
        label: "Tableau de bord",
        icon: LayoutDashboard,
        path: "/dashboard",
        roles: ["admin"] // Only admin can access dashboard
      },
      { 
        id: "pos", 
        label: "Point de Vente", 
        icon: ShoppingCart, 
        path: "/",
        roles: ["admin", "staff"] // Both admin and staff can access POS
      },
      { 
        id: "reservation", 
        label: "Reservation", 
        icon: Calendar, 
        path: "/reservation",
        roles: ["admin", "staff"] // Both admin and staff can access reservation
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
        roles: ["admin", "staff"] // both admin and can access products
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
        roles: ["admin", "staff"] // Both admin and staff can access sales history
      },
      { 
        id: "reservation-history", 
        label: "Historique de reservation", 
        icon: History, 
        path: "/reservation-history",
        roles: ["admin", "staff"] // Both admin and staff can access reservation history
      },
      { 
        id: "reports", 
        label: "Rapports", 
        icon: BarChart3, 
        path: "/reports",
        roles: ["admin"] // Only admin can access reports
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
        roles: ["admin"] // Only admin can access customers
      },
    ],
  },
];

// Function to check if current time is within restricted hours (8 PM to 7 AM)
const isRestrictedTime = (): boolean => {
  const now = new Date();
  const currentHour = now.getHours();
  // Restricted from 8 PM (20) to 7 AM (7)
  return currentHour >= 20 || currentHour < 7;
};

// (Removed unused getTimeUntilAccess function)

export default function Sidebar() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [showTimeWarning, setShowTimeWarning] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const location = useLocation();
  const { token, user, clearAuth } = useAuth();
  
  const sidebarRef = useRef<HTMLElement>(null);
  const touchStartX = useRef(0);
  const touchStartY = useRef(0);
  const touchEndX = useRef(0);

  const isAuthed = Boolean(token && user);
  const isStaff = user?.role === "staff";
  const isRestricted = isStaff && isRestrictedTime();

  // Check if mobile device
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Update current time every minute
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000); // Update every minute

    return () => clearInterval(timer);
  }, []);

  // Check for restricted time and auto-logout staff
  useEffect(() => {
    if (isAuthed && isStaff) {
      if (isRestricted) {
        // Show warning for 10 seconds before auto-logout
        setShowTimeWarning(true);
        const logoutTimer = setTimeout(() => {
          handleAutoLogout();
        }, 10000); // 10 seconds warning

        return () => clearTimeout(logoutTimer);
      } else {
        setShowTimeWarning(false);
      }
    }
  }, [isAuthed, isStaff, isRestricted, currentTime]);

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
      
      // Only trigger swipe if horizontal movement is significant and vertical movement is minimal
      if (Math.abs(touchDiffX) > 50 && touchDiffY < 100) {
        if (touchDiffX > 0) {
          // Swipe right - expand sidebar
          setIsCollapsed(false);
        } else {
          // Swipe left - collapse sidebar
          setIsCollapsed(true);
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

  // Check if user has access to a specific item
  const hasAccess = (item: SidebarItem): boolean => {
    if (!item.roles) return true; // If no roles specified, allow access
    if (!user?.role) return false; // If user has no role, deny access
    
    return item.roles.includes(user.role);
  };

  const toggleSidebar = () => {
    setIsCollapsed(!isCollapsed);
  };

  const handleLogout = () => {
    clearAuth();
    window.location.href = "/login";
  };

  const handleAutoLogout = () => {
    clearAuth();
    window.location.href = "/login?message=auto_logout";
  };

  // Format time for display
  const formatTime = (date: Date): string => {
    return date.toLocaleTimeString('fr-FR', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: false 
    });
  };

  return (
    <motion.aside
      ref={sidebarRef}
      initial={false}
      animate={{ width: isCollapsed ? 80 : 280 }}
      transition={{ duration: 0.3, ease: "easeInOut" }}
      className="bg-gray-900 border-r border-gray-800 flex flex-col h-screen relative"
      style={{ touchAction: "pan-y" }} // Enable vertical scrolling while allowing swipe gestures
    >
      {/* Auto-logout Warning Modal */}
      <AnimatePresence>
        {showTimeWarning && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50"
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              className="bg-red-600 text-white p-6 rounded-lg max-w-sm mx-4 text-center"
            >
              <Clock className="w-12 h-12 mx-auto mb-4" />
              <h3 className="text-lg font-bold mb-2">Heure de fermeture</h3>
              <p className="mb-4">
                L'accès est restreint pour le personnel de {formatTime(new Date(new Date().setHours(20, 0, 0)))} à {formatTime(new Date(new Date().setHours(7, 0, 0)))}.
              </p>
              <p className="mb-4 font-semibold">
                Déconnexion automatique dans 10 secondes...
              </p>
              <button
                onClick={handleLogout}
                className="bg-white text-red-600 px-4 py-2 rounded font-semibold hover:bg-gray-100 transition-colors"
              >
                Se déconnecter maintenant
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="p-4 border-b border-gray-800">
        <div className="flex items-center justify-between">
          <AnimatePresence mode="wait">
            {!isCollapsed && (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
                className="flex items-center gap-3"
              >
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                  <Store className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h1 className="text-lg font-bold text-white">
                    ETS. DIEU MERCI
                  </h1>
                  <p className="text-xs text-gray-400">Gestion de Vente</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <button
            onClick={toggleSidebar}
            className="p-1.5 rounded-md hover:bg-gray-800 transition-colors"
          >
            {isCollapsed ? (
              <ChevronRight className="w-4 h-4 text-gray-300" />
            ) : (
              <ChevronLeft className="w-4 h-4 text-gray-300" />
            )}
          </button>
        </div>

        {/* Time Display */}
        <AnimatePresence mode="wait">
          {!isCollapsed && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="mt-2 text-center"
            >
              <div className="text-xs text-gray-400 flex items-center justify-center gap-1">
                <Clock className="w-3 h-3" />
                {formatTime(currentTime)}
              </div>
              {isStaff && isRestricted && (
                <div className="text-xs text-red-400 mt-1">
                  Accès restreint • Ouverture à 07:00
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* User Info Section - Only show when authenticated and sidebar is expanded */}
        <AnimatePresence mode="wait">
          {isAuthed && !isCollapsed && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="mt-4 pt-4 border-t border-gray-800"
            >
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  isStaff && isRestricted ? 'bg-red-500' : 'bg-blue-500'
                }`}>
                  <User className="w-4 h-4 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">
                    {user?.username || "Utilisateur"}
                  </p>
                  <p className={`text-xs capitalize ${
                    isStaff && isRestricted ? 'text-red-400' : 'text-blue-400'
                  }`}>
                    {user?.role || "Non défini"}
                    {isStaff && isRestricted && " • Accès restreint"}
                  </p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Collapsed User Info - Show only icon when collapsed */}
        <AnimatePresence mode="wait">
          {isAuthed && isCollapsed && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="mt-4 pt-4 border-t border-gray-800 flex justify-center"
            >
              <div className="relative group">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  isStaff && isRestricted ? 'bg-red-500' : 'bg-blue-500'
                }`}>
                  <User className="w-4 h-4 text-white" />
                </div>
                
                {/* Tooltip showing user info when hovered */}
                <div className="absolute left-full ml-2 px-2 py-1 bg-gray-800 text-white text-sm rounded-md shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
                  <div className="text-center">
                    <div className="font-medium">
                      {user?.username || "Utilisateur"}
                    </div>
                    <div className={`capitalize text-xs ${
                      isStaff && isRestricted ? 'text-red-400' : 'text-blue-400'
                    }`}>
                      {user?.role || "Non défini"}
                      {isStaff && isRestricted && (
                        <div className="text-red-300">Accès restreint</div>
                      )}
                    </div>
                    <div className="text-gray-300 text-xs mt-1">
                      {formatTime(currentTime)}
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
        <div className="flex-1 p-4">
          <Link
            to="/login"
            className={clsx(
              "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group relative",
              "bg-blue-600 text-white hover:bg-blue-700"
            )}
          >
            <LogIn className="w-5 h-5 flex-shrink-0" />
            <AnimatePresence mode="wait">
              {!isCollapsed && (
                <motion.span
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  transition={{ duration: 0.2 }}
                  className="font-medium text-sm"
                >
                  Se connecter
                </motion.span>
              )}
            </AnimatePresence>

            {/* Tooltip for collapsed state */}
            {isCollapsed && (
              <div className="absolute left-full ml-2 px-2 py-1 bg-gray-800 text-white text-sm rounded-md shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
                Se connecter
              </div>
            )}
          </Link>
        </div>
      ) : (
        <>
          {/* Navigation (only when authenticated) */}
          <nav className="flex-1 overflow-y-auto p-4 space-y-6">
            {sidebarSections.map((section) => {
              // Filter items based on user role
              const accessibleItems = section.items.filter(hasAccess);
              
              // Don't render section if no items are accessible
              if (accessibleItems.length === 0) return null;

              return (
                <div key={section.title}>
                  <AnimatePresence mode="wait">
                    {!isCollapsed && (
                      <motion.h3
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3"
                      >
                        {section.title}
                      </motion.h3>
                    )}
                  </AnimatePresence>

                  <ul className="space-y-1">
                    {accessibleItems.map((item) => {
                      const isActive = location.pathname === item.path;
                      const Icon = item.icon;
                      const isItemDisabled = isStaff && isRestricted && !item.roles?.includes('admin');

                      return (
                        <li key={item.id}>
                          <Link
                            to={isItemDisabled ? "#" : item.path}
                            onClick={(e) => {
                              if (isItemDisabled) {
                                e.preventDefault();
                                setShowTimeWarning(true);
                              }
                            }}
                            className={clsx(
                              "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group relative",
                              isActive && !isItemDisabled
                                ? "bg-blue-600 text-white shadow-sm"
                                : isItemDisabled
                                ? "text-gray-500 cursor-not-allowed bg-gray-800 bg-opacity-50"
                                : "text-gray-300 hover:bg-gray-800 hover:text-white"
                            )}
                          >
                            <Icon
                              className={clsx(
                                "w-5 h-5 flex-shrink-0",
                                isActive && !isItemDisabled
                                  ? "text-white"
                                  : isItemDisabled
                                  ? "text-gray-500"
                                  : "text-gray-400 group-hover:text-white"
                              )}
                            />

                            <AnimatePresence mode="wait">
                              {!isCollapsed && (
                                <motion.span
                                  initial={{ opacity: 0, x: -10 }}
                                  animate={{ opacity: 1, x: 0 }}
                                  exit={{ opacity: 0, x: -10 }}
                                  transition={{ duration: 0.2 }}
                                  className="font-medium text-sm"
                                >
                                  {item.label}
                                  {isItemDisabled && " 🔒"}
                                </motion.span>
                              )}
                            </AnimatePresence>

                            {item.badge && (
                              <AnimatePresence mode="wait">
                                {!isCollapsed && (
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

                            {/* Tooltip for collapsed state */}
                            {isCollapsed && (
                              <div className="absolute left-full ml-2 px-2 py-1 bg-gray-800 text-white text-sm rounded-md shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
                                {item.label}
                                {isItemDisabled && " (Accès restreint)"}
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
          <div className="p-4 border-t border-gray-800 space-y-2">
            {/* Notifications - Only for admin */}
            {user?.role === "admin" && (
              <Link
                to="/notifications"
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-300 hover:bg-gray-800 hover:text-white transition-colors group"
              >
                <Bell className="w-5 h-5 text-gray-400 group-hover:text-white" />
                <AnimatePresence mode="wait">
                  {!isCollapsed && (
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
                {isCollapsed && (
                  <div className="absolute left-full ml-2 px-2 py-1 bg-gray-800 text-white text-sm rounded-md shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
                    Notifications
                  </div>
                )}
              </Link>
            )}

            {/* Settings - Only for admin */}
            {user?.role === "admin" && (
              <Link
                to="/settings"
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-300 hover:bg-gray-800 hover:text-white transition-colors group"
              >
                <Settings className="w-5 h-5 text-gray-400 group-hover:text-white" />
                <AnimatePresence mode="wait">
                  {!isCollapsed && (
                    <motion.span
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -10 }}
                      transition={{ duration: 0.2 }}
                      className="font-medium text-sm"
                    >
                      Settings
                    </motion.span>
                  )}
                </AnimatePresence>
                {isCollapsed && (
                  <div className="absolute left-full ml-2 px-2 py-1 bg-gray-800 text-white text-sm rounded-md shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
                    Settings
                  </div>
                )}
              </Link>
            )}

            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-300 hover:bg-red-600 hover:text-white transition-colors group"
            >
              <LogOut className="w-5 h-5 text-gray-400 group-hover:text-white" />
              <AnimatePresence mode="wait">
                {!isCollapsed && (
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
              {isCollapsed && (
                <div className="absolute left-full ml-2 px-2 py-1 bg-gray-800 text-white text-sm rounded-md shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
                  Logout
                </div>
              )}
            </button>
          </div>
        </>
      )}
    </motion.aside>
  );
}