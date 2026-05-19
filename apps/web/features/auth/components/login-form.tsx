import { useAuth } from "../hooks/use-auth";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useState } from "react";

const loginSchema = z.object({
  email: z.string().regex(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/),
  password: z.string().min(8),
});

type LoginSchema = z.infer<typeof loginSchema>;

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "11px 14px",
  borderRadius: 8,
  border: "1.5px solid #e8e8e8",
  fontFamily: "Source Sans 3, sans-serif",
  fontSize: 14,
  outline: "none",
  boxSizing: "border-box",
  transition: "border-color 0.2s",
  color: "#1d1d1e",
  background: "#fff",
};

const labelStyle: React.CSSProperties = {
  fontFamily: "Montserrat, sans-serif",
  fontWeight: 600,
  fontSize: 13,
  color: "#1d1d1e",
  display: "block",
  marginBottom: 6,
};

const LoginForm = () => {
  const form = useForm<LoginSchema>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });
  const [showPwd, setShowPwd] = useState(false);
  const { handleLogin, loginWithGoogle, isLoading, error } = useAuth();

  async function onSubmit(data: LoginSchema) {
    await handleLogin(data);
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} style={{ width: "100%" }}>
      <div style={{ marginBottom: 14 }}>
        <label style={labelStyle}>Adresse email</label>
        <input
          {...form.register("email")}
          type="email"
          placeholder="prenom.nom@ynov.com"
          style={inputStyle}
          onFocus={(e) => (e.target.style.borderColor = "#23b2a4")}
          onBlur={(e) => (e.target.style.borderColor = "#e8e8e8")}
        />
        {form.formState.errors.email && (
          <p style={{ color: "#e05252", fontSize: 12, marginTop: 4 }}>
            Email invalide
          </p>
        )}
      </div>

      <div style={{ marginBottom: 20 }}>
        <label style={labelStyle}>Mot de passe</label>
        <div style={{ position: "relative" }}>
          <input
            {...form.register("password")}
            type={showPwd ? "text" : "password"}
            placeholder="••••••••"
            style={{ ...inputStyle, paddingRight: 40 }}
            onFocus={(e) => (e.target.style.borderColor = "#23b2a4")}
            onBlur={(e) => (e.target.style.borderColor = "#e8e8e8")}
          />
          <span
            onClick={() => setShowPwd(!showPwd)}
            style={{
              position: "absolute",
              right: 12,
              top: "50%",
              transform: "translateY(-50%)",
              cursor: "pointer",
              fontSize: 16,
              color: "#999",
            }}
          >
            {showPwd ? "🙈" : "👁️"}
          </span>
        </div>
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
            marginBottom: 16,
          }}
        >
          {error}
        </div>
      )}

      <button
        type="submit"
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
          marginBottom: 16,
          transition: "background 0.2s",
        }}
      >
        {isLoading ? "Connexion…" : "Se connecter"}
      </button>

      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
        <div style={{ flex: 1, height: 1, background: "#e8e8e8" }} />
        <span style={{ fontFamily: "Source Sans 3, sans-serif", fontSize: 12, color: "#aaa" }}>ou</span>
        <div style={{ flex: 1, height: 1, background: "#e8e8e8" }} />
      </div>

      <button
        type="button"
        onClick={() => loginWithGoogle()}
        style={{
          width: "100%",
          padding: "11px",
          borderRadius: 8,
          border: "1.5px solid #e8e8e8",
          background: "#fff",
          fontFamily: "Montserrat, sans-serif",
          fontWeight: 600,
          fontSize: 14,
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 10,
          color: "#1d1d1e",
        }}
      >
        <svg width="18" height="18" viewBox="0 0 48 48">
          <path fill="#4285F4" d="M44.5 20H24v8.5h11.8C34.7 33.9 29.9 37 24 37c-7.2 0-13-5.8-13-13s5.8-13 13-13c3.1 0 5.9 1.1 8.1 2.9l6.4-6.4C34.6 5.1 29.6 3 24 3 12.9 3 4 11.9 4 23s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.7-.4-4l.9 1z"/>
          <path fill="#34A853" d="M6.3 14.7l7 5.1C15 16.1 19.2 13 24 13c3.1 0 5.9 1.1 8.1 2.9l6.4-6.4C34.6 5.1 29.6 3 24 3 16.3 3 9.7 7.9 6.3 14.7z"/>
          <path fill="#FBBC05" d="M24 43c5.8 0 10.7-1.9 14.3-5.2l-6.6-5.4C29.9 34.3 27.1 35 24 35c-5.8 0-10.8-3.1-13.5-7.8l-7 5.4C7.1 39.3 15 43 24 43z"/>
          <path fill="#EA4335" d="M43.6 20H24v8.5h11.8c-1 2.8-2.9 5.1-5.3 6.7l6.6 5.4C40.9 37.2 44 31 44 24c0-1.3-.1-2.7-.4-4z"/>
        </svg>
        Continuer avec Google
      </button>
    </form>
  );
};

export default LoginForm;
