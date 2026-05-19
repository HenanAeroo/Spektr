export type NotifType = "DOCUMENT_ADDED" | "APPLICATION_STATUS" | "OBJECTIVE_CREATED";

export type Notification = {
  id: number;
  type: NotifType;
  payload: Record<string, unknown>;
  read: boolean;
  created_at: string;
};

export const NOTIF_LABELS: Record<NotifType, string> = {
  DOCUMENT_ADDED: "Nouveau document ajouté",
  APPLICATION_STATUS: "Statut de candidature mis à jour",
  OBJECTIVE_CREATED: "Nouvel objectif créé",
};
