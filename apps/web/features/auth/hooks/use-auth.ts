import { useState } from "react";
import {
  login,
  register,
  logout,
  loginWithGoogle,
} from "../actions/auth.actions";
import { LoginFormData, RegisterFormData } from "../types";
import { useNavigate } from "react-router-dom";

export function useAuth() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  async function handleLogin(data: LoginFormData) {
    setIsLoading(true);
    setError(null);

    try {
      await login(data);
      navigate("/");
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
      navigate("/");
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
      navigate("/login");
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
