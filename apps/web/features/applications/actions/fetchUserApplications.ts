import { apiFetch } from "@/shared/lib/api";
import { Application } from "../types";
import { getToken } from "@/shared/lib/auth";

export async function fetchUserApplications(userId: number) {
  return apiFetch<Application[]>(`/applications/user/${userId}`, {
    method: "GET",
    token: getToken() ?? undefined,
  });
}
