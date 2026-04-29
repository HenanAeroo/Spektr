import { apiFetch } from "@/shared/lib/api";
import { setToken } from "@/shared/lib/auth";
import { AuthResponse } from "@/shared/types";

export async function refresh() {
  const { accessToken } = await apiFetch<AuthResponse>("/auth/refresh", {
    method: "POST",
  });

  setToken(accessToken);
}
