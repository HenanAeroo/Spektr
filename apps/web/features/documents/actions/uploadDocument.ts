import { apiFetch } from "@/shared/lib/api";
import { Document } from "../types";

export async function uploadDocument(file: File, folderId?: number) {
  const form = new FormData();
  form.append("file", file);
  if (folderId) form.append("folderId", String(folderId));

  return apiFetch<Document>("/documents/upload", {
    method: "POST",
    body: form,
  });
}
