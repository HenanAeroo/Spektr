import { useAuthContext } from "@/shared/components/auth-provider";
import Sidebar from "@/shared/components/layout/sidebar";
import { getToken } from "@/shared/lib/auth";
import {
  createFileRoute,
  Outlet,
  redirect,
  useNavigate,
} from "@tanstack/react-router";
import { useEffect } from "react";

export const Route = createFileRoute("/_protected")({
  beforeLoad: () => {
    if (!getToken()) {
      throw redirect({ to: "/login" });
    }
  },

  component: () => {
    const { isInitialized } = useAuthContext();
    const navigate = useNavigate();
    const token = getToken();

    useEffect(() => {
      if (isInitialized && !token) {
        navigate({ to: "/login" });
      }
    }, [isInitialized]);

    if (!isInitialized || !token) {
      return null;
    }

    return (
      <div className="flex h-screen">
        <Sidebar />
        <main className="flex-1 overflow-auto">
          <Outlet />
        </main>
      </div>
    );
  },
});
