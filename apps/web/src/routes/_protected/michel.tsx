import { getUser } from "@/shared/lib/auth";
import AdminPage from "@/src/pages/admin";
import { createFileRoute, redirect } from "@tanstack/react-router";
import { z } from "zod";

const searchSchema = z.object({
  p: z.string().optional(),
  uid: z.number().optional(),
});

export const Route = createFileRoute("/_protected/michel")({
  validateSearch: searchSchema,
  beforeLoad: () => {
    const user = getUser();
    if (user?.role !== "ADMIN" && user?.role !== "SUPER_ADMIN") {
      throw redirect({ to: "/" });
    }
  },
  component: AdminPage,
});
