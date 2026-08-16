import { apiFetch } from "@/shared/lib/api";
import { getToken } from "@/shared/lib/auth";

export type ImportResult = {
  imported: number;
  skipped: number;
  errors: Array<{ row: number; message: string }>;
};

/**
 * Uploads a CSV of applications for bulk import via `POST /applications/import`.
 *
 * @param file - The CSV file selected by the user.
 * @returns The import summary: imported/skipped counts and per-row errors.
 */
export async function importCsv(file: File): Promise<ImportResult> {
  const form = new FormData();
  form.append("file", file);

  return apiFetch<ImportResult>("/applications/import", {
    method: "POST",
    token: getToken() ?? undefined,
    body: form,
  });
}
