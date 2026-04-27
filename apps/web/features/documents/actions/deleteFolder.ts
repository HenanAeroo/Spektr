import { apiFetch } from "@/shared/lib/api";

export async function deleteFolder(id: number) {
  return apiFetch(`/folders/${id}`, {
    method: "DELETE",
  });
}
