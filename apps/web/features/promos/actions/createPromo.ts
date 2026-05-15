import { apiFetch } from "@/shared/lib/api";
import { getToken } from "@/shared/lib/auth";
import { Promo } from "../types";

type CreatePromoData = {
  name: string;
};

export async function createPromo(data: CreatePromoData) {
  return apiFetch<Promo>("/promos", {
    method: "POST",
    body: JSON.stringify(data),
    token: getToken() ?? undefined,
  });
}
