import { apiFetch } from "@/shared/lib/api";
import { getToken } from "@/shared/lib/auth";
import { PendingReview } from "../types";

export async function getPendingDocumentReviews() {
  return apiFetch<PendingReview[]>("/documents/admin/pending-reviews", {
    token: getToken() ?? undefined,
  });
}
