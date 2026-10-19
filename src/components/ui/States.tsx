import { AlertTriangle, Inbox, LoaderCircle, ShieldAlert } from "lucide-react";
import type { CSSProperties, ReactNode } from "react";
import { useTranslation } from "react-i18next";

export function LoadingState({ label, page = false }: { label?: string; page?: boolean }) {
  const { t } = useTranslation();
  return <div className={`ui-state ui-state-loading ${page ? "ui-state-page" : ""}`} role="status" aria-live="polite">
    <LoaderCircle className="animate-spin" aria-hidden="true" /><p>{label ?? t("states.loading")}</p>
  </div>;
}

export function EmptyState({ title, children, icon, action }: { title: string; children?: ReactNode; icon?: ReactNode; action?: ReactNode }) {
  return <div className="ui-state">
    {icon ?? <Inbox aria-hidden="true" />}<strong>{title}</strong>{children && <p>{children}</p>}{action}
  </div>;
}

export function ErrorState({ title, children, action }: { title?: string; children?: ReactNode; action?: ReactNode }) {
  const { t } = useTranslation();
  return <div className="ui-state ui-state-danger" role="alert">
    <AlertTriangle aria-hidden="true" /><strong>{title ?? t("states.errorTitle")}</strong>{children && <p>{children}</p>}{action}
  </div>;
}

export function PermissionDenied({ children }: { children?: ReactNode }) {
  const { t } = useTranslation();
  return <div className="ui-state ui-state-page ui-state-danger" role="alert">
    <ShieldAlert aria-hidden="true" />
    <h1>{t("states.deniedTitle")}</h1>
    <p>{children ?? t("states.deniedDefault")}</p>
  </div>;
}

export function Skeleton({ className = "", style }: { className?: string; style?: CSSProperties }) {
  return <span className={`skeleton ${className}`} style={style} aria-hidden="true" />;
}
