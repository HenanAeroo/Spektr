import { Navigate, Outlet } from "react-router-dom";
import { useAuthContext } from "@/shared/components/auth-provider";
import { getToken } from "@/shared/lib/auth";
import { useRole } from "@/shared/hooks/useRole";

type Props = {
  requiredRole?: "STUDENT" | "ADMIN";
};

export function ProtectedRoute({ requiredRole }: Props) {
  const { isInitialized } = useAuthContext();
  const role = useRole();

  if (!isInitialized) return null;

  if (!getToken()) return <Navigate to="/login" replace />;

  if (requiredRole && role !== requiredRole) return <Navigate to="/" replace />;

  return <Outlet />;
}
