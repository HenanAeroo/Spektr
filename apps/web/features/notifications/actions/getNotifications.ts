import { apiFetch } from "@/shared/lib/api";
import { Notification } from "../types";
import { getToken } from "@/shared/lib/auth";

export async function getNotifications() {
  return apiFetch<Notification[]>("/notifications", {
    method: "GET",
    token: getToken() ?? undefined,
  });
}
