"use client";

import { Separator } from "@/shared/components/ui/separator";

export default function SecuritySection() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-lg font-semibold">Sécurité</h1>
        <p className="text-sm text-muted-foreground">
          Gérez la sécurité de votre compte.
        </p>
      </div>

      <Separator />

      <p className="text-sm text-muted-foreground">
        Fonctionnalités à venir — changement de mot de passe, sessions actives.
      </p>
    </div>
  );
}
