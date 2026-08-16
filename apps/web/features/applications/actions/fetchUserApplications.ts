import { apiFetch } from "@/shared/lib/api";
import { Application } from "../types";
import { getToken } from "@/shared/lib/auth";

/**
 * Fetches a given student's applications (admin view) via
 * `GET /applications/user/:userId`.
 *
 * @param userId - Id of the student whose applications to load.
 * @returns The target user's applications.
 */
export async function fetchUserApplications(userId: number) {
  return apiFetch<Application[]>(`/applications/user/${userId}`, {
    method: "GET",
    token: getToken() ?? undefined,
  });
}
