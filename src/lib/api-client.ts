/**
 * Backend base URL + fetch with automatic cookie refresh on 401.
 */
export const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000";

let refreshInFlight: Promise<boolean> | null = null;

async function tryRefreshSession(): Promise<boolean> {
  if (refreshInFlight) {
    return refreshInFlight;
  }
  refreshInFlight = (async () => {
    try {
      const res = await fetch(`${API_BASE}/api/auth/refresh`, {
        method: "POST",
        credentials: "include",
      });
      return res.ok;
    } catch {
      return false;
    } finally {
      refreshInFlight = null;
    }
  })();
  return refreshInFlight;
}

/**
 * Same as fetch to API_BASE, but retries once after POST /api/auth/refresh when the response is 401.
 */
export async function apiFetch(path: string, init?: RequestInit): Promise<Response> {
  const url = path.startsWith("http") ? path : `${API_BASE}${path.startsWith("/") ? path : `/${path}`}`;
  const doFetch = () =>
    fetch(url, {
      ...init,
      credentials: init?.credentials ?? "include",
    });

  let res = await doFetch();
  if (
    res.status === 401 &&
    !url.includes("/api/auth/login") &&
    !url.includes("/api/auth/refresh") &&
    !url.includes("/api/auth/logout")
  ) {
    const refreshed = await tryRefreshSession();
    if (refreshed) {
      res = await doFetch();
    }
  }
  return res;
}
