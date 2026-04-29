import { apiFetch } from "@/shared/lib/api";
import { Application, Outcome, Statut } from "../types";
import { getToken } from "@/shared/lib/auth";

type UpdateApplicationData = {
  lien?: string;
  commentaire?: string;
  statut?: Statut;
  contact_nom?: string;
  contact_email?: string;
  contact_tel?: string;
  date_candidature?: string;
  date_relance?: string;
  outcome?: Outcome;
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
