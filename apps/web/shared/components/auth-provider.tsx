"use client";

import { refresh } from "@/features/auth/actions/auth.actions";
import { useEffect } from "react";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    refresh().catch(() => {});
  }, []);

  return children;
}
