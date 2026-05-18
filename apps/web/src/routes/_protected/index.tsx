import HomePage from "@/src/pages/Home";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_protected/")({
  component: HomePage,
});
