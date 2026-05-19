import { apiFetch } from "@/shared/lib/api";
import { getToken } from "@/shared/lib/auth";
import { Document } from "../types";

export async function getDocuments() {
  return apiFetch<Document[]>("/documents", {
    method: "GET",
    token: getToken() ?? undefined,
  });
}
