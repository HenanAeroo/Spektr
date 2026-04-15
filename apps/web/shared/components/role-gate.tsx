import { ReactNode } from "react";
import { useRole } from "../hooks/useRole";

type Props = {
  requiredRole: "STUDENT" | "ADMIN";
  children: ReactNode;
};

export function RoleGate({ requiredRole, children }: Props) {
  const role = useRole();

  if (role !== requiredRole) return null;

  return children;
}
