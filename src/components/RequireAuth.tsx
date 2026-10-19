import React, { useEffect } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { toast } from "react-toastify";
import i18n from "../i18n";

export const RequireAuth: React.FC<React.PropsWithChildren> = ({
  children,
}) => {
  const { token, loading } = useAuth();
  const location = useLocation();

  // If not logged in, show toast once
  useEffect(() => {
    if (!loading && !token) {
      toast.error(i18n.t("states.mustLogin"));
    }
  }, [loading, token]);

  if (loading) return null; // or a spinner
  if (!token)
    return <Navigate to="/login" replace state={{ from: location }} />;
  return <>{children}</>;
};
