import { Skeleton } from "@/shared/components/ui/skeleton";
import { createFileRoute, lazyRouteComponent } from "@tanstack/react-router";
import { Suspense } from "react";

const ObjectivesPage = lazyRouteComponent(
  () => import("@/src/pages/objectives"),
);

export const Route = createFileRoute("/_protected/objectifs")({
  component: () => (
    <Suspense
      fallback={
        <div className="py-7 px-8">
          <Skeleton className="h-8 w-48 mb-6" />
          <Skeleton className="h-64 w-full" />
        </div>
      }
    >
      <ObjectivesPage />
    </Suspense>
  ),
});
