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

  return (
    <div style={{
      background: "#fff",
      borderRadius: 10,
      border: "1px solid #e8e8e8",
      padding: 20,
      borderLeft: obj.done ? "3px solid #16a34a" : isExpired ? "3px solid #e05252" : "3px solid #23b2a4",
      opacity: obj.done ? 0.85 : 1,
      transition: "all 0.2s",
    }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontFamily: "Montserrat, sans-serif", fontWeight: 700, fontSize: 14, textDecoration: obj.done ? "line-through" : "none", color: obj.done ? "#9ca3af" : "#1d1d1e" }}>
            {obj.title}
          </div>
          {obj.description && (
            <p style={{ fontFamily: "Source Sans 3, sans-serif", fontSize: 13, color: "#6b7280", marginTop: 6, lineHeight: 1.5 }}>
              {obj.description}
            </p>
          )}
          {deadline && (
            <div style={{ fontFamily: "Source Sans 3, sans-serif", fontSize: 12, color: "#9ca3af", marginTop: 8 }}>
              📅 {deadline.toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}
            </div>
          )}
        </div>

        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 8, flexShrink: 0 }}>
          {deadline && !obj.done && (
            <div style={{
              padding: "4px 12px",
              borderRadius: 10,
              background: isExpired ? "#fee2e2" : daysLeft! <= 7 ? "#fff7ed" : "#f0fdf4",
              color: isExpired ? "#dc2626" : daysLeft! <= 7 ? "#d97706" : "#16a34a",
              fontSize: 11,
              fontWeight: 700,
              whiteSpace: "nowrap",
            }}>
              {isExpired ? "Expiré" : daysLeft === 0 ? "Aujourd'hui" : `J-${daysLeft}`}
            </div>
          )}
          {obj.done && (
            <div style={{ padding: "4px 12px", borderRadius: 10, background: "#dcfce7", color: "#16a34a", fontSize: 11, fontWeight: 700 }}>
              ✓ Terminé
            </div>
          )}

          {onToggle && (
            <button
              onClick={onToggle}
              style={{
                padding: "6px 14px",
                borderRadius: 8,
                border: obj.done ? "1.5px solid #e8e8e8" : "1.5px solid #23b2a4",
                background: obj.done ? "transparent" : "#23b2a4",
                color: obj.done ? "#9ca3af" : "#fff",
                fontFamily: "Montserrat, sans-serif",
                fontWeight: 700,
                fontSize: 12,
                cursor: "pointer",
                transition: "all 0.15s",
                whiteSpace: "nowrap",
              }}
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
      <div style={{ padding: "28px 32px", background: "#f5f5f5", minHeight: "100%" }}>
        <div style={{ marginBottom: 24 }}>
          <h1 style={{ fontFamily: "Montserrat, sans-serif", fontWeight: 800, fontSize: 22, color: "#1d1d1e", letterSpacing: "-0.3px" }}>
            Objectifs par promo
          </h1>
          <p style={{ fontFamily: "Source Sans 3, sans-serif", fontSize: 13, color: "#6b7280", marginTop: 3 }}>
            {objectives.length} objectif{objectives.length !== 1 ? "s" : ""} au total
          </p>
        </div>

        {isLoading ? (
          <div style={{ padding: 40, textAlign: "center", color: "#9ca3af" }}>Chargement…</div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
            {Object.entries(grouped).map(([promoId, objs]) => (
              <div key={promoId}>
                <div style={{ fontFamily: "Montserrat, sans-serif", fontWeight: 700, fontSize: 15, color: "#1d1d1e", marginBottom: 12, display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ background: "rgba(35,178,164,0.1)", color: "#23b2a4", padding: "3px 10px", borderRadius: 20, fontSize: 12, fontWeight: 700 }}>
                    Promo {promoId}
                  </span>
                  <span style={{ fontWeight: 400, color: "#9ca3af", fontSize: 13 }}>{objs.length} objectif{objs.length !== 1 ? "s" : ""}</span>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
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

  return (
    <div style={{ padding: "28px 32px", background: "#f5f5f5", minHeight: "100%" }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontFamily: "Montserrat, sans-serif", fontWeight: 800, fontSize: 22, color: "#1d1d1e", letterSpacing: "-0.3px" }}>
          Mes objectifs
        </h1>
        <p style={{ fontFamily: "Source Sans 3, sans-serif", fontSize: 13, color: "#6b7280", marginTop: 3 }}>
          {objectives.length > 0 ? `${doneCount} / ${objectives.length} accomplis` : "Vos objectifs fixés par votre chargé RE"}
        </p>
        {objectives.length > 0 && (
          <div style={{ marginTop: 10, height: 6, borderRadius: 999, background: "#e8e8e8", overflow: "hidden", maxWidth: 320 }}>
            <div style={{ height: "100%", borderRadius: 999, background: "#23b2a4", width: `${(doneCount / objectives.length) * 100}%`, transition: "width 0.4s ease" }} />
          </div>
        )}
      </div>

      {isLoading ? (
        <div style={{ padding: 40, textAlign: "center", color: "#9ca3af" }}>Chargement…</div>
      ) : objectives.length === 0 ? (
        <div style={{ background: "#fff", borderRadius: 10, border: "1px solid #e8e8e8", padding: "60px 40px", textAlign: "center" }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>🎯</div>
          <p style={{ fontFamily: "Montserrat, sans-serif", fontWeight: 600, fontSize: 15, color: "#6b7280" }}>
            Aucun objectif pour l'instant
          </p>
          <p style={{ fontFamily: "Source Sans 3, sans-serif", fontSize: 13, color: "#9ca3af", marginTop: 4 }}>
            Vos objectifs apparaîtront ici une fois qu'ils seront définis par votre chargé RE.
          </p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {objectives.map((obj) => (
            <ObjectiveCard key={obj.id} obj={obj} onToggle={() => toggle(obj.id)} />
          ))}
        </div>
      )}
    </div>
  );
};

export default ObjectivesPage;
