import { apiFetch } from "@/shared/lib/api";
import { setToken } from "@/shared/lib/auth";
import { AuthResponse } from "@/shared/types";

let pendingRefresh: Promise<void> | null = null;

export async function refresh() {
  if (pendingRefresh) return pendingRefresh;

  pendingRefresh = apiFetch<AuthResponse>("/auth/refresh", {
    method: "POST",
  })
    .then(({ accessToken }) => setToken(accessToken))
    .finally(() => {
      pendingRefresh = null;
    });

  return pendingRefresh;
}
