export interface ImportStudentResult {
  imported: number;
  skipped: number;
  errors: Array<{ row: number; email?: string; message: string }>;
}

export interface StudentCsvRow {
  email: string;
  first_name?: string;
  last_name?: string;
  promoName?: string;
}

export type StudentField = 'email' | 'first_name' | 'last_name' | 'promoName';

export const MAX_STUDENT_CSV_ROWS = 500;
export const STUDENT_CSV_BATCH_SIZE = 100;

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

export function normalizeStudentKey(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]/g, '');
}
