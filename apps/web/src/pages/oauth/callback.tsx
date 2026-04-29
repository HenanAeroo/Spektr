import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { refresh } from "@/features/auth/actions/refresh";

const GoogleCallbackPage = () => {
  const navigate = useNavigate();

  useEffect(() => {
    refresh()
      .then(() => navigate("/"))
      .catch(() => navigate("/login"));
  }, [navigate]);

  return <p>Connexion en cours...</p>;
};

export default GoogleCallbackPage;
