import { apiFetch } from "@/shared/lib/api";
import { getToken } from "@/shared/lib/auth";

export async function deleteDocument(id: number) {
  return apiFetch(`/documents/${id}`, {
    method: "DELETE",
    token: getToken() ?? undefined,
  });
}
