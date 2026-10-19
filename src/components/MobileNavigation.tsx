import { useEffect, useMemo, useState } from "react";
import { LogOut, MoreHorizontal, X } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { useTranslation } from "react-i18next";
import { getAccessibleSections, getMobilePrimaryItems, isNavigationItemActive } from "../config/navigation";
import { navLabel, navShort, roleLabel, sectionTitle } from "../i18n/nav";
import LanguageToggle from "./ui/LanguageToggle";
import Dialog from "./ui/Dialog";

/** Phone tab bar: up to four permitted destinations + "Plus" sheet with the rest. */
export default function MobileNavigation() {
  const [isMoreOpen, setIsMoreOpen] = useState(false);
  const location = useLocation();
  const { token, user, clearAuth } = useAuth();
  const { t } = useTranslation();
  const accessibleSections = useMemo(() => getAccessibleSections(user), [user]);
  const primaryItems = useMemo(() => getMobilePrimaryItems(user), [user]);
  const primaryIds = new Set(primaryItems.map(item => item.id));
  const secondaryActive = accessibleSections.some(section => section.items.some(item =>
    !primaryIds.has(item.id) && isNavigationItemActive(location.pathname, item)));

  useEffect(() => setIsMoreOpen(false), [location.pathname]);

  if (!token || !user) return null;
  const logout = () => { clearAuth(); window.location.href = "/login"; };

  return <>
    {isMoreOpen && <Dialog sheet dismissOnBackdrop label={t("nav.allModules")} onClose={() => setIsMoreOpen(false)}>
      <section className="mobile-more-sheet">
        <div className="mobile-sheet-handle" aria-hidden="true" />
        <div className="mobile-sheet-header">
          <div className="min-w-0"><h2>{t("nav.allModules")}</h2><p className="truncate">{user.username} · {roleLabel(t, user.role)}</p></div>
          <button type="button" className="btn btn-ghost btn-icon" onClick={() => setIsMoreOpen(false)} aria-label={t("common.close")}><X aria-hidden="true" /></button>
        </div>
        <div className="mobile-sheet-content">
          {accessibleSections.map(section => {
            const items = section.items.filter(item => !primaryIds.has(item.id));
            if (!items.length) return null;
            return <nav key={section.key} className="mobile-module-section" aria-label={sectionTitle(t, section)}>
              <h3>{sectionTitle(t, section)}</h3>
              <div className="mobile-module-grid">{items.map(item => {
                const Icon = item.icon;
                const active = isNavigationItemActive(location.pathname, item);
                return <Link key={item.id} to={item.path} className={active ? "is-active" : ""} aria-current={active ? "page" : undefined}>
                  <span className="mobile-module-icon"><Icon aria-hidden="true" /></span><span>{navLabel(t, item)}</span>
                </Link>;
              })}</div>
            </nav>;
          })}
          <div className="mobile-lang-row"><span>{t("language.label")}</span><LanguageToggle /></div>
          <div className="mobile-account-card">
            <span className="sidebar-avatar" style={{ background: "var(--primary-soft)", color: "var(--primary)" }} aria-hidden="true">{user.username.slice(0, 2).toUpperCase()}</span>
            <div className="min-w-0 flex-1"><strong>{user.username}</strong><span>{user.email}</span></div>
            <button type="button" onClick={logout} className="btn btn-danger-soft btn-sm"><LogOut aria-hidden="true" />{t("nav.logoutShort")}</button>
          </div>
        </div>
      </section>
    </Dialog>}
    <nav className="mobile-bottom-nav" aria-label={t("nav.mainNavigation")}>
      {primaryItems.map(item => {
        const Icon = item.icon;
        const active = isNavigationItemActive(location.pathname, item);
        return <Link key={item.id} to={item.path} className={active ? "is-active" : ""} aria-current={active ? "page" : undefined}>
          <span className="tab-icon"><Icon aria-hidden="true" /></span><span>{navShort(t, item)}</span>
        </Link>;
      })}
      <button type="button" className={isMoreOpen || secondaryActive ? "is-active" : ""} onClick={() => setIsMoreOpen(true)}
        aria-haspopup="dialog" aria-expanded={isMoreOpen}>
        <span className="tab-icon"><MoreHorizontal aria-hidden="true" /></span><span>{t("nav.more")}</span>
      </button>
    </nav>
  </>;
}
