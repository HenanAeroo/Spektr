import { apiFetch } from "@/shared/lib/api";
import { getToken } from "@/shared/lib/auth";
import { Document, DocumentType } from "../types";

export async function uploadDocument(
  file: File,
  folderId?: number,
  docType?: DocumentType,
) {
  const form = new FormData();
  form.append("file", file);
  if (folderId) form.append("folderId", String(folderId));
  if (docType) form.append("docType", docType);

  return apiFetch<Document>("/documents/upload", {
    method: "POST",
    token: getToken() ?? undefined,
    body: form,
  });
}
