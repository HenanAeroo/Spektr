import { apiFetch } from "@/shared/lib/api";
import { getToken } from "@/shared/lib/auth";
import { Promo } from "../types";

export async function deletePromo(id: number) {
  return apiFetch<Promo>(`/promos/${id}`, {
    method: "DELETE",
    token: getToken() ?? undefined,
  });
}
