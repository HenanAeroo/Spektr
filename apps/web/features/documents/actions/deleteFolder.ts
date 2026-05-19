import { apiFetch } from "@/shared/lib/api";
import { getToken } from "@/shared/lib/auth";

export async function deleteFolder(id: number) {
  return apiFetch(`/folders/${id}`, {
    method: "DELETE",
    token: getToken() ?? undefined,
  });
}
