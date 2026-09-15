import { useEffect, useMemo, useState } from "react";
import { LogOut, MoreHorizontal, User as UserIcon, X } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { canAccessNavigationItem, isNavigationItemActive, navigationSections } from "../config/navigation";

export default function MobileNavigation() {
  const [isMoreOpen, setIsMoreOpen] = useState(false);
  const location = useLocation();
  const { token, user, clearAuth } = useAuth();
  const accessibleSections = useMemo(() => navigationSections
    .map((section) => ({ ...section, items: section.items.filter((item) => canAccessNavigationItem(item, user)) }))
    .filter((section) => section.items.length > 0), [user]);
  const primaryItems = accessibleSections.flatMap((section) => section.items).filter((item) => item.mobilePrimary).slice(0, 4);
  const primaryIds = new Set(primaryItems.map((item) => item.id));

  useEffect(() => setIsMoreOpen(false), [location.pathname]);
  useEffect(() => {
    if (!isMoreOpen) return;
    const onKeyDown = (event: KeyboardEvent) => event.key === "Escape" && setIsMoreOpen(false);
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isMoreOpen]);

  if (!token || !user) return null;
  const logout = () => { clearAuth(); window.location.href = "/login"; };

  return <>
    {isMoreOpen && <div className="mobile-more-layer">
      <button className="mobile-more-backdrop" onClick={() => setIsMoreOpen(false)} aria-label="Fermer le menu" />
      <section className="mobile-more-sheet" role="dialog" aria-modal="true" aria-labelledby="mobile-menu-title">
        <div className="mobile-sheet-handle" />
        <div className="mobile-sheet-header">
          <div className="min-w-0"><h2 id="mobile-menu-title">Tous les modules</h2><p className="truncate">{user.username} · {user.role}</p></div>
          <button className="mobile-icon-button" onClick={() => setIsMoreOpen(false)} aria-label="Fermer"><X /></button>
        </div>
        <div className="mobile-sheet-content">
          {accessibleSections.map((section) => {
            const items = section.items.filter((item) => !primaryIds.has(item.id));
            if (!items.length) return null;
            return <div key={section.title} className="mobile-module-section">
              <h3>{section.title}</h3><div className="mobile-module-grid">{items.map((item) => {
                const Icon = item.icon; const active = isNavigationItemActive(location.pathname, item);
                return <Link key={item.id} to={item.path} className={active ? "is-active" : ""}><span className="mobile-module-icon"><Icon /></span><span>{item.label}</span></Link>;
              })}</div>
            </div>;
          })}
          <div className="mobile-account-card">
            <div className="mobile-account-avatar"><UserIcon /></div>
            <div className="min-w-0 flex-1"><strong className="block truncate">{user.username}</strong><span className="block truncate">{user.email}</span></div>
            <button onClick={logout} className="mobile-logout-button"><LogOut /><span>Déconnexion</span></button>
          </div>
        </div>
      </section>
    </div>}
    <nav className="mobile-bottom-nav" aria-label="Navigation principale">
      {primaryItems.map((item) => { const Icon = item.icon; const active = isNavigationItemActive(location.pathname, item); return <Link key={item.id} to={item.path} className={active ? "is-active" : ""} aria-current={active ? "page" : undefined}><Icon /><span>{item.shortLabel || item.label}</span></Link>; })}
      <button className={isMoreOpen ? "is-active" : ""} onClick={() => setIsMoreOpen(true)} aria-expanded={isMoreOpen}><MoreHorizontal /><span>Plus</span></button>
    </nav>
  </>;
}
