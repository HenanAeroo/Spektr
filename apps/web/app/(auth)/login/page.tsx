"use client";

import { useState } from "react";
import LoginForm from "@/features/auth/components/login-form";
import RegisterForm from "@/features/auth/components/register-form";
import { cn } from "@/shared/lib/utils";

const LoginPage = () => {
  const [isLogin, setIsLogin] = useState(true);

  return (
    <main className="relative h-screen flex items-center justify-center">
      <div className="relative w-full max-w-4xl h-125 overflow-hidden border rounded-2xl shadow-lg">
        <div
          className={cn(
            "flex w-[200%] h-full transition-transform duration-500 ease-in-out",
            isLogin ? "translate-x-0" : "-translate-x-1/2",
          )}
        >
          <div className="w-1/2 flex items-center justify-center bg-background">
            <LoginForm />
          </div>
          <div className="w-1/2 flex items-center justify-center bg-muted">
            <RegisterForm />
          </div>
        </div>
        <button
          onClick={() => setIsLogin(!isLogin)}
          className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 px-4 py-2 rounded-full bg-primary text-primary-foreground shadow-md"
        >
          {isLogin ? "Créer un compte →" : "← Se connecter"}
        </button>
      </div>
    </main>
  );
};

export default LoginPage;
