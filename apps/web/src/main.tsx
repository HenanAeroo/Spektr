import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./globals.css";
import { createRouter, RouterProvider } from "@tanstack/react-router";
import { routeTree } from "./routeTree.gen";

const vars = ["VITE_API_URL"];

for (const varName of vars) {
  const value = import.meta.env[varName];
  if (value === undefined || value === "") {
    throw new Error(`[Config] Variable manquante : ${varName}`);
  }
}

const router = createRouter({ routeTree, defaultPreload: "intent" });

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
);
