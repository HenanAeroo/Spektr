import { apiFetch } from "@/shared/lib/api";
import { setToken } from "@/shared/lib/auth";
import { AuthResponse } from "@spektr/shared";

/** In-flight refresh promise, shared so concurrent callers dedupe to one call. */
let pendingRefresh: Promise<void> | null = null;

/**
 * Silently restores the access token by rotating the refresh cookie via
 * `POST /auth/refresh`. Concurrent invocations share the same in-flight request
 * (single-flight) to avoid racing the rotation and logging the user out.
 *
 * @returns A promise that resolves once the new token is stored.
 */
export async function refresh() {
  if (pendingRefresh) return pendingRefresh;

  pendingRefresh = apiFetch<AuthResponse>("/auth/refresh", {
    method: "POST",
    skipAuth: true,
  })
    .then(({ accessToken }) => setToken(accessToken))
    .finally(() => {
      pendingRefresh = null;
    });

  return pendingRefresh;
}
