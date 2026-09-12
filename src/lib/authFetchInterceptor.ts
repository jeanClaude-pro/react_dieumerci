/**
 * Centralizes 401 handling for authenticated API requests without requiring
 * every page (most of which call `fetch` directly with a manual
 * `Authorization` header — see ReceiptScannerPage, SortieHistory,
 * Reservation, etc.) to be rewritten to go through a shared request wrapper.
 *
 * Only requests to our own API that actually carried an Authorization header
 * are considered "authenticated requests". /auth/login and /auth/register
 * are excluded explicitly: login already returns 401 for wrong credentials,
 * and that must never be treated as a session expiration.
 *
 * Import this module once (see main.tsx) before the app renders.
 */
import { serverUrl } from "../utils/constants";
import { invalidateSession } from "./sessionManager";

const EXCLUDED_PATHS = ["/auth/login", "/auth/register"];

function resolveUrl(input: RequestInfo | URL): string {
  if (typeof input === "string") return input;
  if (input instanceof URL) return input.toString();
  return input.url;
}

function hasAuthorizationHeader(input: RequestInfo | URL, init?: RequestInit): boolean {
  if (init?.headers) {
    if (init.headers instanceof Headers) return init.headers.has("Authorization");
    if (Array.isArray(init.headers)) {
      return init.headers.some(([key]) => key.toLowerCase() === "authorization");
    }
    return Object.keys(init.headers).some((key) => key.toLowerCase() === "authorization");
  }
  if (input instanceof Request) return input.headers.has("Authorization");
  return false;
}

let installed = false;

export function installAuthFetchInterceptor(): void {
  if (installed) return;
  installed = true;

  const nativeFetch = window.fetch.bind(window);

  window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
    const response = await nativeFetch(input, init);

    if (response.status === 401) {
      const url = resolveUrl(input);
      const isExcluded = EXCLUDED_PATHS.some((path) => url.includes(path));
      const isOwnApi = url.startsWith(serverUrl);

      if (isOwnApi && !isExcluded && hasAuthorizationHeader(input, init)) {
        invalidateSession("unauthorized");
      }
    }

    return response;
  };
}

installAuthFetchInterceptor();
