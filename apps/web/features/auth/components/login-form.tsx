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
    <form onSubmit={form.handleSubmit(onSubmit)} className="w-full">
      <div className="mb-3.5">
        <label htmlFor="email" className="font-montserrat font-semibold text-[13px] text-spektr-dark block mb-1.5">
          Adresse email
        </label>
        <input
          {...form.register("email")}
          id="email"
          type="email"
          placeholder="prenom.nom@ynov.com"
          className="w-full px-3.5 py-[11px] rounded-lg border-[1.5px] border-spektr-border font-source-sans text-sm text-spektr-dark bg-white box-border transition-colors focus:outline-none focus:border-spektr-teal"
        />
        {form.formState.errors.email && (
          <p className="text-spektr-red text-xs mt-1">Email invalide</p>
        )}
      </div>

      <div className="mb-5">
        <label htmlFor="password" className="font-montserrat font-semibold text-[13px] text-spektr-dark block mb-1.5">
          Mot de passe
        </label>
        <div className="relative">
          <input
            {...form.register("password")}
            id="password"
            type={showPwd ? "text" : "password"}
            placeholder="••••••••"
            className="w-full px-3.5 py-[11px] pr-10 rounded-lg border-[1.5px] border-spektr-border font-source-sans text-sm text-spektr-dark bg-white box-border transition-colors focus:outline-none focus:border-spektr-teal"
          />
          <span
            onClick={() => setShowPwd(!showPwd)}
            className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer text-base text-[#999]"
          >
            {showPwd ? "🙈" : "👁️"}
          </span>
        </div>
        {form.formState.errors.password && (
          <p className="text-spektr-red text-xs mt-1">8 caractères minimum</p>
        )}
      </div>

      {error && (
        <div className="bg-[#fee2e2] text-[#dc2626] rounded-lg px-3.5 py-2.5 text-[13px] mb-4">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={isLoading}
        className={[
          "w-full py-[13px] rounded-lg border-none font-montserrat font-bold text-[15px] text-white mb-4 transition-colors",
          isLoading ? "bg-spektr-teal/50 cursor-not-allowed" : "bg-spektr-teal cursor-pointer",
        ].join(" ")}
      >
        {isLoading ? "Connexion…" : "Se connecter"}
      </button>

      <div className="flex items-center gap-2.5 mb-4">
        <div className="flex-1 h-px bg-spektr-border" />
        <span className="font-source-sans text-xs text-[#aaa]">ou</span>
        <div className="flex-1 h-px bg-spektr-border" />
      </div>

      <button
        type="button"
        onClick={() => loginWithGoogle()}
        className="w-full py-[11px] rounded-lg border-[1.5px] border-spektr-border bg-white font-montserrat font-semibold text-sm cursor-pointer flex items-center justify-center gap-2.5 text-spektr-dark"
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
