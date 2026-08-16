import { apiFetch } from "@/shared/lib/api";
import { setToken } from "@/shared/lib/auth";
import { AuthResponse } from "@spektr/shared";
import { LoginFormData } from "../types";

/**
 * Logs in with email/password via `POST /auth/login` and stores the returned
 * access token in the in-memory token store. The refresh token is set as an
 * httpOnly cookie by the API.
 *
 * @param data - The login form credentials.
 */
export async function login(data: LoginFormData): Promise<void> {
  const { accessToken } = await apiFetch<AuthResponse>("/auth/login", {
    method: "POST",
    body: JSON.stringify(data),
    skipAuth: true,
  });

  setToken(accessToken);
}
