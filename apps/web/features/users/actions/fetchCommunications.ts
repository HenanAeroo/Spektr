import { apiFetch } from "@/shared/lib/api";
import { getToken } from "@/shared/lib/auth";
import { Communications } from "@spektr/shared";

export async function fetchCommunications(id: number) {
  return apiFetch<Communications[]>(`/communications?userId=${id}`, {
    method: "GET",
    token: getToken() ?? undefined,
  });
}
