import { fetchObjectives } from "@/features/objectives/actions/fetchObjectives";
import { fetchRecentActivity } from "@/features/objectives/actions/fetchRecentActivity";
import { useQuery } from "@tanstack/react-query";
import { Card } from "./Card";
import { ProgressBar } from "./ProgressBar";

export function Dashboard({
  navigate,
  users,
  promos,
}: {
  navigate: (p: string) => void;
  users: any[];
  promos: any[];
}) {
  const students = users.filter((u) => u.role === "STUDENT");
  const { data: objectives = [] } = useQuery({
    queryKey: ["objectives", "all"],
    queryFn: fetchObjectives,
    staleTime: 5 * 60 * 1000,
  });
  const { data: recentActivity = [] } = useQuery({
    queryKey: ["objectives", "recent-activity"],
    queryFn: fetchRecentActivity,
    staleTime: 2 * 60 * 1000,
  });

  const metrics = [
    {
      label: "Étudiants suivis",
      value: students.length,
      delta: "Total enregistrés",
      icon: "👤",
    },
    {
      label: "Promos actives",
      value: promos.length,
      delta: "Filières",
      icon: "🎓",
    },
    {
      label: "Objectifs définis",
      value: objectives.length,
      delta: "Pour les étudiants",
      icon: "🎯",
    },
  ];

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-montserrat font-extrabold text-[22px] text-spektr-dark tracking-[-0.3px]">
          Tableau de bord RE
        </h1>
        <p className="font-source-sans text-[13px] text-gray-500 mt-0.5">
          Vue d'ensemble de votre promotion
        </p>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-5">
        {metrics.map((m, i) => (
          <Card key={i}>
            <div className="text-[28px] mb-2">{m.icon}</div>
            <div className="font-montserrat font-extrabold text-[36px] text-spektr-dark tracking-[-1px]">
              {m.value}
            </div>
            <div className="font-montserrat font-semibold text-[11px] text-gray-500 uppercase tracking-[0.5px] mt-1">
              {m.label}
            </div>
            <div className="font-source-sans text-xs text-gray-500 mt-0.5">
              {m.delta}
            </div>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-[1fr_320px] gap-4">
        <Card>
          <div className="flex justify-between items-center mb-4">
            <span className="font-montserrat font-bold text-sm">
              Dernières activités
            </span>
            <button
              onClick={() => navigate("students")}
              className="text-xs text-spektr-teal-accessible font-semibold bg-transparent border-none cursor-pointer"
            >
              Voir les étudiants →
            </button>
          </div>
          {recentActivity.length === 0 ? (
            <p className="font-source-sans text-[13px] text-gray-500 text-center py-6">
              Aucune activité récente
            </p>
          ) : (
            <div className="flex flex-col gap-2.5">
              {recentActivity.map((activity) => {
                const initials =
                  `${activity.user.first_name?.[0] ?? ""}${activity.user.last_name?.[0] ?? ""}`.toUpperCase() ||
                  "?";
                const promo = promos.find(
                  (p: any) => p.id === activity.user.promoId,
                );
                const date = new Date(activity.modified_at);
                const relativeTime = (() => {
                  const diff = Date.now() - date.getTime();
                  const mins = Math.floor(diff / 60000);
                  if (mins < 60) return `il y a ${mins} min`;
                  const hours = Math.floor(mins / 60);
                  if (hours < 24) return `il y a ${hours}h`;
                  return `il y a ${Math.floor(hours / 24)}j`;
                })();
                return (
                  <button
                    type="button"
                    key={activity.id}
                    className="flex items-center gap-3 px-2.5 py-2.5 w-full text-left border-b border-spektr-bg rounded-lg transition-colors hover:bg-[#f9fafb]"
                    onClick={() =>
                      navigate(`student-detail:${activity.user.id}`)
                    }
                  >
                    <div className="w-[34px] h-[34px] rounded-full bg-green-100 text-green-600 flex items-center justify-center font-montserrat font-bold text-xs flex-shrink-0">
                      {initials}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-montserrat font-semibold text-[13px] text-spektr-dark truncate">
                        {activity.user.first_name} {activity.user.last_name}
                      </div>
                      <div className="font-source-sans text-[11px] text-gray-500 truncate">
                        ✅ {activity.objective.title}
                        {promo && (
                          <span className="ml-1.5 text-spektr-teal-accessible">
                            · {promo.name}
                          </span>
                        )}
                      </div>
                    </div>
                    <span className="font-source-sans text-[10px] text-gray-500 whitespace-nowrap flex-shrink-0">
                      {relativeTime}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </Card>

        <div className="flex flex-col gap-4">
          <Card>
            <div className="font-montserrat font-bold text-[13px] mb-3">
              Répartition par promo
            </div>
            {promos.length === 0 ? (
              <p className="font-source-sans text-[13px] text-gray-500">
                Aucune promo
              </p>
            ) : (
              <div className="flex flex-col gap-2.5">
                {promos.map((p: any) => {
                  const count = users.filter((u) => u.promoId === p.id).length;
                  const pct =
                    students.length > 0
                      ? Math.round((count / students.length) * 100)
                      : 0;
                  return (
                    <div key={p.id}>
                      <div className="flex justify-between mb-1">
                        <span className="font-montserrat font-semibold text-xs">
                          {p.name}
                        </span>
                        <span className="font-source-sans text-[11px] text-gray-500">
                          {count} étudiant{count !== 1 ? "s" : ""}
                        </span>
                      </div>
                      <ProgressBar pct={pct} />
                    </div>
                  );
                })}
              </div>
            )}
          </Card>

          <Card>
            <div className="font-montserrat font-bold text-[13px] mb-2.5">
              Objectifs
            </div>
            {objectives.length === 0 ? (
              <p className="font-source-sans text-[13px] text-gray-500">
                Aucun objectif défini
              </p>
            ) : (
              <div className="flex flex-col gap-2">
                {objectives.slice(0, 4).map((obj) => (
                  <div key={obj.id} className="flex items-center gap-2">
                    <span className="text-sm">🎯</span>
                    <span className="font-source-sans text-xs text-spektr-dark">
                      {obj.title}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
