import { apiFetch } from "@/shared/lib/api";
import { useQuery } from "@tanstack/react-query";
import { useSearch } from "@tanstack/react-router";
import { CheckCircle2, Loader2, XCircle } from "lucide-react";

const VerifyEmail = () => {
  const search = useSearch({ strict: false });
  const token = search.token;

  const result = useQuery({
    queryKey: ["verify-email", token],
    queryFn: () =>
      apiFetch("/auth/verify-email?token=" + token, { skipAuth: true }),
    enabled: !!token,
    retry: false,
  });

  if (result.isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (result.isSuccess) {
    return (
      <div className="flex flex-col items-center gap-4 text-center py-8">
        <CheckCircle2 className="h-10 w-10 text-green-500" />
        <h2 className="text-xl font-medium">Email confirmé</h2>
        <p className="text-muted-foreground text-sm">
          Votre adresse email a bien été vérifiée.
        </p>
        <a
          href="/login"
          className="text-sm text-muted-foreground underline underline-offset-4 hover:text-foreground transition-colors"
        >
          Se connecter
        </a>
      </div>
    );
  }

  if (result.isError) {
    return (
      <div className="flex flex-col items-center gap-4 text-center py-8">
        <XCircle className="h-10 w-10 text-destructive" />
        <h2 className="text-xl font-medium">Lien invalide ou expiré</h2>
        <p className="text-muted-foreground text-sm">
          Ce lien de vérification n'est plus valide.
        </p>
        <a
          href="/login"
          className="text-sm text-muted-foreground underline underline-offset-4 hover:text-foreground transition-colors"
        >
          Retour à la connexion
        </a>
      </div>
    );
  }
};

export default VerifyEmail;
