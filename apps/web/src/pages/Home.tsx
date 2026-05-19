import { fetchMyApplications } from "@/features/applications/actions/fetchMyApplications";
import { fetchMyObjectives } from "@/features/objectives/actions/fetchMyObjectives";
import { useAuthContext } from "@/shared/components/auth-provider";
import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";

const STATUT_LABELS: Record<string, string> = {
  A_CONTACTER: "À contacter",
  ENVOYE: "Envoyé",
  RELANCE: "Relancé",
  EN_DISCUSSION: "En discussion",
  REPONSE_POSITIVE: "Réponse positive",
  REFUS: "Refus",
};

const STATUT_COLORS: Record<string, { bg: string; color: string }> = {
  A_CONTACTER: { bg: "#f3f4f6", color: "#6b7280" },
  ENVOYE: { bg: "#eff6ff", color: "#3b82f6" },
  RELANCE: { bg: "#fff7ed", color: "#d97706" },
  EN_DISCUSSION: { bg: "#f5f3ff", color: "#8b5cf6" },
  REPONSE_POSITIVE: { bg: "#dcfce7", color: "#16a34a" },
  REFUS: { bg: "#fee2e2", color: "#dc2626" },
};

export default function HomePage() {
  const { user } = useAuthContext();
  const firstName = user?.first_name ?? "Étudiant";

  const { data: applications = [] } = useQuery({
    queryKey: ["applications"],
    queryFn: fetchMyApplications,
  });

  const { data: objectives = [] } = useQuery({
    queryKey: ["objectives", "mine"],
    queryFn: fetchMyObjectives,
  });

  const activeApps = applications.filter((a) =>
    ["ENVOYE", "RELANCE", "EN_DISCUSSION"].includes(a.statut)
  );
  const interviews = applications.filter(
    (a) => a.outcome === "ENTRETIEN"
  );
  const positives = applications.filter(
    (a) => a.statut === "REPONSE_POSITIVE"
  );

  const recentApps = [...applications]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 5);

  const now = new Date();
  const greeting =
    now.getHours() < 12
      ? "Bonjour"
      : now.getHours() < 18
        ? "Bon après-midi"
        : "Bonsoir";

  return (
    <div style={{ padding: "28px 32px", background: "#f5f5f5", minHeight: "100%" }}>
      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontFamily: "Montserrat, sans-serif", fontWeight: 800, fontSize: 26, color: "#1d1d1e", letterSpacing: "-0.5px" }}>
          {greeting}, {firstName} 👋
        </h1>
        <p style={{ fontFamily: "Source Sans 3, sans-serif", fontSize: 14, color: "#6b7280", marginTop: 4 }}>
          Voici un aperçu de votre recherche d'alternance.
        </p>
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, marginBottom: 24 }}>
        {[
          { label: "Candidatures en cours", value: activeApps.length, delta: `${applications.length} au total`, icon: "📨" },
          { label: "Entretiens obtenus", value: interviews.length, delta: "depuis le début", icon: "🤝" },
          { label: "Réponses positives", value: positives.length, delta: "offres reçues", icon: "✅" },
        ].map((stat, i) => (
          <div key={i} style={{ background: "#fff", borderRadius: 10, border: "1px solid #e8e8e8", padding: 20 }}>
            <div style={{ fontSize: 28, marginBottom: 8 }}>{stat.icon}</div>
            <div style={{ fontFamily: "Montserrat, sans-serif", fontWeight: 800, fontSize: 32, color: "#1d1d1e", letterSpacing: "-1px" }}>
              {stat.value}
            </div>
            <div style={{ fontFamily: "Montserrat, sans-serif", fontWeight: 600, fontSize: 11, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.5px", marginTop: 4 }}>
              {stat.label}
            </div>
            <div style={{ fontFamily: "Source Sans 3, sans-serif", fontSize: 12, color: "#9ca3af", marginTop: 2 }}>
              {stat.delta}
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: 16 }}>
        {/* Recent applications */}
        <div style={{ background: "#fff", borderRadius: 10, border: "1px solid #e8e8e8", padding: 20 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <span style={{ fontFamily: "Montserrat, sans-serif", fontWeight: 700, fontSize: 14 }}>Candidatures récentes</span>
            <Link to="/candidatures" style={{ fontSize: 12, color: "#23b2a4", fontWeight: 600, textDecoration: "none" }}>
              Voir toutes →
            </Link>
          </div>
          {recentApps.length === 0 ? (
            <div style={{ textAlign: "center", padding: "32px 0", color: "#9ca3af", fontSize: 14 }}>
              <div style={{ fontSize: 32, marginBottom: 8 }}>📭</div>
              <p>Aucune candidature pour l'instant</p>
              <Link to="/candidatures" style={{ display: "inline-block", marginTop: 12, padding: "8px 16px", background: "#23b2a4", color: "#fff", borderRadius: 8, fontSize: 13, fontWeight: 600, textDecoration: "none" }}>
                Ajouter une candidature
              </Link>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {recentApps.map((app) => {
                const colors = STATUT_COLORS[app.statut] ?? { bg: "#f3f4f6", color: "#6b7280" };
                return (
                  <div key={app.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 0", borderBottom: "1px solid #f5f5f5" }}>
                    <div style={{ width: 38, height: 38, borderRadius: "50%", background: colors.bg, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "Montserrat, sans-serif", fontWeight: 700, fontSize: 13, color: colors.color, flexShrink: 0 }}>
                      {app.entreprise.slice(0, 2).toUpperCase()}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontFamily: "Montserrat, sans-serif", fontWeight: 600, fontSize: 13, color: "#1d1d1e", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                        {app.entreprise}
                      </div>
                      <div style={{ fontFamily: "Source Sans 3, sans-serif", fontSize: 11, color: "#9ca3af", marginTop: 2 }}>
                        {app.date_candidature
                          ? new Date(app.date_candidature).toLocaleDateString("fr-FR")
                          : "—"}
                      </div>
                    </div>
                    <span style={{ fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 10, background: colors.bg, color: colors.color, whiteSpace: "nowrap" }}>
                      {STATUT_LABELS[app.statut] ?? app.statut}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Objectives */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ background: "#fff", borderRadius: 10, border: "1px solid #e8e8e8", padding: 20 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
              <span style={{ fontFamily: "Montserrat, sans-serif", fontWeight: 700, fontSize: 13 }}>Mes objectifs</span>
              <Link to="/objectifs" style={{ fontSize: 12, color: "#23b2a4", fontWeight: 600, textDecoration: "none" }}>
                Voir →
              </Link>
            </div>
            {objectives.length === 0 ? (
              <p style={{ fontSize: 13, color: "#9ca3af", textAlign: "center", padding: "16px 0" }}>
                Aucun objectif pour l'instant
              </p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {objectives.slice(0, 4).map((obj) => (
                  <div key={obj.id} style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                    <span style={{ fontSize: 16, marginTop: 1 }}>🎯</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontFamily: "Montserrat, sans-serif", fontWeight: 600, fontSize: 12, color: "#1d1d1e" }}>
                        {obj.title}
                      </div>
                      {obj.deadline && (
                        <div style={{ fontFamily: "Source Sans 3, sans-serif", fontSize: 11, color: "#9ca3af", marginTop: 2 }}>
                          Deadline : {new Date(obj.deadline).toLocaleDateString("fr-FR")}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Quick actions */}
          <div style={{ background: "rgba(35,178,164,0.06)", borderRadius: 10, border: "1px solid rgba(35,178,164,0.2)", padding: 20 }}>
            <div style={{ fontFamily: "Montserrat, sans-serif", fontWeight: 700, fontSize: 13, color: "#23b2a4", marginBottom: 12 }}>
              Actions rapides
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <Link to="/candidatures" style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 12px", background: "#fff", borderRadius: 8, border: "1px solid #e8e8e8", textDecoration: "none", fontFamily: "Source Sans 3, sans-serif", fontSize: 13, color: "#1d1d1e", fontWeight: 600 }}>
                <span>📨</span> Nouvelle candidature
              </Link>
              <Link to="/docs" style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 12px", background: "#fff", borderRadius: 8, border: "1px solid #e8e8e8", textDecoration: "none", fontFamily: "Source Sans 3, sans-serif", fontSize: 13, color: "#1d1d1e", fontWeight: 600 }}>
                <span>📄</span> Mes documents
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
