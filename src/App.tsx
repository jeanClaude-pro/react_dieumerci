"use client";

import { lazy, Suspense, useEffect, useRef } from "react";

import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useLocation,
} from "react-router-dom";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import Sidebar from "./components/Sidebar";
import LoginPage from "./pages/login/page";
import MobileNavigation from "./components/MobileNavigation";
import { RequireAuth } from "./components/RequireAuth";
import { AuthProvider } from "./context/AuthProvider";
import { RequireRole } from "./components/RequireRole";
import { useAuth } from "./hooks/useAuth";
import { LoadingState } from "./components/ui/States";

const Products = lazy(() => import("./pages/products/products"));
const SalesHistory = lazy(() => import("./pages/history/SalesHistory"));
const Analytics = lazy(() => import("./pages/analytics/Analytics"));
const Customers = lazy(() => import("./pages/customers/Customers"));
const NewSale = lazy(() => import("./pages/NewSale"));
const Sortie = lazy(() => import("./pages/Sortie"));
const SortieHistory = lazy(() => import("./pages/SortieHistory"));
const Rate = lazy(() => import("./pages/Rate"));
const Entry = lazy(() => import("./pages/Entry"));
const EntryHistory = lazy(() => import("./pages/EntryHistory"));
const AdminPanel = lazy(() => import("./pages/admin/AdminPanel"));
const SaleEditApprovals = lazy(() => import("./pages/admin/SaleEditApprovals"));
const ReceiptScannerPage = lazy(() => import("./components/ReceiptScannerPage"));
const Remboursements = lazy(() => import("./pages/Remboursements"));
const Welcome = lazy(() => import("./pages/Welcome"));
const Dashboard = lazy(() => import("./pages/dashboard/Dashboard"));

function RouteLoading() {
  return <LoadingState page />;
}

function AppLayout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const isLogin = location.pathname === "/login";
  // The welcome launcher is itself the navigation: full width, no sidebar.
  const isWelcome = location.pathname === "/";
  const mainRef = useRef<HTMLElement>(null);

  // <main> is the scroll container: start each screen at its top.
  useEffect(() => { mainRef.current?.scrollTo(0, 0); }, [location.pathname]);

  return (
    <div className="app-shell">
      <a href="#main-content" className="skip-link">Aller au contenu</a>
      {!isLogin && !isWelcome && <Sidebar />}
      <main ref={mainRef} id="main-content" tabIndex={-1} className={`app-main ${isLogin ? "app-login" : ""}`}>
        <div className="app-content">{children}</div>
      </main>
      {!isLogin && <MobileNavigation />}
    </div>
  );
}

function LoginRoute() {
  const { token, loading } = useAuth();
  if (loading) return null;
  return token ? <Navigate to="/" replace /> : <LoginPage />;
}

export default function App() {
  return (
    <AuthProvider>
      <ToastContainer position="top-right" autoClose={3000} newestOnTop />

      <Router>
        <AppLayout>
          <Suspense fallback={<RouteLoading />}><Routes>
                <Route
                  path="/products"
                  element={
                    <RequireAuth>
                      <Products />
                    </RequireAuth>
                  }
                />
                <Route
                  path="/new-sale"
                  element={
                    <RequireAuth>
                      <NewSale />
                    </RequireAuth>
                  }
                />
                <Route
                  path="/entry"
                  element={
                    <RequireAuth>
                      <Entry />
                    </RequireAuth>
                  }
                />
                <Route
                  path="/entryhistory"
                  element={
                    <RequireAuth>
                      <EntryHistory />
                    </RequireAuth>
                  }
                />
                <Route
                  path="/rate"
                  element={
                    <RequireAuth>
                      <Rate />
                    </RequireAuth>
                  }
                />
                <Route
                  path="/sortie"
                  element={
                    <RequireAuth>
                      <Sortie />
                    </RequireAuth>
                  }
                />
                <Route
                  path="/sortiehistory"
                  element={
                    <RequireAuth>
                      <SortieHistory />
                    </RequireAuth>
                  }
                />
                <Route
                  path="/"
                  element={
                    <RequireAuth>
                      <Welcome />
                    </RequireAuth>
                  }
                />
                <Route
                  path="/sales"
                  element={
                    <RequireAuth>
                      <SalesHistory />
                    </RequireAuth>
                  }
                />
                
                <Route
                  path="/reports"
                  element={
                    <RequireAuth>
                      <Analytics />
                    </RequireAuth>
                  }
                />
                <Route
                  path="/customers"
                  element={
                    <RequireAuth>
                      <Customers />
                    </RequireAuth>
                  }
                />
                <Route
                  path="/payment-approval"
                  element={
                    <RequireAuth>
                      <RequireRole roles={["cashier_supervisor", "admin"]}>
                        <ReceiptScannerPage mode="approve" />
                      </RequireRole>
                    </RequireAuth>
                  }
                />
                <Route
                  path="/payment-verification"
                  element={
                    <RequireAuth>
                      <RequireRole roles={["inventory_manager", "admin"]}>
                        <ReceiptScannerPage mode="verify" />
                      </RequireRole>
                    </RequireAuth>
                  }
                />
                <Route
                  path="/dashboard"
                  element={<RequireAuth><RequireRole roles={["admin"]}><Dashboard /></RequireRole></RequireAuth>}
                />
                <Route
                  path="/remboursements"
                  element={<RequireAuth><RequireRole roles={["admin"]}><Remboursements /></RequireRole></RequireAuth>}
                />
                <Route
                  path="/admin/sale-edit-approvals"
                  element={<RequireAuth><RequireRole roles={["admin"]}><SaleEditApprovals /></RequireRole></RequireAuth>}
                />
                <Route
                  path="/admin"
                  element={
                    <RequireAuth>
                      <AdminPanel />
                    </RequireAuth>
                  }
                />
                <Route path="/login" element={<LoginRoute />} />
              </Routes></Suspense>
        </AppLayout>
      </Router>
    </AuthProvider>
  );
}
