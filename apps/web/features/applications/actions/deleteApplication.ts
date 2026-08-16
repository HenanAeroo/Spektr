import { apiFetch } from "@/shared/lib/api";
import { Application } from "../types";
import { getToken } from "@/shared/lib/auth";

/**
 * Deletes an application via `DELETE /applications/:id`.
 *
 * @param id - Id of the application to delete.
 * @returns The deleted {@link Application}.
 */
export async function deleteApplication(id: number) {
  return apiFetch<Application>(`/applications/${id}`, {
    method: "DELETE",
    token: getToken() ?? undefined,
  });
}
