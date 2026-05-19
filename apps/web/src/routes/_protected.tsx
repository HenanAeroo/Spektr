import { useAuthContext } from "@/shared/components/auth-provider";
import Sidebar from "@/shared/components/layout/sidebar";
import { refresh } from "@/features/auth/actions/refresh";
import { getToken } from "@/shared/lib/auth";
import {
  createFileRoute,
  Outlet,
  redirect,
  useNavigate,
} from "@tanstack/react-router";
import { useEffect } from "react";

export const Route = createFileRoute("/_protected")({
  beforeLoad: async () => {
    if (!getToken()) {
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
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", background: "#f5f5f5" }}>
          <div style={{ width: 32, height: 32, border: "3px solid #e8e8e8", borderTopColor: "#23b2a4", borderRadius: "50%", animation: "spin 0.7s linear infinite" }} />
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      );
    }

    return (
      <div className="flex h-screen" style={{ background: "#f5f5f5" }}>
        <Sidebar />
        <main
          className="flex-1 overflow-auto"
          style={{ marginLeft: "220px" }}
        >
          <Outlet />
        </main>
      </div>
    );
  },
});
