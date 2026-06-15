import { apiFetch } from "@/shared/lib/api";
import { getToken } from "@/shared/lib/auth";

export type ImportResult = {
  imported: number;
  skipped: number;
  errors: Array<{ row: number; message: string }>;
};

export async function importCsv(file: File): Promise<ImportResult> {
  const form = new FormData();
  form.append("file", file);

  return apiFetch<ImportResult>("/applications/import", {
    method: "POST",
    token: getToken() ?? undefined,
    body: form,
  });
}
