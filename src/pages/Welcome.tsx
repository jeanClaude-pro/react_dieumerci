import { useEffect, useMemo, useState } from "react";
import { ArrowLeftRight, ArrowUpRight, CalendarDays, LogOut } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { getAccessibleSections, roleLabels, type NavigationItem } from "../config/navigation";
import { EmptyState } from "../components/ui/States";
import { serverUrl } from "../utils/constants";

// Everyday operations surface first; order only, access comes from navigation.
const QUICK_ORDER = ["pos", "sales", "products", "payment-approval", "payment-verification", "entry", "sortie", "customers"];

function greeting(date: Date) {
  const hour = Number(new Intl.DateTimeFormat("fr-FR", { hour: "numeric", hour12: false, timeZone: "Africa/Lubumbashi" }).format(date));
  return hour >= 18 || hour < 4 ? "Bonsoir" : "Bonjour";
}

type Tone = "blue" | "green";

function Launcher({ item, primary = false, tone = "blue" }: { item: NavigationItem; primary?: boolean; tone?: Tone }) {
  const Icon = item.icon;
  return <Link to={item.path} data-tone={tone} className={`launcher-card ${primary ? "launcher-primary" : ""}`}>
    <span className="launcher-icon"><Icon aria-hidden="true" /></span>
    <span className="launcher-copy"><strong>{item.label}</strong>{item.description && <span>{item.description}</span>}</span>
    <ArrowUpRight className="launcher-arrow" aria-hidden="true" />
  </Link>;
}

export default function Welcome() {
  const { user, clearAuth } = useAuth();
  const logout = () => { clearAuth(); window.location.href = "/login"; };
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

  const dateLabel = new Intl.DateTimeFormat("fr-FR", { weekday: "long", day: "numeric", month: "long", timeZone: "Africa/Lubumbashi" }).format(today);

  return <div className="page welcome-page">
    {/* No sidebar on this screen: brand, account and logout live here. */}
    <div className="welcome-topbar">
      <div className="welcome-topbar-brand">
        <img src="/logo.jpeg" alt="" />
        <span>ETS. DIEU MERCI<small>Gestion commerciale</small></span>
      </div>
      {user && <div className="welcome-account">
        <span className="welcome-avatar" aria-hidden="true">{user.username.slice(0, 2).toUpperCase()}</span>
        <span className="welcome-account-text"><strong>{user.username}</strong><small>{roleLabels[user.role]}</small></span>
        <button type="button" onClick={logout} className="btn btn-secondary btn-sm" aria-label="Se déconnecter" title="Se déconnecter">
          <LogOut aria-hidden="true" /><span className="welcome-logout-text">Déconnexion</span>
        </button>
      </div>}
    </div>

    <header className="welcome-hero">
      <div className="min-w-0">
        <div className="eyebrow"><CalendarDays aria-hidden="true" /><span>{dateLabel}</span></div>
        <h1>{greeting(today)}{user?.username ? `, ${user.username}` : ""}</h1>
        <p>{quick.length
          ? "Choisissez une opération pour commencer. Seuls les modules autorisés pour votre compte sont affichés."
          : "Votre compte est actif. Les modules vous seront accessibles dès qu'un administrateur les aura attribués."}</p>
        <div className="welcome-meta">
          {user && <span className="welcome-chip">{roleLabels[user.role]}</span>}
          {rate !== null && <span className="welcome-chip"><ArrowLeftRight aria-hidden="true" />
            <span className="num">1 USD = {new Intl.NumberFormat("fr-FR").format(rate)} FC</span></span>}
        </div>
      </div>
    </header>

    {quick.length > 0 && <section aria-labelledby="quick-title">
      <div className="welcome-section-heading"><h2 id="quick-title">Opérations courantes</h2></div>
      <div className="launcher-grid launcher-quick">
        {quick.map((item, index) => <Launcher key={item.id} item={item} primary={item.id === "pos"} tone={index % 2 ? "green" : "blue"} />)}
      </div>
    </section>}

    {/* Sections alternate blue and green so the launcher reads in groups. */}
    {sections.map((section, index) => {
      const tone: Tone = index % 2 ? "blue" : "green";
      return <section key={section.title} aria-labelledby={`launch-${section.title}`} data-tone={tone} className="welcome-section">
        <div className="welcome-section-heading"><h2 id={`launch-${section.title}`}>{section.title}</h2></div>
        <div className="launcher-grid">{section.items.map(item => <Launcher key={item.id} item={item} tone={tone} />)}</div>
      </section>;
    })}

    {!quick.length && !sections.length && <div className="card">
      <EmptyState title="Aucun module attribué">Contactez votre administrateur pour obtenir l'accès aux modules nécessaires à votre poste.</EmptyState>
    </div>}
  </div>;
}
