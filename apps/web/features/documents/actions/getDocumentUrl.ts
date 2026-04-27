import { apiFetch } from "@/shared/lib/api";

export async function getDocumentUrl(id: number) {
  return apiFetch<{ url: string }>(`/documents/${id}/url`, {
    method: "GET",
  });
}
