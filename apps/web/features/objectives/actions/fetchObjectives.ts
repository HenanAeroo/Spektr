import { apiFetch } from "@/shared/lib/api";
import { Objective } from "../types";
import { getToken } from "@/shared/lib/auth";

export async function fetchObjectives() {
  return apiFetch<Objective[]>("/objectives", {
    method: "GET",
    token: getToken() ?? undefined,
  });
}
