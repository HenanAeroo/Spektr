import { apiFetch } from "@/shared/lib/api";
import { getToken } from "@/shared/lib/auth";
import { Folder } from "../types";

export async function createFolder(name: string) {
  return apiFetch<Folder>("/folders", {
    method: "POST",
    token: getToken() ?? undefined,
    body: JSON.stringify({ name }),
  });
}
