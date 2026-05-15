import { apiFetch } from "@/shared/lib/api";
import { getToken } from "@/shared/lib/auth";
import { User } from "@/shared/types";

export async function assignPromo(promoId: number, userId: number) {
  return apiFetch<User>(`/promos/${promoId}/assign`, {
    method: "PATCH",
    body: JSON.stringify({ userId, promoId }),
    token: getToken() ?? undefined,
  });
}
