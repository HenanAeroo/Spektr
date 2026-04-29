import { apiFetch } from "@/shared/lib/api";
import { Notification } from "../types";

export async function getNotifications() {
  return apiFetch<Notification[]>("/notifications", {
    method: "GET",
  });
}
