import { apiFetch } from "@/shared/lib/api";
import { Application } from "../types";
import { getToken } from "@/shared/lib/auth";

export async function fetchMyApplications() {
  return apiFetch<Application[]>("/applications/me", {
    method: "GET",
    token: getToken() ?? undefined,
  });
}
