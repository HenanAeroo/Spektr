import { apiFetch } from "@/shared/lib/api";
import { setToken } from "@/shared/lib/auth";
import { AuthResponse } from "@/shared/types";
import { RegisterFormData } from "../types";

export async function register(data: RegisterFormData): Promise<void> {
  const { accessToken } = await apiFetch<AuthResponse>("/auth/register", {
    method: "POST",
    body: JSON.stringify(data),
  });

  setToken(accessToken);
}
