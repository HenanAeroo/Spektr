import { apiFetch } from "@/shared/lib/api";
import { removeToken, getToken } from "@/shared/lib/auth";

/**
 * Logs out via `POST /auth/logout` (revoking refresh tokens server-side) and
 * clears the in-memory access token.
 */
export async function logout(): Promise<void> {
  await apiFetch("/auth/logout", {
    method: "POST",
    token: getToken() ?? undefined,
    skipAuth: true,
  });

  removeToken();
}
