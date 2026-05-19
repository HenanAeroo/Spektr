import { assignPromo } from "@/features/promos/actions/assignPromo";
import { createPromo, CreatePromoData } from "@/features/promos/actions/createPromo";
import { deletePromo } from "@/features/promos/actions/deletePromo";
import { fetchPromos } from "@/features/promos/actions/fetchPromos";
import { fetchUsers } from "@/features/promos/actions/fetchUsers";
import { fetchObjectives } from "@/features/objectives/actions/fetchObjectives";
import { createObjective, CreateObjectiveData } from "@/features/objectives/actions/createObjective";
import { deleteObjective } from "@/features/objectives/actions/deleteObjective";
import { fetchUserApplications } from "@/features/applications/actions/fetchUserApplications";
import { getUserDocuments } from "@/features/documents/actions/getUserDocuments";
import { useProfile } from "@/features/profile/hooks/use-profile";
import { useAuthContext } from "@/shared/components/auth-provider";
import { Calendar } from "@/shared/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/shared/components/ui/popover";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { useState } from "react";
import { useNavigate, useSearch } from "@tanstack/react-router";

/* ── shared types ── */
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

const STATUT_STATUS_COLORS = {
  ok:     { bg: "#dcfce7", color: "#16a34a", border: "#bbf7d0" },
  suivre: { bg: "#fff7ed", color: "#d97706", border: "#fed7aa" },
  retard: { bg: "#fee2e2", color: "#dc2626", border: "#fecaca" },
} as const;

function StatusBadge({ status, label }: { status: keyof typeof STATUT_STATUS_COLORS; label: string }) {
  const c = STATUT_STATUS_COLORS[status];
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 600, background: c.bg, color: c.color, border: `1px solid ${c.border}` }}>
      <span style={{ width: 6, height: 6, borderRadius: "50%", background: c.color, display: "inline-block" }} />
      {label}
    </span>
  );
}

function ProgressBar({ pct, color = "#23b2a4" }: { pct: number; color?: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <div style={{ flex: 1, height: 6, background: "#f0f0f0", borderRadius: 10, overflow: "hidden" }}>
        <div style={{ width: `${pct}%`, height: "100%", background: color, borderRadius: 10 }} />
      </div>
      <span style={{ fontSize: 11, fontWeight: 600, color, minWidth: 32 }}>{pct}%</span>
    </div>
  );
}

function Card({ children, style = {} }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{ background: "#fff", border: "1px solid #e8e8e8", borderRadius: 10, padding: 20, ...style }}>
      {children}
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "9px 12px",
  border: "1.5px solid #e8e8e8",
  borderRadius: 8,
  fontFamily: "Source Sans 3, sans-serif",
  fontSize: 13,
  outline: "none",
  boxSizing: "border-box",
  color: "#1d1d1e",
  background: "#fff",
};

/* ── Dashboard ── */
function Dashboard({ navigate, users, promos }: { navigate: (p: string) => void; users: any[]; promos: any[] }) {
  const students = users.filter((u) => u.role === "STUDENT");
  const { data: objectives = [] } = useQuery({ queryKey: ["objectives", "all"], queryFn: fetchObjectives });

  const metrics = [
    { label: "Étudiants suivis",    value: students.length, delta: "Total enregistrés", icon: "👤" },
    { label: "Promos actives",       value: promos.length,  delta: "Filières",           icon: "🎓" },
    { label: "Objectifs définis",    value: objectives.length, delta: "Pour les étudiants", icon: "🎯" },
  ];

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontFamily: "Montserrat, sans-serif", fontWeight: 800, fontSize: 22, color: "#1d1d1e", letterSpacing: "-0.3px" }}>
          Tableau de bord RE
        </h1>
        <p style={{ fontFamily: "Source Sans 3, sans-serif", fontSize: 13, color: "#6b7280", marginTop: 3 }}>
          Vue d'ensemble de votre promotion
        </p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, marginBottom: 20 }}>
        {metrics.map((m, i) => (
          <Card key={i}>
            <div style={{ fontSize: 28, marginBottom: 8 }}>{m.icon}</div>
            <div style={{ fontFamily: "Montserrat, sans-serif", fontWeight: 800, fontSize: 36, color: "#1d1d1e", letterSpacing: "-1px" }}>{m.value}</div>
            <div style={{ fontFamily: "Montserrat, sans-serif", fontWeight: 600, fontSize: 11, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.5px", marginTop: 4 }}>{m.label}</div>
            <div style={{ fontFamily: "Source Sans 3, sans-serif", fontSize: 12, color: "#9ca3af", marginTop: 2 }}>{m.delta}</div>
          </Card>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: 16 }}>
        <Card>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <span style={{ fontFamily: "Montserrat, sans-serif", fontWeight: 700, fontSize: 14 }}>Étudiants</span>
            <button onClick={() => navigate("students")} style={{ fontSize: 12, color: "#23b2a4", fontWeight: 600, background: "none", border: "none", cursor: "pointer" }}>Voir tous →</button>
          </div>
          {students.length === 0 ? (
            <p style={{ fontFamily: "Source Sans 3, sans-serif", fontSize: 13, color: "#9ca3af", textAlign: "center", padding: "24px 0" }}>Aucun étudiant enregistré</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {students.slice(0, 6).map((u) => {
                const initials = `${u.first_name?.[0] ?? ""}${u.last_name?.[0] ?? ""}`.toUpperCase() || "?";
                const promo = promos.find((p: any) => p.id === u.promoId);
                return (
                  <div key={u.id}
                    style={{ display: "flex", alignItems: "center", gap: 12, padding: "8px 10px", borderBottom: "1px solid #f5f5f5", borderRadius: 8, cursor: "pointer", transition: "background 0.15s" }}
                    onClick={() => navigate(`student-detail:${u.id}`)}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "#f9fafb")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                  >
                    <div style={{ width: 34, height: 34, borderRadius: "50%", background: "#dcfce7", color: "#16a34a", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "Montserrat, sans-serif", fontWeight: 700, fontSize: 12, flexShrink: 0 }}>{initials}</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontFamily: "Montserrat, sans-serif", fontWeight: 600, fontSize: 13, color: "#1d1d1e" }}>{u.first_name} {u.last_name}</div>
                      <div style={{ fontFamily: "Source Sans 3, sans-serif", fontSize: 11, color: "#9ca3af" }}>{promo?.name ?? "Sans promo"}</div>
                    </div>
                    <StatusBadge status="ok" label="Actif" />
                  </div>
                );
              })}
            </div>
          )}
        </Card>

        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <Card>
            <div style={{ fontFamily: "Montserrat, sans-serif", fontWeight: 700, fontSize: 13, marginBottom: 12 }}>Répartition par promo</div>
            {promos.length === 0 ? (
              <p style={{ fontFamily: "Source Sans 3, sans-serif", fontSize: 13, color: "#9ca3af" }}>Aucune promo</p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {promos.map((p: any) => {
                  const count = users.filter((u) => u.promoId === p.id).length;
                  const pct = students.length > 0 ? Math.round((count / students.length) * 100) : 0;
                  return (
                    <div key={p.id}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                        <span style={{ fontFamily: "Montserrat, sans-serif", fontWeight: 600, fontSize: 12 }}>{p.name}</span>
                        <span style={{ fontFamily: "Source Sans 3, sans-serif", fontSize: 11, color: "#9ca3af" }}>{count} étudiant{count !== 1 ? "s" : ""}</span>
                      </div>
                      <ProgressBar pct={pct} />
                    </div>
                  );
                })}
              </div>
            )}
          </Card>

          <Card>
            <div style={{ fontFamily: "Montserrat, sans-serif", fontWeight: 700, fontSize: 13, marginBottom: 10 }}>Objectifs</div>
            {objectives.length === 0 ? (
              <p style={{ fontFamily: "Source Sans 3, sans-serif", fontSize: 13, color: "#9ca3af" }}>Aucun objectif défini</p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {objectives.slice(0, 4).map((obj) => (
                  <div key={obj.id} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontSize: 14 }}>🎯</span>
                    <span style={{ fontFamily: "Source Sans 3, sans-serif", fontSize: 12, color: "#1d1d1e" }}>{obj.title}</span>
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

/* ── Students List ── */
function StudentsList({ users, promos, navigate }: { users: any[]; promos: any[]; navigate: (p: string) => void }) {
  const [search, setSearch] = useState("");
  const [showContact, setShowContact] = useState(false);
  const [selected, setSelected] = useState<number[]>([]);
  const [subject, setSubject] = useState("Suivi — Votre recherche d'alternance");
  const [message, setMessage] = useState("Bonjour,\n\nNous souhaitons faire le point sur votre recherche d'alternance.\n\nN'hésitez pas à nous contacter pour planifier un rendez-vous.\n\nCordialement,\nL'équipe Relations Entreprises — Ynov Campus Rennes");

  const students = users.filter((u) => u.role === "STUDENT");
  const filtered = students.filter((u) => {
    if (!search) return true;
    const name = `${u.first_name} ${u.last_name}`.toLowerCase();
    return name.includes(search.toLowerCase()) || u.email?.toLowerCase().includes(search.toLowerCase());
  });

  const handleSendOutlook = () => {
    const recipients = users.filter((u) => selected.includes(u.id)).map((u) => u.email).join(";");
    window.open(`mailto:${recipients}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(message)}`, "_blank");
  };

  return (
    <div>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 24 }}>
        <div>
          <h1 style={{ fontFamily: "Montserrat, sans-serif", fontWeight: 800, fontSize: 22, color: "#1d1d1e" }}>Étudiants</h1>
          <p style={{ fontFamily: "Source Sans 3, sans-serif", fontSize: 13, color: "#6b7280", marginTop: 3 }}>{students.length} étudiant{students.length !== 1 ? "s" : ""} suivis</p>
        </div>
        <button onClick={() => setShowContact(true)} style={{ padding: "10px 16px", borderRadius: 8, border: "1.5px solid #23b2a4", background: "transparent", color: "#23b2a4", fontFamily: "Montserrat, sans-serif", fontWeight: 700, fontSize: 13, cursor: "pointer" }}>
          ✉ Contacter des étudiants
        </button>
      </div>

      <Card style={{ padding: 0 }}>
        <div style={{ padding: "14px 20px", borderBottom: "1px solid #e8e8e8", display: "flex", gap: 12, alignItems: "center" }}>
          <div style={{ position: "relative", flex: 1, maxWidth: 320 }}>
            <span style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "#9ca3af", pointerEvents: "none" }}>🔍</span>
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Rechercher un étudiant..."
              style={{ ...inputStyle, paddingLeft: 30 }}
              onFocus={(e) => (e.target.style.borderColor = "#23b2a4")}
              onBlur={(e) => (e.target.style.borderColor = "#e8e8e8")} />
          </div>
        </div>

        {filtered.length === 0 ? (
          <div style={{ padding: "60px 40px", textAlign: "center" }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>👥</div>
            <p style={{ fontFamily: "Montserrat, sans-serif", fontWeight: 600, fontSize: 14, color: "#6b7280" }}>Aucun étudiant trouvé</p>
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "#fafafa" }}>
                  {["Étudiant", "Email", "Promotion", "Statut", "Actions"].map((h) => (
                    <th key={h} style={{ padding: "12px 16px", textAlign: "left", fontSize: 11, fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.5px", borderBottom: "1px solid #e8e8e8" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((u) => {
                  const initials = `${u.first_name?.[0] ?? ""}${u.last_name?.[0] ?? ""}`.toUpperCase() || "?";
                  const promo = promos.find((p: any) => p.id === u.promoId);
                  return (
                    <tr key={u.id} style={{ borderBottom: "1px solid #e8e8e8", transition: "background 0.15s", cursor: "pointer" }}
                      onClick={() => navigate(`student-detail:${u.id}`)}
                      onMouseEnter={(e) => (e.currentTarget.style.background = "#fafafa")}
                      onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                    >
                      <td style={{ padding: "14px 16px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          <div style={{ width: 32, height: 32, borderRadius: "50%", background: "#dcfce7", color: "#16a34a", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "Montserrat, sans-serif", fontWeight: 700, fontSize: 12, flexShrink: 0 }}>{initials}</div>
                          <div style={{ fontFamily: "Montserrat, sans-serif", fontWeight: 600, fontSize: 13 }}>{u.first_name} {u.last_name}</div>
                        </div>
                      </td>
                      <td style={{ padding: "14px 16px", fontFamily: "Source Sans 3, sans-serif", fontSize: 12, color: "#6b7280" }}>{u.email}</td>
                      <td style={{ padding: "14px 16px" }}>
                        {promo ? (
                          <span style={{ background: "rgba(35,178,164,0.1)", color: "#23b2a4", fontSize: 11, fontWeight: 600, padding: "3px 10px", borderRadius: 10 }}>{promo.name}</span>
                        ) : (
                          <span style={{ color: "#9ca3af", fontSize: 12 }}>—</span>
                        )}
                      </td>
                      <td style={{ padding: "14px 16px" }}>
                        <StatusBadge status="ok" label="Actif" />
                      </td>
                      <td style={{ padding: "14px 16px" }} onClick={(e) => e.stopPropagation()}>
                        <button onClick={() => navigate(`student-detail:${u.id}`)}
                          style={{ background: "rgba(35,178,164,0.1)", border: "none", borderRadius: 6, padding: "6px 10px", cursor: "pointer", fontSize: 12, fontWeight: 600, color: "#23b2a4" }}>
                          👁 Voir
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Contact modal */}
      {showContact && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ background: "#fff", borderRadius: 16, width: 640, maxHeight: "90vh", overflow: "auto", boxShadow: "0 24px 80px rgba(0,0,0,0.2)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "22px 28px", borderBottom: "1px solid #e8e8e8" }}>
              <div>
                <div style={{ fontFamily: "Montserrat, sans-serif", fontWeight: 800, fontSize: 17 }}>Contacter des étudiants</div>
                <div style={{ fontFamily: "Source Sans 3, sans-serif", fontSize: 12, color: "#9ca3af", marginTop: 2 }}>
                  Le message s'ouvrira dans votre client email
                </div>
              </div>
              <button onClick={() => setShowContact(false)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 20, color: "#9ca3af" }}>✕</button>
            </div>
            <div style={{ padding: "22px 28px", display: "flex", flexDirection: "column", gap: 16 }}>
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                  <span style={{ fontFamily: "Montserrat, sans-serif", fontWeight: 700, fontSize: 13 }}>
                    Destinataires <span style={{ color: "#23b2a4" }}>{selected.length}</span> sélectionné{selected.length > 1 ? "s" : ""}
                  </span>
                  <div style={{ display: "flex", gap: 10 }}>
                    <button onClick={() => setSelected(students.map((u) => u.id))} style={{ fontSize: 11, fontWeight: 600, color: "#6b7280", background: "none", border: "none", cursor: "pointer" }}>Tous</button>
                    <button onClick={() => setSelected([])} style={{ fontSize: 11, fontWeight: 600, color: "#dc2626", background: "none", border: "none", cursor: "pointer" }}>Effacer</button>
                  </div>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 4, maxHeight: 160, overflowY: "auto", border: "1px solid #e8e8e8", borderRadius: 10, padding: 8 }}>
                  {students.map((u) => {
                    const initials = `${u.first_name?.[0] ?? ""}${u.last_name?.[0] ?? ""}`.toUpperCase() || "?";
                    return (
                      <label key={u.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "6px 10px", borderRadius: 8, cursor: "pointer", background: selected.includes(u.id) ? "rgba(35,178,164,0.08)" : "transparent" }}>
                        <input type="checkbox" checked={selected.includes(u.id)} onChange={() => setSelected((prev) => prev.includes(u.id) ? prev.filter((x) => x !== u.id) : [...prev, u.id])}
                          style={{ accentColor: "#23b2a4", width: 15, height: 15, cursor: "pointer" }} />
                        <div style={{ width: 26, height: 26, borderRadius: "50%", background: "#dcfce7", color: "#16a34a", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700 }}>{initials}</div>
                        <span style={{ fontFamily: "Source Sans 3, sans-serif", fontSize: 13 }}>{u.first_name} {u.last_name}</span>
                        <span style={{ fontFamily: "Source Sans 3, sans-serif", fontSize: 11, color: "#9ca3af" }}>{u.email}</span>
                      </label>
                    );
                  })}
                </div>
              </div>
              <div>
                <label style={{ fontFamily: "Montserrat, sans-serif", fontWeight: 600, fontSize: 12, display: "block", marginBottom: 5, color: "#1d1d1e" }}>Objet</label>
                <input value={subject} onChange={(e) => setSubject(e.target.value)} style={{ ...inputStyle }}
                  onFocus={(e) => (e.target.style.borderColor = "#23b2a4")} onBlur={(e) => (e.target.style.borderColor = "#e8e8e8")} />
              </div>
              <div>
                <label style={{ fontFamily: "Montserrat, sans-serif", fontWeight: 600, fontSize: 12, display: "block", marginBottom: 5, color: "#1d1d1e" }}>Message</label>
                <textarea value={message} onChange={(e) => setMessage(e.target.value)} rows={6}
                  style={{ ...inputStyle, resize: "vertical", lineHeight: 1.6 }}
                  onFocus={(e) => (e.target.style.borderColor = "#23b2a4")} onBlur={(e) => (e.target.style.borderColor = "#e8e8e8")} />
              </div>
              <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
                <button onClick={() => setShowContact(false)} style={{ padding: "10px 20px", borderRadius: 8, border: "1.5px solid #e8e8e8", background: "#fff", fontFamily: "Montserrat, sans-serif", fontWeight: 600, fontSize: 13, cursor: "pointer", color: "#6b7280" }}>Annuler</button>
                <button onClick={handleSendOutlook} disabled={selected.length === 0}
                  style={{ padding: "10px 20px", borderRadius: 8, border: "none", background: selected.length === 0 ? "#88d5cf" : "#23b2a4", color: "#fff", fontFamily: "Montserrat, sans-serif", fontWeight: 700, fontSize: 13, cursor: selected.length === 0 ? "not-allowed" : "pointer" }}>
                  ✉ Ouvrir dans Outlook ({selected.length})
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Student Detail ── */
function StudentDetail({ userId, promos, navigate }: { userId: number; promos: any[]; navigate: (p: string) => void }) {
  const [activeTab, setActiveTab] = useState<"profile" | "candidatures" | "documents">("profile");
  const [feedbackScore, setFeedbackScore] = useState<number | null>(null);
  const [feedbackText, setFeedbackText] = useState("");
  const [feedbackSent, setFeedbackSent] = useState(false);

  const { data: users = [] } = useQuery({ queryKey: ["users"], queryFn: fetchUsers });
  const user = users.find((u: any) => u.id === userId);

  const { data: applications = [], isLoading: appsLoading } = useQuery({
    queryKey: ["applications", "user", userId],
    queryFn: () => fetchUserApplications(userId),
    enabled: activeTab === "candidatures",
  });

  const { data: documents = [], isLoading: docsLoading } = useQuery({
    queryKey: ["documents", "user", userId],
    queryFn: () => getUserDocuments(userId),
    enabled: activeTab === "documents",
  });

  if (!user) {
    return (
      <div style={{ textAlign: "center", padding: "60px 0", color: "#9ca3af" }}>
        <div style={{ fontSize: 40, marginBottom: 12 }}>🔍</div>
        <p style={{ fontFamily: "Montserrat, sans-serif", fontWeight: 600, fontSize: 14 }}>Étudiant introuvable</p>
        <button onClick={() => navigate("students")} style={{ marginTop: 16, padding: "8px 16px", borderRadius: 8, border: "1.5px solid #23b2a4", background: "transparent", color: "#23b2a4", cursor: "pointer", fontFamily: "Montserrat, sans-serif", fontWeight: 700, fontSize: 13 }}>Retour</button>
      </div>
    );
  }

  const initials = `${user.first_name?.[0] ?? ""}${user.last_name?.[0] ?? ""}`.toUpperCase() || "?";
  const promo = promos.find((p: any) => p.id === user.promoId);
  const smileys = ["😊", "🙂", "😐", "🙁", "😟"];
  const smileyLabels = ["Très bien", "Bien", "Moyen", "Préoccupant", "Critique"];

  const tabs = [
    { id: "profile" as const, label: "Profil" },
    { id: "candidatures" as const, label: "Candidatures" },
    { id: "documents" as const, label: "Documents" },
  ];

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
        <button onClick={() => navigate("students")} style={{ background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 6, color: "#6b7280", fontFamily: "Source Sans 3, sans-serif", fontSize: 13 }}>
          ← Retour
        </button>
        <span style={{ color: "#e8e8e8" }}>|</span>
        <h1 style={{ fontFamily: "Montserrat, sans-serif", fontWeight: 800, fontSize: 20, color: "#1d1d1e" }}>{user.first_name} {user.last_name}</h1>
        <StatusBadge status="ok" label="Actif" />
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 4, marginBottom: 20, background: "#fff", borderRadius: 10, border: "1px solid #e8e8e8", padding: 6, width: "fit-content" }}>
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              padding: "8px 18px",
              borderRadius: 7,
              border: "none",
              cursor: "pointer",
              fontFamily: "Montserrat, sans-serif",
              fontWeight: activeTab === tab.id ? 700 : 500,
              fontSize: 13,
              background: activeTab === tab.id ? "#23b2a4" : "transparent",
              color: activeTab === tab.id ? "#fff" : "#6b7280",
              transition: "all 0.15s",
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "profile" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 260px", gap: 16 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <Card>
              <div style={{ fontFamily: "Montserrat, sans-serif", fontWeight: 700, fontSize: 14, marginBottom: 14 }}>Informations</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                {[
                  { label: "Prénom", value: user.first_name },
                  { label: "Nom", value: user.last_name },
                  { label: "Email", value: user.email },
                  { label: "Promotion", value: promo?.name ?? "—" },
                ].map((f) => (
                  <div key={f.label}>
                    <div style={{ fontFamily: "Montserrat, sans-serif", fontWeight: 600, fontSize: 11, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 3 }}>{f.label}</div>
                    <div style={{ fontFamily: "Source Sans 3, sans-serif", fontSize: 13, fontWeight: 600, color: "#1d1d1e" }}>{f.value || "—"}</div>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <Card>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
                <div style={{ width: 52, height: 52, borderRadius: "50%", background: "#23b2a4", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "Montserrat, sans-serif", fontWeight: 700, fontSize: 18 }}>{initials}</div>
                <div style={{ fontFamily: "Montserrat, sans-serif", fontWeight: 700, fontSize: 14, color: "#1d1d1e" }}>{user.first_name} {user.last_name}</div>
                <div style={{ fontFamily: "Source Sans 3, sans-serif", fontSize: 11, color: "#9ca3af" }}>{promo?.name ?? "Sans promo"}</div>
                <div style={{ fontFamily: "Source Sans 3, sans-serif", fontSize: 11, color: "#23b2a4" }}>{user.email}</div>
              </div>
            </Card>

            <Card>
              <div style={{ fontFamily: "Montserrat, sans-serif", fontWeight: 700, fontSize: 13, marginBottom: 12 }}>Feedback RE</div>
              {feedbackSent ? (
                <div style={{ textAlign: "center", padding: "16px 0" }}>
                  <div style={{ fontSize: 28, marginBottom: 6 }}>✅</div>
                  <div style={{ fontSize: 12, color: "#16a34a", fontWeight: 600 }}>Feedback envoyé !</div>
                </div>
              ) : (
                <>
                  <div style={{ fontSize: 11, color: "#6b7280", marginBottom: 8 }}>Évaluer la situation :</div>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                    {smileys.map((em, i) => (
                      <button key={i} onClick={() => setFeedbackScore(i)}
                        style={{ background: "none", border: `2px solid ${feedbackScore === i ? "#23b2a4" : "transparent"}`, borderRadius: 8, cursor: "pointer", padding: 4, fontSize: 20 }}
                        title={smileyLabels[i]}>
                        {em}
                      </button>
                    ))}
                  </div>
                  {feedbackScore !== null && (
                    <div style={{ fontSize: 10, color: "#23b2a4", textAlign: "center", marginBottom: 8, fontWeight: 600 }}>{smileyLabels[feedbackScore]}</div>
                  )}
                  <textarea value={feedbackText} onChange={(e) => setFeedbackText(e.target.value)}
                    placeholder="Ajouter un commentaire..."
                    style={{ width: "100%", height: 70, border: "1px solid #e8e8e8", borderRadius: 8, padding: 10, fontSize: 12, fontFamily: "Source Sans 3, sans-serif", resize: "none", outline: "none", boxSizing: "border-box", color: "#1d1d1e" }}
                    onFocus={(e) => (e.target.style.borderColor = "#23b2a4")}
                    onBlur={(e) => (e.target.style.borderColor = "#e8e8e8")} />
                  <button
                    onClick={() => feedbackScore !== null && setFeedbackSent(true)}
                    style={{ width: "100%", padding: "8px", borderRadius: 8, border: "none", background: feedbackScore !== null ? "#23b2a4" : "#e8e8e8", color: feedbackScore !== null ? "#fff" : "#9ca3af", fontFamily: "Montserrat, sans-serif", fontWeight: 700, fontSize: 12, cursor: feedbackScore !== null ? "pointer" : "default", marginTop: 8 }}>
                    ✉ Envoyer le feedback
                  </button>
                </>
              )}
            </Card>
          </div>
        </div>
      )}

      {activeTab === "candidatures" && (
        <Card>
          <div style={{ fontFamily: "Montserrat, sans-serif", fontWeight: 700, fontSize: 14, marginBottom: 16 }}>
            Candidatures de {user.first_name} {user.last_name}
            <span style={{ fontFamily: "Source Sans 3, sans-serif", fontWeight: 400, fontSize: 12, color: "#9ca3af", marginLeft: 8 }}>{applications.length} au total</span>
          </div>
          {appsLoading ? (
            <div style={{ textAlign: "center", padding: "32px 0", color: "#9ca3af" }}>Chargement…</div>
          ) : applications.length === 0 ? (
            <div style={{ textAlign: "center", padding: "40px 0" }}>
              <div style={{ fontSize: 32, marginBottom: 8 }}>📭</div>
              <p style={{ fontFamily: "Montserrat, sans-serif", fontWeight: 600, fontSize: 14, color: "#6b7280" }}>Aucune candidature</p>
            </div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ background: "#fafafa" }}>
                    {["Entreprise", "Statut", "Date", "Contact"].map((h) => (
                      <th key={h} style={{ padding: "10px 14px", textAlign: "left", fontSize: 11, fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.5px", borderBottom: "1px solid #e8e8e8" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {applications.map((app) => {
                    const colors = STATUT_COLORS[app.statut] ?? { bg: "#f3f4f6", color: "#6b7280" };
                    return (
                      <tr key={app.id} style={{ borderBottom: "1px solid #f0f0f0" }}>
                        <td style={{ padding: "12px 14px" }}>
                          <div style={{ fontFamily: "Montserrat, sans-serif", fontWeight: 600, fontSize: 13, color: "#1d1d1e" }}>{app.entreprise}</div>
                          {app.lien && <a href={app.lien} target="_blank" rel="noopener noreferrer" style={{ fontSize: 11, color: "#23b2a4", textDecoration: "none" }}>Voir l'offre →</a>}
                        </td>
                        <td style={{ padding: "12px 14px" }}>
                          <span style={{ fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 10, background: colors.bg, color: colors.color }}>
                            {STATUT_LABELS[app.statut] ?? app.statut}
                          </span>
                        </td>
                        <td style={{ padding: "12px 14px", fontFamily: "Source Sans 3, sans-serif", fontSize: 12, color: "#6b7280" }}>
                          {app.date_candidature ? new Date(app.date_candidature).toLocaleDateString("fr-FR") : "—"}
                        </td>
                        <td style={{ padding: "12px 14px", fontFamily: "Source Sans 3, sans-serif", fontSize: 12, color: "#6b7280" }}>
                          {app.contact_nom ? `${app.contact_nom}${app.contact_email ? ` · ${app.contact_email}` : ""}` : "—"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}

      {activeTab === "documents" && (
        <Card>
          <div style={{ fontFamily: "Montserrat, sans-serif", fontWeight: 700, fontSize: 14, marginBottom: 16 }}>
            Documents de {user.first_name} {user.last_name}
            <span style={{ fontFamily: "Source Sans 3, sans-serif", fontWeight: 400, fontSize: 12, color: "#9ca3af", marginLeft: 8 }}>{documents.length} fichier{documents.length !== 1 ? "s" : ""}</span>
          </div>
          {docsLoading ? (
            <div style={{ textAlign: "center", padding: "32px 0", color: "#9ca3af" }}>Chargement…</div>
          ) : documents.length === 0 ? (
            <div style={{ textAlign: "center", padding: "40px 0" }}>
              <div style={{ fontSize: 32, marginBottom: 8 }}>📂</div>
              <p style={{ fontFamily: "Montserrat, sans-serif", fontWeight: 600, fontSize: 14, color: "#6b7280" }}>Aucun document</p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {documents.map((doc) => {
                const sizeKb = Math.round(doc.size / 1024);
                const ext = doc.name.split(".").pop()?.toUpperCase() ?? "FILE";
                return (
                  <div key={doc.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 14px", background: "#fafafa", borderRadius: 8, border: "1px solid #e8e8e8" }}>
                    <div style={{ width: 38, height: 38, borderRadius: 8, background: "rgba(35,178,164,0.1)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 700, color: "#23b2a4", flexShrink: 0 }}>{ext}</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontFamily: "Montserrat, sans-serif", fontWeight: 600, fontSize: 13, color: "#1d1d1e", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{doc.name}</div>
                      <div style={{ fontFamily: "Source Sans 3, sans-serif", fontSize: 11, color: "#9ca3af", marginTop: 1 }}>
                        {sizeKb} Ko · {doc.created_at ? new Date(doc.created_at).toLocaleDateString("fr-FR") : "—"}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      )}
    </div>
  );
}

/* ── Promo Manager ── */
function PromoManager({ users, promos }: { users: any[]; promos: any[] }) {
  const queryClient = useQueryClient();
  const [newName, setNewName] = useState("");

  const { mutate: handleCreate } = useMutation({
    mutationFn: (data: CreatePromoData) => createPromo(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["promos"] }),
  });

  const { mutate: handleDelete } = useMutation({
    mutationFn: (id: number) => deletePromo(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["promos"] }),
  });

  const { mutate: handleAssign } = useMutation({
    mutationFn: ({ promoId, userId }: { promoId: number; userId: number }) => assignPromo(promoId, userId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["users"] }),
  });

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontFamily: "Montserrat, sans-serif", fontWeight: 800, fontSize: 22, color: "#1d1d1e" }}>Gestion des promotions</h1>
        <p style={{ fontFamily: "Source Sans 3, sans-serif", fontSize: 13, color: "#6b7280", marginTop: 3 }}>Créez des promos et assignez des étudiants</p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <Card>
          <div style={{ fontFamily: "Montserrat, sans-serif", fontWeight: 700, fontSize: 14, marginBottom: 14 }}>Promotions</div>
          <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
            <input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Nom de la promo"
              style={{ ...inputStyle, flex: 1 }}
              onFocus={(e) => (e.target.style.borderColor = "#23b2a4")}
              onBlur={(e) => (e.target.style.borderColor = "#e8e8e8")}
              onKeyDown={(e) => e.key === "Enter" && newName.trim() && (handleCreate({ name: newName }), setNewName(""))} />
            <button onClick={() => { if (newName.trim()) { handleCreate({ name: newName }); setNewName(""); } }}
              style={{ padding: "9px 16px", borderRadius: 8, border: "none", background: "#23b2a4", color: "#fff", fontFamily: "Montserrat, sans-serif", fontWeight: 700, fontSize: 13, cursor: "pointer" }}>
              Créer
            </button>
          </div>
          {promos.length === 0 ? (
            <p style={{ fontFamily: "Source Sans 3, sans-serif", fontSize: 13, color: "#9ca3af" }}>Aucune promo créée</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {promos.map((p: any) => {
                const count = users.filter((u) => u.promoId === p.id).length;
                return (
                  <div key={p.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 14px", background: "#fafafa", borderRadius: 8, border: "1px solid #e8e8e8" }}>
                    <span style={{ fontFamily: "Montserrat, sans-serif", fontWeight: 600, fontSize: 13, flex: 1 }}>{p.name}</span>
                    <span style={{ fontFamily: "Source Sans 3, sans-serif", fontSize: 11, color: "#9ca3af" }}>{count} étudiant{count !== 1 ? "s" : ""}</span>
                    <button onClick={() => handleDelete(p.id)} style={{ background: "#fee2e2", border: "none", borderRadius: 6, padding: "5px 10px", cursor: "pointer", fontSize: 11, fontWeight: 600, color: "#dc2626" }}>
                      Supprimer
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </Card>

        <Card>
          <div style={{ fontFamily: "Montserrat, sans-serif", fontWeight: 700, fontSize: 14, marginBottom: 14 }}>Assigner des étudiants</div>
          {users.filter((u) => u.role === "STUDENT").length === 0 ? (
            <p style={{ fontFamily: "Source Sans 3, sans-serif", fontSize: 13, color: "#9ca3af" }}>Aucun étudiant enregistré</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8, maxHeight: 400, overflowY: "auto" }}>
              {users.filter((u) => u.role === "STUDENT").map((u) => {
                const currentPromo = promos.find((p: any) => p.id === u.promoId);
                return (
                  <div key={u.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 14px", background: "#fafafa", borderRadius: 8, border: "1px solid #e8e8e8" }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontFamily: "Montserrat, sans-serif", fontWeight: 600, fontSize: 12 }}>{u.first_name} {u.last_name}</div>
                      <div style={{ fontFamily: "Source Sans 3, sans-serif", fontSize: 11, color: "#9ca3af" }}>{u.email}</div>
                    </div>
                    <select value={u.promoId ?? ""} onChange={(e) => handleAssign({ promoId: parseInt(e.target.value), userId: u.id })}
                      style={{ padding: "5px 8px", border: "1px solid #e8e8e8", borderRadius: 6, fontSize: 12, fontFamily: "Source Sans 3, sans-serif", cursor: "pointer", outline: "none", color: "#1d1d1e", background: "#fff" }}>
                      <option value="">Sans promo</option>
                      {promos.map((p: any) => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}

/* ── Objectives Admin ── */
function ObjectivesAdmin({ promos }: { promos: any[] }) {
  const queryClient = useQueryClient();
  const tanstackNavigate = useNavigate();
  const { data: objectives = [] } = useQuery({ queryKey: ["objectives", "all"], queryFn: fetchObjectives });
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [deadline, setDeadline] = useState<Date | undefined>(undefined);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [promoId, setPromoId] = useState<string>("");
  const [createError, setCreateError] = useState<string | null>(null);

  const { mutate: handleCreate, isPending: creating } = useMutation({
    mutationFn: (data: CreateObjectiveData) => createObjective(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["objectives", "all"] });
      setTitle(""); setDescription(""); setDeadline(undefined); setPromoId(""); setShowForm(false); setCreateError(null);
      tanstackNavigate({ to: "/michel", search: { p: "objectifs" } });
    },
    onError: (err: Error) => {
      setCreateError(err.message ?? "Une erreur est survenue");
    },
  });

  const { mutate: handleDelete } = useMutation({
    mutationFn: (id: number) => deleteObjective(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["objectives", "all"] }),
  });

  const handleSubmit = () => {
    if (!title.trim() || !promoId) return;
    handleCreate({
      title: title.trim(),
      description: description.trim() || undefined,
      deadline: deadline ? format(deadline, "yyyy-MM-dd") : undefined,
      promoId: Number(promoId),
    });
  };

  const grouped = objectives.reduce<Record<number, typeof objectives>>((acc, obj) => {
    (acc[obj.promoId] ??= []).push(obj);
    return acc;
  }, {});

  return (
    <div>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 24 }}>
        <div>
          <h1 style={{ fontFamily: "Montserrat, sans-serif", fontWeight: 800, fontSize: 22, color: "#1d1d1e" }}>Objectifs</h1>
          <p style={{ fontFamily: "Source Sans 3, sans-serif", fontSize: 13, color: "#6b7280", marginTop: 3 }}>{objectives.length} objectif{objectives.length !== 1 ? "s" : ""} définis</p>
        </div>
        <button
          onClick={() => setShowForm((v) => !v)}
          aria-expanded={showForm}
          style={{ padding: "10px 16px", borderRadius: 8, border: "none", background: "#23b2a4", color: "#fff", fontFamily: "Montserrat, sans-serif", fontWeight: 700, fontSize: 13, cursor: "pointer" }}
        >
          {showForm ? "Annuler" : "+ Créer un objectif"}
        </button>
      </div>

      {/* Create form */}
      {showForm && (
        <Card style={{ marginBottom: 20, borderLeft: "3px solid #23b2a4" }}>
          <h2 style={{ fontFamily: "Montserrat, sans-serif", fontWeight: 700, fontSize: 14, color: "#1d1d1e", marginBottom: 16 }}>Nouvel objectif</h2>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 14 }}>
            <div style={{ gridColumn: "1 / -1" }}>
              <label htmlFor="obj-title" style={{ fontFamily: "Montserrat, sans-serif", fontWeight: 600, fontSize: 11, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.5px", display: "block", marginBottom: 4 }}>Titre *</label>
              <input
                id="obj-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ex : Envoyer 5 candidatures cette semaine"
                style={{ ...inputStyle }}
                onFocus={(e) => (e.target.style.borderColor = "#23b2a4")}
                onBlur={(e) => (e.target.style.borderColor = "#e8e8e8")}
              />
            </div>
            <div>
              <label htmlFor="obj-promo" style={{ fontFamily: "Montserrat, sans-serif", fontWeight: 600, fontSize: 11, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.5px", display: "block", marginBottom: 4 }}>Promotion *</label>
              <select
                id="obj-promo"
                value={promoId}
                onChange={(e) => setPromoId(e.target.value)}
                style={{ ...inputStyle, cursor: "pointer" }}
                onFocus={(e) => (e.target.style.borderColor = "#23b2a4")}
                onBlur={(e) => (e.target.style.borderColor = "#e8e8e8")}
              >
                <option value="">Choisir une promotion</option>
                {promos.map((p: any) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontFamily: "Montserrat, sans-serif", fontWeight: 600, fontSize: 11, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.5px", display: "block", marginBottom: 4 }}>Deadline (optionnel)</label>
              <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
                <PopoverTrigger asChild>
                  <button
                    type="button"
                    style={{ ...inputStyle, textAlign: "left", cursor: "pointer", color: deadline ? "#1d1d1e" : "#9ca3af", display: "flex", alignItems: "center", gap: 8 }}
                  >
                    <span style={{ fontSize: 14 }}>📅</span>
                    {deadline ? format(deadline, "dd MMMM yyyy", { locale: fr }) : "Choisir une date"}
                  </button>
                </PopoverTrigger>
                <PopoverContent align="start" style={{ width: "auto", padding: 0 }}>
                  <Calendar
                    mode="single"
                    selected={deadline}
                    onSelect={(date) => { setDeadline(date); setCalendarOpen(false); }}
                    locale={fr}
                    disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                    initialFocus
                  />
                  {deadline && (
                    <div style={{ padding: "8px 12px", borderTop: "1px solid #f0f0f0" }}>
                      <button
                        type="button"
                        onClick={() => { setDeadline(undefined); setCalendarOpen(false); }}
                        style={{ fontSize: 12, color: "#e05252", background: "none", border: "none", cursor: "pointer", fontFamily: "Source Sans 3, sans-serif" }}
                      >
                        Effacer la date
                      </button>
                    </div>
                  )}
                </PopoverContent>
              </Popover>
            </div>
            <div style={{ gridColumn: "1 / -1" }}>
              <label htmlFor="obj-desc" style={{ fontFamily: "Montserrat, sans-serif", fontWeight: 600, fontSize: 11, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.5px", display: "block", marginBottom: 4 }}>Description (optionnel)</label>
              <textarea
                id="obj-desc"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Décrivez l'objectif en détail..."
                rows={3}
                style={{ ...inputStyle, resize: "vertical", lineHeight: 1.5 }}
                onFocus={(e) => (e.target.style.borderColor = "#23b2a4")}
                onBlur={(e) => (e.target.style.borderColor = "#e8e8e8")}
              />
            </div>
          </div>
          {createError && (
            <div style={{ background: "#fee2e2", color: "#dc2626", borderRadius: 8, padding: "10px 14px", fontSize: 13, fontFamily: "Source Sans 3, sans-serif", marginBottom: 12 }}>
              {createError}
            </div>
          )}
          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
            <button onClick={() => { setShowForm(false); setCreateError(null); }} style={{ padding: "9px 18px", borderRadius: 8, border: "1.5px solid #e8e8e8", background: "#fff", color: "#6b7280", fontFamily: "Montserrat, sans-serif", fontWeight: 600, fontSize: 13, cursor: "pointer" }}>Annuler</button>
            <button
              onClick={handleSubmit}
              disabled={!title.trim() || !promoId || creating}
              aria-busy={creating}
              style={{ padding: "9px 18px", borderRadius: 8, border: "none", background: (!title.trim() || !promoId || creating) ? "#88d5cf" : "#23b2a4", color: "#fff", fontFamily: "Montserrat, sans-serif", fontWeight: 700, fontSize: 13, cursor: (!title.trim() || !promoId || creating) ? "not-allowed" : "pointer" }}
            >
              {creating ? "Création…" : "Créer l'objectif"}
            </button>
          </div>
        </Card>
      )}

      {objectives.length === 0 && !showForm ? (
        <Card>
          <div style={{ textAlign: "center", padding: "40px 0" }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>🎯</div>
            <p style={{ fontFamily: "Montserrat, sans-serif", fontWeight: 600, fontSize: 14, color: "#6b7280" }}>Aucun objectif défini</p>
            <p style={{ fontFamily: "Source Sans 3, sans-serif", fontSize: 13, color: "#9ca3af", marginTop: 4 }}>Cliquez sur "+ Créer un objectif" pour commencer</p>
          </div>
        </Card>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          {Object.entries(grouped).map(([promoId, objs]) => {
            const promo = promos.find((p: any) => p.id === Number(promoId));
            return (
              <div key={promoId}>
                <div style={{ fontFamily: "Montserrat, sans-serif", fontWeight: 700, fontSize: 14, color: "#1d1d1e", marginBottom: 10, display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ background: "rgba(35,178,164,0.1)", color: "#23b2a4", padding: "3px 10px", borderRadius: 20, fontSize: 12 }}>
                    {promo?.name ?? `Promo ${promoId}`}
                  </span>
                  <span style={{ fontWeight: 400, color: "#9ca3af", fontSize: 12 }}>{objs.length} objectif{objs.length !== 1 ? "s" : ""}</span>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {objs.map((obj) => (
                    <Card key={obj.id} style={{ borderLeft: "3px solid #23b2a4" }}>
                      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontFamily: "Montserrat, sans-serif", fontWeight: 700, fontSize: 13, color: "#1d1d1e", marginBottom: 4 }}>{obj.title}</div>
                          {obj.description && <p style={{ fontFamily: "Source Sans 3, sans-serif", fontSize: 13, color: "#6b7280" }}>{obj.description}</p>}
                          {obj.deadline && (
                            <div style={{ fontFamily: "Source Sans 3, sans-serif", fontSize: 12, color: "#9ca3af", marginTop: 6 }}>
                              📅 {new Date(obj.deadline).toLocaleDateString("fr-FR")}
                            </div>
                          )}
                        </div>
                        <button
                          onClick={() => handleDelete(obj.id)}
                          aria-label={`Supprimer l'objectif "${obj.title}"`}
                          style={{ background: "#fee2e2", border: "none", borderRadius: 6, padding: "5px 10px", cursor: "pointer", fontSize: 11, fontWeight: 600, color: "#dc2626", flexShrink: 0 }}
                        >
                          Supprimer
                        </button>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ── Admin Profil ── */
function AdminProfil() {
  const { user: authUser } = useAuthContext();
  const { profile, loading, saving, handleUpdate } = useProfile();
  const [editMode, setEditMode] = useState(false);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");

  // Sync form fields when profile loads
  const profileFirstName = profile?.first_name ?? authUser?.first_name ?? "";
  const profileLastName = profile?.last_name ?? authUser?.last_name ?? "";

  const initials = authUser
    ? `${authUser.first_name?.[0] ?? ""}${authUser.last_name?.[0] ?? ""}`.toUpperCase() || "RE"
    : "RE";

  const handleEdit = () => {
    setFirstName(profileFirstName);
    setLastName(profileLastName);
    setEditMode(true);
  };

  const handleSave = async () => {
    await handleUpdate({ first_name: firstName, last_name: lastName });
    setEditMode(false);
  };

  if (loading) {
    return (
      <div style={{ padding: "60px 0", textAlign: "center", color: "#9ca3af" }}>Chargement…</div>
    );
  }

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontFamily: "Montserrat, sans-serif", fontWeight: 800, fontSize: 22, color: "#1d1d1e" }}>Mon profil</h1>
        <p style={{ fontFamily: "Source Sans 3, sans-serif", fontSize: 13, color: "#6b7280", marginTop: 3 }}>Informations de votre compte chargé RE</p>
      </div>
      <Card>
        {/* Avatar + header */}
        <div style={{ display: "flex", alignItems: "center", gap: 20, marginBottom: 28, paddingBottom: 24, borderBottom: "1px solid #e8e8e8" }}>
          <div style={{ width: 72, height: 72, borderRadius: "50%", background: "#23b2a4", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, fontWeight: 700, color: "#fff", fontFamily: "Montserrat, sans-serif", flexShrink: 0 }}>
            {initials}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: "Montserrat, sans-serif", fontWeight: 800, fontSize: 20, color: "#1d1d1e" }}>
              {profileFirstName} {profileLastName}
            </div>
            <div style={{ fontFamily: "Source Sans 3, sans-serif", fontSize: 13, color: "#9ca3af", marginTop: 2 }}>
              {profile?.email ?? authUser?.email}
            </div>
            <div style={{ marginTop: 8 }}>
              <span style={{ background: "rgba(35,178,164,0.1)", color: "#23b2a4", fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 20, border: "1px solid rgba(35,178,164,0.2)" }}>Chargé RE</span>
            </div>
          </div>
          {!editMode && (
            <button
              onClick={handleEdit}
              style={{ padding: "8px 16px", borderRadius: 8, border: "1.5px solid #23b2a4", background: "transparent", color: "#23b2a4", fontFamily: "Montserrat, sans-serif", fontWeight: 700, fontSize: 13, cursor: "pointer" }}
            >
              Modifier
            </button>
          )}
        </div>

        {/* Fields */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 20 }}>
          <div>
            <label htmlFor="re-firstname" style={{ fontFamily: "Montserrat, sans-serif", fontWeight: 600, fontSize: 11, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.5px", display: "block", marginBottom: 4 }}>Prénom</label>
            {editMode ? (
              <input
                id="re-firstname"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                style={{ ...inputStyle }}
                onFocus={(e) => (e.target.style.borderColor = "#23b2a4")}
                onBlur={(e) => (e.target.style.borderColor = "#e8e8e8")}
              />
            ) : (
              <div style={{ fontFamily: "Source Sans 3, sans-serif", fontSize: 14, fontWeight: 600, color: "#1d1d1e" }}>{profileFirstName || "—"}</div>
            )}
          </div>
          <div>
            <label htmlFor="re-lastname" style={{ fontFamily: "Montserrat, sans-serif", fontWeight: 600, fontSize: 11, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.5px", display: "block", marginBottom: 4 }}>Nom</label>
            {editMode ? (
              <input
                id="re-lastname"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                style={{ ...inputStyle }}
                onFocus={(e) => (e.target.style.borderColor = "#23b2a4")}
                onBlur={(e) => (e.target.style.borderColor = "#e8e8e8")}
              />
            ) : (
              <div style={{ fontFamily: "Source Sans 3, sans-serif", fontSize: 14, fontWeight: 600, color: "#1d1d1e" }}>{profileLastName || "—"}</div>
            )}
          </div>
          <div style={{ gridColumn: "1 / -1" }}>
            <label style={{ fontFamily: "Montserrat, sans-serif", fontWeight: 600, fontSize: 11, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.5px", display: "block", marginBottom: 4 }}>Adresse email</label>
            <div style={{ fontFamily: "Source Sans 3, sans-serif", fontSize: 14, color: "#6b7280" }}>{profile?.email ?? authUser?.email ?? "—"}</div>
            <p style={{ fontFamily: "Source Sans 3, sans-serif", fontSize: 12, color: "#9ca3af", marginTop: 3 }}>L'adresse email ne peut pas être modifiée.</p>
          </div>
        </div>

        {editMode && (
          <div style={{ display: "flex", gap: 10 }}>
            <button
              onClick={() => setEditMode(false)}
              style={{ padding: "10px 18px", borderRadius: 8, border: "1.5px solid #e8e8e8", background: "#fff", color: "#6b7280", fontFamily: "Montserrat, sans-serif", fontWeight: 600, fontSize: 13, cursor: "pointer" }}
            >
              Annuler
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              aria-busy={saving}
              style={{ padding: "10px 24px", borderRadius: 8, border: "none", background: saving ? "#88d5cf" : "#23b2a4", color: "#fff", fontFamily: "Montserrat, sans-serif", fontWeight: 700, fontSize: 14, cursor: saving ? "not-allowed" : "pointer" }}
            >
              {saving ? "Enregistrement…" : "Enregistrer les modifications"}
            </button>
          </div>
        )}
      </Card>
    </div>
  );
}

/* ── Main Admin App ── */
const AdminPage = () => {
  const tanstackNavigate = useNavigate();
  // useSearch is reactive — re-renders on every URL search param change
  const search = useSearch({ strict: false }) as { p?: string; uid?: number | string };
  const page = search.p ?? "dashboard";
  const uid = search.uid;

  const { data: promos = [] } = useQuery({ queryKey: ["promos"], queryFn: fetchPromos });
  const { data: users = [] } = useQuery({ queryKey: ["users"], queryFn: fetchUsers });

  // navigate helper — for internal page nav (student-detail uses "student-detail:123" format)
  const navigate = (target: string) => {
    if (target.startsWith("student-detail:")) {
      const userId = target.split(":")[1];
      tanstackNavigate({ to: "/michel", search: { p: "student-detail", uid: Number(userId) } });
    } else {
      tanstackNavigate({ to: "/michel", search: { p: target } });
    }
  };

  const renderPage = () => {
    switch (page) {
      case "dashboard":
        return <Dashboard navigate={navigate} users={users} promos={promos} />;
      case "students":
        return <StudentsList users={users} promos={promos} navigate={navigate} />;
      case "student-detail":
        return uid ? <StudentDetail userId={Number(uid)} promos={promos} navigate={navigate} /> : <StudentsList users={users} promos={promos} navigate={navigate} />;
      case "promos":
        return <PromoManager users={users} promos={promos} />;
      case "objectifs":
        return <ObjectivesAdmin promos={promos} />;
      case "profil":
        return <AdminProfil />;
      default:
        return <Dashboard navigate={navigate} users={users} promos={promos} />;
    }
  };

  return (
    <div style={{ padding: "28px 32px", background: "#f5f5f5", minHeight: "100%" }}>
      {renderPage()}
    </div>
  );
};

export default AdminPage;
