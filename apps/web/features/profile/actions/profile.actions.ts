import { apiFetch } from "@/shared/lib/api";
import { getToken } from "@/shared/lib/auth";
import { ProfileUser, UpdateProfileData } from "../types";

export async function getProfile(userId: number): Promise<ProfileUser> {
  return apiFetch<ProfileUser>(`/users/${userId}`, {
    token: getToken() ?? undefined,
  });
}

export async function updateProfile(
  userId: number,
  data: UpdateProfileData,
): Promise<ProfileUser> {
  return apiFetch<ProfileUser>(`/users/${userId}`, {
    method: "PATCH",
    body: JSON.stringify(data),
    token: getToken() ?? undefined,
  });
}
