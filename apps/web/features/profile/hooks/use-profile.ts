import { toast } from "sonner";
import { getUser } from "@/shared/lib/auth";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getProfile, updateProfile } from "../actions/profile.actions";
import { UpdateProfileData } from "../types";

export function useProfile() {
  const user = getUser();
  const queryClient = useQueryClient();

  const { data: profile = null, isLoading } = useQuery({
    queryKey: ["profile", user?.sub],
    queryFn: () => getProfile(user!.sub),
    enabled: user !== null,
    staleTime: 3 * 60 * 1000,
  });

  const { mutate: updateProf, isPending } = useMutation({
    mutationFn: ({
      userId,
      data,
    }: {
      userId: number;
      data: UpdateProfileData;
    }) => updateProfile(userId, data),
    onSuccess: (updatedProfile) => {
      queryClient.setQueryData(["profile", user?.sub], updatedProfile);
      toast.success("Le profil a été mis à jour");
    },
    onError: () => toast.error("Le profil ne peut pas être mis à jour"),
  });

  const loading = isLoading;
  const saving = isPending;

  function handleUpdate(data: UpdateProfileData) {
    updateProf({ userId: user!.sub, data: data });
  }

  return { profile, loading, saving, handleUpdate };
}
