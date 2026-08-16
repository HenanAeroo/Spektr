import { apiFetch } from "@/shared/lib/api";
import { RegisterFormData } from "../types";

/**
 * Registers a new local account via `POST /auth/register`. On success the API
 * emails a verification link; no token is issued until the email is confirmed.
 *
 * @param data - The registration form data.
 */
export async function register(data: RegisterFormData): Promise<void> {
  await apiFetch("/auth/register", {
    method: "POST",
    body: JSON.stringify(data),
    skipAuth: true,
  });
}
