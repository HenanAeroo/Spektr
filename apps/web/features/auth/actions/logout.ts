import { apiFetch } from "@/shared/lib/api";
import { removeToken, getToken } from "@/shared/lib/auth";

export async function logout(): Promise<void> {
  await apiFetch("/auth/logout", {
    method: "POST",
    token: getToken() ?? undefined,
  });

  removeToken();
}
