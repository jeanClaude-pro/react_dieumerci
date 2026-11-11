/* eslint-disable @typescript-eslint/no-explicit-any */
import type { LoginPayload, LoginResponse, User } from "../types/auth";
import { serverUrl } from "../utils/constants";

export async function apiFetch<T>(path: string, options: RequestInit = {}) {
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;

  const res = await fetch(`${serverUrl}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    }
  });

  const data = (await res.json().catch(() => ({}))) as any;
  if (!res.ok) throw new Error(data?.message || `Request failed (${res.status})`);
  return data as T;
}

export function login(payload: LoginPayload) {
  return apiFetch<LoginResponse>("/auth/login", {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export type SessionCheck =
  | { status: "valid"; user: User }
  | { status: "invalid" }
  | { status: "unreachable" };

/**
 * Asks the server whether this token is still a valid, open session and who
 * it belongs to. "unreachable" means no answer (offline, server down) — it is
 * never treated as a valid session.
 */
export async function checkSession(token: string, signal?: AbortSignal): Promise<SessionCheck> {
  try {
    const res = await fetch(`${serverUrl}/auth/session`, {
      method: "GET",
      cache: "no-store",
      headers: { Accept: "application/json", Authorization: `Bearer ${token}` },
      signal,
    });
    if (res.status === 401 || res.status === 403) return { status: "invalid" };
    if (!res.ok) return { status: "unreachable" };
    const data = (await res.json().catch(() => null)) as { user?: User } | null;
    if (!data?.user?.id || !data.user.role) return { status: "unreachable" };
    return { status: "valid", user: data.user };
  } catch {
    return { status: "unreachable" };
  }
}

/** Ends this session on the server. Resolves even if the server cannot be reached. */
export async function logoutOnServer(token: string): Promise<void> {
  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), 5000);
  try {
    await fetch(`${serverUrl}/auth/logout`, {
      method: "POST",
      keepalive: true,
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      signal: controller.signal,
    });
  } catch {
    // Offline: the browser is still cleared; the token expires on its own.
  } finally {
    window.clearTimeout(timer);
  }
}
