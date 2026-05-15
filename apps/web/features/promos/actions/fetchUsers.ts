import { apiFetch } from "@/shared/lib/api";
import { getToken } from "@/shared/lib/auth";
import { User } from "@/shared/types";

export async function fetchUsers() {
  return apiFetch<User[]>("/users", {
    method: "GET",
    token: getToken() ?? undefined,
  });
}
