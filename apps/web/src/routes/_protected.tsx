import { useAuthContext } from "@/shared/components/auth-provider";
import Sidebar from "@/shared/components/layout/sidebar";
import { refresh } from "@/features/auth/actions/refresh";
import { getToken, isTokenExpired } from "@/shared/lib/auth";
import {
  createFileRoute,
  Outlet,
  redirect,
  useNavigate,
} from "@tanstack/react-router";
import { useEffect } from "react";

export const Route = createFileRoute("/_protected")({
  beforeLoad: async () => {
    if (!getToken() || isTokenExpired()) {
      try {
        await refresh();
      } catch {
        throw redirect({ to: "/login" });
      }
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

    if (!isInitialized) {
      return (
        <div className="flex items-center justify-center h-screen bg-spektr-bg">
          <div className="w-8 h-8 rounded-full border-[3px] border-spektr-border border-t-spektr-teal animate-spin" />
        </div>
      );
    }

    return (
      <div className="flex h-screen bg-spektr-bg">
        <Sidebar />
        <main className="flex-1 overflow-auto ml-[220px]">
          <Outlet />
        </main>
      </div>
    );
  },
});
