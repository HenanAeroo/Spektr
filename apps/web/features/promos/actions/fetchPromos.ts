import { apiFetch } from "@/shared/lib/api";
import { Promo } from "../types";
import { getToken } from "@/shared/lib/auth";

export async function fetchPromos() {
  return apiFetch<Promo[]>("/promos", {
    method: "GET",
    token: getToken() ?? undefined,
  });
}
