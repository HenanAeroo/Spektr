import { apiFetch } from "@/shared/lib/api";
import { setToken } from "@/shared/lib/auth";
import { AuthResponse } from "@/shared/types";
import { LoginFormData } from "../types";

export async function login(data: LoginFormData): Promise<void> {
  const { accessToken } = await apiFetch<AuthResponse>("/auth/login", {
    method: "POST",
    body: JSON.stringify(data),
    skipAuth: true,
  });

  setToken(accessToken);
}
