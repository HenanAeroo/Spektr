import { useState } from "react";
import { login } from "../actions/login";
import { register } from "../actions/register";
import { logout } from "../actions/logout";
import { loginWithGoogle } from "../actions/loginWithGoogle";
import { LoginFormData, RegisterFormData } from "../types";
import { useNavigate } from "@tanstack/react-router";

export function useAuth() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  async function handleLogin(data: LoginFormData) {
    setIsLoading(true);
    setError(null);

    try {
      await login(data);
      navigate({ to: "/" });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Mauvais identifiants");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleRegister(data: RegisterFormData) {
    setIsLoading(true);
    setError(null);

    try {
      await register(data);
      navigate({ to: "/" });
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Problème lors de l'inscription",
      );
    } finally {
      setIsLoading(false);
    }
  }

  async function handleLogout() {
    setIsLoading(true);
    setError(null);

    try {
      await logout();
      navigate({ to: "/login" });
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Impossible de se déconnecter",
      );
    } finally {
      setIsLoading(false);
    }
  }

  return {
    handleLogin,
    handleRegister,
    handleLogout,
    loginWithGoogle,
    isLoading,
    error,
  };
}
