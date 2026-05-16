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
  date_relance?: string | null;
  statut?: Statut;
  outcome?: Outcome | null;
};

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
