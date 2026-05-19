import { apiFetch } from "@/shared/lib/api";
import { getToken } from "@/shared/lib/auth";

export async function getDocumentUrl(id: number) {
  return apiFetch<{ url: string }>(`/documents/${id}/url`, {
    method: "GET",
    token: getToken() ?? undefined,
  });
}
