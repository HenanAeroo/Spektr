import { apiFetch } from "@/shared/lib/api";
import { getToken } from "@/shared/lib/auth";

export async function changePassword(
  oldPassword: string,
  newPassword: string,
): Promise<{ success: true }> {
  return apiFetch<{ success: true }>("/users/me/password", {
    method: "PATCH",
    body: JSON.stringify({ oldPassword, newPassword }),
    token: getToken() ?? undefined,
  });
}
