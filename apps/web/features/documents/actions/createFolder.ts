import { apiFetch } from "@/shared/lib/api";
import { Folder } from "../types";

export async function createFolder(name: string) {
  return apiFetch<Folder>("/folders", {
    method: "POST",
    body: JSON.stringify({ name }),
  });
}
