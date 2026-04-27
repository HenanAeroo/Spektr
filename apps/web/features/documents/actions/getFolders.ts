import { apiFetch } from "@/shared/lib/api";
import { Folder } from "../types";

export async function getFolders() {
  return apiFetch<Folder[]>("/folders", {
    method: "GET",
  });
}
