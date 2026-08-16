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
import { User } from "@spektr/shared";

/**
 * Auth actions hook for forms and the sidebar. Wraps the login/register/logout
 * network calls with shared `isLoading`/`error`/`emailSent` UI state, syncs the
 * auth context user, and handles post-action navigation. Local `useState` is
 * used because this is scoped UI state, not the global auth context.
 *
 * @returns Handlers (`handleLogin`, `handleRegister`, `handleLogout`,
 *   `loginWithGoogle`) plus the `isLoading`, `error` and `emailSent` flags.
 */
export function useAuth() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [emailSent, setEmailSent] = useState(false);
  const { setUser } = useAuthContext();
  const navigate = useNavigate();

  /**
   * Logs in, loads the current user into the auth context, and navigates home.
   * Failures are surfaced through `error`.
   *
   * @param data - The login form credentials.
   */
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

  /**
   * Registers a new account and flips `emailSent` so the UI can prompt the user
   * to confirm their email. Failures are surfaced through `error`.
   *
   * @param data - The registration form data.
   */
  async function handleRegister(data: RegisterFormData) {
    setIsLoading(true);
    setError(null);

    try {
      await register(data);
      setEmailSent(true);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Problème lors de l'inscription",
      );
    } finally {
      setIsLoading(false);
    }
  }

  /**
   * Logs out, clears the auth context user, and navigates to `/login`.
   * Failures are surfaced through `error`.
   */
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
    emailSent,
  };
}
