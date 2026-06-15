import { apiFetch } from "@/shared/lib/api";
import { getToken } from "@/shared/lib/auth";

export type AdminPromoRole = "OWNER" | "COLLABORATOR";

export type AdminPromoRelation = {
  adminId: number;
  promoId: number;
  role: AdminPromoRole;
};

export async function assignAdmin(
  promoId: number,
  adminId: number,
  role: AdminPromoRole = "OWNER",
): Promise<AdminPromoRelation> {
  return apiFetch<AdminPromoRelation>(`/promos/${promoId}/admins`, {
    method: "POST",
    token: getToken() ?? undefined,
    body: JSON.stringify({ adminId, role }),
  });
}
