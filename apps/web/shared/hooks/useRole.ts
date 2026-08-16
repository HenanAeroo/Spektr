import { useAuthContext } from "../components/auth-provider";

/**
 * Convenience hook exposing the authenticated user's role from the auth context.
 *
 * @returns The current user's role, or `undefined` when not authenticated.
 */
export function useRole() {
  const { user } = useAuthContext();

  return user?.role;
}
