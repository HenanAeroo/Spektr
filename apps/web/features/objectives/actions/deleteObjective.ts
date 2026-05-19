import { apiFetch } from "@/shared/lib/api";
import { getToken } from "@/shared/lib/auth";

export async function deleteObjective(id: number): Promise<void> {
  return apiFetch<void>(`/objectives/${id}`, {
    method: "DELETE",
    token: getToken() ?? undefined,
  });
}
