import { fetchMyObjectives } from "@/features/objectives/actions/fetchMyObjectives";
import { fetchObjectives } from "@/features/objectives/actions/fetchObjectives";
import { Objective } from "@/features/objectives/types";
import { useRole } from "@/shared/hooks/useRole";
import { useQuery } from "@tanstack/react-query";

function ObjectiveCard({ obj }: { obj: Objective }) {
  const now = new Date();
  const deadline = obj.deadline ? new Date(obj.deadline) : null;
  const isExpired = deadline && deadline < now;
  const daysLeft = deadline
    ? Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    : null;

  return (
    <div style={{
      background: "#fff",
      borderRadius: 10,
      border: "1px solid #e8e8e8",
      padding: 20,
      borderLeft: isExpired ? "3px solid #e05252" : "3px solid #23b2a4",
    }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontFamily: "Montserrat, sans-serif", fontWeight: 700, fontSize: 14, color: "#1d1d1e" }}>
            {obj.title}
          </div>
          {obj.description && (
            <p style={{ fontFamily: "Source Sans 3, sans-serif", fontSize: 13, color: "#6b7280", marginTop: 6, lineHeight: 1.5 }}>
              {obj.description}
            </p>
          )}
        </div>
        {deadline && (
          <div style={{
            padding: "4px 12px",
            borderRadius: 10,
            background: isExpired ? "#fee2e2" : daysLeft! <= 7 ? "#fff7ed" : "#f0fdf4",
            color: isExpired ? "#dc2626" : daysLeft! <= 7 ? "#d97706" : "#16a34a",
            fontSize: 11,
            fontWeight: 700,
            whiteSpace: "nowrap",
          }}>
            {isExpired
              ? "Expiré"
              : daysLeft === 0
                ? "Aujourd'hui"
                : `J-${daysLeft}`}
          </div>
        )}
      </div>
      {deadline && (
        <div style={{ fontFamily: "Source Sans 3, sans-serif", fontSize: 12, color: "#9ca3af", marginTop: 8 }}>
          📅 Deadline : {deadline.toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}
        </div>
      )}
    </div>
  );
}

const ObjectivesPage = () => {
  const role = useRole();

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

  return (
    <div style={{ padding: "28px 32px", background: "#f5f5f5", minHeight: "100%" }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontFamily: "Montserrat, sans-serif", fontWeight: 800, fontSize: 22, color: "#1d1d1e", letterSpacing: "-0.3px" }}>
          Mes objectifs
        </h1>
        <p style={{ fontFamily: "Source Sans 3, sans-serif", fontSize: 13, color: "#6b7280", marginTop: 3 }}>
          Vos objectifs fixés par votre chargé RE
        </p>
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
          {objectives.map((obj) => <ObjectiveCard key={obj.id} obj={obj} />)}
        </div>
      )}
    </div>
  );
};

export default ObjectivesPage;
