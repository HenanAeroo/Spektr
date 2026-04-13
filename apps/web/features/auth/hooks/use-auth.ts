import { useState } from "react";
import {
  login,
  register,
  logout,
  loginWithGoogle,
} from "../actions/auth.actions";
import { LoginFormData, RegisterFormData } from "../types";
import { useRouter } from "next/navigation";

export function useAuth() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  async function handleLogin(data: LoginFormData) {
    setIsLoading(true);
    setError(null);

    try {
      await login(data);
      router.push("/");
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
      router.push("/");
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
      router.push("/login");
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
