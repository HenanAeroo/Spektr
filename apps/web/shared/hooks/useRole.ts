import { useAuthContext } from "../components/auth-provider";

export function useRole() {
  const { user } = useAuthContext();

  return user?.role;
}
