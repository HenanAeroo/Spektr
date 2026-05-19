import { apiFetch } from "@/shared/lib/api";
import { getToken } from "@/shared/lib/auth";
import { Objective } from "../types";

export interface CreateObjectiveData {
  title: string;
  description?: string;
  deadline?: string;
  promoId: number;
}

export async function createObjective(data: CreateObjectiveData): Promise<Objective> {
  return apiFetch<Objective>("/objectives", {
    method: "POST",
    body: JSON.stringify(data),
    token: getToken() ?? undefined,
  });
}
