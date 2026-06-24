import { apiFetch } from "@/shared/lib/api";
import { useSearch } from "@tanstack/react-router";
import { useState } from "react";
import {
  isStrongPassword,
  PASSWORD_POLICY_MESSAGE,
} from "@/shared/lib/password";

const ResetPasswordPage = () => {
  const token = (useSearch({ strict: false }) as { token?: string }).token ?? "";
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (password !== confirm) {
      setError("Les mots de passe ne correspondent pas");
      return;
    }
    if (!isStrongPassword(password)) {
      setError(PASSWORD_POLICY_MESSAGE);
      return;
    }

    try {
      await apiFetch("/auth/reset-password", {
        method: "POST",
        body: JSON.stringify({ token, password }),
        skipAuth: true,
      });
      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Une erreur est survenue");
    }
  }

  return (
    <div className="min-h-screen bg-spektr-bg flex items-center justify-center p-6">
      <div className="bg-white rounded-2xl shadow-[0_8px_40px_rgba(0,0,0,0.10)] py-10 px-9 w-full max-w-[400px]">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="font-montserrat font-extrabold text-[32px] text-spektr-dark tracking-[-1px]">
            Spek<span className="text-spektr-teal">tr</span>
          </div>
          <div className="font-montserrat font-semibold text-[9px] text-[#999] tracking-[3px] uppercase mt-1">
            YNOV CAMPUS RENNES
          </div>
        </div>

        {success ? (
          <div className="text-center">
            <h2 className="font-montserrat font-extrabold text-[22px] text-spektr-dark mb-3">
              Mot de passe réinitialisé
            </h2>
            <p className="font-source-sans text-sm text-[#555] mb-6">
              Votre mot de passe a bien été modifié.
            </p>
            <a
              href="/login"
              className="font-source-sans text-sm text-spektr-teal font-bold"
            >
              Se connecter
            </a>
          </div>
        ) : (
          <>
            <h2 className="font-montserrat font-extrabold text-[22px] text-spektr-dark mb-1.5">
              Nouveau mot de passe
            </h2>
            <p className="font-source-sans text-sm text-spektr-teal mb-6">
              Choisissez un nouveau mot de passe.
            </p>

            <form onSubmit={handleSubmit} className="w-full">
              <div className="mb-3.5">
                <label
                  htmlFor="password"
                  className="font-montserrat font-semibold text-[13px] text-spektr-dark block mb-1.5"
                >
                  Nouveau mot de passe
                </label>
                <input
                  id="password"
                  type="password"
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="12 caractères minimum"
                  required
                  className="w-full px-3.5 py-[11px] rounded-lg border-[1.5px] border-spektr-border font-source-sans text-sm text-spektr-dark bg-white box-border transition-colors focus:outline-none focus:border-spektr-teal"
                />
              </div>

              <div className="mb-5">
                <label
                  htmlFor="confirm"
                  className="font-montserrat font-semibold text-[13px] text-spektr-dark block mb-1.5"
                >
                  Confirmer le mot de passe
                </label>
                <input
                  id="confirm"
                  type="password"
                  autoComplete="new-password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full px-3.5 py-[11px] rounded-lg border-[1.5px] border-spektr-border font-source-sans text-sm text-spektr-dark bg-white box-border transition-colors focus:outline-none focus:border-spektr-teal"
                />
              </div>

              {error && (
                <div className="bg-[#fee2e2] text-[#dc2626] rounded-lg px-3.5 py-2.5 text-[13px] mb-4">
                  {error}
                </div>
              )}

              <button
                type="submit"
                className="w-full py-[13px] rounded-lg border-none font-montserrat font-bold text-[15px] text-white bg-spektr-teal cursor-pointer transition-colors"
              >
                Réinitialiser
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
};

export default ResetPasswordPage;
