import { apiFetch } from "@/shared/lib/api";
import { getToken } from "@/shared/lib/auth";
import { User } from "@/shared/types";

type PaginatedUsers = {
  data: User[];
  total: number;
  hasNextPage: boolean;
};

export async function fetchUsers(page: number, promoId?: number) {
  return apiFetch<PaginatedUsers>(
    `/users?page=${page}&limit=9${promoId ? `&promoId=${promoId}` : ""}`,
    {
      method: "GET",
      token: getToken() ?? undefined,
    },
  );
}
