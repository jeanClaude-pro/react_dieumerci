import React from "react";
import { useAuth } from "../hooks/useAuth";
import type { Role } from "../types/auth";
import { PermissionDenied } from "./ui/States";
import { useTranslation } from "react-i18next";

export const RequireRole: React.FC<
  React.PropsWithChildren<{ roles: Role[] }>
> = ({ roles, children }) => {
  const { user, loading } = useAuth();
  const { t } = useTranslation();
  if (loading) return null;
  if (!user || !roles.includes(user.role))
    return <div className="page"><PermissionDenied>{t("states.deniedPage")}</PermissionDenied></div>;
  return <>{children}</>;
};
