import DocumentsPage from "@/src/pages/documents";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_protected/documents")({
  component: DocumentsPage,
});
