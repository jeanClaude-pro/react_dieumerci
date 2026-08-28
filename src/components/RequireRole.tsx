import React from "react";
import { useAuth } from "../hooks/useAuth";
import type { Role } from "../types/auth";

export const RequireRole: React.FC<
  React.PropsWithChildren<{ roles: Role[] }>
> = ({ roles, children }) => {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user || !roles.includes(user.role))
    return (
      <div className="p-8">
        <h1 className="text-2xl font-black text-red-700">ACCÈS REFUSÉ</h1>
        <p className="mt-2">Vous n'êtes pas autorisé à accéder à cette page.</p>
      </div>
    );
  return <>{children}</>;
};
