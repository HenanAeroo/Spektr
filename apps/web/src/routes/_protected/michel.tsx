import { Skeleton } from "@/shared/components/ui/skeleton";
import { getUser } from "@/shared/lib/auth";
import { createFileRoute, redirect } from "@tanstack/react-router";
import { lazy, Suspense } from "react";
import { z } from "zod";

const AdminPage = lazy(() => import("@/src/pages/admin"));

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
  component: () => (
    <Suspense
      fallback={
        <div className="py-7 px-8">
          <Skeleton className="h-8 w-48 mb-6" />
          <Skeleton className="h-64 w-full" />
        </div>
      }
    >
      <AdminPage />
    </Suspense>
  ),
});
