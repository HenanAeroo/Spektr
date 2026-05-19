import { apiFetch } from "@/shared/lib/api";
import { getToken } from "@/shared/lib/auth";

export async function sendFeedback(userId: number, score: number, comment: string) {
  return apiFetch<{ sent: boolean }>(`/users/${userId}/feedback`, {
    method: "POST",
    token: getToken() ?? undefined,
    body: JSON.stringify({ score, comment }),
  });
}
