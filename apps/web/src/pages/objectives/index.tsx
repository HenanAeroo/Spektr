import { fetchMyObjectives } from "@/features/objectives/actions/fetchMyObjectives";
import { fetchObjectives } from "@/features/objectives/actions/fetchObjectives";
import { Objective } from "@/features/objectives/types";
import { useRole } from "@/shared/hooks/useRole";
import { useEffect, useState } from "react";

const ObjectivesPage = () => {
  const [objectives, setObjectives] = useState<Objective[]>([]);
  const role = useRole();

  useEffect(() => {
    if (role === "ADMIN") {
      fetchObjectives().then((data) => setObjectives(data));
    } else {
      fetchMyObjectives().then((data) => setObjectives(data));
    }
  }, []);

  if (role === "ADMIN") {
    const grouped = objectives.reduce<Record<number, Objective[]>>(
      (acc, obj) => {
        (acc[obj.promoId] ??= []).push(obj);
        return acc;
      },
      {},
    );

    return (
      <div className="p-6 space-y-8">
        <h1 className="text-2xl font-bold">Objectifs par promo</h1>
        {Object.entries(grouped).map(([promoId, objs]) => (
          <section key={promoId}>
            <h2 className="text-lg font-semibold mb-3">Promo {promoId}</h2>
            <ul className="space-y-2">
              {objs.map((obj) => (
                <li key={obj.id} className="border rounded-md p-4">
                  <p className="font-medium">{obj.title}</p>
                  {obj.description && (
                    <p className="text-sm text-muted-foreground mt-1">
                      {obj.description}
                    </p>
                  )}
                  {obj.deadline && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Deadline : {new Date(obj.deadline).toLocaleDateString()}
                    </p>
                  )}
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    );
  }

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-bold">Mes objectifs</h1>
      <ul className="space-y-2">
        {objectives.map((obj) => (
          <li key={obj.id} className="border rounded-md p-4">
            <p className="font-medium">{obj.title}</p>
            {obj.description && (
              <p className="text-sm text-muted-foreground mt-1">
                {obj.description}
              </p>
            )}
            {obj.deadline && (
              <p className="text-xs text-muted-foreground mt-1">
                Deadline : {new Date(obj.deadline).toLocaleDateString()}
              </p>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default ObjectivesPage;
