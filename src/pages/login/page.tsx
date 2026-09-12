/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React from "react";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { Eye, EyeOff, LockKeyhole } from "lucide-react";

import { useAuth } from "../../hooks/useAuth";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { login as loginApi } from "../../services/authService";

const SESSION_EXPIRED_TOAST_ID = "session-expired";

const LoginPage = () => {
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
      toast.error("Votre session a expiré. Veuillez vous reconnecter.", {
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
      toast.success("Connexion réussie !");
      navigate(getReturnTo(), { replace: true });
    } catch (err: any) {
      const msg = err?.message || "Email ou mot de passe incorrect";
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_24%_18%,rgba(37,99,235,0.22),transparent_30rem),linear-gradient(135deg,#020617_0%,#0f172a_45%,#111827_100%)]" />
      <div className="absolute inset-x-0 bottom-0 h-56 bg-gradient-to-t from-black/40 to-transparent" />
      <div className="w-full max-w-md relative z-10">
        {/* Logo / Brand */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-white rounded-2xl shadow-2xl shadow-black/30 mb-5 overflow-hidden ring-1 ring-white/20">
            <img src="/logo.jpeg" alt="ETS. DIEU MERCI" className="h-full w-full object-cover" />
          </div>
          <h1 className="text-3xl font-bold text-white tracking-wide">ETS. DIEU MERCI</h1>
          <p className="text-blue-300 text-sm mt-1">Dan Collection</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-xl shadow-2xl shadow-black/25 overflow-hidden border border-white/80">
          <div className="p-8">
            <div className="flex items-center gap-3 mb-2">
              <div className="h-9 w-9 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center">
                <LockKeyhole className="h-5 w-5" />
              </div>
              <h2 className="text-xl font-semibold text-gray-900">Connexion</h2>
            </div>
            <p className="text-gray-500 text-sm mb-6">
              Entrez vos identifiants pour accéder au système
            </p>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1.5">
                  Adresse email
                </label>
                <input
                  id="email"
                  type="email"
                  placeholder="ex: utilisateur@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition text-sm"
                  required
                  autoComplete="email"
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1.5">
                  Mot de passe
                </label>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Votre mot de passe"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-4 py-3 pr-11 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition text-sm"
                    required
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((s) => !s)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition disabled:opacity-50 disabled:cursor-not-allowed text-sm shadow-sm"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Connexion en cours...
                  </span>
                ) : (
                  "Se connecter"
                )}
              </button>
            </form>
          </div>

          <div className="bg-gray-50 px-8 py-4 border-t border-gray-100 text-center">
            <p className="text-xs text-gray-400">
              
            </p>
          </div>
        </div>
      </div>

      <ToastContainer
        position="top-right"
        autoClose={4000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        pauseOnHover
      />
    </div>
  );
};

export default LoginPage;
