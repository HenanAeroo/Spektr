"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { refresh } from "@/features/auth/actions/auth.actions";

const GoogleCallbackPage = () => {
  const router = useRouter();

  useEffect(() => {
    refresh()
      .then(() => router.push("/"))
      .catch(() => router.push("/login"));
  }, [router]);

  return <p>Connexion en cours...</p>;
};

export default GoogleCallbackPage;
