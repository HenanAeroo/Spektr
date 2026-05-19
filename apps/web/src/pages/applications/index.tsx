import { fetchMyApplications } from "@/features/applications/actions/fetchMyApplications";
import { createApplication } from "@/features/applications/actions/createApplication";
import { deleteApplication } from "@/features/applications/actions/deleteApplication";
import { updateApplication, UpdateApplicationData } from "@/features/applications/actions/updateApplication";
import { Application, Statut } from "@/features/applications/types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";

const STATUTS: Statut[] = [
  "A_CONTACTER", "ENVOYE", "RELANCE", "EN_DISCUSSION", "REPONSE_POSITIVE", "REFUS",
];

const STATUT_LABELS: Record<Statut, string> = {
  A_CONTACTER: "À contacter",
  ENVOYE: "Envoyé",
  RELANCE: "Relancé",
  EN_DISCUSSION: "En discussion",
  REPONSE_POSITIVE: "Réponse positive",
  REFUS: "Refus",
};

const STATUT_COLORS: Record<Statut, { bg: string; color: string; border: string }> = {
  A_CONTACTER: { bg: "#f3f4f6", color: "#6b7280", border: "#e5e7eb" },
  ENVOYE:      { bg: "#eff6ff", color: "#3b82f6", border: "#bfdbfe" },
  RELANCE:     { bg: "#fff7ed", color: "#d97706", border: "#fed7aa" },
  EN_DISCUSSION: { bg: "#f5f3ff", color: "#8b5cf6", border: "#ddd6fe" },
  REPONSE_POSITIVE: { bg: "#dcfce7", color: "#16a34a", border: "#bbf7d0" },
  REFUS:       { bg: "#fee2e2", color: "#dc2626", border: "#fecaca" },
};

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

function StatusBadge({ statut }: { statut: Statut }) {
  const c = STATUT_COLORS[statut];
  return (
    <span style={{ fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 10, background: c.bg, color: c.color, border: `1px solid ${c.border}` }}>
      {STATUT_LABELS[statut]}
    </span>
  );
}

type ModalProps = {
  app: Partial<Application> & { id?: number };
  onClose: () => void;
  onSave: (data: Partial<Application>) => void;
  mode: "create" | "edit";
};

function AppModal({ app, onClose, onSave, mode }: ModalProps) {
  const [form, setForm] = useState({
    entreprise: app.entreprise ?? "",
    statut: (app.statut ?? "A_CONTACTER") as Statut,
    contact_nom: app.contact_nom ?? "",
    contact_email: app.contact_email ?? "",
    contact_tel: app.contact_tel ?? "",
    commentaire: app.commentaire ?? "",
    lien: app.lien ?? "",
    date_candidature: app.date_candidature ?? "",
  });

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ background: "#fff", borderRadius: 16, width: 560, maxHeight: "90vh", overflow: "auto", boxShadow: "0 24px 80px rgba(0,0,0,0.2)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "22px 28px", borderBottom: "1px solid #e8e8e8" }}>
          <span style={{ fontFamily: "Montserrat, sans-serif", fontWeight: 800, fontSize: 17, color: "#1d1d1e" }}>
            {mode === "create" ? "Nouvelle candidature" : "Modifier la candidature"}
          </span>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 20, color: "#9ca3af" }}>✕</button>
        </div>
        <div style={{ padding: "22px 28px", display: "flex", flexDirection: "column", gap: 14 }}>
          <div>
            <label style={{ fontFamily: "Montserrat, sans-serif", fontWeight: 600, fontSize: 12, color: "#1d1d1e", display: "block", marginBottom: 5 }}>
              Entreprise *
            </label>
            <input value={form.entreprise} onChange={set("entreprise")} placeholder="Nom de l'entreprise" style={inputStyle}
              onFocus={(e) => (e.target.style.borderColor = "#23b2a4")}
              onBlur={(e) => (e.target.style.borderColor = "#e8e8e8")} />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div>
              <label style={{ fontFamily: "Montserrat, sans-serif", fontWeight: 600, fontSize: 12, color: "#1d1d1e", display: "block", marginBottom: 5 }}>Statut</label>
              <select value={form.statut} onChange={set("statut")} style={{ ...inputStyle, background: "#fff", cursor: "pointer" }}>
                {STATUTS.map((s) => <option key={s} value={s}>{STATUT_LABELS[s]}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontFamily: "Montserrat, sans-serif", fontWeight: 600, fontSize: 12, color: "#1d1d1e", display: "block", marginBottom: 5 }}>Date de candidature</label>
              <input type="date" value={form.date_candidature?.split("T")[0] ?? ""} onChange={set("date_candidature")} style={inputStyle}
                onFocus={(e) => (e.target.style.borderColor = "#23b2a4")}
                onBlur={(e) => (e.target.style.borderColor = "#e8e8e8")} />
            </div>
          </div>
          <div>
            <label style={{ fontFamily: "Montserrat, sans-serif", fontWeight: 600, fontSize: 12, color: "#1d1d1e", display: "block", marginBottom: 5 }}>Lien de l'offre</label>
            <input value={form.lien} onChange={set("lien")} placeholder="https://..." style={inputStyle}
              onFocus={(e) => (e.target.style.borderColor = "#23b2a4")}
              onBlur={(e) => (e.target.style.borderColor = "#e8e8e8")} />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div>
              <label style={{ fontFamily: "Montserrat, sans-serif", fontWeight: 600, fontSize: 12, color: "#1d1d1e", display: "block", marginBottom: 5 }}>Nom du contact</label>
              <input value={form.contact_nom} onChange={set("contact_nom")} placeholder="Jean Dupont" style={inputStyle}
                onFocus={(e) => (e.target.style.borderColor = "#23b2a4")}
                onBlur={(e) => (e.target.style.borderColor = "#e8e8e8")} />
            </div>
            <div>
              <label style={{ fontFamily: "Montserrat, sans-serif", fontWeight: 600, fontSize: 12, color: "#1d1d1e", display: "block", marginBottom: 5 }}>Email du contact</label>
              <input value={form.contact_email} onChange={set("contact_email")} placeholder="contact@entreprise.com" style={inputStyle}
                onFocus={(e) => (e.target.style.borderColor = "#23b2a4")}
                onBlur={(e) => (e.target.style.borderColor = "#e8e8e8")} />
            </div>
          </div>
          <div>
            <label style={{ fontFamily: "Montserrat, sans-serif", fontWeight: 600, fontSize: 12, color: "#1d1d1e", display: "block", marginBottom: 5 }}>Commentaire</label>
            <textarea value={form.commentaire} onChange={set("commentaire")} placeholder="Notes sur cette candidature..." rows={3}
              style={{ ...inputStyle, resize: "vertical", lineHeight: 1.5 }}
              onFocus={(e) => (e.target.style.borderColor = "#23b2a4")}
              onBlur={(e) => (e.target.style.borderColor = "#e8e8e8")} />
          </div>
          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", paddingTop: 4 }}>
            <button onClick={onClose} style={{ padding: "10px 20px", borderRadius: 8, border: "1.5px solid #e8e8e8", background: "#fff", fontFamily: "Montserrat, sans-serif", fontWeight: 600, fontSize: 13, cursor: "pointer", color: "#6b7280" }}>
              Annuler
            </button>
            <button
              onClick={() => onSave(form)}
              disabled={!form.entreprise.trim()}
              style={{ padding: "10px 20px", borderRadius: 8, border: "none", background: form.entreprise.trim() ? "#23b2a4" : "#88d5cf", color: "#fff", fontFamily: "Montserrat, sans-serif", fontWeight: 700, fontSize: 13, cursor: form.entreprise.trim() ? "pointer" : "not-allowed" }}
            >
              {mode === "create" ? "Ajouter" : "Enregistrer"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

const ApplicationsPage = () => {
  const queryClient = useQueryClient();
  const [filterStatut, setFilterStatut] = useState<Statut | "tous">("tous");
  const [search, setSearch] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [editApp, setEditApp] = useState<Application | null>(null);

  const { data: applications = [], isLoading } = useQuery({
    queryKey: ["applications"],
    queryFn: fetchMyApplications,
  });

  const { mutate: createApp } = useMutation({
    mutationFn: (data: any) => createApplication(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["applications"] }),
  });

  const { mutate: deleteApp } = useMutation({
    mutationFn: (id: number) => deleteApplication(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["applications"] }),
  });

  const { mutate: updateApp } = useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateApplicationData }) =>
      updateApplication(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["applications"] }),
  });

  const filtered = applications.filter((a) => {
    const matchSearch =
      !search ||
      a.entreprise.toLowerCase().includes(search.toLowerCase()) ||
      (a.contact_nom ?? "").toLowerCase().includes(search.toLowerCase());
    const matchStatut = filterStatut === "tous" || a.statut === filterStatut;
    return matchSearch && matchStatut;
  });

  const counts = STATUTS.reduce(
    (acc, s) => ({ ...acc, [s]: applications.filter((a) => a.statut === s).length }),
    {} as Record<Statut, number>
  );

  return (
    <div style={{ padding: "28px 32px", background: "#f5f5f5", minHeight: "100%" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 24 }}>
        <div>
          <h1 style={{ fontFamily: "Montserrat, sans-serif", fontWeight: 800, fontSize: 22, color: "#1d1d1e", letterSpacing: "-0.3px" }}>
            Candidatures
          </h1>
          <p style={{ fontFamily: "Source Sans 3, sans-serif", fontSize: 13, color: "#6b7280", marginTop: 3 }}>
            {applications.length} candidature{applications.length !== 1 ? "s" : ""} au total
          </p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          style={{ padding: "10px 18px", borderRadius: 8, border: "none", background: "#23b2a4", color: "#fff", fontFamily: "Montserrat, sans-serif", fontWeight: 700, fontSize: 13, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}
        >
          + Nouvelle candidature
        </button>
      </div>

      {/* Status summary */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 10, marginBottom: 20 }}>
        {STATUTS.map((s) => {
          const c = STATUT_COLORS[s];
          return (
            <button
              key={s}
              onClick={() => setFilterStatut(filterStatut === s ? "tous" : s)}
              style={{
                background: filterStatut === s ? c.color : "#fff",
                color: filterStatut === s ? "#fff" : c.color,
                border: `1.5px solid ${c.border}`,
                borderRadius: 10,
                padding: "10px 12px",
                cursor: "pointer",
                fontFamily: "Montserrat, sans-serif",
                textAlign: "left",
              }}
            >
              <div style={{ fontSize: 18, fontWeight: 800 }}>{counts[s] ?? 0}</div>
              <div style={{ fontSize: 10, fontWeight: 600, marginTop: 2 }}>{STATUT_LABELS[s]}</div>
            </button>
          );
        })}
      </div>

      {/* Table */}
      <div style={{ background: "#fff", borderRadius: 10, border: "1px solid #e8e8e8" }}>
        {/* Toolbar */}
        <div style={{ padding: "14px 20px", borderBottom: "1px solid #e8e8e8", display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ position: "relative", flex: 1, maxWidth: 320 }}>
            <span style={{ position: "absolute", left: 11, top: "50%", transform: "translateY(-50%)", color: "#9ca3af", pointerEvents: "none" }}>🔍</span>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher une entreprise..."
              style={{ ...inputStyle, paddingLeft: 34 }}
              onFocus={(e) => (e.target.style.borderColor = "#23b2a4")}
              onBlur={(e) => (e.target.style.borderColor = "#e8e8e8")}
            />
          </div>
          <div style={{ display: "flex", gap: 6 }}>
            <button
              onClick={() => setFilterStatut("tous")}
              style={{ padding: "6px 14px", borderRadius: 20, border: "1.5px solid", fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "Montserrat, sans-serif", background: filterStatut === "tous" ? "#23b2a4" : "transparent", color: filterStatut === "tous" ? "#fff" : "#6b7280", borderColor: filterStatut === "tous" ? "#23b2a4" : "#e8e8e8" }}
            >
              Tous ({applications.length})
            </button>
          </div>
        </div>

        {isLoading ? (
          <div style={{ padding: "40px", textAlign: "center", color: "#9ca3af" }}>Chargement…</div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: "60px 40px", textAlign: "center" }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>📭</div>
            <p style={{ fontFamily: "Montserrat, sans-serif", fontWeight: 600, fontSize: 15, color: "#6b7280" }}>
              {search || filterStatut !== "tous" ? "Aucun résultat" : "Aucune candidature"}
            </p>
            {!search && filterStatut === "tous" && (
              <button
                onClick={() => setShowCreate(true)}
                style={{ marginTop: 12, padding: "10px 20px", borderRadius: 8, border: "none", background: "#23b2a4", color: "#fff", fontFamily: "Montserrat, sans-serif", fontWeight: 700, fontSize: 13, cursor: "pointer" }}
              >
                Ajouter ma première candidature
              </button>
            )}
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "#fafafa" }}>
                  {["Entreprise", "Statut", "Date", "Contact", "Commentaire", "Actions"].map((h) => (
                    <th key={h} style={{ padding: "12px 16px", textAlign: "left", fontSize: 11, fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.5px", borderBottom: "1px solid #e8e8e8" }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((app) => (
                  <tr
                    key={app.id}
                    style={{ borderBottom: "1px solid #e8e8e8", transition: "background 0.15s" }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "#fafafa")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                  >
                    <td style={{ padding: "14px 16px" }}>
                      <div style={{ fontFamily: "Montserrat, sans-serif", fontWeight: 600, fontSize: 13, color: "#1d1d1e" }}>
                        {app.entreprise}
                      </div>
                      {app.lien && (
                        <a href={app.lien} target="_blank" rel="noopener noreferrer" style={{ fontFamily: "Source Sans 3, sans-serif", fontSize: 11, color: "#23b2a4", textDecoration: "none" }}>
                          Voir l'offre →
                        </a>
                      )}
                    </td>
                    <td style={{ padding: "14px 16px" }}>
                      <StatusBadge statut={app.statut} />
                    </td>
                    <td style={{ padding: "14px 16px", fontFamily: "Source Sans 3, sans-serif", fontSize: 12, color: "#6b7280" }}>
                      {app.date_candidature
                        ? new Date(app.date_candidature).toLocaleDateString("fr-FR")
                        : "—"}
                    </td>
                    <td style={{ padding: "14px 16px", fontFamily: "Source Sans 3, sans-serif", fontSize: 12, color: "#6b7280" }}>
                      {app.contact_nom || "—"}
                      {app.contact_email && (
                        <div style={{ fontSize: 11, color: "#9ca3af" }}>{app.contact_email}</div>
                      )}
                    </td>
                    <td style={{ padding: "14px 16px", fontFamily: "Source Sans 3, sans-serif", fontSize: 12, color: "#6b7280", maxWidth: 200 }}>
                      <span style={{ display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                        {app.commentaire || "—"}
                      </span>
                    </td>
                    <td style={{ padding: "14px 16px" }}>
                      <div style={{ display: "flex", gap: 6 }}>
                        <button
                          onClick={() => setEditApp(app)}
                          style={{ background: "rgba(35,178,164,0.1)", border: "none", borderRadius: 6, padding: "5px 10px", cursor: "pointer", fontSize: 11, fontWeight: 600, color: "#23b2a4" }}
                        >
                          Modifier
                        </button>
                        <button
                          onClick={() => deleteApp(app.id)}
                          style={{ background: "#fee2e2", border: "none", borderRadius: 6, padding: "5px 10px", cursor: "pointer", fontSize: 11, fontWeight: 600, color: "#dc2626" }}
                        >
                          Supprimer
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create modal */}
      {showCreate && (
        <AppModal
          mode="create"
          app={{}}
          onClose={() => setShowCreate(false)}
          onSave={(data) => {
            createApp(data);
            setShowCreate(false);
          }}
        />
      )}

      {/* Edit modal */}
      {editApp && (
        <AppModal
          mode="edit"
          app={editApp}
          onClose={() => setEditApp(null)}
          onSave={(data) => {
            updateApp({ id: editApp.id, data: data as UpdateApplicationData });
            setEditApp(null);
          }}
        />
      )}
    </div>
  );
};

export default ApplicationsPage;
