import { apiFetch } from "@/shared/lib/api";
import { useState } from "react";

const ForgotPasswordPage = () => {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      await apiFetch("/auth/forgot-password", {
        method: "POST",
        body: JSON.stringify({ email }),
        skipAuth: true,
      });
    } catch {
      // Intentionally silent — don't reveal whether email exists
    }
    setSubmitted(true);
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

        {submitted ? (
          <div className="text-center">
            <h2 className="font-montserrat font-extrabold text-[22px] text-spektr-dark mb-3">
              Email envoyé
            </h2>
            <p className="font-source-sans text-sm text-[#555] mb-6">
              Si cet email existe, un lien a été envoyé.
            </p>
            <a
              href="/login"
              className="font-source-sans text-sm text-spektr-teal font-bold"
            >
              Retour à la connexion
            </a>
          </div>
        ) : (
          <>
            <h2 className="font-montserrat font-extrabold text-[22px] text-spektr-dark mb-1.5">
              Mot de passe oublié
            </h2>
            <p className="font-source-sans text-sm text-spektr-teal mb-6">
              Entrez votre email pour recevoir un lien de réinitialisation.
            </p>

            <form onSubmit={handleSubmit} className="w-full">
              <div className="mb-5">
                <label
                  htmlFor="email"
                  className="font-montserrat font-semibold text-[13px] text-spektr-dark block mb-1.5"
                >
                  Adresse email
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="prenom.nom@ynov.com"
                  required
                  className="w-full px-3.5 py-[11px] rounded-lg border-[1.5px] border-spektr-border font-source-sans text-sm text-spektr-dark bg-white box-border transition-colors focus:outline-none focus:border-spektr-teal"
                />
              </div>

              <button
                type="submit"
                className="w-full py-[13px] rounded-lg border-none font-montserrat font-bold text-[15px] text-white bg-spektr-teal cursor-pointer mb-4 transition-colors"
              >
                Envoyer
              </button>
            </form>

            <p className="text-center font-source-sans text-sm text-[#888]">
              <a
                href="/login"
                className="text-spektr-teal font-bold"
              >
                Retour à la connexion
              </a>
            </p>
          </>
        )}
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
