import { useEffect, useMemo, useState } from "react";
import { ArrowLeftRight, ArrowUpRight, CalendarDays, LogOut } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { useTranslation } from "react-i18next";
import type { TFunction } from "i18next";
import { getAccessibleSections, type NavigationItem } from "../config/navigation";
import { navDescription, navLabel, roleLabel, sectionTitle } from "../i18n/nav";
import { activeLocale } from "../i18n/translate";
import LanguageToggle from "../components/ui/LanguageToggle";
import { EmptyState } from "../components/ui/States";
import { serverUrl } from "../utils/constants";

// Everyday operations surface first; order only, access comes from navigation.
const QUICK_ORDER = ["pos", "sales", "products", "payment-approval", "payment-verification", "entry", "sortie", "customers"];

function greeting(t: TFunction, date: Date) {
  const hour = Number(new Intl.DateTimeFormat("en-GB", { hour: "numeric", hour12: false, timeZone: "Africa/Lubumbashi" }).format(date));
  if (hour >= 18 || hour < 4) return t("welcome.goodEvening");
  // French keeps "Bonjour" all day; English distinguishes the afternoon.
  return hour >= 12 ? t("welcome.goodAfternoon") : t("welcome.goodMorning");
}

type Tone = "blue" | "green";

function Launcher({ item, primary = false, tone = "blue" }: { item: NavigationItem; primary?: boolean; tone?: Tone }) {
  const { t } = useTranslation();
  const Icon = item.icon;
  const description = navDescription(t, item);
  return <Link to={item.path} data-tone={tone} className={`launcher-card ${primary ? "launcher-primary" : ""}`}>
    <span className="launcher-icon"><Icon aria-hidden="true" /></span>
    <span className="launcher-copy"><strong>{navLabel(t, item)}</strong>{description && <span>{description}</span>}</span>
    <ArrowUpRight className="launcher-arrow" aria-hidden="true" />
  </Link>;
}

export default function Welcome() {
  const { user, logout: serverLogout } = useAuth();
  const { t } = useTranslation();
  const logout = () => { void serverLogout(); };
  const [rate, setRate] = useState<number | null>(null);
  const today = new Date();

  const { quick, sections } = useMemo(() => {
    const accessible = getAccessibleSections(user)
      .map(section => ({ ...section, items: section.items.filter(item => item.id !== "home") }))
      .filter(section => section.items.length);
    const all = accessible.flatMap(section => section.items);
    const quick = QUICK_ORDER.map(id => all.find(item => item.id === id)).filter((item): item is NavigationItem => !!item).slice(0, 4);
    const quickIds = new Set(quick.map(item => item.id));
    return {
      quick,
      sections: accessible
        .map(section => ({ ...section, items: section.items.filter(item => !quickIds.has(item.id)) }))
        .filter(section => section.items.length),
    };
  }, [user]);

  // Read-only context for cash desks: today's USD/FC rate (same endpoint the
  // sale screen uses). Failure simply hides the chip.
  useEffect(() => {
    if (!quick.length) return;
    const controller = new AbortController();
    fetch(`${serverUrl}/exchange-rates/current`, {
      headers: { Authorization: `Bearer ${localStorage.getItem("token") || ""}` },
      signal: controller.signal,
    })
      .then(response => (response.ok ? response.json() : null))
      .then(data => { if (data && typeof data.rate === "number") setRate(data.rate); })
      .catch(() => { /* optional context only */ });
    return () => controller.abort();
  }, [quick.length]);

  const dateLabel = new Intl.DateTimeFormat(activeLocale(), { weekday: "long", day: "numeric", month: "long", timeZone: "Africa/Lubumbashi" }).format(today);

  return <div className="page welcome-page">
    {/* No sidebar on this screen: brand, account and logout live here. */}
    <div className="welcome-topbar">
      <div className="welcome-topbar-brand">
        <img src="/logo.jpeg" alt="" />
        <span>ETS. DIEU MERCI<small>{t("nav.tagline")}</small></span>
      </div>
      <LanguageToggle className="welcome-lang" />
      {user && <div className="welcome-account">
        <span className="welcome-avatar" aria-hidden="true">{user.username.slice(0, 2).toUpperCase()}</span>
        <span className="welcome-account-text"><strong>{user.username}</strong><small>{roleLabel(t, user.role)}</small></span>
        <button type="button" onClick={logout} className="btn btn-secondary btn-sm" aria-label={t("nav.logout")} title={t("nav.logout")}>
          <LogOut aria-hidden="true" /><span className="welcome-logout-text">{t("nav.logoutShort")}</span>
        </button>
      </div>}
    </div>

    <header className="welcome-hero">
      <div className="min-w-0">
        <div className="eyebrow"><CalendarDays aria-hidden="true" /><span>{dateLabel}</span></div>
        <h1>{user?.username ? t("welcome.greeting", { greeting: greeting(t, today), name: user.username }) : greeting(t, today)}</h1>
        <p>{quick.length ? t("welcome.intro") : t("welcome.introNoModules")}</p>
        <div className="welcome-meta">
          {user && <span className="welcome-chip">{roleLabel(t, user.role)}</span>}
          {rate !== null && <span className="welcome-chip"><ArrowLeftRight aria-hidden="true" />
            <span className="num">{t("welcome.rate", { rate: new Intl.NumberFormat(activeLocale()).format(rate) })}</span></span>}
        </div>
      </div>
    </header>

    {quick.length > 0 && <section aria-labelledby="quick-title">
      <div className="welcome-section-heading"><h2 id="quick-title">{t("welcome.quick")}</h2></div>
      <div className="launcher-grid launcher-quick">
        {quick.map((item, index) => <Launcher key={item.id} item={item} primary={item.id === "pos"} tone={index % 2 ? "green" : "blue"} />)}
      </div>
    </section>}

    {/* Sections alternate blue and green so the launcher reads in groups. */}
    {sections.map((section, index) => {
      const tone: Tone = index % 2 ? "blue" : "green";
      return <section key={section.key} aria-labelledby={`launch-${section.key}`} data-tone={tone} className="welcome-section">
        <div className="welcome-section-heading"><h2 id={`launch-${section.key}`}>{sectionTitle(t, section)}</h2></div>
        <div className="launcher-grid">{section.items.map(item => <Launcher key={item.id} item={item} tone={tone} />)}</div>
      </section>;
    })}

    {!quick.length && !sections.length && <div className="card">
      <EmptyState title={t("welcome.noModulesTitle")}>{t("welcome.noModulesBody")}</EmptyState>
    </div>}
  </div>;
}
