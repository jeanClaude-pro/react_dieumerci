"use client";
import * as React from "react";
import type { AuthState, User } from "../types/auth";
import { AuthContext } from "./auth-context";
import {
  AUTH_TOKEN_KEY,
  AUTH_USER_KEY,
  clearAuthStorage,
  getTokenExpiry,
  invalidateSession,
  isTokenExpired,
} from "../lib/sessionManager";

// setTimeout's delay is a 32-bit signed int; clamp defensively so a
// misconfigured/longer-lived token can never overflow into an immediate fire.
const MAX_TIMEOUT_MS = 2 ** 31 - 1;

export const AuthProvider: React.FC<React.PropsWithChildren> = ({
  children,
}) => {
  const [state, setState] = React.useState<AuthState>({
    token: null,
    user: null,
    loading: true,
  });

  const expiryTimerRef = React.useRef<number | null>(null);

  const clearExpiryTimer = React.useCallback(() => {
    if (expiryTimerRef.current !== null) {
      window.clearTimeout(expiryTimerRef.current);
      expiryTimerRef.current = null;
    }
  }, []);

  const scheduleExpiryTimer = React.useCallback(
    (token: string) => {
      clearExpiryTimer();
      const exp = getTokenExpiry(token);
      if (!exp) return;

      const expiresIn = exp * 1000 - Date.now();
      if (expiresIn <= 0) {
        invalidateSession("expired");
        return;
      }

      expiryTimerRef.current = window.setTimeout(() => {
        invalidateSession("expired");
      }, Math.min(expiresIn, MAX_TIMEOUT_MS));
    },
    [clearExpiryTimer]
  );

  // Boot from localStorage
  React.useEffect(() => {
    const token = localStorage.getItem(AUTH_TOKEN_KEY);
    const userRaw = localStorage.getItem(AUTH_USER_KEY);

    if (!token) {
      setState({ token: null, user: null, loading: false });
      return;
    }

    if (isTokenExpired(token)) {
      // A previously-authenticated session is now stale: go through the
      // centralized invalidation flow (clears storage, redirects, shows the
      // session-expired message) instead of silently treating this as a
      // fresh logged-out state. Loading intentionally stays true — a full
      // navigation to /login is about to happen.
      invalidateSession("expired");
      return;
    }

    let user: User | null = null;
    try {
      user = userRaw ? JSON.parse(userRaw) : null;
    } catch {
      user = null;
    }

    setState({ token, user, loading: false });
    scheduleExpiryTimer(token);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Cross-tab sync: if another tab logs out / gets invalidated, this tab's
  // auth state must drop too instead of continuing to look authenticated.
  React.useEffect(() => {
    const handleStorage = (event: StorageEvent) => {
      if (event.key !== AUTH_TOKEN_KEY) return;
      if (event.newValue) return; // token was set, not removed — ignore
      clearExpiryTimer();
      setState({ token: null, user: null, loading: false });
    };

    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, [clearExpiryTimer]);

  React.useEffect(() => clearExpiryTimer, [clearExpiryTimer]);

  const setAuth = React.useCallback(
    ({ token, user }: { token: string | null; user: User | null }) => {
      if (token) localStorage.setItem(AUTH_TOKEN_KEY, token);
      else localStorage.removeItem(AUTH_TOKEN_KEY);

      if (user) localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));
      else localStorage.removeItem(AUTH_USER_KEY);

      setState((s) => ({ ...s, token, user, loading: false }));

      if (token) scheduleExpiryTimer(token);
      else clearExpiryTimer();
    },
    [clearExpiryTimer, scheduleExpiryTimer]
  );

  const clearAuth = React.useCallback(() => {
    clearExpiryTimer();
    clearAuthStorage();
    setState({ token: null, user: null, loading: false });
  }, [clearExpiryTimer]);

  const value = { ...state, setAuth, clearAuth };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthProvider;
