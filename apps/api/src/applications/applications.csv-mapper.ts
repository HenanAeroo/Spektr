import { Outcome, Statut } from '../../prisma/generated/prisma/client';

export type ApplicationField =
  | 'entreprise'
  | 'lien'
  | 'commentaire'
  | 'statut'
  | 'contact_nom'
  | 'contact_email'
  | 'contact_tel'
  | 'date_candidature'
  | 'date_relance_contact'
  | 'date_relance_tel'
  | 'date_reponse_entreprise'
  | 'outcome';

export interface ImportResult {
  imported: number;
  skipped: number;
  errors: Array<{ row: number; message: string }>;
}

export type ApplicationCsvRow = {
  entreprise: string;
  lien?: string | null;
  commentaire?: string | null;
  statut?: Statut;
  contact_nom?: string | null;
  contact_email?: string | null;
  contact_tel?: string | null;
  date_candidature?: Date | null;
  date_relance_contact?: Date | null;
  date_relance_tel?: Date | null;
  date_reponse_entreprise?: Date | null;
  outcome?: Outcome | null;
  userId: number;
};

export const MAX_CSV_ROWS = 2000;
export const CSV_BATCH_SIZE = 500;

export const COLUMN_MAP: Record<string, ApplicationField> = {
  entreprise: 'entreprise',
  company: 'entreprise',
  societe: 'entreprise',
  compagnie: 'entreprise',
  nomentreprise: 'entreprise',
  firm: 'entreprise',
  lien: 'lien',
  url: 'lien',
  link: 'lien',
  offre: 'lien',
  liendoffre: 'lien',
  joburl: 'lien',
  commentaire: 'commentaire',
  comment: 'commentaire',
  notes: 'commentaire',
  note: 'commentaire',
  remarque: 'commentaire',
  observation: 'commentaire',
  statut: 'statut',
  status: 'statut',
  etat: 'statut',
  state: 'statut',
  contactnom: 'contact_nom',
  contact: 'contact_nom',
  nomcontact: 'contact_nom',
  interlocuteur: 'contact_nom',
  contactname: 'contact_nom',
  contactperson: 'contact_nom',
  contactemail: 'contact_email',
  email: 'contact_email',
  mail: 'contact_email',
  emailcontact: 'contact_email',
  contacttel: 'contact_tel',
  tel: 'contact_tel',
  telephone: 'contact_tel',
  phone: 'contact_tel',
  portable: 'contact_tel',
  datecandidature: 'date_candidature',
  date: 'date_candidature',
  dateenvoi: 'date_candidature',
  applied: 'date_candidature',
  datedepostulation: 'date_candidature',
  daterelancecontact: 'date_relance_contact',
  relancecontact: 'date_relance_contact',
  relance: 'date_relance_contact',
  followup: 'date_relance_contact',
  suivi: 'date_relance_contact',
  daterelancetel: 'date_relance_tel',
  relancetel: 'date_relance_tel',
  relancetelephone: 'date_relance_tel',
  followupphone: 'date_relance_tel',
  datereponseentreprise: 'date_reponse_entreprise',
  reponse: 'date_reponse_entreprise',
  response: 'date_reponse_entreprise',
  datereponse: 'date_reponse_entreprise',
  outcome: 'outcome',
  resultat: 'outcome',
  issue: 'outcome',
  result: 'outcome',
  conclusion: 'outcome',
};

const STATUT_MAP: Record<string, Statut> = {
  acontacter: Statut.A_CONTACTER,
  tocontact: Statut.A_CONTACTER,
  pending: Statut.A_CONTACTER,
  new: Statut.A_CONTACTER,
  envoye: Statut.ENVOYE,
  sent: Statut.ENVOYE,
  applied: Statut.ENVOYE,
  relance: Statut.RELANCE,
  followup: Statut.RELANCE,
  endiscussion: Statut.EN_DISCUSSION,
  discussion: Statut.EN_DISCUSSION,
  interview: Statut.EN_DISCUSSION,
  inprogress: Statut.EN_DISCUSSION,
  encours: Statut.EN_DISCUSSION,
  reponsepositive: Statut.REPONSE_POSITIVE,
  positive: Statut.REPONSE_POSITIVE,
  accepted: Statut.REPONSE_POSITIVE,
  refus: Statut.REFUS,
  refused: Statut.REFUS,
  rejected: Statut.REFUS,
};

const OUTCOME_MAP: Record<string, Outcome> = {
  rappel: Outcome.RAPPEL,
  callback: Outcome.RAPPEL,
  sansreponse: Outcome.SANS_REPONSE,
  noreply: Outcome.SANS_REPONSE,
  noanswer: Outcome.SANS_REPONSE,
  noresponse: Outcome.SANS_REPONSE,
  entretien: Outcome.ENTRETIEN,
  interview: Outcome.ENTRETIEN,
  decrochee: Outcome.DECROCHEE,
  gotit: Outcome.DECROCHEE,
  landed: Outcome.DECROCHEE,
};

export function normalizeKey(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]/g, '');
}

/**
 * Strict date parser: tries explicit formats before falling back to nothing.
 * Avoids new Date("2") → Jan 2001 false positives.
 */
export function parseDate(value: string): Date | null {
  // ISO: YYYY-MM-DD or YYYY-MM-DDTHH:mm:ss...
  if (/^\d{4}-\d{2}-\d{2}/.test(value)) {
    const d = new Date(value);
    if (!isNaN(d.getTime())) return d;
  }

  // DD/MM/YYYY or DD-MM-YYYY or DD.MM.YYYY
  const dmy = value.match(/^(\d{1,2})[/\-.](\d{1,2})[/\-.](\d{4})$/);
  if (dmy) {
    const date = new Date(Number(dmy[3]), Number(dmy[2]) - 1, Number(dmy[1]));
    if (!isNaN(date.getTime())) return date;
  }

  return null;
}

export function mapStatut(value: string): Statut | undefined {
  return STATUT_MAP[normalizeKey(value)];
}

export function mapOutcome(value: string): Outcome | undefined {
  return OUTCOME_MAP[normalizeKey(value)];
}

/** Neutralizes CSV formula injection (= + - @ leading chars). */
export function sanitizeCsvCell(value: string): string {
  return /^[=+\-@\t\r]/.test(value) ? `'${value}` : value;
}
