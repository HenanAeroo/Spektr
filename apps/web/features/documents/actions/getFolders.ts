import { apiFetch } from "@/shared/lib/api";
import { getToken } from "@/shared/lib/auth";
import { Folder } from "../types";

export async function getFolders() {
  return apiFetch<Folder[]>("/folders", {
    method: "GET",
    token: getToken() ?? undefined,
  });
}
