import React, { useEffect } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { toast } from "react-toastify";
import i18n from "../i18n";
import { LoadingState } from "./ui/States";

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

  // Nothing protected is shown until the server has confirmed the session.
  if (loading) return <LoadingState page />;
  if (!token)
    return <Navigate to="/login" replace state={{ from: location }} />;
  return <>{children}</>;
};
