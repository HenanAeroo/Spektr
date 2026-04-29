import { createContext, useContext, useEffect, useState } from "react";
import { refresh } from "@/features/auth/actions/refresh";
import { User } from "../types";
import { apiFetch } from "../lib/api";
import { getToken } from "../lib/auth";

interface AuthContextValue {
  isInitialized: boolean;
  user: User | null;
}

const AuthContext = createContext<AuthContextValue>({
  isInitialized: false,
  user: null,
});

export function useAuthContext() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isInitialized, setIsInitialized] = useState(false);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    refresh()
      .then(() =>
        apiFetch<User>("/users/me", {
          method: "GET",
          token: getToken() ?? undefined,
        }),
      )
      .then((user) => setUser(user))
      .catch(() => {})
      .finally(() => setIsInitialized(true));
  }, []);

  return (
    <AuthContext.Provider value={{ isInitialized, user }}>
      {children}
    </AuthContext.Provider>
  );
}
