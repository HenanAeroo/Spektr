import { apiFetch } from "@/shared/lib/api";
import { getToken } from "@/shared/lib/auth";
import { ObjectiveWithCompletions } from "../types";

export async function fetchAllCompletions() {
  return apiFetch<ObjectiveWithCompletions[]>("/objectives/completions", {
    method: "GET",
    token: getToken() ?? undefined,
  });
}
