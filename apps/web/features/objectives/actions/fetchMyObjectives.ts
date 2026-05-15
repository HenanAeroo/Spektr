import { apiFetch } from "@/shared/lib/api";
import { Objective } from "../types";
import { getToken } from "@/shared/lib/auth";

export async function fetchMyObjectives() {
  return apiFetch<Objective[]>("/objectives/my", {
    method: "GET",
    token: getToken() ?? undefined,
  });
}
