import { createContext, useContext, useEffect, useState } from "react";
import { refresh } from "@/features/auth/actions/auth.actions";

interface AuthContextValue {
  isInitialized: boolean;
}

const AuthContext = createContext<AuthContextValue>({ isInitialized: false });

export function useAuthContext() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    refresh()
      .catch(() => {})
      .finally(() => setIsInitialized(true));
  }, []);

  return (
    <AuthContext.Provider value={{ isInitialized }}>
      {children}
    </AuthContext.Provider>
  );
}
