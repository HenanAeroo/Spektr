import { useState } from "react";
import LoginForm from "@/features/auth/components/login-form";
import RegisterForm from "@/features/auth/components/register-form";

const LoginPage = () => {
  const [isLogin, setIsLogin] = useState(true);

  return (
    <div className="min-h-screen bg-spektr-bg flex items-center justify-center p-6">
      <div
        className={[
          "bg-white rounded-2xl shadow-[0_8px_40px_rgba(0,0,0,0.10)] py-10 px-9 w-full",
          isLogin ? "max-w-[400px]" : "max-w-[440px]",
        ].join(" ")}
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="font-montserrat font-extrabold text-[32px] text-spektr-dark tracking-[-1px]">
            Spek<span className="text-spektr-teal">tr</span>
          </div>
          <div className="font-montserrat font-semibold text-[9px] text-[#999] tracking-[3px] uppercase mt-1">
            YNOV CAMPUS RENNES
          </div>
        </div>

        {isLogin ? (
          <>
            <h2 className="font-montserrat font-extrabold text-[22px] text-spektr-dark mb-1.5">
              Connexion
            </h2>
            <p className="font-source-sans text-sm text-spektr-teal mb-6">
              Bienvenue ! Connectez-vous à votre espace.
            </p>
            <LoginForm />
            <p className="text-center font-source-sans text-sm text-[#888] mt-5">
              Pas encore de compte ?{" "}
              <button
                onClick={() => setIsLogin(false)}
                className="bg-transparent border-none text-spektr-teal font-bold cursor-pointer text-sm"
              >
                S'inscrire
              </button>
            </p>
          </>
        ) : (
          <>
            <RegisterForm />
            <p className="text-center font-source-sans text-sm text-[#888] mt-4">
              Déjà un compte ?{" "}
              <button
                onClick={() => setIsLogin(true)}
                className="bg-transparent border-none text-spektr-teal font-bold cursor-pointer text-sm"
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
