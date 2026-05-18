import { useEffect } from "react";
import { refresh } from "@/features/auth/actions/refresh";
import { useNavigate } from "@tanstack/react-router";

const GoogleCallbackPage = () => {
  const navigate = useNavigate();

  useEffect(() => {
    refresh()
      .then(() => navigate({ to: "/" }))
      .catch(() => navigate({ to: "/login" }));
  }, [navigate]);

  return <p>Connexion en cours...</p>;
};

export default GoogleCallbackPage;
