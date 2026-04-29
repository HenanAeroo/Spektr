import { apiFetch } from "@/shared/lib/api";
import { Notification } from "../types";
import { getToken } from "@/shared/lib/auth";

export async function markAsRead(id: number) {
  return apiFetch<Notification>(`/notifications/${id}/read`, {
    method: "PATCH",
    token: getToken() ?? undefined,
  });
}
