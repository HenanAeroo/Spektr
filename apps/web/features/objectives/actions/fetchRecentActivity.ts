import { apiFetch } from "@/shared/lib/api";
import { getToken } from "@/shared/lib/auth";

export type RecentActivity = {
  id: number;
  done: boolean;
  modified_at: string;
  user: {
    id: number;
    first_name: string | null;
    last_name: string | null;
    email: string;
    promoId: number | null;
  };
  objective: {
    id: number;
    title: string;
  };
};

export async function fetchRecentActivity() {
  return apiFetch<RecentActivity[]>("/objectives/recent-activity", {
    method: "GET",
    token: getToken() ?? undefined,
  });
}
