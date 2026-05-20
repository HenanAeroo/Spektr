import { apiFetch } from "@/shared/lib/api";
import { RegisterFormData } from "../types";

export async function register(data: RegisterFormData): Promise<void> {
  await apiFetch("/auth/register", {
    method: "POST",
    body: JSON.stringify(data),
  });
}
