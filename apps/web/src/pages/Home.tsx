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

const STATUT_COLORS: Record<string, { bg: string; text: string }> = {
  A_CONTACTER: { bg: "bg-gray-100", text: "text-gray-500" },
  ENVOYE: { bg: "bg-blue-50", text: "text-blue-500" },
  RELANCE: { bg: "bg-amber-50", text: "text-amber-600" },
  EN_DISCUSSION: { bg: "bg-violet-50", text: "text-violet-500" },
  REPONSE_POSITIVE: { bg: "bg-green-100", text: "text-green-600" },
  REFUS: { bg: "bg-red-100", text: "text-red-600" },
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
  const interviews = applications.filter((a) => a.outcome === "ENTRETIEN");
  const positives = applications.filter((a) => a.statut === "REPONSE_POSITIVE");

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
    <div className="py-7 px-8 bg-spektr-bg min-h-full">
      {/* Header */}
      <div className="mb-7">
        <h1 className="font-montserrat font-extrabold text-[26px] text-spektr-dark tracking-[-0.5px]">
          {greeting}, {firstName} 👋
        </h1>
        <p className="font-source-sans text-sm text-gray-500 mt-1">
          Voici un aperçu de votre recherche d'alternance.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: "Candidatures en cours", value: activeApps.length, delta: `${applications.length} au total`, icon: "📨" },
          { label: "Entretiens obtenus", value: interviews.length, delta: "depuis le début", icon: "🤝" },
          { label: "Réponses positives", value: positives.length, delta: "offres reçues", icon: "✅" },
        ].map((stat, i) => (
          <div key={i} className="bg-white rounded-[10px] border border-spektr-border p-5">
            <div className="text-[28px] mb-2">{stat.icon}</div>
            <div className="font-montserrat font-extrabold text-[32px] text-spektr-dark tracking-[-1px]">
              {stat.value}
            </div>
            <div className="font-montserrat font-semibold text-[11px] text-gray-500 uppercase tracking-[0.5px] mt-1">
              {stat.label}
            </div>
            <div className="font-source-sans text-xs text-gray-400 mt-0.5">
              {stat.delta}
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-[1fr_320px] gap-4">
        {/* Recent applications */}
        <div className="bg-white rounded-[10px] border border-spektr-border p-5">
          <div className="flex justify-between items-center mb-4">
            <span className="font-montserrat font-bold text-sm">Candidatures récentes</span>
            <Link to="/candidatures" className="text-xs text-spektr-teal font-semibold no-underline">
              Voir toutes →
            </Link>
          </div>
          {recentApps.length === 0 ? (
            <div className="text-center py-8 text-gray-400 text-sm">
              <div className="text-[32px] mb-2">📭</div>
              <p>Aucune candidature pour l'instant</p>
              <Link
                to="/candidatures"
                className="inline-block mt-3 px-4 py-2 bg-spektr-teal text-white rounded-lg text-[13px] font-semibold no-underline"
              >
                Ajouter une candidature
              </Link>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {recentApps.map((app) => {
                const colors = STATUT_COLORS[app.statut] ?? { bg: "bg-gray-100", text: "text-gray-500" };
                return (
                  <div key={app.id} className="flex items-center gap-3 py-2.5 border-b border-spektr-bg">
                    <div className={`w-[38px] h-[38px] rounded-full ${colors.bg} flex items-center justify-center font-montserrat font-bold text-[13px] ${colors.text} flex-shrink-0`}>
                      {app.entreprise.slice(0, 2).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-montserrat font-semibold text-[13px] text-spektr-dark truncate">
                        {app.entreprise}
                      </div>
                      <div className="font-source-sans text-[11px] text-gray-400 mt-0.5">
                        {app.date_candidature
                          ? new Date(app.date_candidature).toLocaleDateString("fr-FR")
                          : "—"}
                      </div>
                    </div>
                    <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-[10px] ${colors.bg} ${colors.text} whitespace-nowrap`}>
                      {STATUT_LABELS[app.statut] ?? app.statut}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right column */}
        <div className="flex flex-col gap-4">
          {/* Objectives */}
          <div className="bg-white rounded-[10px] border border-spektr-border p-5">
            <div className="flex justify-between items-center mb-3.5">
              <span className="font-montserrat font-bold text-[13px]">Mes objectifs</span>
              <Link to="/objectifs" className="text-xs text-spektr-teal font-semibold no-underline">
                Voir →
              </Link>
            </div>
            {objectives.length === 0 ? (
              <p className="text-[13px] text-gray-400 text-center py-4">
                Aucun objectif pour l'instant
              </p>
            ) : (
              <div className="flex flex-col gap-2.5">
                {objectives.slice(0, 4).map((obj) => (
                  <div key={obj.id} className="flex items-start gap-2.5">
                    <span className="text-base mt-px">🎯</span>
                    <div className="flex-1">
                      <div className="font-montserrat font-semibold text-xs text-spektr-dark">
                        {obj.title}
                      </div>
                      {obj.deadline && (
                        <div className="font-source-sans text-[11px] text-gray-400 mt-0.5">
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
          <div className="bg-spektr-teal/[0.06] rounded-[10px] border border-spektr-teal/20 p-5">
            <div className="font-montserrat font-bold text-[13px] text-spektr-teal mb-3">
              Actions rapides
            </div>
            <div className="flex flex-col gap-2">
              <Link
                to="/candidatures"
                className="flex items-center gap-2 px-3 py-2 bg-white rounded-lg border border-spektr-border no-underline font-source-sans text-[13px] text-spektr-dark font-semibold"
              >
                <span>📨</span> Nouvelle candidature
              </Link>
              <Link
                to="/docs"
                className="flex items-center gap-2 px-3 py-2 bg-white rounded-lg border border-spektr-border no-underline font-source-sans text-[13px] text-spektr-dark font-semibold"
              >
                <span>📄</span> Mes documents
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
