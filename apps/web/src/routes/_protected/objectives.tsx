import ObjectivesPage from "@/src/pages/objectives";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_protected/objectifs")({
  component: ObjectivesPage,
});
