import { useAuth } from "../hooks/use-auth";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useState } from "react";

const registerSchema = z.object({
  email: z.string().regex(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/),
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

const FILIERES = [
  "B1 Informatique", "B2 Informatique", "B3 Informatique",
  "M1 Informatique", "M2 Informatique",
  "B3 Communication", "B3 Design",
];

const PROMOS = ["Promo 2024", "Promo 2025", "Promo 2026", "Promo 2027"];

const RegisterForm = () => {
  const [step, setStep] = useState(1);
  const [filiere, setFiliere] = useState("");
  const [promo, setPromo] = useState("");

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

  return (
    <div style={{ width: "100%" }}>
      {/* Stepper */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginBottom: 28 }}>
        {[1, 2, 3].map((s, i) => (
          <div key={s} style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{
              width: 28, height: 28, borderRadius: "50%",
              background: step >= s ? "#23b2a4" : "#f0f0f0",
              color: step >= s ? "#fff" : "#aaa",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontFamily: "Montserrat, sans-serif", fontWeight: 700, fontSize: 13,
            }}>
              {step > s ? "✓" : s}
            </div>
            {i < 2 && (
              <div style={{
                width: 40, height: 2,
                background: step > s ? "#23b2a4" : "#f0f0f0",
              }} />
            )}
          </div>
        ))}
      </div>

      <h2 style={{ fontFamily: "Montserrat, sans-serif", fontWeight: 800, fontSize: 20, color: "#1d1d1e", marginBottom: 4 }}>
        {step === 1 ? "Informations personnelles" : step === 2 ? "Votre formation" : "Créer un mot de passe"}
      </h2>
      <p style={{ fontFamily: "Source Sans 3, sans-serif", fontSize: 13, color: "#888", marginBottom: 22 }}>
        {step === 1 ? "Étape 1 sur 3 — Vos coordonnées" : step === 2 ? "Étape 2 sur 3 — Votre parcours à Ynov" : "Étape 3 sur 3 — Sécurisez votre compte"}
      </p>

      {step === 1 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <div>
              <label style={labelStyle}>Prénom</label>
              <input
                {...form.register("first_name")}
                placeholder="Sophie"
                style={inputStyle}
                onFocus={(e) => (e.target.style.borderColor = "#23b2a4")}
                onBlur={(e) => (e.target.style.borderColor = "#e8e8e8")}
              />
            </div>
            <div>
              <label style={labelStyle}>Nom</label>
              <input
                {...form.register("last_name")}
                placeholder="Martin"
                style={inputStyle}
                onFocus={(e) => (e.target.style.borderColor = "#23b2a4")}
                onBlur={(e) => (e.target.style.borderColor = "#e8e8e8")}
              />
            </div>
          </div>
          <div>
            <label style={labelStyle}>Adresse email Ynov</label>
            <input
              {...form.register("email")}
              type="email"
              placeholder="prenom.nom@ynov.com"
              style={inputStyle}
              onFocus={(e) => (e.target.style.borderColor = "#23b2a4")}
              onBlur={(e) => (e.target.style.borderColor = "#e8e8e8")}
            />
          </div>
        </div>
      )}

      {step === 2 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div>
            <label style={labelStyle}>Filière</label>
            <select
              value={filiere}
              onChange={(e) => setFiliere(e.target.value)}
              style={{ ...inputStyle, background: "#fff", cursor: "pointer" }}
            >
              <option value="">Sélectionnez votre filière</option>
              {FILIERES.map((f) => <option key={f}>{f}</option>)}
            </select>
          </div>
          <div>
            <label style={labelStyle}>Promotion</label>
            <select
              value={promo}
              onChange={(e) => setPromo(e.target.value)}
              style={{ ...inputStyle, background: "#fff", cursor: "pointer" }}
            >
              <option value="">Sélectionnez votre promotion</option>
              {PROMOS.map((p) => <option key={p}>{p}</option>)}
            </select>
          </div>
          <div style={{ background: "rgba(35,178,164,0.06)", border: "1px solid rgba(35,178,164,0.2)", borderRadius: 10, padding: 14 }}>
            <div style={{ fontFamily: "Montserrat, sans-serif", fontWeight: 700, fontSize: 13, color: "#23b2a4", marginBottom: 4 }}>ℹ️ Chargé RE associé</div>
            <div style={{ fontFamily: "Source Sans 3, sans-serif", fontSize: 13, color: "#555" }}>
              Votre chargé RE sera automatiquement assigné selon votre filière.
            </div>
          </div>
        </div>
      )}

      {step === 3 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div>
            <label style={labelStyle}>Mot de passe</label>
            <input
              {...form.register("password")}
              type="password"
              placeholder="8 caractères minimum"
              style={inputStyle}
              onFocus={(e) => (e.target.style.borderColor = "#23b2a4")}
              onBlur={(e) => (e.target.style.borderColor = "#e8e8e8")}
            />
            {form.formState.errors.password && (
              <p style={{ color: "#e05252", fontSize: 12, marginTop: 4 }}>8 caractères minimum</p>
            )}
          </div>
          {error && (
            <div style={{ background: "#fee2e2", color: "#dc2626", borderRadius: 8, padding: "10px 14px", fontSize: 13 }}>
              {error}
            </div>
          )}
          <label style={{ display: "flex", alignItems: "center", gap: 8, fontFamily: "Source Sans 3, sans-serif", fontSize: 13, color: "#555", cursor: "pointer" }}>
            <input type="checkbox" style={{ accentColor: "#23b2a4", width: 16, height: 16 }} />
            J'accepte les <span style={{ color: "#23b2a4", fontWeight: 600 }}>conditions d'utilisation</span>
          </label>
        </div>
      )}

      <button
        type="button"
        onClick={handleNext}
        disabled={isLoading}
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
        {isLoading ? "Création du compte…" : step < 3 ? "Continuer →" : "Créer mon compte"}
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
  );
};

export default RegisterForm;
