import { useAuth } from "../hooks/use-auth";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
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
        return !blockedMail.includes(domain);
      },
      { message: "Les adresses email temporaires ne sont pas acceptées" },
    ),
  password: z.string().min(8),
  first_name: z.string().min(1),
  last_name: z.string().min(1),
});

type RegisterSchema = z.infer<typeof registerSchema>;

const inputCls =
  "w-full px-3.5 py-[11px] rounded-lg border-[1.5px] border-spektr-border font-source-sans text-sm text-spektr-dark bg-white box-border focus:outline-none focus:border-spektr-teal";

const labelCls =
  "font-montserrat font-semibold text-xs text-spektr-dark block mb-[5px]";

const CGU_SECTIONS = [
  {
    title: "1. Objet",
    body: "Spektr est une plateforme mise à disposition des étudiants de Ynov Campus Rennes pour faciliter le suivi de leur recherche d'emploi (alternance, stage) en lien avec leur chargé de Relations Entreprises (RE).",
  },
  {
    title: "2. Données collectées",
    body: "En créant un compte, vous acceptez que les données suivantes soient collectées et stockées : nom, prénom, adresse email, candidatures (entreprise, poste, statut, dates), documents déposés, et objectifs assignés par votre RE.",
  },
  {
    title: "3. Finalité",
    body: "Ces données sont utilisées exclusivement dans le cadre du suivi pédagogique et professionnel assuré par l'équipe RE de Ynov Campus Rennes. Elles ne sont pas partagées avec des tiers, ni utilisées à des fins commerciales.",
  },
  {
    title: "4. Accès aux données",
    body: "Votre chargé RE a accès à vos candidatures, documents et objectifs dans le cadre de son rôle d'accompagnement. Vous pouvez consulter et modifier vos données à tout moment depuis votre espace personnel.",
  },
  {
    title: "5. Suppression du compte",
    body: "Vous pouvez demander la suppression de votre compte et de l'ensemble de vos données en contactant directement votre chargé RE. La suppression est effective sous 7 jours ouvrés.",
  },
  {
    title: "6. Sécurité",
    body: "Votre mot de passe est chiffré et jamais stocké en clair. Les tokens d'authentification sont sécurisés et expirés automatiquement. Vous êtes responsable de la confidentialité de vos identifiants.",
  },
  {
    title: "7. Acceptation",
    body: "En cochant la case d'acceptation, vous confirmez avoir lu et accepté les présentes CGU dans leur intégralité.",
  },
];

const RegisterForm = () => {
  const [step, setStep] = useState(1);
  const [isOpen, setIsOpen] = useState(false);
  const [isAccepted, setIsAccepted] = useState(false);
  const [hasScrolled, setHasScrolled] = useState(false);

  const form = useForm<RegisterSchema>({
    resolver: zodResolver(registerSchema),
    defaultValues: { email: "", password: "", first_name: "", last_name: "" },
  });

  const { handleRegister, isLoading, error } = useAuth();

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

  function handleScroll(e: React.UIEvent<HTMLDivElement>) {
    const el = e.currentTarget;
    if (el.scrollTop + el.clientHeight >= el.scrollHeight - 8) {
      setHasScrolled(true);
    }
  }

  function openDialog() {
    setHasScrolled(false);
    setIsOpen(true);
  }

  function handleCheckboxChange() {
    if (!isAccepted) {
      // Must read CGU before accepting
      openDialog();
    } else {
      setIsAccepted(false);
    }
  }

  function handleAccept() {
    setIsAccepted(true);
    setIsOpen(false);
  }

  return (
    <>
      <div className="w-full">
        {/* Stepper */}
        <div className="flex items-center justify-center gap-2 mb-7">
          {[1, 2, 3].map((s, i) => (
            <div key={s} className="flex items-center gap-2">
              <div
                className={[
                  "w-7 h-7 rounded-full flex items-center justify-center font-montserrat font-bold text-[13px]",
                  step >= s
                    ? "bg-spektr-teal text-white"
                    : "bg-[#f0f0f0] text-[#aaa]",
                ].join(" ")}
              >
                {step > s ? "✓" : s}
              </div>
              {i < 2 && (
                <div
                  className={[
                    "w-10 h-0.5",
                    step > s ? "bg-spektr-teal" : "bg-[#f0f0f0]",
                  ].join(" ")}
                />
              )}
            </div>
          ))}
        </div>

        <h2 className="font-montserrat font-extrabold text-xl text-spektr-dark mb-1">
          {step === 1
            ? "Informations personnelles"
            : step === 2
              ? "Votre formation"
              : "Créer un mot de passe"}
        </h2>
        <p className="font-source-sans text-[13px] text-[#888] mb-[22px]">
          {step === 1
            ? "Étape 1 sur 3 — Vos coordonnées"
            : step === 2
              ? "Étape 2 sur 3 — Votre parcours à Ynov"
              : "Étape 3 sur 3 — Sécurisez votre compte"}
        </p>

        {step === 1 && (
          <div className="flex flex-col gap-3">
            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label htmlFor="first_name" className={labelCls}>
                  Prénom
                </label>
                <input
                  {...form.register("first_name")}
                  id="first_name"
                  placeholder="Sophie"
                  className={inputCls}
                />
              </div>
              <div>
                <label htmlFor="last_name" className={labelCls}>
                  Nom
                </label>
                <input
                  {...form.register("last_name")}
                  id="last_name"
                  placeholder="Martin"
                  className={inputCls}
                />
              </div>
            </div>
            <div>
              <label htmlFor="email" className={labelCls}>
                Adresse email Ynov
              </label>
              <input
                {...form.register("email")}
                id="email"
                type="email"
                placeholder="prenom.nom@ynov.com"
                className={inputCls}
              />
              {form.formState.errors.email?.message && (
                <p className="text-spektr-red text-xs mt-1">
                  L'email est invalide
                </p>
              )}
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="flex flex-col gap-3">
            <div>
              <label htmlFor="password" className={labelCls}>
                Mot de passe
              </label>
              <input
                {...form.register("password")}
                id="password"
                type="password"
                placeholder="8 caractères minimum"
                className={inputCls}
              />
              {form.formState.errors.password && (
                <p className="text-spektr-red text-xs mt-1">
                  8 caractères minimum
                </p>
              )}
            </div>

            {error && (
              <div className="bg-[#fee2e2] text-[#dc2626] rounded-lg px-3.5 py-2.5 text-[13px]">
                {error}
              </div>
            )}

            {/* CGU checkbox row */}
            <div className="flex items-start gap-2.5 mt-1">
              <input
                type="checkbox"
                id="cgu-checkbox"
                checked={isAccepted}
                onChange={handleCheckboxChange}
                aria-describedby="cgu-label"
                className="mt-[2px] w-4 h-4 flex-shrink-0 accent-spektr-teal cursor-pointer"
              />
              <p
                id="cgu-label"
                className="font-source-sans text-[13px] text-[#555] leading-snug"
              >
                J'ai lu et j'accepte les{" "}
                <button
                  type="button"
                  onClick={openDialog}
                  className="text-spektr-teal font-semibold underline-offset-2 hover:underline focus:outline-none focus:underline"
                >
                  Conditions Générales d'Utilisation
                </button>
              </p>
            </div>
          </div>
        )}

        <button
          type="button"
          onClick={handleNext}
          disabled={isLoading || (step === 2 && !isAccepted)}
          className={[
            "w-full py-[13px] rounded-lg border-none font-montserrat font-bold text-[15px] text-white mt-5 transition-colors",
            step > 1 ? "mb-2.5" : "mb-0",
            isLoading || (step === 2 && !isAccepted)
              ? "bg-spektr-teal/50 cursor-not-allowed"
              : "bg-spektr-teal cursor-pointer",
          ].join(" ")}
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
            className="w-full py-2.5 rounded-lg border-[1.5px] border-spektr-border bg-white font-montserrat font-semibold text-sm cursor-pointer text-[#888]"
          >
            ← Retour
          </button>
        )}
      </div>

      {/* CGU Dialog */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-lg flex flex-col max-h-[85vh]">
          <DialogHeader>
            <DialogTitle>Conditions Générales d'Utilisation</DialogTitle>
            <DialogDescription>
              Lisez attentivement les CGU jusqu'à la fin pour pouvoir les
              accepter.
            </DialogDescription>
          </DialogHeader>

          {/* Scrollable CGU content */}
          <div
            onScroll={handleScroll}
            role="region"
            aria-label="Contenu des Conditions Générales d'Utilisation"
            className="flex-1 overflow-y-auto pr-1 min-h-0"
          >
            <article className="flex flex-col gap-4 pb-2">
              {CGU_SECTIONS.map((section) => (
                <section key={section.title}>
                  <h3 className="font-montserrat font-bold text-[13px] text-white mb-1">
                    {section.title}
                  </h3>
                  <p className="font-source-sans text-[13px] text-white leading-relaxed">
                    {section.body}
                  </p>
                </section>
              ))}
            </article>
          </div>

          {/* Scroll hint */}
          {!hasScrolled && (
            <p
              aria-live="polite"
              className="text-center font-source-sans text-[11px] text-gray-400 py-1"
            >
              Faites défiler jusqu'à la fin pour pouvoir accepter
            </p>
          )}

          <DialogFooter className="flex-col sm:flex-row gap-2 pt-2 border-t border-spektr-border">
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="flex-1 py-[10px] rounded-lg border-[1.5px] border-spektr-border bg-white font-montserrat font-semibold text-[13px] text-gray-500 cursor-pointer hover:bg-spektr-bg transition-colors"
            >
              Fermer
            </button>
            <button
              type="button"
              onClick={handleAccept}
              disabled={!hasScrolled}
              aria-disabled={!hasScrolled}
              className={[
                "flex-1 py-[10px] rounded-lg border-none font-montserrat font-bold text-[13px] text-white transition-colors",
                hasScrolled
                  ? "bg-spektr-teal cursor-pointer"
                  : "bg-spektr-teal/40 cursor-not-allowed",
              ].join(" ")}
            >
              J'accepte les CGU
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default RegisterForm;
