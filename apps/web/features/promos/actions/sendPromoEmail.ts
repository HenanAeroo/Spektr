import { apiFetch } from "@/shared/lib/api";

export async function sendPromoEmail(
  id: number,
  subject: string,
  body: string,
) {
  return apiFetch<void>(`/promos/${id}/email`, {
    method: "POST",
    body: JSON.stringify({ subject, body }),
  });
}
