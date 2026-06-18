import { apiFetch } from "@/shared/lib/api";
import { getToken } from "@/shared/lib/auth";
import { Document, DocumentStatus, DocumentType } from "../types";

export async function reviewDocument(
  id: number,
  status: DocumentStatus,
  docType?: DocumentType,
) {
  return apiFetch<Document>(`/documents/${id}/review`, {
    method: "PATCH",
    token: getToken() ?? undefined,
    body: JSON.stringify({ status, ...(docType ? { docType } : {}) }),
  });
}
