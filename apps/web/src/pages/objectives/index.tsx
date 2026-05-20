import { fetchMyObjectives } from "@/features/objectives/actions/fetchMyObjectives";
import { fetchObjectives } from "@/features/objectives/actions/fetchObjectives";
import { toggleObjectiveCompletion } from "@/features/objectives/actions/toggleObjectiveCompletion";
import { Objective } from "@/features/objectives/types";
import { useRole } from "@/shared/hooks/useRole";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

function ObjectiveCard({ obj, onToggle }: { obj: Objective; onToggle?: () => void }) {
  const now = new Date();
  const deadline = obj.deadline ? new Date(obj.deadline) : null;
  const isExpired = deadline && deadline < now && !obj.done;
  const daysLeft = deadline
    ? Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    : null;

  const borderColor = obj.done
    ? "border-l-green-600"
    : isExpired
      ? "border-l-spektr-red"
      : "border-l-spektr-teal";

  const deadlineBadge = isExpired
    ? "bg-red-100 text-red-600"
    : daysLeft! <= 7
      ? "bg-amber-50 text-amber-600"
      : "bg-green-50 text-green-600";

  return (
    <div
      className={[
        "bg-white rounded-[10px] border border-spektr-border p-5 border-l-[3px] transition-all",
        borderColor,
        obj.done ? "opacity-85" : "",
      ].join(" ")}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1">
          <div
            className={[
              "font-montserrat font-bold text-sm",
              obj.done ? "line-through text-gray-400" : "text-spektr-dark",
            ].join(" ")}
          >
            {obj.title}
          </div>
          {obj.description && (
            <p className="font-source-sans text-[13px] text-gray-500 mt-1.5 leading-relaxed">
              {obj.description}
            </p>
          )}
          {deadline && (
            <div className="font-source-sans text-xs text-gray-400 mt-2">
              📅 {deadline.toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}
            </div>
          )}
        </div>

        <div className="flex flex-col items-end gap-2 flex-shrink-0">
          {deadline && !obj.done && (
            <div className={`px-3 py-1 rounded-[10px] text-[11px] font-bold whitespace-nowrap ${deadlineBadge}`}>
              {isExpired ? "Expiré" : daysLeft === 0 ? "Aujourd'hui" : `J-${daysLeft}`}
            </div>
          )}
          {obj.done && (
            <div className="px-3 py-1 rounded-[10px] bg-green-100 text-green-600 text-[11px] font-bold">
              ✓ Terminé
            </div>
          )}

          {onToggle && (
            <button
              onClick={onToggle}
              className={[
                "px-3.5 py-1.5 rounded-lg border-[1.5px] font-montserrat font-bold text-xs cursor-pointer transition-all whitespace-nowrap",
                obj.done
                  ? "border-spektr-border bg-transparent text-gray-400"
                  : "border-spektr-teal bg-spektr-teal text-white",
              ].join(" ")}
            >
              {obj.done ? "Marquer non fait" : "Marquer fait ✓"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

const ObjectivesPage = () => {
  const role = useRole();
  const queryClient = useQueryClient();

  const { data: queryAdmin = [], isLoading: adminLoading } = useQuery({
    queryKey: ["objectives", "all"],
    queryFn: fetchObjectives,
    enabled: role === "ADMIN",
  });

  const { data: queryStudent = [], isLoading: studentLoading } = useQuery({
    queryKey: ["objectives", "mine"],
    queryFn: fetchMyObjectives,
    enabled: role === "STUDENT",
  });

  const { mutate: toggle } = useMutation({
    mutationFn: toggleObjectiveCompletion,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["objectives", "mine"] }),
  });

  const isLoading = role === "ADMIN" ? adminLoading : studentLoading;
  const objectives = role === "ADMIN" ? queryAdmin : queryStudent;

  if (role === "ADMIN") {
    const grouped = objectives.reduce<Record<number, Objective[]>>((acc, obj) => {
      (acc[obj.promoId] ??= []).push(obj);
      return acc;
    }, {});

    return (
      <div className="py-7 px-8 bg-spektr-bg min-h-full">
        <div className="mb-6">
          <h1 className="font-montserrat font-extrabold text-[22px] text-spektr-dark tracking-[-0.3px]">
            Objectifs par promo
          </h1>
          <p className="font-source-sans text-[13px] text-gray-500 mt-0.5">
            {objectives.length} objectif{objectives.length !== 1 ? "s" : ""} au total
          </p>
        </div>

        {isLoading ? (
          <div className="py-10 text-center text-gray-400">Chargement…</div>
        ) : (
          <div className="flex flex-col gap-6">
            {Object.entries(grouped).map(([promoId, objs]) => (
              <div key={promoId}>
                <div className="font-montserrat font-bold text-[15px] text-spektr-dark mb-3 flex items-center gap-2">
                  <span className="bg-spektr-teal/10 text-spektr-teal px-2.5 py-0.5 rounded-full text-xs font-bold">
                    Promo {promoId}
                  </span>
                  <span className="font-normal text-gray-400 text-[13px]">
                    {objs.length} objectif{objs.length !== 1 ? "s" : ""}
                  </span>
                </div>
                <div className="flex flex-col gap-2.5">
                  {objs.map((obj) => <ObjectiveCard key={obj.id} obj={obj} />)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  const doneCount = objectives.filter((o) => o.done).length;
  const progressPct = objectives.length > 0 ? (doneCount / objectives.length) * 100 : 0;

  return (
    <div className="py-7 px-8 bg-spektr-bg min-h-full">
      <div className="mb-6">
        <h1 className="font-montserrat font-extrabold text-[22px] text-spektr-dark tracking-[-0.3px]">
          Mes objectifs
        </h1>
        <p className="font-source-sans text-[13px] text-gray-500 mt-0.5">
          {objectives.length > 0
            ? `${doneCount} / ${objectives.length} accomplis`
            : "Vos objectifs fixés par votre chargé RE"}
        </p>
        {objectives.length > 0 && (
          <div className="mt-2.5 h-1.5 rounded-full bg-spektr-border overflow-hidden max-w-[320px]">
            <div
              className="h-full rounded-full bg-spektr-teal transition-[width] duration-400 ease-in-out"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        )}
      </div>

      {isLoading ? (
        <div className="py-10 text-center text-gray-400">Chargement…</div>
      ) : objectives.length === 0 ? (
        <div className="bg-white rounded-[10px] border border-spektr-border py-[60px] px-10 text-center">
          <div className="text-[40px] mb-3">🎯</div>
          <p className="font-montserrat font-semibold text-[15px] text-gray-500">
            Aucun objectif pour l'instant
          </p>
          <p className="font-source-sans text-[13px] text-gray-400 mt-1">
            Vos objectifs apparaîtront ici une fois qu'ils seront définis par votre chargé RE.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {objectives.map((obj) => (
            <ObjectiveCard key={obj.id} obj={obj} onToggle={() => toggle(obj.id)} />
          ))}
        </div>
      )}
    </div>
  );
};

export default ObjectivesPage;
