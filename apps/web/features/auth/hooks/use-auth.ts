import { useState } from "react";
import { login } from "../actions/login";
import { register } from "../actions/register";
import { logout } from "../actions/logout";
import { loginWithGoogle } from "../actions/loginWithGoogle";
import { LoginFormData, RegisterFormData } from "../types";
import { useNavigate } from "@tanstack/react-router";
import { useAuthContext } from "@/shared/components/auth-provider";
import { apiFetch } from "@/shared/lib/api";
import { getToken } from "@/shared/lib/auth";
import { User } from "@/shared/types";

// Using useState because it is a dedicated context for the authentication
export function useAuth() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { setUser } = useAuthContext();
  const navigate = useNavigate();

  async function handleLogin(data: LoginFormData) {
    setIsLoading(true);
    setError(null);

    try {
      await login(data);
      const me = await apiFetch<User>("/users/me", { token: getToken()! });
      setUser(me);
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
      const me = await apiFetch<User>("/users/me", { token: getToken()! });
      setUser(me);
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
      setUser(null);
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
