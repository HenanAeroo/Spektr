import { apiFetch } from "@/shared/lib/api";
import { Application, Outcome, Statut } from "../types";
import { getToken } from "@/shared/lib/auth";

export type UpdateApplicationData = {
  lien?: string | null;
  commentaire?: string | null;
  contact_nom?: string | null;
  contact_email?: string | null;
  contact_tel?: string | null;
  date_candidature?: string | null;
  date_relance_contact?: string | null;
  date_relance_tel?: string | null;
  date_reponse_entreprise?: string | null;
  statut?: Statut;
  outcome?: Outcome | null;
};

/**
 * Updates an existing application via `PATCH /applications/:id`.
 *
 * @param id - Id of the application to update.
 * @param data - The partial fields to change (null clears a value).
 * @returns The updated {@link Application}.
 */
export async function updateApplication(
  id: number,
  data: UpdateApplicationData,
) {
  return apiFetch<Application>(`/applications/${id}`, {
    method: "PATCH",
    body: JSON.stringify(data),
    token: getToken() ?? undefined,
  });
}
