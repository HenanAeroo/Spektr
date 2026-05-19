import { useState } from "react";
import LoginForm from "@/features/auth/components/login-form";
import RegisterForm from "@/features/auth/components/register-form";

const LoginPage = () => {
  const [isLogin, setIsLogin] = useState(true);

  return (
    <div style={{ minHeight: "100vh", background: "#f5f5f5", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <div style={{ background: "#fff", borderRadius: 16, boxShadow: "0 8px 40px rgba(0,0,0,0.10)", padding: "40px 36px", width: "100%", maxWidth: isLogin ? 400 : 440 }}>
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{ fontFamily: "Montserrat, sans-serif", fontWeight: 800, fontSize: 32, color: "#1d1d1e", letterSpacing: "-1px" }}>
            Spek<span style={{ color: "#23b2a4" }}>tr</span>
          </div>
          <div style={{ fontFamily: "Montserrat, sans-serif", fontWeight: 600, fontSize: 9, color: "#999", letterSpacing: 3, textTransform: "uppercase", marginTop: 4 }}>
            YNOV CAMPUS RENNES
          </div>
        </div>

        {isLogin ? (
          <>
            <h2 style={{ fontFamily: "Montserrat, sans-serif", fontWeight: 800, fontSize: 22, color: "#1d1d1e", marginBottom: 6 }}>Connexion</h2>
            <p style={{ fontFamily: "Source Sans 3, sans-serif", fontSize: 14, color: "#23b2a4", marginBottom: 24 }}>
              Bienvenue ! Connectez-vous à votre espace.
            </p>
            <LoginForm />
            <p style={{ textAlign: "center", fontFamily: "Source Sans 3, sans-serif", fontSize: 14, color: "#888", marginTop: 20 }}>
              Pas encore de compte ?{" "}
              <button
                onClick={() => setIsLogin(false)}
                style={{ background: "none", border: "none", color: "#23b2a4", fontWeight: 700, cursor: "pointer", fontSize: 14 }}
              >
                S'inscrire
              </button>
            </p>
          </>
        ) : (
          <>
            <RegisterForm />
            <p style={{ textAlign: "center", fontFamily: "Source Sans 3, sans-serif", fontSize: 14, color: "#888", marginTop: 16 }}>
              Déjà un compte ?{" "}
              <button
                onClick={() => setIsLogin(true)}
                style={{ background: "none", border: "none", color: "#23b2a4", fontWeight: 700, cursor: "pointer", fontSize: 14 }}
              >
                Se connecter
              </button>
            </p>
          </>
        )}
      </div>
    </div>
  );
};

export default LoginPage;
