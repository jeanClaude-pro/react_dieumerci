import React from "react";
import { useAuth } from "../hooks/useAuth";
import type { Role } from "../types/auth";
import { PermissionDenied } from "./ui/States";

export const RequireRole: React.FC<
  React.PropsWithChildren<{ roles: Role[] }>
> = ({ roles, children }) => {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user || !roles.includes(user.role))
    return <div className="page"><PermissionDenied>Vous n'êtes pas autorisé à accéder à cette page.</PermissionDenied></div>;
  return <>{children}</>;
};
