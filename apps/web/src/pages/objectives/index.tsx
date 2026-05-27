import { fetchMyObjectives } from "@/features/objectives/actions/fetchMyObjectives";
import { fetchObjectives } from "@/features/objectives/actions/fetchObjectives";
import { toggleObjectiveCompletion } from "@/features/objectives/actions/toggleObjectiveCompletion";
import { ObjectiveCard } from "@/features/objectives/components/ObjectivesCard";
import { Objective } from "@/features/objectives/types";
import { useRole } from "@/shared/hooks/useRole";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

const ObjectivesPage = () => {
  const role = useRole();
  const queryClient = useQueryClient();

  const { data: queryAdmin = [], isLoading: adminLoading } = useQuery({
    queryKey: ["objectives", "all"],
    queryFn: fetchObjectives,
    enabled: role === "ADMIN",
    staleTime: 5 * 60 * 1000,
  });

  const { data: queryStudent = [], isLoading: studentLoading } = useQuery({
    queryKey: ["objectives", "mine"],
    queryFn: fetchMyObjectives,
    enabled: role === "STUDENT",
    staleTime: 5 * 60 * 1000,
  });

  const { mutate: toggle } = useMutation({
    mutationFn: toggleObjectiveCompletion,
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["objectives", "mine"] }),
  });

  const isLoading = role === "ADMIN" ? adminLoading : studentLoading;
  const objectives = role === "ADMIN" ? queryAdmin : queryStudent;

  if (role === "ADMIN") {
    const grouped = objectives.reduce<Record<number, Objective[]>>(
      (acc, obj) => {
        (acc[obj.promoId] ??= []).push(obj);
        return acc;
      },
      {},
    );

    return (
      <div className="py-7 px-8 bg-spektr-bg min-h-full">
        <div className="mb-6">
          <h1 className="font-montserrat font-extrabold text-[22px] text-spektr-dark tracking-[-0.3px]">
            Objectifs par promo
          </h1>
          <p className="font-source-sans text-[13px] text-gray-500 mt-0.5">
            {objectives.length} objectif{objectives.length !== 1 ? "s" : ""} au
            total
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
                  {objs.map((obj) => (
                    <ObjectiveCard key={obj.id} obj={obj} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  const doneCount = objectives.filter((o) => o.done).length;
  const progressPct =
    objectives.length > 0 ? (doneCount / objectives.length) * 100 : 0;

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
            Vos objectifs apparaîtront ici une fois qu'ils seront définis par
            votre chargé RE.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {objectives.map((obj) => (
            <ObjectiveCard
              key={obj.id}
              obj={obj}
              onToggle={() => toggle(obj.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default ObjectivesPage;
