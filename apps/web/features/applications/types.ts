export type Statut =
  | "A_CONTACTER"
  | "ENVOYE"
  | "RELANCE"
  | "EN_DISCUSSION"
  | "REPONSE_POSITIVE"
  | "REFUS";

export type Outcome = "RAPPEL" | "SANS_REPONSE" | "ENTRETIEN" | "DECROCHEE";

export type Application = {
  id: number;
  entreprise: string;
  lien: string | null;
  commentaire: string | null;
  statut: Statut;
  contact_nom: string | null;
  contact_email: string | null;
  contact_tel: string | null;
  outcome: Outcome | null;
  date_candidature: string | null;
  date_relance_tel: string | null;
  date_relance_contact: string | null;
  date_reponse_entreprise: string | null;
  created_at: string;
  modified_at: string;
};
