import { apiFetch } from "@/shared/lib/api";
import { setToken, removeToken, getToken } from "@/shared/lib/auth";
import { AuthResponse } from "@/shared/types";
import { RegisterFormData, LoginFormData } from "../types";

export async function login(data: LoginFormData): Promise<void> {
  const { accessToken } = await apiFetch<AuthResponse>("/auth/login", {
    method: "POST",
    body: JSON.stringify(data),
  });

  setToken(accessToken);
}

export async function register(data: RegisterFormData): Promise<void> {
  const { accessToken } = await apiFetch<AuthResponse>("/auth/register", {
    method: "POST",
    body: JSON.stringify(data),
  });

  setToken(accessToken);
}

export async function logout(): Promise<void> {
  await apiFetch("/auth/logout", {
    method: "POST",
    token: getToken() ?? undefined,
  });

  removeToken();
}

export async function refresh() {
  const { accessToken } = await apiFetch<AuthResponse>("/auth/refresh", {
    method: "POST",
  });

  setToken(accessToken);
}

export function loginWithGoogle() {
  window.location.href = `${process.env.NEXT_PUBLIC_API_URL}/auth/google`;
}
