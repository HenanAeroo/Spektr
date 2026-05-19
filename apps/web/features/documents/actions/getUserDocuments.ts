import { apiFetch } from "@/shared/lib/api";
import { Document } from "../types";
import { getToken } from "@/shared/lib/auth";

export async function getUserDocuments(userId: number) {
  return apiFetch<Document[]>(`/documents/user/${userId}`, {
    method: "GET",
    token: getToken() ?? undefined,
  });
}
