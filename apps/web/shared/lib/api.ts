import { getToken } from "./auth";

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3001";

type FetchOptions = RequestInit & {
  /**
   * Explicit bearer token override. Omit to let apiFetch attach the current
   * in-memory token itself (fe-02). Pass `null` to force no Authorization.
   */
  token?: string | null;
  /**
   * Auth endpoints (login/register/refresh/…) opt out of the automatic
   * token attach + 401→refresh→retry flow to avoid a refresh loop (fe-01).
   */
  skipAuth?: boolean;
};

async function parseBody<T>(res: Response): Promise<T> {
  // Guard against an empty body (204/205 or content-length 0) — calling
  // res.json() unconditionally throws on those (fe-01).
  if (res.status === 204 || res.status === 205) return undefined as T;
  if (res.headers?.get?.("content-length") === "0") return undefined as T;
  return res.json().catch(() => undefined as T);
}

export async function apiFetch<T>(
  path: string,
  options: FetchOptions = {},
): Promise<T> {
  const { token, skipAuth, ...rest } = options;
  const isFormData = options.body instanceof FormData;

  const resolveToken = (forceLatest: boolean): string | null | undefined => {
    // On a post-refresh retry, always use the freshest token, never the one
    // captured when the request was first built.
    if (forceLatest && !skipAuth) return getToken();
    if (token !== undefined) return token;
    if (skipAuth) return undefined;
    return getToken();
  };

  const doFetch = (forceLatest = false) => {
    const authToken = resolveToken(forceLatest);
    return fetch(`${API_URL}${path}`, {
      ...rest,
      credentials: "include",
      headers: {
        ...(isFormData ? {} : { "Content-Type": "application/json" }),
        ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
        ...rest.headers,
      },
    });
  };

  let res = await doFetch();

  // Token expired mid-session: silently refresh once and replay the request so
  // in-page actions don't fail (fe-01). The single-flight lives in refresh().
  if (res.status === 401 && !skipAuth) {
    try {
      const { refresh } = await import("@/features/auth/actions/refresh");
      await refresh();
      res = await doFetch(true);
    } catch {
      // Refresh failed — fall through to the standard error handling.
    }
  }

  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(error.message ?? "API error");
  }

  return parseBody<T>(res);
}
