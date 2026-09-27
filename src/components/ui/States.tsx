import { AlertTriangle, Inbox, LoaderCircle, ShieldAlert } from "lucide-react";
import type { CSSProperties, ReactNode } from "react";

export function LoadingState({ label = "Chargement en cours…", page = false }: { label?: string; page?: boolean }) {
  return <div className={`ui-state ui-state-loading ${page ? "ui-state-page" : ""}`} role="status" aria-live="polite">
    <LoaderCircle className="animate-spin" aria-hidden="true" /><p>{label}</p>
  </div>;
}

export function EmptyState({ title, children, icon, action }: { title: string; children?: ReactNode; icon?: ReactNode; action?: ReactNode }) {
  return <div className="ui-state">
    {icon ?? <Inbox aria-hidden="true" />}<strong>{title}</strong>{children && <p>{children}</p>}{action}
  </div>;
}

export function ErrorState({ title = "Une erreur est survenue", children, action }: { title?: string; children?: ReactNode; action?: ReactNode }) {
  return <div className="ui-state ui-state-danger" role="alert">
    <AlertTriangle aria-hidden="true" /><strong>{title}</strong>{children && <p>{children}</p>}{action}
  </div>;
}

export function PermissionDenied({ children }: { children?: ReactNode }) {
  return <div className="ui-state ui-state-page ui-state-danger" role="alert">
    <ShieldAlert aria-hidden="true" />
    <h1>Accès refusé</h1>
    <p>{children ?? "Votre compte n'a pas accès à ce module. Contactez un administrateur si vous en avez besoin."}</p>
  </div>;
}

export function Skeleton({ className = "", style }: { className?: string; style?: CSSProperties }) {
  return <span className={`skeleton ${className}`} style={style} aria-hidden="true" />;
}
