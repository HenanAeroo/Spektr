import { apiFetch } from "@/shared/lib/api";
import { getToken } from "@/shared/lib/auth";
import { User } from "@spektr/shared";

export async function fetchUser(id: number) {
  return apiFetch<User>(`/users/${id}`, {
    method: "GET",
    token: getToken() ?? undefined,
  });
}
