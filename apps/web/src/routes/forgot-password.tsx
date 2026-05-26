import ForgotPasswordPage from "@/src/pages/forgot-password";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/forgot-password")({
  component: ForgotPasswordPage,
});
