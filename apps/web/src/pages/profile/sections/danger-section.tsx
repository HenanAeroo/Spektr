import { useState } from "react";
import { toast } from "sonner";
import { Separator } from "@/shared/components/ui/separator";
import { Button } from "@/shared/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/shared/components/ui/dialog";
import { removeToken, getUser } from "@/shared/lib/auth";
import { useMutation } from "@tanstack/react-query";
import { deleteAccount } from "@/features/profile/actions/profile.actions";
import { useNavigate } from "@tanstack/react-router";

export default function DangerSection() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const user = getUser();

  const { mutate: deleteProfile, isPending } = useMutation({
    mutationFn: (userId: number) => deleteAccount(userId),
    onSuccess: () => {
      removeToken();
      navigate({ to: "/login" });
    },
    onError: () => toast.error("Erreur lors de la suppression du compte"),
  });

  async function handleDelete() {
    deleteProfile(user!.sub);
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-lg font-semibold text-destructive">Danger Zone</h1>
        <p className="text-sm text-muted-foreground">
          Actions irréversibles sur votre compte.
        </p>
      </div>

      <Separator />

      <div className="border border-destructive/40 rounded-lg p-4 flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-medium">Supprimer le compte</p>
          <p className="text-xs text-muted-foreground">
            Cette action est définitive. Toutes vos données seront supprimées.
          </p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button variant="destructive" size="sm">
              Supprimer
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Supprimer le compte</DialogTitle>
              <DialogDescription>
                Cette action est irréversible. Votre compte et toutes vos
                données seront définitivement supprimés.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)}>
                Annuler
              </Button>
              <Button
                variant="destructive"
                onClick={handleDelete}
                disabled={isPending}
              >
                {isPending ? "Suppression..." : "Confirmer la suppression"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
