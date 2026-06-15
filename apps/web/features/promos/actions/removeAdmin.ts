import { apiFetch } from "@/shared/lib/api";
import { getToken } from "@/shared/lib/auth";

export async function removeAdmin(
  promoId: number,
  adminId: number,
): Promise<void> {
  return apiFetch<void>(`/promos/${promoId}/admins/${adminId}`, {
    method: "DELETE",
    token: getToken() ?? undefined,
  });
}
