import { apiFetch } from "@/shared/lib/api";

export async function deleteDocument(id: number) {
  return apiFetch(`/documents/${id}`, {
    method: "DELETE",
  });
}
