import { createFileRoute } from "@tanstack/react-router";
import VerifyEmail from "../pages/verify-email";

export const Route = createFileRoute("/verify-email")({
  component: VerifyEmail,
});
