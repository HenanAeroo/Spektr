import { Navigate, Outlet } from "react-router-dom";
import { useAuthContext } from "@/shared/components/auth-provider";
import { getToken } from "@/shared/lib/auth";

export function ProtectedRoute() {
  const { isInitialized } = useAuthContext();

  if (!isInitialized) return null;

  if (!getToken()) return <Navigate to="/login" replace />;

  return <Outlet />;
}
