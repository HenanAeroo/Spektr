import { assignPromo } from "@/features/promos/actions/assignPromo";
import {
  createPromo,
  CreatePromoData,
} from "@/features/promos/actions/createPromo";
import { deletePromo } from "@/features/promos/actions/deletePromo";
import { fetchPromos } from "@/features/promos/actions/fetchPromos";
import { fetchUsers } from "@/features/promos/actions/fetchUsers";
import { fetchObjectives } from "@/features/objectives/actions/fetchObjectives";
import { fetchAllCompletions } from "@/features/objectives/actions/fetchAllCompletions";
import {
  createObjective,
  CreateObjectiveData,
} from "@/features/objectives/actions/createObjective";
import { deleteObjective } from "@/features/objectives/actions/deleteObjective";
import { getUserDocuments } from "@/features/documents/actions/getUserDocuments";
import { sendFeedback } from "@/features/users/actions/sendFeedback";
import { useProfile } from "@/features/profile/hooks/use-profile";
import { changePassword } from "@/features/profile/actions/changePassword";
import { useAuthContext } from "@/shared/components/auth-provider";
import { useAuth } from "@/features/auth/hooks/use-auth";
import { Calendar } from "@/shared/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/shared/components/ui/popover";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { useState } from "react";
import { useNavigate, useSearch } from "@tanstack/react-router";

/* ── shared types ── */
const STATUT_STATUS_COLORS = {
  ok: {
    cls: "bg-green-100 text-green-600 border-green-200",
    dot: "bg-green-600",
  },
  suivre: {
    cls: "bg-amber-50 text-amber-600 border-amber-200",
    dot: "bg-amber-600",
  },
  retard: { cls: "bg-red-100 text-red-600 border-red-200", dot: "bg-red-600" },
} as const;

const inputCls =
  "w-full px-3 py-[9px] border-[1.5px] border-spektr-border rounded-lg font-source-sans text-[13px] text-spektr-dark bg-white focus:outline-none focus:border-spektr-teal box-border";

const labelCls =
  "font-montserrat font-semibold text-[11px] text-gray-500 uppercase tracking-[0.5px] block mb-1";

function StatusBadge({
  status,
  label,
}: {
  status: keyof typeof STATUT_STATUS_COLORS;
  label: string;
}) {
  const c = STATUT_STATUS_COLORS[status];
  return (
    <span
      className={`inline-flex items-center gap-[5px] px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${c.cls}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full inline-block ${c.dot}`} />
      {label}
    </span>
  );
}

function ProgressBar({
  pct,
  color = "bg-spektr-teal",
}: {
  pct: number;
  color?: string;
}) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-[#f0f0f0] rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full ${color}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span
        className={`text-[11px] font-semibold min-w-8 ${color === "bg-green-600" ? "text-green-600" : "text-spektr-teal"}`}
      >
        {pct}%
      </span>
    </div>
  );
}

function Card({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`bg-white border border-spektr-border rounded-[10px] p-5 ${className}`}
    >
      {children}
    </div>
  );
}

/* ── Dashboard ── */
function Dashboard({
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
  });
  const { data: objectivesWithCompletions = [] } = useQuery({
    queryKey: ["objectives", "completions"],
    queryFn: fetchAllCompletions,
  });

  const studentProgress = students.reduce<
    Record<number, { done: number; total: number }>
  >((acc, u) => {
    const promoObjectives = objectivesWithCompletions.filter(
      (obj: any) => obj.promoId === u.promoId,
    );
    const done = promoObjectives.filter((obj: any) =>
      obj.completions?.some((c: any) => c.user.id === u.id && c.done),
    ).length;
    acc[u.id] = { done, total: promoObjectives.length };
    return acc;
  }, {});

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
            <div className="font-source-sans text-xs text-gray-400 mt-0.5">
              {m.delta}
            </div>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-[1fr_320px] gap-4">
        <Card>
          <div className="flex justify-between items-center mb-4">
            <span className="font-montserrat font-bold text-sm">Étudiants</span>
            <button
              onClick={() => navigate("students")}
              className="text-xs text-spektr-teal font-semibold bg-transparent border-none cursor-pointer"
            >
              Voir tous →
            </button>
          </div>
          {students.length === 0 ? (
            <p className="font-source-sans text-[13px] text-gray-400 text-center py-6">
              Aucun étudiant enregistré
            </p>
          ) : (
            <div className="flex flex-col gap-2.5">
              {students.slice(0, 6).map((u) => {
                const initials =
                  `${u.first_name?.[0] ?? ""}${u.last_name?.[0] ?? ""}`.toUpperCase() ||
                  "?";
                const promo = promos.find((p: any) => p.id === u.promoId);
                const progress = studentProgress[u.id] ?? { done: 0, total: 0 };
                const pct =
                  progress.total > 0
                    ? Math.round((progress.done / progress.total) * 100)
                    : 0;
                return (
                  <div
                    key={u.id}
                    className="flex items-center gap-3 px-2.5 py-2.5 border-b border-spektr-bg rounded-lg cursor-pointer transition-colors hover:bg-[#f9fafb]"
                    onClick={() => navigate(`student-detail:${u.id}`)}
                  >
                    <div className="w-[34px] h-[34px] rounded-full bg-green-100 text-green-600 flex items-center justify-center font-montserrat font-bold text-xs flex-shrink-0">
                      {initials}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-montserrat font-semibold text-[13px] text-spektr-dark">
                        {u.first_name} {u.last_name}
                      </div>
                      <div className="font-source-sans text-[11px] text-gray-400">
                        {promo?.name ?? "Sans promo"}
                      </div>
                      {progress.total > 0 && (
                        <div className="mt-1 flex items-center gap-1.5">
                          <div className="flex-1 h-1 rounded-full bg-spektr-border overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-[width] duration-400 ${pct === 100 ? "bg-green-600" : "bg-spektr-teal"}`}
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                          <span
                            className={`text-[10px] font-bold whitespace-nowrap ${pct === 100 ? "text-green-600" : "text-spektr-teal"}`}
                          >
                            {progress.done}/{progress.total}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
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
              <p className="font-source-sans text-[13px] text-gray-400">
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
                        <span className="font-source-sans text-[11px] text-gray-400">
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
              <p className="font-source-sans text-[13px] text-gray-400">
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

/* ── Students List ── */
function StudentsList({
  users,
  promos,
  navigate,
}: {
  users: any[];
  promos: any[];
  navigate: (p: string) => void;
}) {
  const [search, setSearch] = useState("");
  const [showContact, setShowContact] = useState(false);
  const [selected, setSelected] = useState<number[]>([]);
  const [subject, setSubject] = useState(
    "Suivi — Votre recherche d'alternance",
  );
  const [message, setMessage] = useState(
    "Bonjour,\n\nNous souhaitons faire le point sur votre recherche d'alternance.\n\nN'hésitez pas à nous contacter pour planifier un rendez-vous.\n\nCordialement,\nL'équipe Relations Entreprises — Ynov Campus Rennes",
  );

  const { data: objectivesWithCompletions = [] } = useQuery({
    queryKey: ["objectives", "completions"],
    queryFn: fetchAllCompletions,
  });

  const students = users.filter((u) => u.role === "STUDENT");
  const filtered = students.filter((u) => {
    if (!search) return true;
    const name = `${u.first_name} ${u.last_name}`.toLowerCase();
    return (
      name.includes(search.toLowerCase()) ||
      u.email?.toLowerCase().includes(search.toLowerCase())
    );
  });

  const handleSendOutlook = () => {
    const recipients = users
      .filter((u) => selected.includes(u.id))
      .map((u) => u.email)
      .join(";");
    window.open(
      `mailto:${recipients}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(message)}`,
      "_blank",
    );
  };

  return (
    <div>
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="font-montserrat font-extrabold text-[22px] text-spektr-dark">
            Étudiants
          </h1>
          <p className="font-source-sans text-[13px] text-gray-500 mt-0.5">
            {students.length} étudiant{students.length !== 1 ? "s" : ""} suivis
          </p>
        </div>
        <button
          onClick={() => setShowContact(true)}
          className="px-4 py-2.5 rounded-lg border-[1.5px] border-spektr-teal bg-transparent text-spektr-teal font-montserrat font-bold text-[13px] cursor-pointer"
        >
          ✉ Contacter des étudiants
        </button>
      </div>

      <Card className="p-0">
        <div className="px-5 py-3.5 border-b border-spektr-border flex gap-3 items-center">
          <div className="relative flex-1 max-w-[320px]">
            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
              🔍
            </span>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher un étudiant..."
              className={`${inputCls} pl-[30px]`}
            />
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="py-[60px] px-10 text-center">
            <div className="text-[40px] mb-3">👥</div>
            <p className="font-montserrat font-semibold text-sm text-gray-500">
              Aucun étudiant trouvé
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-[#fafafa]">
                  {[
                    "Étudiant",
                    "Email",
                    "Promotion",
                    "Objectifs",
                    "Actions",
                  ].map((h) => (
                    <th
                      key={h}
                      className="px-4 py-3 text-left text-[11px] font-bold text-gray-400 uppercase tracking-[0.5px] border-b border-spektr-border"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((u) => {
                  const initials =
                    `${u.first_name?.[0] ?? ""}${u.last_name?.[0] ?? ""}`.toUpperCase() ||
                    "?";
                  const promo = promos.find((p: any) => p.id === u.promoId);
                  const promoObjectives = objectivesWithCompletions.filter(
                    (obj: any) => obj.promoId === u.promoId,
                  );
                  const doneCount = promoObjectives.filter((obj: any) =>
                    obj.completions?.some(
                      (c: any) => c.user.id === u.id && c.done,
                    ),
                  ).length;
                  const pct =
                    promoObjectives.length > 0
                      ? Math.round((doneCount / promoObjectives.length) * 100)
                      : 0;
                  return (
                    <tr
                      key={u.id}
                      className="border-b border-spektr-border transition-colors cursor-pointer hover:bg-[#fafafa]"
                      onClick={() => navigate(`student-detail:${u.id}`)}
                    >
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-green-100 text-green-600 flex items-center justify-center font-montserrat font-bold text-xs flex-shrink-0">
                            {initials}
                          </div>
                          <div className="font-montserrat font-semibold text-[13px]">
                            {u.first_name} {u.last_name}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3.5 font-source-sans text-xs text-gray-500">
                        {u.email}
                      </td>
                      <td className="px-4 py-3.5">
                        {promo ? (
                          <span className="bg-spektr-teal/10 text-spektr-teal text-[11px] font-semibold px-2.5 py-0.5 rounded-[10px]">
                            {promo.name}
                          </span>
                        ) : (
                          <span className="text-gray-400 text-xs">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3.5 min-w-[120px]">
                        {promoObjectives.length > 0 ? (
                          <div>
                            <div className="flex items-center gap-1.5 mb-0.5">
                              <div className="flex-1 h-[5px] rounded-full bg-spektr-border overflow-hidden">
                                <div
                                  className={`h-full rounded-full transition-[width] duration-400 ${pct === 100 ? "bg-green-600" : "bg-spektr-teal"}`}
                                  style={{ width: `${pct}%` }}
                                />
                              </div>
                              <span
                                className={`text-[11px] font-bold whitespace-nowrap ${pct === 100 ? "text-green-600" : "text-spektr-teal"}`}
                              >
                                {doneCount}/{promoObjectives.length}
                              </span>
                            </div>
                          </div>
                        ) : (
                          <span className="text-gray-400 text-xs">—</span>
                        )}
                      </td>
                      <td
                        className="px-4 py-3.5"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          onClick={() => navigate(`student-detail:${u.id}`)}
                          className="bg-spektr-teal/10 border-none rounded-md px-2.5 py-1.5 cursor-pointer text-xs font-semibold text-spektr-teal"
                        >
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
        <div className="fixed inset-0 bg-black/45 z-[1000] flex items-center justify-center">
          <div className="bg-white rounded-2xl w-[640px] max-h-[90vh] overflow-auto shadow-[0_24px_80px_rgba(0,0,0,0.2)]">
            <div className="flex justify-between items-center px-7 py-[22px] border-b border-spektr-border">
              <div>
                <div className="font-montserrat font-extrabold text-[17px]">
                  Contacter des étudiants
                </div>
                <div className="font-source-sans text-xs text-gray-400 mt-0.5">
                  Le message s'ouvrira dans votre client email
                </div>
              </div>
              <button
                onClick={() => setShowContact(false)}
                className="bg-transparent border-none cursor-pointer text-xl text-gray-400"
              >
                ✕
              </button>
            </div>
            <div className="px-7 py-[22px] flex flex-col gap-4">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="font-montserrat font-bold text-[13px]">
                    Destinataires{" "}
                    <span className="text-spektr-teal">{selected.length}</span>{" "}
                    sélectionné{selected.length > 1 ? "s" : ""}
                  </span>
                  <div className="flex gap-2.5">
                    <button
                      onClick={() => setSelected(students.map((u) => u.id))}
                      className="text-[11px] font-semibold text-gray-500 bg-transparent border-none cursor-pointer"
                    >
                      Tous
                    </button>
                    <button
                      onClick={() => setSelected([])}
                      className="text-[11px] font-semibold text-[#dc2626] bg-transparent border-none cursor-pointer"
                    >
                      Effacer
                    </button>
                  </div>
                </div>
                <div className="flex flex-col gap-1 max-h-[160px] overflow-y-auto border border-spektr-border rounded-[10px] p-2">
                  {students.map((u) => {
                    const initials =
                      `${u.first_name?.[0] ?? ""}${u.last_name?.[0] ?? ""}`.toUpperCase() ||
                      "?";
                    return (
                      <label
                        key={u.id}
                        className={`flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg cursor-pointer ${selected.includes(u.id) ? "bg-spektr-teal/[0.08]" : "bg-transparent"}`}
                      >
                        <input
                          type="checkbox"
                          checked={selected.includes(u.id)}
                          onChange={() =>
                            setSelected((prev) =>
                              prev.includes(u.id)
                                ? prev.filter((x) => x !== u.id)
                                : [...prev, u.id],
                            )
                          }
                          className="accent-spektr-teal w-[15px] h-[15px] cursor-pointer"
                        />
                        <div className="w-[26px] h-[26px] rounded-full bg-green-100 text-green-600 flex items-center justify-center text-[11px] font-bold">
                          {initials}
                        </div>
                        <span className="font-source-sans text-[13px]">
                          {u.first_name} {u.last_name}
                        </span>
                        <span className="font-source-sans text-[11px] text-gray-400">
                          {u.email}
                        </span>
                      </label>
                    );
                  })}
                </div>
              </div>
              <div>
                <label className={labelCls}>Objet</label>
                <input
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className={inputCls}
                />
              </div>
              <div>
                <label className={labelCls}>Message</label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={6}
                  className={`${inputCls} resize-y leading-relaxed`}
                />
              </div>
              <div className="flex justify-end gap-2.5">
                <button
                  onClick={() => setShowContact(false)}
                  className="px-5 py-2.5 rounded-lg border-[1.5px] border-spektr-border bg-white font-montserrat font-semibold text-[13px] cursor-pointer text-gray-500"
                >
                  Annuler
                </button>
                <button
                  onClick={handleSendOutlook}
                  disabled={selected.length === 0}
                  className={`px-5 py-2.5 rounded-lg border-none font-montserrat font-bold text-[13px] text-white ${selected.length === 0 ? "bg-spektr-teal/50 cursor-not-allowed" : "bg-spektr-teal cursor-pointer"}`}
                >
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
function StudentDetail({
  userId,
  promos,
  navigate,
}: {
  userId: number;
  promos: any[];
  navigate: (p: string) => void;
}) {
  const [activeTab, setActiveTab] = useState<
    "profile" | "objectifs" | "documents"
  >("profile");
  const [feedbackScore, setFeedbackScore] = useState<number | null>(null);
  const [feedbackText, setFeedbackText] = useState("");

  const {
    mutate: submitFeedback,
    isPending: feedbackPending,
    isSuccess: feedbackSent,
  } = useMutation({
    mutationFn: () => sendFeedback(userId, feedbackScore!, feedbackText),
  });

  const { data: users = [] } = useQuery({
    queryKey: ["users"],
    queryFn: fetchUsers,
  });
  const user = users.find((u: any) => u.id === userId);

  const { data: objectivesWithCompletions = [], isLoading: objLoading } =
    useQuery({
      queryKey: ["objectives", "completions"],
      queryFn: fetchAllCompletions,
      enabled: activeTab === "objectifs",
    });

  const { data: documents = [], isLoading: docsLoading } = useQuery({
    queryKey: ["documents", "user", userId],
    queryFn: () => getUserDocuments(userId),
    enabled: activeTab === "documents",
  });

  if (!user) {
    return (
      <div className="text-center py-[60px] text-gray-400">
        <div className="text-[40px] mb-3">🔍</div>
        <p className="font-montserrat font-semibold text-sm">
          Étudiant introuvable
        </p>
        <button
          onClick={() => navigate("students")}
          className="mt-4 px-4 py-2 rounded-lg border-[1.5px] border-spektr-teal bg-transparent text-spektr-teal cursor-pointer font-montserrat font-bold text-[13px]"
        >
          Retour
        </button>
      </div>
    );
  }

  const initials =
    `${user.first_name?.[0] ?? ""}${user.last_name?.[0] ?? ""}`.toUpperCase() ||
    "?";
  const promo = promos.find((p: any) => p.id === user.promoId);
  const smileys = ["😊", "🙂", "😐", "🙁", "😟"];
  const smileyLabels = [
    "Très bien",
    "Bien",
    "Moyen",
    "Préoccupant",
    "Critique",
  ];

  const tabs = [
    { id: "profile" as const, label: "Profil" },
    { id: "objectifs" as const, label: "Objectifs" },
    { id: "documents" as const, label: "Documents" },
  ];

  return (
    <div>
      <div className="flex items-center gap-3 mb-5">
        <button
          onClick={() => navigate("students")}
          className="bg-transparent border-none cursor-pointer flex items-center gap-1.5 text-gray-500 font-source-sans text-[13px]"
        >
          ← Retour
        </button>
        <span className="text-spektr-border">|</span>
        <h1 className="font-montserrat font-extrabold text-xl text-spektr-dark">
          {user.first_name} {user.last_name}
        </h1>
        <StatusBadge status="ok" label="Actif" />
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-5 bg-white rounded-[10px] border border-spektr-border p-1.5 w-fit">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={[
              "px-[18px] py-2 rounded-[7px] border-none cursor-pointer font-montserrat text-[13px] transition-all",
              activeTab === tab.id
                ? "font-bold bg-spektr-teal text-white"
                : "font-medium bg-transparent text-gray-500",
            ].join(" ")}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "profile" && (
        <div className="grid grid-cols-[1fr_260px] gap-4">
          <div className="flex flex-col gap-4">
            <Card>
              <div className="font-montserrat font-bold text-sm mb-3.5">
                Informations
              </div>
              <div className="grid grid-cols-2 gap-3.5">
                {[
                  { label: "Prénom", value: user.first_name },
                  { label: "Nom", value: user.last_name },
                  { label: "Email", value: user.email },
                  { label: "Promotion", value: promo?.name ?? "—" },
                ].map((f) => (
                  <div key={f.label}>
                    <div className="font-montserrat font-semibold text-[11px] text-gray-400 uppercase tracking-[0.5px] mb-0.5">
                      {f.label}
                    </div>
                    <div className="font-source-sans text-[13px] font-semibold text-spektr-dark">
                      {f.value || "—"}
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          <div className="flex flex-col gap-4">
            <Card>
              <div className="flex flex-col items-center gap-2">
                <div className="w-[52px] h-[52px] rounded-full bg-spektr-teal text-white flex items-center justify-center font-montserrat font-bold text-lg">
                  {initials}
                </div>
                <div className="font-montserrat font-bold text-sm text-spektr-dark">
                  {user.first_name} {user.last_name}
                </div>
                <div className="font-source-sans text-[11px] text-gray-400">
                  {promo?.name ?? "Sans promo"}
                </div>
                <div className="font-source-sans text-[11px] text-spektr-teal">
                  {user.email}
                </div>
              </div>
            </Card>

            <Card>
              <div className="font-montserrat font-bold text-[13px] mb-3">
                Feedback RE
              </div>
              {feedbackSent ? (
                <div className="text-center py-4">
                  <div className="text-[28px] mb-1.5">✅</div>
                  <div className="text-xs text-green-600 font-semibold">
                    Feedback envoyé !
                  </div>
                </div>
              ) : (
                <>
                  <div className="text-[11px] text-gray-500 mb-2">
                    Évaluer la situation :
                  </div>
                  <div className="flex justify-between mb-1.5">
                    {smileys.map((em, i) => (
                      <button
                        key={i}
                        onClick={() => setFeedbackScore(i)}
                        className={`bg-transparent rounded-lg cursor-pointer p-1 text-xl border-2 ${feedbackScore === i ? "border-spektr-teal" : "border-transparent"}`}
                        title={smileyLabels[i]}
                      >
                        {em}
                      </button>
                    ))}
                  </div>
                  {feedbackScore !== null && (
                    <div className="text-[10px] text-spektr-teal text-center mb-2 font-semibold">
                      {smileyLabels[feedbackScore]}
                    </div>
                  )}
                  <textarea
                    value={feedbackText}
                    onChange={(e) => setFeedbackText(e.target.value)}
                    placeholder="Ajouter un commentaire..."
                    className="w-full h-[70px] border border-spektr-border rounded-lg p-2.5 text-xs font-source-sans resize-none focus:outline-none focus:border-spektr-teal box-border text-spektr-dark"
                  />
                  <button
                    onClick={() => feedbackScore !== null && submitFeedback()}
                    disabled={feedbackScore === null || feedbackPending}
                    className={`w-full py-2 rounded-lg border-none font-montserrat font-bold text-xs mt-2 ${feedbackScore !== null && !feedbackPending ? "bg-spektr-teal text-white cursor-pointer" : "bg-spektr-border text-gray-400 cursor-default"}`}
                  >
                    {feedbackPending ? "Envoi…" : "✉ Envoyer le feedback"}
                  </button>
                </>
              )}
            </Card>
          </div>
        </div>
      )}

      {activeTab === "objectifs" && (
        <Card>
          <div className="font-montserrat font-bold text-sm mb-4">
            Objectifs de {user.first_name} {user.last_name}
          </div>
          {objLoading ? (
            <div className="text-center py-8 text-gray-400">Chargement…</div>
          ) : (
            (() => {
              const studentObjectives = objectivesWithCompletions.filter(
                (obj: any) => obj.promoId === user.promoId,
              );
              const doneCount = studentObjectives.filter((obj: any) =>
                obj.completions?.some(
                  (c: any) => c.user.id === userId && c.done,
                ),
              ).length;

              if (studentObjectives.length === 0) {
                return (
                  <div className="text-center py-10">
                    <div className="text-[32px] mb-2">🎯</div>
                    <p className="font-montserrat font-semibold text-sm text-gray-500">
                      Aucun objectif pour cette promo
                    </p>
                  </div>
                );
              }

              return (
                <div>
                  <div className="flex items-center gap-3 mb-[18px]">
                    <div className="flex-1 h-2 rounded-full bg-spektr-border overflow-hidden">
                      <div
                        className="h-full rounded-full bg-spektr-teal transition-[width] duration-400 ease-in-out"
                        style={{
                          width: `${studentObjectives.length ? (doneCount / studentObjectives.length) * 100 : 0}%`,
                        }}
                      />
                    </div>
                    <span className="font-montserrat font-bold text-[13px] text-spektr-teal whitespace-nowrap">
                      {doneCount} / {studentObjectives.length}
                    </span>
                  </div>

                  <div className="flex flex-col gap-2.5">
                    {studentObjectives.map((obj: any) => {
                      const completion = obj.completions?.find(
                        (c: any) => c.user.id === userId,
                      );
                      const done = completion?.done ?? false;
                      const deadline = obj.deadline
                        ? new Date(obj.deadline)
                        : null;
                      const isExpired =
                        deadline && deadline < new Date() && !done;
                      const borderColor = done
                        ? "border-l-green-600"
                        : isExpired
                          ? "border-l-spektr-red"
                          : "border-l-spektr-teal";

                      return (
                        <div
                          key={obj.id}
                          className={`flex items-center gap-3.5 px-4 py-3.5 rounded-[10px] border border-spektr-border border-l-[3px] ${borderColor} ${done ? "bg-[#f0fdf4]" : "bg-white"}`}
                        >
                          <div
                            className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 text-sm ${done ? "bg-green-100" : "bg-spektr-bg"}`}
                          >
                            {done ? "✓" : "○"}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div
                              className={`font-montserrat font-semibold text-[13px] ${done ? "text-gray-500 line-through" : "text-spektr-dark"}`}
                            >
                              {obj.title}
                            </div>
                            {deadline && (
                              <div className="font-source-sans text-[11px] text-gray-400 mt-0.5">
                                📅{" "}
                                {deadline.toLocaleDateString("fr-FR", {
                                  day: "numeric",
                                  month: "short",
                                  year: "numeric",
                                })}
                              </div>
                            )}
                          </div>
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold whitespace-nowrap ${done ? "bg-green-100 text-green-600" : isExpired ? "bg-red-100 text-red-600" : "bg-spektr-bg text-gray-400"}`}
                          >
                            {done ? "Fait" : isExpired ? "Expiré" : "En cours"}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })()
          )}
        </Card>
      )}

      {activeTab === "documents" && (
        <Card>
          <div className="font-montserrat font-bold text-sm mb-4">
            Documents de {user.first_name} {user.last_name}
            <span className="font-source-sans font-normal text-xs text-gray-400 ml-2">
              {documents.length} fichier{documents.length !== 1 ? "s" : ""}
            </span>
          </div>
          {docsLoading ? (
            <div className="text-center py-8 text-gray-400">Chargement…</div>
          ) : documents.length === 0 ? (
            <div className="text-center py-10">
              <div className="text-[32px] mb-2">📂</div>
              <p className="font-montserrat font-semibold text-sm text-gray-500">
                Aucun document
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {documents.map((doc) => {
                const sizeKb = Math.round(doc.size / 1024);
                const ext = doc.name.split(".").pop()?.toUpperCase() ?? "FILE";
                return (
                  <div
                    key={doc.id}
                    className="flex items-center gap-3 px-3.5 py-2.5 bg-[#fafafa] rounded-lg border border-spektr-border"
                  >
                    <div className="w-[38px] h-[38px] rounded-lg bg-spektr-teal/10 flex items-center justify-center text-[10px] font-bold text-spektr-teal flex-shrink-0">
                      {ext}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-montserrat font-semibold text-[13px] text-spektr-dark truncate">
                        {doc.name}
                      </div>
                      <div className="font-source-sans text-[11px] text-gray-400 mt-px">
                        {sizeKb} Ko ·{" "}
                        {doc.created_at
                          ? new Date(doc.created_at).toLocaleDateString("fr-FR")
                          : "—"}
                      </div>
                    </div>
                    <button
                      onClick={async () => {
                        const { getDocumentUrl } =
                          await import("@/features/documents/actions/getDocumentUrl");
                        const { url } = await getDocumentUrl(doc.id);
                        window.open(url, "_blank");
                      }}
                      className="bg-spektr-teal/10 border-none rounded-md px-2.5 py-1.5 cursor-pointer text-[11px] font-semibold text-spektr-teal whitespace-nowrap flex-shrink-0"
                    >
                      ⬇ Télécharger
                    </button>
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
    mutationFn: ({ promoId, userId }: { promoId: number; userId: number }) =>
      assignPromo(promoId, userId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["users"] }),
  });

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-montserrat font-extrabold text-[22px] text-spektr-dark">
          Gestion des promotions
        </h1>
        <p className="font-source-sans text-[13px] text-gray-500 mt-0.5">
          Créez des promos et assignez des étudiants
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Card>
          <div className="font-montserrat font-bold text-sm mb-3.5">
            Promotions
          </div>
          <div className="flex gap-2 mb-3.5">
            <input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Nom de la promo"
              className={`${inputCls} flex-1`}
              onKeyDown={(e) =>
                e.key === "Enter" &&
                newName.trim() &&
                (handleCreate({ name: newName }), setNewName(""))
              }
            />
            <button
              onClick={() => {
                if (newName.trim()) {
                  handleCreate({ name: newName });
                  setNewName("");
                }
              }}
              className="px-4 py-[9px] rounded-lg border-none bg-spektr-teal text-white font-montserrat font-bold text-[13px] cursor-pointer"
            >
              Créer
            </button>
          </div>
          {promos.length === 0 ? (
            <p className="font-source-sans text-[13px] text-gray-400">
              Aucune promo créée
            </p>
          ) : (
            <div className="flex flex-col gap-2">
              {promos.map((p: any) => {
                const count = users.filter((u) => u.promoId === p.id).length;
                return (
                  <div
                    key={p.id}
                    className="flex items-center gap-3 px-3.5 py-2.5 bg-[#fafafa] rounded-lg border border-spektr-border"
                  >
                    <span className="font-montserrat font-semibold text-[13px] flex-1">
                      {p.name}
                    </span>
                    <span className="font-source-sans text-[11px] text-gray-400">
                      {count} étudiant{count !== 1 ? "s" : ""}
                    </span>
                    <button
                      onClick={() => handleDelete(p.id)}
                      className="bg-[#fee2e2] border-none rounded-md px-2.5 py-[5px] cursor-pointer text-[11px] font-semibold text-[#dc2626]"
                    >
                      Supprimer
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </Card>

        <Card>
          <div className="font-montserrat font-bold text-sm mb-3.5">
            Assigner des étudiants
          </div>
          {users.filter((u) => u.role === "STUDENT").length === 0 ? (
            <p className="font-source-sans text-[13px] text-gray-400">
              Aucun étudiant enregistré
            </p>
          ) : (
            <div className="flex flex-col gap-2 max-h-[400px] overflow-y-auto">
              {users
                .filter((u) => u.role === "STUDENT")
                .map((u) => {
                  return (
                    <div
                      key={u.id}
                      className="flex items-center gap-3 px-3.5 py-2.5 bg-[#fafafa] rounded-lg border border-spektr-border"
                    >
                      <div className="flex-1">
                        <div className="font-montserrat font-semibold text-xs">
                          {u.first_name} {u.last_name}
                        </div>
                        <div className="font-source-sans text-[11px] text-gray-400">
                          {u.email}
                        </div>
                      </div>
                      <select
                        value={u.promoId ?? ""}
                        onChange={(e) =>
                          handleAssign({
                            promoId: parseInt(e.target.value),
                            userId: u.id,
                          })
                        }
                        className="px-2 py-[5px] border border-spektr-border rounded-md text-xs font-source-sans cursor-pointer focus:outline-none text-spektr-dark bg-white"
                      >
                        <option value="">Sans promo</option>
                        {promos.map((p: any) => (
                          <option key={p.id} value={p.id}>
                            {p.name}
                          </option>
                        ))}
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
  const { data: objectives = [] } = useQuery({
    queryKey: ["objectives", "all"],
    queryFn: fetchObjectives,
  });
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
      setTitle("");
      setDescription("");
      setDeadline(undefined);
      setPromoId("");
      setShowForm(false);
      setCreateError(null);
      tanstackNavigate({ to: "/michel", search: { p: "objectifs" } });
    },
    onError: (err: Error) => {
      setCreateError(err.message ?? "Une erreur est survenue");
    },
  });

  const { mutate: handleDelete } = useMutation({
    mutationFn: (id: number) => deleteObjective(id),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["objectives", "all"] }),
  });

  const handleSubmit = () => {
    if (!title.trim() || !promoId) return;
    handleCreate({
      title: title.trim(),
      description: description.trim() || undefined,
      deadline: deadline ? deadline.toISOString() : undefined,
      promoId: Number(promoId),
    });
  };

  const grouped = objectives.reduce<Record<number, typeof objectives>>(
    (acc, obj) => {
      (acc[obj.promoId] ??= []).push(obj);
      return acc;
    },
    {},
  );

  const canCreate = !title.trim() || !promoId || creating;

  return (
    <div>
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="font-montserrat font-extrabold text-[22px] text-spektr-dark">
            Objectifs
          </h1>
          <p className="font-source-sans text-[13px] text-gray-500 mt-0.5">
            {objectives.length} objectif{objectives.length !== 1 ? "s" : ""}{" "}
            définis
          </p>
        </div>
        <button
          onClick={() => setShowForm((v) => !v)}
          aria-expanded={showForm}
          className="px-4 py-2.5 rounded-lg border-none bg-spektr-teal text-white font-montserrat font-bold text-[13px] cursor-pointer"
        >
          {showForm ? "Annuler" : "+ Créer un objectif"}
        </button>
      </div>

      {/* Create form */}
      {showForm && (
        <Card className="mb-5 border-l-[3px] border-l-spektr-teal">
          <h2 className="font-montserrat font-bold text-sm text-spektr-dark mb-4">
            Nouvel objectif
          </h2>
          <div className="grid grid-cols-2 gap-3.5 mb-3.5">
            <div className="col-span-2">
              <label htmlFor="obj-title" className={labelCls}>
                Titre *
              </label>
              <input
                id="obj-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ex : Envoyer 5 candidatures cette semaine"
                className={inputCls}
              />
            </div>
            <div>
              <label htmlFor="obj-promo" className={labelCls}>
                Promotion *
              </label>
              <select
                id="obj-promo"
                value={promoId}
                onChange={(e) => setPromoId(e.target.value)}
                className={`${inputCls} cursor-pointer`}
              >
                <option value="">Choisir une promotion</option>
                {promos.map((p: any) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelCls}>Deadline (optionnel)</label>
              <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
                <PopoverTrigger asChild>
                  <button
                    type="button"
                    className={`${inputCls} text-left cursor-pointer flex items-center gap-2 ${deadline ? "text-spektr-dark" : "text-gray-400"}`}
                  >
                    <span className="text-sm">📅</span>
                    {deadline
                      ? format(deadline, "dd MMMM yyyy", { locale: fr })
                      : "Choisir une date"}
                  </button>
                </PopoverTrigger>
                <PopoverContent align="start" className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={deadline}
                    onSelect={(date) => {
                      setDeadline(date);
                      setCalendarOpen(false);
                    }}
                    locale={fr}
                    disabled={(date) =>
                      date < new Date(new Date().setHours(0, 0, 0, 0))
                    }
                    initialFocus
                  />
                  {deadline && (
                    <div className="px-3 py-2 border-t border-[#f0f0f0]">
                      <button
                        type="button"
                        onClick={() => {
                          setDeadline(undefined);
                          setCalendarOpen(false);
                        }}
                        className="text-xs text-spektr-red bg-transparent border-none cursor-pointer font-source-sans"
                      >
                        Effacer la date
                      </button>
                    </div>
                  )}
                </PopoverContent>
              </Popover>
            </div>
            <div className="col-span-2">
              <label htmlFor="obj-desc" className={labelCls}>
                Description (optionnel)
              </label>
              <textarea
                id="obj-desc"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Décrivez l'objectif en détail..."
                rows={3}
                className={`${inputCls} resize-y leading-relaxed`}
              />
            </div>
          </div>
          {createError && (
            <div className="bg-[#fee2e2] text-[#dc2626] rounded-lg px-3.5 py-2.5 text-[13px] font-source-sans mb-3">
              {createError}
            </div>
          )}
          <div className="flex gap-2.5 justify-end">
            <button
              onClick={() => {
                setShowForm(false);
                setCreateError(null);
              }}
              className="px-[18px] py-[9px] rounded-lg border-[1.5px] border-spektr-border bg-white text-gray-500 font-montserrat font-semibold text-[13px] cursor-pointer"
            >
              Annuler
            </button>
            <button
              onClick={handleSubmit}
              disabled={canCreate}
              aria-busy={creating}
              className={`px-[18px] py-[9px] rounded-lg border-none font-montserrat font-bold text-[13px] text-white ${canCreate ? "bg-spektr-teal/50 cursor-not-allowed" : "bg-spektr-teal cursor-pointer"}`}
            >
              {creating ? "Création…" : "Créer l'objectif"}
            </button>
          </div>
        </Card>
      )}

      {objectives.length === 0 && !showForm ? (
        <Card>
          <div className="text-center py-10">
            <div className="text-[40px] mb-3">🎯</div>
            <p className="font-montserrat font-semibold text-sm text-gray-500">
              Aucun objectif défini
            </p>
            <p className="font-source-sans text-[13px] text-gray-400 mt-1">
              Cliquez sur "+ Créer un objectif" pour commencer
            </p>
          </div>
        </Card>
      ) : (
        <div className="flex flex-col gap-6">
          {Object.entries(grouped).map(([gPromoId, objs]) => {
            const promo = promos.find((p: any) => p.id === Number(gPromoId));
            return (
              <div key={gPromoId}>
                <div className="font-montserrat font-bold text-sm text-spektr-dark mb-2.5 flex items-center gap-2">
                  <span className="bg-spektr-teal/10 text-spektr-teal px-2.5 py-0.5 rounded-full text-xs">
                    {promo?.name ?? `Promo ${gPromoId}`}
                  </span>
                  <span className="font-normal text-gray-400 text-xs">
                    {objs.length} objectif{objs.length !== 1 ? "s" : ""}
                  </span>
                </div>
                <div className="flex flex-col gap-2.5">
                  {objs.map((obj) => (
                    <Card
                      key={obj.id}
                      className="border-l-[3px] border-l-spektr-teal"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1">
                          <div className="font-montserrat font-bold text-[13px] text-spektr-dark mb-1">
                            {obj.title}
                          </div>
                          {obj.description && (
                            <p className="font-source-sans text-[13px] text-gray-500">
                              {obj.description}
                            </p>
                          )}
                          {obj.deadline && (
                            <div className="font-source-sans text-xs text-gray-400 mt-1.5">
                              📅{" "}
                              {new Date(obj.deadline).toLocaleDateString(
                                "fr-FR",
                              )}
                            </div>
                          )}
                        </div>
                        <button
                          onClick={() => handleDelete(obj.id)}
                          aria-label={`Supprimer l'objectif "${obj.title}"`}
                          className="bg-[#fee2e2] border-none rounded-md px-2.5 py-[5px] cursor-pointer text-[11px] font-semibold text-[#dc2626] flex-shrink-0"
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
  const { handleLogout } = useAuth();
  const [editMode, setEditMode] = useState(false);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");

  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [pwdError, setPwdError] = useState<string | null>(null);

  const {
    mutate: submitPasswordChange,
    isPending: pwdPending,
    isSuccess: pwdSuccess,
  } = useMutation({
    mutationFn: () => changePassword(oldPassword, newPassword),
    onSuccess: () => {
      setTimeout(() => handleLogout(), 2000);
    },
    onError: (err: Error) => {
      setPwdError(err.message ?? "Une erreur est survenue.");
    },
  });

  const profileFirstName = profile?.first_name ?? authUser?.first_name ?? "";
  const profileLastName = profile?.last_name ?? authUser?.last_name ?? "";

  const initials = authUser
    ? `${authUser.first_name?.[0] ?? ""}${authUser.last_name?.[0] ?? ""}`.toUpperCase() ||
      "RE"
    : "RE";

  const pwdInvalid =
    pwdPending ||
    !oldPassword ||
    !newPassword ||
    newPassword.length < 8 ||
    newPassword !== confirmPassword;

  if (loading) {
    return (
      <div className="py-[60px] text-center text-gray-400">Chargement…</div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-montserrat font-extrabold text-[22px] text-spektr-dark">
          Mon profil
        </h1>
        <p className="font-source-sans text-[13px] text-gray-500 mt-0.5">
          Informations de votre compte chargé RE
        </p>
      </div>
      <Card>
        <div className="flex items-center gap-5 mb-7 pb-6 border-b border-spektr-border">
          <div className="w-[72px] h-[72px] rounded-full bg-spektr-teal flex items-center justify-center text-2xl font-bold text-white font-montserrat flex-shrink-0">
            {initials}
          </div>
          <div className="flex-1">
            <div className="font-montserrat font-extrabold text-xl text-spektr-dark">
              {profileFirstName} {profileLastName}
            </div>
            <div className="font-source-sans text-[13px] text-gray-400 mt-0.5">
              {profile?.email ?? authUser?.email}
            </div>
            <div className="mt-2">
              <span className="bg-spektr-teal/10 text-spektr-teal text-[11px] font-bold px-2.5 py-0.5 rounded-full border border-spektr-teal/20">
                Chargé RE
              </span>
            </div>
          </div>
          {!editMode && (
            <button
              onClick={() => {
                setFirstName(profileFirstName);
                setLastName(profileLastName);
                setEditMode(true);
              }}
              className="px-4 py-2 rounded-lg border-[1.5px] border-spektr-teal bg-transparent text-spektr-teal font-montserrat font-bold text-[13px] cursor-pointer"
            >
              Modifier
            </button>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4 mb-5">
          <div>
            <label htmlFor="re-firstname" className={labelCls}>
              Prénom
            </label>
            {editMode ? (
              <input
                id="re-firstname"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className={inputCls}
              />
            ) : (
              <div className="font-source-sans text-sm font-semibold text-spektr-dark">
                {profileFirstName || "—"}
              </div>
            )}
          </div>
          <div>
            <label htmlFor="re-lastname" className={labelCls}>
              Nom
            </label>
            {editMode ? (
              <input
                id="re-lastname"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className={inputCls}
              />
            ) : (
              <div className="font-source-sans text-sm font-semibold text-spektr-dark">
                {profileLastName || "—"}
              </div>
            )}
          </div>
          <div className="col-span-2">
            <label className={labelCls}>Adresse email</label>
            <div className="font-source-sans text-sm text-gray-500">
              {profile?.email ?? authUser?.email ?? "—"}
            </div>
            <p className="font-source-sans text-xs text-gray-400 mt-0.5">
              L'adresse email ne peut pas être modifiée.
            </p>
          </div>
        </div>

        {editMode && (
          <div className="flex gap-2.5">
            <button
              onClick={() => setEditMode(false)}
              className="px-[18px] py-2.5 rounded-lg border-[1.5px] border-spektr-border bg-white text-gray-500 font-montserrat font-semibold text-[13px] cursor-pointer"
            >
              Annuler
            </button>
            <button
              onClick={async () => {
                await handleUpdate({
                  first_name: firstName,
                  last_name: lastName,
                });
                setEditMode(false);
              }}
              disabled={saving}
              aria-busy={saving}
              className={`px-6 py-2.5 rounded-lg border-none font-montserrat font-bold text-sm text-white ${saving ? "bg-spektr-teal/50 cursor-not-allowed" : "bg-spektr-teal cursor-pointer"}`}
            >
              {saving ? "Enregistrement…" : "Enregistrer les modifications"}
            </button>
          </div>
        )}
      </Card>

      {/* Password change */}
      <Card className="mt-4">
        <h2 className="font-montserrat font-bold text-[15px] text-spektr-dark mb-1.5">
          Sécurité
        </h2>
        <p className="font-source-sans text-[13px] text-gray-500 mb-5">
          Modifiez votre mot de passe. Vous serez déconnecté après confirmation.
        </p>

        {pwdSuccess ? (
          <div className="bg-[#f0fdf4] border border-[#bbf7d0] rounded-[10px] px-5 py-4 flex items-center gap-3">
            <span className="text-2xl">✅</span>
            <div>
              <div className="font-montserrat font-bold text-sm text-green-600">
                Mot de passe modifié !
              </div>
              <div className="font-source-sans text-[13px] text-green-400 mt-0.5">
                Un email de confirmation a été envoyé. Déconnexion en cours…
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-3.5 max-w-[400px]">
            <div>
              <label className={labelCls}>Mot de passe actuel</label>
              <input
                type="password"
                value={oldPassword}
                onChange={(e) => {
                  setOldPassword(e.target.value);
                  setPwdError(null);
                }}
                placeholder="••••••••"
                className={inputCls}
                autoComplete="current-password"
              />
            </div>
            <div>
              <label className={labelCls}>Nouveau mot de passe</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => {
                  setNewPassword(e.target.value);
                  setPwdError(null);
                }}
                placeholder="••••••••"
                className={inputCls}
                autoComplete="new-password"
              />
              {newPassword.length > 0 && newPassword.length < 8 && (
                <p className="font-source-sans text-xs text-amber-600 mt-1">
                  Minimum 8 caractères
                </p>
              )}
            </div>
            <div>
              <label className={labelCls}>
                Confirmer le nouveau mot de passe
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  setPwdError(null);
                }}
                placeholder="••••••••"
                className={`${inputCls} ${confirmPassword && confirmPassword !== newPassword ? "border-spektr-red focus:border-spektr-red" : ""}`}
                autoComplete="new-password"
              />
              {confirmPassword && confirmPassword !== newPassword && (
                <p className="font-source-sans text-xs text-spektr-red mt-1">
                  Les mots de passe ne correspondent pas
                </p>
              )}
            </div>
            {pwdError && (
              <div className="bg-[#fee2e2] border border-[#fecaca] rounded-lg px-3.5 py-2.5 font-source-sans text-[13px] text-[#dc2626]">
                {pwdError}
              </div>
            )}
            <button
              onClick={() => {
                if (pwdInvalid) return;
                submitPasswordChange();
              }}
              disabled={pwdInvalid}
              className={`px-5 py-2.5 rounded-lg border-none font-montserrat font-bold text-[13px] w-fit ${pwdInvalid ? "bg-spektr-border text-gray-400 cursor-not-allowed" : "bg-spektr-teal text-white cursor-pointer"}`}
            >
              {pwdPending
                ? "Modification en cours…"
                : "🔐 Modifier le mot de passe"}
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
  const search = useSearch({ strict: false }) as {
    p?: string;
    uid?: number | string;
  };
  const page = search.p ?? "dashboard";
  const uid = search.uid;

  const { data: promos = [] } = useQuery({
    queryKey: ["promos"],
    queryFn: fetchPromos,
  });
  const { data: users = [] } = useQuery({
    queryKey: ["users"],
    queryFn: fetchUsers,
  });

  const navigate = (target: string) => {
    if (target.startsWith("student-detail:")) {
      const userId = target.split(":")[1];
      tanstackNavigate({
        to: "/michel",
        search: { p: "student-detail", uid: Number(userId) },
      });
    } else {
      tanstackNavigate({ to: "/michel", search: { p: target } });
    }
  };

  const renderPage = () => {
    switch (page) {
      case "dashboard":
        return <Dashboard navigate={navigate} users={users} promos={promos} />;
      case "students":
        return (
          <StudentsList users={users} promos={promos} navigate={navigate} />
        );
      case "student-detail":
        return uid ? (
          <StudentDetail
            userId={Number(uid)}
            promos={promos}
            navigate={navigate}
          />
        ) : (
          <StudentsList users={users} promos={promos} navigate={navigate} />
        );
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
    <div className="py-7 px-8 bg-spektr-bg min-h-full">{renderPage()}</div>
  );
};

export default AdminPage;
