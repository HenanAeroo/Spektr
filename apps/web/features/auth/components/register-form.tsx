import { useAuth } from "../hooks/use-auth";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/shared/components/ui/dialog";

const blockedMail = [
  "yopmail.com",
  "mailinator.com",
  "guerrillamail.com",
  "tempmail.com",
  "throwam.com",
  "sharklasers.com",
  "trashmail.com",
  "dispostable.com",
  "maildrop.cc",
];

const registerSchema = z.object({
  email: z
    .string()
    .regex(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/)
    .refine(
      (email) => {
        const domain = email.split("@")[1];
        const result = blockedMail.includes(domain);
        return !result;
      },
      { message: "Les adresses email temporaires ne sont pas acceptées" },
    ),
  password: z.string().min(8),
  first_name: z.string().min(1),
  last_name: z.string().min(1),
});

type RegisterSchema = z.infer<typeof registerSchema>;

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "11px 14px",
  borderRadius: 8,
  border: "1.5px solid #e8e8e8",
  fontFamily: "Source Sans 3, sans-serif",
  fontSize: 14,
  outline: "none",
  boxSizing: "border-box",
  color: "#1d1d1e",
  background: "#fff",
};

const labelStyle: React.CSSProperties = {
  fontFamily: "Montserrat, sans-serif",
  fontWeight: 600,
  fontSize: 12,
  color: "#1d1d1e",
  display: "block",
  marginBottom: 5,
};

const RegisterForm = () => {
  const [step, setStep] = useState(1);
  const [isOpen, setIsOpen] = useState(false);
  const [isAccepted, setIsAccepted] = useState(false);
  const [hasScrolled, setHasScrolled] = useState(false);

  const form = useForm<RegisterSchema>({
    resolver: zodResolver(registerSchema),
    defaultValues: { email: "", password: "", first_name: "", last_name: "" },
  });

  const { handleRegister, loginWithGoogle, isLoading, error } = useAuth();

  async function onSubmit(data: RegisterSchema) {
    await handleRegister(data);
  }

  const handleNext = async () => {
    if (step === 1) {
      const valid = await form.trigger(["first_name", "last_name", "email"]);
      if (valid) setStep(2);
    } else if (step === 2) {
      setStep(3);
    } else {
      form.handleSubmit(onSubmit)();
    }
  };

  function handleScroll(event: React.UIEvent<HTMLDivElement>) {
    const element = event.currentTarget;

    const scrolled = element.scrollTop;
    const visible = element.clientHeight;
    const total = element.scrollHeight;

    if (scrolled + visible >= total - 5) {
      setHasScrolled(true);
    }
  }

  return (
    <>
      <div style={{ width: "100%" }}>
        {/* Stepper */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            marginBottom: 28,
          }}
        >
          {[1, 2, 3].map((s, i) => (
            <div
              key={s}
              style={{ display: "flex", alignItems: "center", gap: 8 }}
            >
              <div
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: "50%",
                  background: step >= s ? "#23b2a4" : "#f0f0f0",
                  color: step >= s ? "#fff" : "#aaa",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontFamily: "Montserrat, sans-serif",
                  fontWeight: 700,
                  fontSize: 13,
                }}
              >
                {step > s ? "✓" : s}
              </div>
              {i < 2 && (
                <div
                  style={{
                    width: 40,
                    height: 2,
                    background: step > s ? "#23b2a4" : "#f0f0f0",
                  }}
                />
              )}
            </div>
          ))}
        </div>

        <h2
          style={{
            fontFamily: "Montserrat, sans-serif",
            fontWeight: 800,
            fontSize: 20,
            color: "#1d1d1e",
            marginBottom: 4,
          }}
        >
          {step === 1
            ? "Informations personnelles"
            : step === 2
              ? "Votre formation"
              : "Créer un mot de passe"}
        </h2>
        <p
          style={{
            fontFamily: "Source Sans 3, sans-serif",
            fontSize: 13,
            color: "#888",
            marginBottom: 22,
          }}
        >
          {step === 1
            ? "Étape 1 sur 3 — Vos coordonnées"
            : step === 2
              ? "Étape 2 sur 3 — Votre parcours à Ynov"
              : "Étape 3 sur 3 — Sécurisez votre compte"}
        </p>

        {step === 1 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 10,
              }}
            >
              <div>
                <label htmlFor="first_name" style={labelStyle}>
                  Prénom
                </label>
                <input
                  {...form.register("first_name")}
                  id="first_name"
                  placeholder="Sophie"
                  style={inputStyle}
                  onFocus={(e) => (e.target.style.borderColor = "#23b2a4")}
                  onBlur={(e) => (e.target.style.borderColor = "#e8e8e8")}
                />
              </div>
              <div>
                <label htmlFor="last_name" style={labelStyle}>
                  Nom
                </label>
                <input
                  {...form.register("last_name")}
                  id="last_name"
                  placeholder="Martin"
                  style={inputStyle}
                  onFocus={(e) => (e.target.style.borderColor = "#23b2a4")}
                  onBlur={(e) => (e.target.style.borderColor = "#e8e8e8")}
                />
              </div>
            </div>
            <div>
              <label htmlFor="email" style={labelStyle}>
                Adresse email Ynov
              </label>
              <input
                {...form.register("email")}
                id="email"
                type="email"
                placeholder="prenom.nom@ynov.com"
                style={inputStyle}
                onFocus={(e) => (e.target.style.borderColor = "#23b2a4")}
                onBlur={(e) => (e.target.style.borderColor = "#e8e8e8")}
              />
              {form.formState.errors.email?.message && (
                <p style={{ color: "#e05252", fontSize: 12, marginTop: 4 }}>
                  L'email est invalide
                </p>
              )}
            </div>
          </div>
        )}

        {step === 2 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div>
              <label htmlFor="password" style={labelStyle}>
                Mot de passe
              </label>
              <input
                {...form.register("password")}
                id="password"
                type="password"
                placeholder="8 caractères minimum"
                style={inputStyle}
                onFocus={(e) => (e.target.style.borderColor = "#23b2a4")}
                onBlur={(e) => (e.target.style.borderColor = "#e8e8e8")}
              />
              {form.formState.errors.password && (
                <p style={{ color: "#e05252", fontSize: 12, marginTop: 4 }}>
                  8 caractères minimum
                </p>
              )}
            </div>
            {error && (
              <div
                style={{
                  background: "#fee2e2",
                  color: "#dc2626",
                  borderRadius: 8,
                  padding: "10px 14px",
                  fontSize: 13,
                }}
              >
                {error}
              </div>
            )}
            <label
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                fontFamily: "Source Sans 3, sans-serif",
                fontSize: 13,
                color: "#555",
                cursor: "pointer",
              }}
            >
              <input
                type="checkbox"
                style={{ accentColor: "#23b2a4", width: 16, height: 16 }}
                checked={isAccepted}
                onChange={() => setIsAccepted(true)}
              />
              J'accepte les{" "}
              <button
                style={{ color: "#23b2a4", fontWeight: 600 }}
                type="button"
                onClick={() => setIsOpen(true)}
              >
                Conditions Générales d'Utilisation
              </button>
            </label>
          </div>
        )}

        <button
          type="button"
          onClick={handleNext}
          disabled={isLoading || (step == 2 && !isAccepted)}
          style={{
            width: "100%",
            padding: "13px",
            borderRadius: 8,
            border: "none",
            background: isLoading ? "#88d5cf" : "#23b2a4",
            color: "#fff",
            fontFamily: "Montserrat, sans-serif",
            fontWeight: 700,
            fontSize: 15,
            cursor: isLoading ? "not-allowed" : "pointer",
            marginTop: 20,
            marginBottom: step > 1 ? 10 : 0,
          }}
        >
          {isLoading
            ? "Création du compte…"
            : step < 3
              ? "Continuer →"
              : "Créer mon compte"}
        </button>

        {step > 1 && (
          <button
            type="button"
            onClick={() => setStep((s) => s - 1)}
            style={{
              width: "100%",
              padding: "10px",
              borderRadius: 8,
              border: "1.5px solid #e8e8e8",
              background: "#fff",
              fontFamily: "Montserrat, sans-serif",
              fontWeight: 600,
              fontSize: 14,
              cursor: "pointer",
              color: "#888",
            }}
          >
            ← Retour
          </button>
        )}
      </div>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="h-24">
          <DialogHeader>
            <DialogTitle>Conditions Générales d'Utilisation</DialogTitle>
          </DialogHeader>
          <div onScroll={handleScroll} className="h-75 overflow-y-auto">
            <p>
              1. Objet
              <br />
              Spektr est une plateforme mise à disposition des étudiants de Ynov
              Campus Rennes pour faciliter le suivi de leur recherche d'emploi
              (alternance, stage) en lien avec leur chargé de Relations
              Entreprises (RE).
              <br />
              <br />
              2. Données collectées
              <br />
              En créant un compte, vous acceptez que les données suivantes
              soient collectées et stockées : nom, prénom, adresse email,
              candidatures (entreprise, poste, statut, dates), documents
              déposés, et objectifs assignés par votre RE.
              <br />
              <br />
              3. Finalité
              <br />
              Ces données sont utilisées exclusivement dans le cadre du suivi
              pédagogique et professionnel assuré par l'équipe RE de Ynov Campus
              Rennes. Elles ne sont pas partagées avec des tiers, ni utilisées à
              des fins commerciales.
              <br />
              <br />
              4. Accès aux données
              <br />
              Votre chargé RE a accès à vos candidatures, documents et objectifs
              dans le cadre de son rôle d'accompagnement. Vous pouvez consulter
              et modifier vos données à tout moment depuis votre espace
              personnel.
              <br />
              <br />
              5. Suppression du compte
              <br />
              Vous pouvez demander la suppression de votre compte et de
              l'ensemble de vos données en contactant directement votre chargé
              RE. La suppression est effective sous 7 jours ouvrés.
              <br />
              <br />
              6. Sécurité
              <br />
              Votre mot de passe est chiffré et jamais stocké en clair. Les
              tokens d'authentification sont sécurisés et expirés
              automatiquement. Vous êtes responsable de la confidentialité de
              vos identifiants.
              <br />
              <br />
              7. Acceptation
              <br />
              En cochant la case d'acceptation, vous confirmez avoir lu et
              accepté les présentes CGU dans leur intégralité.
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              setIsAccepted(true);
              setIsOpen(false);
            }}
            disabled={!hasScrolled}
          >
            J'accepte
          </button>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default RegisterForm;
