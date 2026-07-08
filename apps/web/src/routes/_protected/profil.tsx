import { Skeleton } from "@/shared/components/ui/skeleton";
import { createFileRoute } from "@tanstack/react-router";
import { lazy, Suspense } from "react";

const ProfilePage = lazy(() => import("@/src/pages/profile"));

export const Route = createFileRoute("/_protected/profil")({
  component: () => (
    <Suspense
      fallback={
        <div className="py-7 px-8">
          <Skeleton className="h-8 w-48 mb-6" />
          <Skeleton className="h-64 w-full" />
        </div>
      }
    >
      <ProfilePage />
    </Suspense>
  ),
});
