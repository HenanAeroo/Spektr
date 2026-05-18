import ProfilePage from "@/src/pages/profile";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_protected/profil")({
  component: ProfilePage,
});
