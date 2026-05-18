import GoogleCallbackPage from "@/src/pages/oauth/callback";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/oauth/callback")({
  component: GoogleCallbackPage,
});
