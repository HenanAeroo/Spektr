import { apiFetch } from "@/shared/lib/api";
import { Application, Outcome, Statut } from "../types";
import { getToken } from "@/shared/lib/auth";

export type CreateApplicationData = {
  entreprise: string;
  lien?: string;
  commentaire?: string;
  statut?: Statut;
  contact_nom?: string;
  contact_email?: string;
  contact_tel?: string;
  date_candidature?: string;
  date_relance_contact?: string;
  date_relance_tel?: string;
  date_reponse_entreprise?: string;
  outcome?: Outcome;
};

export async function createApplication(data: CreateApplicationData) {
  return apiFetch<Application>("/applications", {
    method: "POST",
    body: JSON.stringify(data),
    token: getToken() ?? undefined,
  });
}
