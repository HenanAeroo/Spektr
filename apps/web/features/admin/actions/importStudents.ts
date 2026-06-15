import { apiFetch } from "@/shared/lib/api";
import { getToken } from "@/shared/lib/auth";

export type ImportStudentResult = {
  imported: number;
  skipped: number;
  errors: Array<{ row: number; email?: string; message: string }>;
};

export async function importStudents(
  file: File,
): Promise<ImportStudentResult> {
  const form = new FormData();
  form.append("file", file);

  return apiFetch<ImportStudentResult>("/users/import", {
    method: "POST",
    token: getToken() ?? undefined,
    body: form,
  });
}
