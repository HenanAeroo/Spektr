import { apiFetch } from "@/shared/lib/api";
import { Application } from "../types";
import { getToken } from "@/shared/lib/auth";

export async function deleteApplication(id: number) {
  return apiFetch<Application>(`/applications/${id}`, {
    method: "DELETE",
    token: getToken() ?? undefined,
  });
}
