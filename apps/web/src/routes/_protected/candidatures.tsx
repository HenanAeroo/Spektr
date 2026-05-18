import ApplicationsPage from "@/src/pages/applications";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_protected/candidatures")({
  component: ApplicationsPage,
});
