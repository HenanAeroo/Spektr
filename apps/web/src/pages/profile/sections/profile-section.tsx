import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useProfile } from "@/features/profile/hooks/use-profile";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { Button } from "@/shared/components/ui/button";
import { Separator } from "@/shared/components/ui/separator";

const schema = z.object({
  first_name: z.string().min(1, "Requis"),
  last_name: z.string().min(1, "Requis"),
});

type FormData = z.infer<typeof schema>;

export default function ProfileSection() {
  const { profile, loading, saving, handleUpdate } = useProfile();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  useEffect(() => {
    if (profile) {
      reset({
        first_name: profile.first_name ?? "",
        last_name: profile.last_name ?? "",
      });
    }
  }, [profile, reset]);

  if (loading) return <p className="text-sm text-muted-foreground">Chargement...</p>;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-lg font-semibold">Profil</h1>
        <p className="text-sm text-muted-foreground">
          Informations personnelles associées à votre compte.
        </p>
      </div>

      <Separator />

      <form onSubmit={handleSubmit(handleUpdate)} className="flex flex-col gap-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="first_name">Prénom</Label>
            <Input id="first_name" {...register("first_name")} />
            {errors.first_name && (
              <p className="text-xs text-destructive">{errors.first_name.message}</p>
            )}
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="last_name">Nom</Label>
            <Input id="last_name" {...register("last_name")} />
            {errors.last_name && (
              <p className="text-xs text-destructive">{errors.last_name.message}</p>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            value={profile?.email ?? ""}
            disabled
            className="opacity-60 cursor-not-allowed"
          />
          <p className="text-xs text-muted-foreground">
            L&apos;adresse email ne peut pas être modifiée.
          </p>
        </div>

        <div className="flex justify-end">
          <Button type="submit" disabled={saving}>
            {saving ? "Enregistrement..." : "Enregistrer"}
          </Button>
        </div>
      </form>
    </div>
  );
}
