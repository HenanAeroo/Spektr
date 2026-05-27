import { apiFetch } from "@/shared/lib/api";
import { getToken } from "@/shared/lib/auth";

export async function markAllRead() {
  return apiFetch<Notification>(`/notifications/mark-all-read`, {
    method: "PATCH",
    token: getToken() ?? undefined,
  });
}
