"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { getUser } from "@/shared/lib/auth";
import { getProfile, updateProfile } from "../actions/profile.actions";
import { ProfileUser, UpdateProfileData } from "../types";

export function useProfile() {
  const user = getUser();
  const [profile, setProfile] = useState<ProfileUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) return;
    getProfile(user.sub)
      .then(setProfile)
      .catch(() => toast.error("Impossible de charger le profil"))
      .finally(() => setLoading(false));
  }, [user?.sub]);

  async function handleUpdate(data: UpdateProfileData) {
    if (!user) return;
    setSaving(true);
    try {
      const updated = await updateProfile(user.sub, data);
      setProfile(updated);
      toast.success("Profil mis à jour");
    } catch {
      toast.error("Erreur lors de la mise à jour");
    } finally {
      setSaving(false);
    }
  }

  return { profile, loading, saving, handleUpdate };
}
