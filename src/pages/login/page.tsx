import React from "react";
import { toast } from "react-toastify";
import { Eye, EyeOff, Loader2, LockKeyhole } from "lucide-react";

import { useAuth } from "../../hooks/useAuth";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { login as loginApi } from "../../services/authService";
import { useTranslation } from "react-i18next";
import LanguageToggle from "../../components/ui/LanguageToggle";
import { serverMessage } from "../../i18n/serverMessages";

const SESSION_EXPIRED_TOAST_ID = "session-expired";

const LoginPage = () => {
  const { t } = useTranslation();
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [showPassword, setShowPassword] = React.useState(false);
  const [error, setError] = React.useState("");
  const [loading, setLoading] = React.useState(false);

  const { setAuth } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();

  React.useEffect(() => {
    if (searchParams.get("reason") === "session-expired") {
      toast.error(t("login.sessionExpired"), {
        toastId: SESSION_EXPIRED_TOAST_ID,
      });
    }
    // Only ever read on the initial mount of this page.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Only ever navigate to an internal path — never let a returnTo value
  // escape to an external origin.
  const isSafeInternalPath = (path: string | null | undefined): path is string =>
    !!path && path.startsWith("/") && !path.startsWith("//");

  const getReturnTo = () => {
    const stateFrom = (location.state as { from?: { pathname?: string; search?: string } } | null)?.from;
    const fromState = stateFrom?.pathname ? `${stateFrom.pathname}${stateFrom.search || ""}` : null;
    if (isSafeInternalPath(fromState)) return fromState;
    const returnTo = searchParams.get("returnTo");
    if (isSafeInternalPath(returnTo)) return returnTo;
    return "/";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const { user, token } = await loginApi({ email, password });
      setAuth({ token, user });
      toast.success(t("login.success"));
      navigate(getReturnTo(), { replace: true });
    } catch (err: unknown) {
      const msg = serverMessage(err instanceof Error ? err.message : "", t("login.invalid"));
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <aside className="login-brand" aria-hidden="true">
        <div className="login-brand-mark">
          <img src="/logo.jpeg" alt="" />
        </div>
        <div>
          <p className="login-brand-name">ETS. DIEU MERCI</p>
          <p className="login-brand-tagline">{t("login.tagline")}</p>
        </div>
        <p className="login-brand-foot">Dan Collection · Lubumbashi</p>
      </aside>

      <div className="login-main">
        <LanguageToggle className="login-lang" />
        <div className="login-card">
          <div className="login-mobile-brand">
            <img src="/logo.jpeg" alt="" />
            <span>ETS. DIEU MERCI<small>{t("nav.tagline")}</small></span>
          </div>

          <div className="mb-6">
            <div className="eyebrow mb-2"><LockKeyhole aria-hidden="true" />{t("login.secure")}</div>
            <h1 className="text-2xl font-semibold text-gray-900 tracking-tight">{t("login.title")}</h1>
            <p className="text-sm text-gray-500 mt-1">
              {t("login.subtitle")}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="grid gap-4" noValidate={false}>
            <div className="field">
              <label htmlFor="email" className="field-label">
                {t("login.email")}
              </label>
              <input
                id="email"
                type="email"
                inputMode="email"
                placeholder={t("login.emailPlaceholder")}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input"
                required
                autoComplete="email"
                aria-invalid={error ? true : undefined}
                aria-describedby={error ? "login-error" : undefined}
              />
            </div>

            <div className="field">
              <label htmlFor="password" className="field-label">
                {t("login.password")}
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder={t("reports.gate.placeholder")}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input pr-12"
                  required
                  autoComplete="current-password"
                  aria-invalid={error ? true : undefined}
                  aria-describedby={error ? "login-error" : undefined}
                />
                <button
                  type="button"
                  aria-label={showPassword ? t("login.hidePassword") : t("login.showPassword")}
                  aria-pressed={showPassword}
                  onClick={() => setShowPassword((s) => !s)}
                  className="absolute right-1 top-1/2 -translate-y-1/2 btn btn-ghost btn-icon text-gray-500"
                >
                  {showPassword ? <EyeOff aria-hidden="true" /> : <Eye aria-hidden="true" />}
                </button>
              </div>
            </div>

            {error && (
              <div id="login-error" className="alert alert-danger" role="alert">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary btn-lg btn-block mt-1"
            >
              {loading ? (
                <>
                  <Loader2 className="animate-spin" aria-hidden="true" />
                  {t("login.signingIn")}
                </>
              ) : (
                t("login.submit")
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
