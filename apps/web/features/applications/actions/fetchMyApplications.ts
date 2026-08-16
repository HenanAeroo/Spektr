import { apiFetch } from "@/shared/lib/api";
import { Application } from "../types";
import { getToken } from "@/shared/lib/auth";

/**
 * Fetches the current user's own applications via `GET /applications/me`.
 *
 * @returns The authenticated user's applications.
 */
export async function fetchMyApplications() {
  return apiFetch<Application[]>("/applications/me", {
    method: "GET",
    token: getToken() ?? undefined,
  });
}
