import { apiFetch } from "@/shared/lib/api";
import { getToken } from "@/shared/lib/auth";

export async function sendBulkEmail(
  userIds: number[],
  subject: string,
  body: string,
) {
  return apiFetch<{ sent: boolean }>("/users/bulk-email", {
    method: "POST",
    body: JSON.stringify({ userIds, subject, body }),
    token: getToken() ?? undefined,
  });
}
