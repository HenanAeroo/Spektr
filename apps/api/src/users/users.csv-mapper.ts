/**
 * Outcome of a student CSV import: how many rows were created vs. skipped, plus
 * a per-row error list (with the offending email when known).
 */
export interface ImportStudentResult {
  imported: number;
  skipped: number;
  errors: Array<{ row: number; email?: string; message: string }>;
}

/** Normalized shape of a single student row after header mapping. */
export interface StudentCsvRow {
  email: string;
  first_name?: string;
  last_name?: string;
  promoName?: string;
}

export type StudentField = 'email' | 'first_name' | 'last_name' | 'promoName';

/** Hard cap on student CSV size to bound import cost. */
export const MAX_STUDENT_CSV_ROWS = 500;
/** Batch size for chunked student inserts. */
export const STUDENT_CSV_BATCH_SIZE = 100;

/**
 * Maps many localized/normalized header spellings to the canonical student
 * field, so imports tolerate French/English and varied column names.
 */
export const STUDENT_COLUMN_MAP: Record<string, StudentField> = {
  email: 'email',
  courriel: 'email',
  mail: 'email',
  mailynov: 'email',
  emailetudiant: 'email',
  emaileleve: 'email',
  prenom: 'first_name',
  firstname: 'first_name',
  first_name: 'first_name',
  givenname: 'first_name',
  prenometudiant: 'first_name',
  nom: 'last_name',
  lastname: 'last_name',
  last_name: 'last_name',
  familyname: 'last_name',
  nometudiant: 'last_name',
  surname: 'last_name',
  promo: 'promoName',
  promotion: 'promoName',
  classe: 'promoName',
  group: 'promoName',
  groupe: 'promoName',
  class: 'promoName',
  formation: 'promoName',
  programme: 'promoName',
};

/**
 * Normalizes a header (or promo name) for lookup: lowercased, accents stripped,
 * and all non-alphanumeric characters removed. Makes `"Prénom étudiant"` and
 * `"prenom_etudiant"` collapse to the same key.
 *
 * @param s - The raw string to normalize.
 * @returns The normalized, comparison-friendly key.
 */
export function normalizeStudentKey(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]/g, '');
}
