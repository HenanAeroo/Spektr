import { apiFetch } from "@/shared/lib/api";
import { getToken } from "@/shared/lib/auth";

export async function toggleObjectiveCompletion(objectiveId: number) {
  return apiFetch<{ done: boolean }>(`/objectives/${objectiveId}/toggle`, {
    method: "POST",
    token: getToken() ?? undefined,
  });
}
