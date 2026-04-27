import { apiFetch } from "@/shared/lib/api";
import { Document } from "../types";

export async function getDocuments() {
  return apiFetch<Document[]>("/documents", {
    method: "GET",
  });
}
