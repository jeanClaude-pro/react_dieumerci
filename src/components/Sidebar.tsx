import { useEffect, useMemo, useState } from "react";
import { LogOut, PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { useTranslation } from "react-i18next";
import { getAccessibleSections, isNavigationItemActive } from "../config/navigation";
import { navLabel, navShort, roleLabel, sectionTitle } from "../i18n/nav";
import LanguageToggle from "./ui/LanguageToggle";
import { formatDayGMT2, formatTimeGMT2 } from "../utils/dateUtils";
import { useMediaQuery } from "../hooks/useMediaQuery";

const COLLAPSE_KEY = "ui.sidebar.collapsed";

function readCollapsedPreference() {
  try {
    return localStorage.getItem(COLLAPSE_KEY) === "1";
  } catch {
    return false;
  }
}

/**
 * Desktop (≥1280px): full sidebar, collapsible to a rail (remembered).
 * Tablet (640–1279px): touch-sized rail; the toggle opens the full menu as
 * an overlay drawer. Phones use MobileNavigation instead (CSS hides this).
 */
export default function Sidebar() {
  const { token, user, logout: serverLogout } = useAuth();
  const { t } = useTranslation();
  const location = useLocation();
  const isDesktop = useMediaQuery("(min-width: 1280px)");
  const [collapsed, setCollapsed] = useState(readCollapsedPreference);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [now, setNow] = useState(new Date());
  const sections = useMemo(() => getAccessibleSections(user), [user]);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 60000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => setDrawerOpen(false), [location.pathname, isDesktop]);

  useEffect(() => {
    if (!drawerOpen) return;
    const onKeyDown = (event: KeyboardEvent) => { if (event.key === "Escape") setDrawerOpen(false); };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [drawerOpen]);

  if (!token || !user) return null;

  const expanded = isDesktop ? !collapsed : drawerOpen;
  const isDrawer = !isDesktop && drawerOpen;
  const toggle = () => {
    if (!isDesktop) return setDrawerOpen(open => !open);
    setCollapsed(value => {
      try { localStorage.setItem(COLLAPSE_KEY, value ? "0" : "1"); } catch { /* preference only */ }
      return !value;
    });
  };
  const logout = () => { void serverLogout(); };
  const initials = user.username.slice(0, 2).toUpperCase();

  return <div className={`app-sidebar-slot ${isDesktop && !collapsed ? "" : "is-rail"}`}>
    {isDrawer && <button type="button" className="sidebar-scrim" aria-label={t("nav.closeMenu")} onClick={() => setDrawerOpen(false)} />}
    <aside className={`app-sidebar ${expanded ? "is-expanded" : "is-rail"} ${isDrawer ? "is-drawer" : ""}`} aria-label={t("nav.appMenu")}>
      <div className="sidebar-head">
        <Link to="/" className="sidebar-brand" aria-label={t("nav.brandHome")} title={t("nav.items.home.label")}>
          <img src="/logo.jpeg" alt="" /><span>ETS. DIEU MERCI<small>{t("nav.tagline")}</small></span>
        </Link>
        <button type="button" className="sidebar-toggle" onClick={toggle} aria-expanded={expanded}
          aria-label={expanded ? t("nav.collapse") : t("nav.expand")} title={expanded ? t("nav.collapse") : t("nav.expand")}>
          {expanded ? <PanelLeftClose aria-hidden="true" /> : <PanelLeftOpen aria-hidden="true" />}
        </button>
      </div>

      <nav aria-label={t("nav.mainNavigation")} className="sidebar-nav">
        {sections.map(section => <section key={section.key} aria-labelledby={`nav-${section.key}`}>
          <h2 id={`nav-${section.key}`} className={section.hideTitle ? "sr-only" : undefined}>{sectionTitle(t, section)}</h2>
          <ul>
            {section.items.map(item => {
              const Icon = item.icon;
              const active = isNavigationItemActive(location.pathname, item);
              return <li key={item.id}>
                <Link to={item.path} title={expanded ? undefined : navLabel(t, item)} aria-current={active ? "page" : undefined}
                  className={`sidebar-link ${active ? "is-active" : ""}`}>
                  <Icon aria-hidden="true" />
                  <span className="label-full">{navLabel(t, item)}</span>
                  <span className="label-short" aria-hidden="true">{navShort(t, item)}</span>
                  {!expanded && <span className="sr-only">{navLabel(t, item)}</span>}
                </Link>
              </li>;
            })}
          </ul>
        </section>)}
      </nav>

      <footer className="sidebar-footer">
        <LanguageToggle compact={!expanded} className="sidebar-lang" />
        <div className="sidebar-clock"><span>{formatDayGMT2(now)}</span><strong>{formatTimeGMT2(now)}</strong></div>
        <div className="sidebar-account">
          <span className="sidebar-avatar" aria-hidden="true" title={`${user.username} · ${roleLabel(t, user.role)}`}>{initials}</span>
          <div className="sidebar-account-text"><strong>{user.username}</strong><small>{roleLabel(t, user.role)}</small></div>
          <button type="button" className="sidebar-logout" aria-label={t("nav.logout")} title={t("nav.logout")} onClick={logout}>
            <LogOut aria-hidden="true" />
          </button>
        </div>
      </footer>
    </aside>
  </div>;
}
