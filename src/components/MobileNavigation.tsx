import { useEffect, useMemo, useState } from "react";
import { LogOut, MoreHorizontal, X } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { getAccessibleSections, getMobilePrimaryItems, isNavigationItemActive, roleLabels } from "../config/navigation";
import Dialog from "./ui/Dialog";

/** Phone tab bar: up to four permitted destinations + "Plus" sheet with the rest. */
export default function MobileNavigation() {
  const [isMoreOpen, setIsMoreOpen] = useState(false);
  const location = useLocation();
  const { token, user, clearAuth } = useAuth();
  const accessibleSections = useMemo(() => getAccessibleSections(user), [user]);
  const primaryItems = useMemo(() => getMobilePrimaryItems(user), [user]);
  const primaryIds = new Set(primaryItems.map(item => item.id));
  const secondaryActive = accessibleSections.some(section => section.items.some(item =>
    !primaryIds.has(item.id) && isNavigationItemActive(location.pathname, item)));

  useEffect(() => setIsMoreOpen(false), [location.pathname]);

  if (!token || !user) return null;
  const logout = () => { clearAuth(); window.location.href = "/login"; };

  return <>
    {isMoreOpen && <Dialog sheet dismissOnBackdrop label="Tous les modules" onClose={() => setIsMoreOpen(false)}>
      <section className="mobile-more-sheet">
        <div className="mobile-sheet-handle" aria-hidden="true" />
        <div className="mobile-sheet-header">
          <div className="min-w-0"><h2>Tous les modules</h2><p className="truncate">{user.username} · {roleLabels[user.role]}</p></div>
          <button type="button" className="btn btn-ghost btn-icon" onClick={() => setIsMoreOpen(false)} aria-label="Fermer"><X aria-hidden="true" /></button>
        </div>
        <div className="mobile-sheet-content">
          {accessibleSections.map(section => {
            const items = section.items.filter(item => !primaryIds.has(item.id));
            if (!items.length) return null;
            return <nav key={section.title} className="mobile-module-section" aria-label={section.title}>
              <h3>{section.title}</h3>
              <div className="mobile-module-grid">{items.map(item => {
                const Icon = item.icon;
                const active = isNavigationItemActive(location.pathname, item);
                return <Link key={item.id} to={item.path} className={active ? "is-active" : ""} aria-current={active ? "page" : undefined}>
                  <span className="mobile-module-icon"><Icon aria-hidden="true" /></span><span>{item.label}</span>
                </Link>;
              })}</div>
            </nav>;
          })}
          <div className="mobile-account-card">
            <span className="sidebar-avatar" style={{ background: "var(--primary-soft)", color: "var(--primary)" }} aria-hidden="true">{user.username.slice(0, 2).toUpperCase()}</span>
            <div className="min-w-0 flex-1"><strong>{user.username}</strong><span>{user.email}</span></div>
            <button type="button" onClick={logout} className="btn btn-danger-soft btn-sm"><LogOut aria-hidden="true" />Déconnexion</button>
          </div>
        </div>
      </section>
    </Dialog>}
    <nav className="mobile-bottom-nav" aria-label="Navigation principale">
      {primaryItems.map(item => {
        const Icon = item.icon;
        const active = isNavigationItemActive(location.pathname, item);
        return <Link key={item.id} to={item.path} className={active ? "is-active" : ""} aria-current={active ? "page" : undefined}>
          <span className="tab-icon"><Icon aria-hidden="true" /></span><span>{item.shortLabel || item.label}</span>
        </Link>;
      })}
      <button type="button" className={isMoreOpen || secondaryActive ? "is-active" : ""} onClick={() => setIsMoreOpen(true)}
        aria-haspopup="dialog" aria-expanded={isMoreOpen}>
        <span className="tab-icon"><MoreHorizontal aria-hidden="true" /></span><span>Plus</span>
      </button>
    </nav>
  </>;
}
