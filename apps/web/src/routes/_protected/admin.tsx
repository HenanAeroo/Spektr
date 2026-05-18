import { getUser } from "@/shared/lib/auth";
import AdminPage from "@/src/pages/admin";
import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/_protected/admin")({
  beforeLoad: () => {
    const user = getUser();
    if (user?.role !== "ADMIN") {
      throw redirect({ to: "/" });
    }
  },
  component: AdminPage,
});
