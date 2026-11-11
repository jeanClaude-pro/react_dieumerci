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
  setVerifiedUser,
} from "../lib/sessionManager";
import { checkSession, logoutOnServer } from "../services/authService";
import i18n from "../i18n";

// setTimeout's delay is a 32-bit signed int; clamp defensively so a
// misconfigured/longer-lived token can never overflow into an immediate fire.
const MAX_TIMEOUT_MS = 2 ** 31 - 1;
// How often an open app re-asks the server (role change, deactivation,
// logout from elsewhere are picked up within this delay).
const RECHECK_INTERVAL_MS = 5 * 60 * 1000;

/**
 * The session is decided by the server, never by the browser:
 * - on start, the stored token is sent to GET /auth/session and nothing is
 *   shown until the server answers; the user (role, pages, actions) comes
 *   from that answer, not from storage;
 * - the check is repeated every few minutes and whenever the app comes back
 *   to the foreground;
 * - logout is a POST /auth/logout that kills the token on the server.
 */
export const AuthProvider: React.FC<React.PropsWithChildren> = ({
  children,
}) => {
  const [state, setState] = React.useState<AuthState>({
    token: null,
    user: null,
    loading: true,
  });
  const [unreachable, setUnreachable] = React.useState(false);

  const expiryTimerRef = React.useRef<number | null>(null);
  const tokenRef = React.useRef<string | null>(null);

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

  const acceptVerified = React.useCallback(
    (token: string, user: User) => {
      tokenRef.current = token;
      setVerifiedUser(user);
      setUnreachable(false);
      setState({ token, user, loading: false });
      scheduleExpiryTimer(token);
    },
    [scheduleExpiryTimer]
  );

  /** Asks the server. `initial` = nothing is shown until it answers. */
  const verify = React.useCallback(
    async (token: string, initial: boolean) => {
      const result = await checkSession(token);
      if (tokenRef.current !== null && tokenRef.current !== token) return; // superseded
      if (result.status === "valid") return acceptVerified(token, result.user);
      if (result.status === "invalid") return invalidateSession("unauthorized");
      // No answer: on start we refuse to open the app; later we keep the
      // already-verified session and simply try again next time.
      if (initial) setUnreachable(true);
    },
    [acceptVerified]
  );

  const boot = React.useCallback(() => {
    // The user is never read from storage any more; drop what older
    // versions saved there.
    localStorage.removeItem(AUTH_USER_KEY);
    const token = localStorage.getItem(AUTH_TOKEN_KEY);

    if (!token) {
      setVerifiedUser(null);
      setState({ token: null, user: null, loading: false });
      return;
    }

    if (isTokenExpired(token)) {
      // Loading intentionally stays true — a full navigation to /login is
      // about to happen.
      invalidateSession("expired");
      return;
    }

    tokenRef.current = token;
    setUnreachable(false);
    setState({ token: null, user: null, loading: true });
    void verify(token, true);
  }, [verify]);

  React.useEffect(() => {
    boot();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Re-check periodically and when the app returns to the foreground.
  React.useEffect(() => {
    if (!state.token) return;
    const token = state.token;
    const recheck = () => {
      if (document.visibilityState === "visible") void verify(token, false);
    };
    const interval = window.setInterval(recheck, RECHECK_INTERVAL_MS);
    document.addEventListener("visibilitychange", recheck);
    window.addEventListener("focus", recheck);
    return () => {
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", recheck);
      window.removeEventListener("focus", recheck);
    };
  }, [state.token, verify]);

  // Cross-tab sync: if another tab logs out / gets invalidated, this tab's
  // auth state must drop too instead of continuing to look authenticated.
  React.useEffect(() => {
    const handleStorage = (event: StorageEvent) => {
      if (event.key !== AUTH_TOKEN_KEY && event.key !== null) return;
      if (event.key === AUTH_TOKEN_KEY && event.newValue) return; // token was set, not removed
      clearExpiryTimer();
      tokenRef.current = null;
      setVerifiedUser(null);
      setState({ token: null, user: null, loading: false });
    };

    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, [clearExpiryTimer]);

  React.useEffect(() => clearExpiryTimer, [clearExpiryTimer]);

  // Called by the login page with the server's own answer (token + user).
  const setAuth = React.useCallback(
    ({ token, user }: { token: string | null; user: User | null }) => {
      if (token && user) {
        localStorage.setItem(AUTH_TOKEN_KEY, token);
        acceptVerified(token, user);
        return;
      }
      clearExpiryTimer();
      tokenRef.current = null;
      clearAuthStorage();
      setState({ token: null, user: null, loading: false });
    },
    [acceptVerified, clearExpiryTimer]
  );

  const clearAuth = React.useCallback(() => {
    clearExpiryTimer();
    setUnreachable(false);
    tokenRef.current = null;
    clearAuthStorage();
    setState({ token: null, user: null, loading: false });
  }, [clearExpiryTimer]);

  const logout = React.useCallback(async () => {
    const token = tokenRef.current || localStorage.getItem(AUTH_TOKEN_KEY);
    if (token) await logoutOnServer(token);
    clearAuth();
    window.location.href = "/login";
  }, [clearAuth]);

  const value = { ...state, setAuth, clearAuth, logout };

  if (unreachable) {
    return (
      <div className="login-page" role="alert" style={{ alignItems: "center", justifyContent: "center", display: "flex", minHeight: "100vh", padding: "1.5rem" }}>
        <div className="login-card" style={{ maxWidth: 420, textAlign: "center" }}>
          <p className="text-sm text-gray-700 mb-4">{i18n.t("login.sessionCheckFailed")}</p>
          <div style={{ display: "flex", gap: "0.5rem", justifyContent: "center" }}>
            <button type="button" className="btn btn-primary" onClick={boot}>
              {i18n.t("login.sessionCheckRetry")}
            </button>
            <button type="button" className="btn btn-secondary" onClick={() => { clearAuth(); }}>
              {i18n.t("nav.logoutShort")}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthProvider;
