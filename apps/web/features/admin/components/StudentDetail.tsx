import { fetchUserApplications } from "@/features/applications/actions/fetchUserApplications";
import {
  STATUT_COLORS,
  STATUT_LABELS,
} from "@/features/applications/constants";
import { getUserDocuments } from "@/features/documents/actions/getUserDocuments";
import { fetchAllCompletions } from "@/features/objectives/actions/fetchAllCompletions";
import { fetchUser } from "@/features/promos/actions/fetchUser";
import { sendFeedback } from "@/features/users/actions/sendFeedback";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Card } from "./Card";
import { StatusBadge } from "./StatusBadge";
import { fetchCommunications } from "@/features/users/actions/fetchCommunications";
import { Mail, MessageCircleMore } from "lucide-react";
import { Communications } from "@/shared/types";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/shared/components/ui/dialog";
import { reviewDocument } from "@/features/documents/actions/reviewDocument";
import { DocumentType } from "@/features/documents/types";
import DOMPurify from "dompurify";

export function StudentDetail({
  userId,
  promos,
  navigate,
}: {
  userId: number;
  promos: any[];
  navigate: (p: string) => void;
}) {
  const [activeTab, setActiveTab] = useState<
    "profile" | "objectifs" | "documents" | "candidatures" | "communications"
  >("profile");
  const [feedbackScore, setFeedbackScore] = useState<number | null>(null);
  const [feedbackText, setFeedbackText] = useState("");
  const [selectedComm, setSelectedComm] = useState<Communications | null>(null);
  const queryClient = useQueryClient();

  const { mutate: submitReview, isPending: reviewPending } = useMutation({
    mutationFn: ({
      id,
      status,
      docType,
    }: {
      id: number;
      status: "VALIDATED" | "TO_CORRECT";
      docType: DocumentType;
    }) => reviewDocument(id, status, docType),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["documents", "user", userId] }),
  });

  const {
    mutate: submitFeedback,
    isPending: feedbackPending,
    isSuccess: feedbackSent,
  } = useMutation({
    mutationFn: () => {
      const score = feedbackScore;
      if (score === null) throw new Error("Score manquant");
      return sendFeedback(userId, score, feedbackText);
    },
  });

  const { data: user } = useQuery({
    queryKey: ["users", userId],
    queryFn: () => fetchUser(userId),
    staleTime: 3 * 60 * 1000,
  });

  const { data: objectivesWithCompletions = [], isLoading: objLoading } =
    useQuery({
      queryKey: ["objectives", "completions"],
      queryFn: fetchAllCompletions,
      enabled: activeTab === "objectifs",
      staleTime: 5 * 60 * 1000,
    });

  const { data: documents = [], isLoading: docsLoading } = useQuery({
    queryKey: ["documents", "user", userId],
    queryFn: () => getUserDocuments(userId),
    enabled: activeTab === "documents",
    staleTime: 5 * 60 * 1000,
  });

  const { data: applications = [], isLoading: appsLoading } = useQuery({
    queryKey: ["applications", "user", userId],
    queryFn: () => fetchUserApplications(userId),
    enabled: activeTab === "candidatures" || activeTab === "profile",
    staleTime: 3 * 60 * 1000,
  });

  const { data: communications = [], isLoading: commsLoading } = useQuery({
    queryKey: ["communications", userId],
    queryFn: () => fetchCommunications(userId),
    enabled: activeTab === "communications",
    staleTime: 3 * 60 * 1000,
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

  const appPositive = applications.filter(
    (a) => a.statut === "REPONSE_POSITIVE",
  ).length;
  const appRefus = applications.filter((a) => a.statut === "REFUS").length;
  const appEnCours = applications.filter(
    (a) => a.statut !== "REPONSE_POSITIVE" && a.statut !== "REFUS",
  ).length;

  const tabs = [
    { id: "profile" as const, label: "Profil" },
    {
      id: "candidatures" as const,
      label: `Candidatures${applications.length ? ` (${applications.length})` : ""}`,
    },
    { id: "objectifs" as const, label: "Objectifs" },
    { id: "documents" as const, label: "Documents" },
    { id: "communications" as const, label: "Communications" },
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
                Candidatures
              </div>
              <div className="grid grid-cols-3 gap-2 text-center">
                <div
                  className="rounded-lg bg-spektr-bg py-2 cursor-pointer hover:bg-spektr-border/40 transition-colors"
                  onClick={() => setActiveTab("candidatures")}
                >
                  <div className="font-montserrat font-extrabold text-[20px] text-spektr-dark">
                    {applications.length}
                  </div>
                  <div className="font-source-sans text-[10px] text-gray-400 mt-0.5">
                    Total
                  </div>
                </div>
                <div className="rounded-lg bg-green-50 py-2">
                  <div className="font-montserrat font-extrabold text-[20px] text-green-600">
                    {appPositive}
                  </div>
                  <div className="font-source-sans text-[10px] text-green-500 mt-0.5">
                    Positif
                  </div>
                </div>
                <div className="rounded-lg bg-red-50 py-2">
                  <div className="font-montserrat font-extrabold text-[20px] text-red-500">
                    {appRefus}
                  </div>
                  <div className="font-source-sans text-[10px] text-red-400 mt-0.5">
                    Refus
                  </div>
                </div>
              </div>
              {appEnCours > 0 && (
                <div className="mt-2.5 text-center font-source-sans text-[11px] text-amber-600">
                  {appEnCours} en cours de traitement
                </div>
              )}
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

      {activeTab === "candidatures" && (
        <div className="flex flex-col gap-4">
          {/* Stats row */}
          <div className="grid grid-cols-4 gap-3">
            {[
              {
                label: "Total",
                value: applications.length,
                color: "text-spektr-dark",
                bg: "bg-white",
              },
              {
                label: "Positifs",
                value: appPositive,
                color: "text-green-600",
                bg: "bg-green-50",
              },
              {
                label: "Refus",
                value: appRefus,
                color: "text-red-500",
                bg: "bg-red-50",
              },
              {
                label: "En cours",
                value: appEnCours,
                color: "text-amber-600",
                bg: "bg-amber-50",
              },
            ].map((s) => (
              <Card key={s.label} className={s.bg}>
                <div
                  className={`font-montserrat font-extrabold text-[32px] ${s.color}`}
                >
                  {s.value}
                </div>
                <div className="font-montserrat font-semibold text-[11px] text-gray-500 uppercase tracking-[0.5px] mt-1">
                  {s.label}
                </div>
              </Card>
            ))}
          </div>

          <Card>
            <div className="font-montserrat font-bold text-sm mb-4">
              Toutes les candidatures
            </div>
            {appsLoading ? (
              <div className="text-center py-8 text-gray-400">Chargement…</div>
            ) : applications.length === 0 ? (
              <div className="text-center py-10">
                <div className="text-[32px] mb-2">📋</div>
                <p className="font-montserrat font-semibold text-sm text-gray-500">
                  Aucune candidature enregistrée
                </p>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                {[...applications]
                  .sort(
                    (a, b) =>
                      new Date(b.modified_at).getTime() -
                      new Date(a.modified_at).getTime(),
                  )
                  .map((app) => {
                    const colors = STATUT_COLORS[app.statut];
                    const dateCandidature = app.date_candidature
                      ? new Date(app.date_candidature).toLocaleDateString(
                          "fr-FR",
                          { day: "numeric", month: "short", year: "numeric" },
                        )
                      : null;
                    const dateRelance = app.date_relance_contact
                      ? new Date(app.date_relance_contact).toLocaleDateString(
                          "fr-FR",
                          { day: "numeric", month: "short" },
                        )
                      : null;
                    return (
                      <div
                        key={app.id}
                        className="flex items-start gap-3.5 px-4 py-3.5 rounded-[10px] border border-spektr-border hover:bg-[#fafafa] transition-colors"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2.5 mb-1.5">
                            <span className="font-montserrat font-bold text-[16px] text-spektr-dark truncate">
                              {app.entreprise}
                            </span>
                            <span
                              className={`px-2.5 py-0.5 rounded-full text-[12px] font-bold whitespace-nowrap flex-shrink-0 ${colors.bg} ${colors.text}`}
                            >
                              {STATUT_LABELS[app.statut]}
                            </span>
                          </div>
                          <div className="flex flex-wrap gap-x-4 gap-y-1">
                            {dateCandidature && (
                              <span className="font-source-sans text-[13px] text-gray-400">
                                📅 Candidature : {dateCandidature}
                              </span>
                            )}
                            {dateRelance && (
                              <span className="font-source-sans text-[13px] text-amber-500">
                                🔔 Relance : {dateRelance}
                              </span>
                            )}
                            {app.contact_nom && (
                              <span className="font-source-sans text-[13px] text-gray-400">
                                👤 {app.contact_nom}
                                {app.contact_email && ` · ${app.contact_email}`}
                                {app.contact_tel && ` · ${app.contact_tel}`}
                              </span>
                            )}
                          </div>
                          {app.commentaire && (
                            <div className="mt-2 font-source-sans text-[13px] text-gray-500 italic line-clamp-2">
                              {app.commentaire}
                            </div>
                          )}
                        </div>
                        {app.lien && (
                          <a
                            href={app.lien}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="bg-spektr-teal/10 border-none rounded-md px-2.5 py-1.5 text-[11px] font-semibold text-spektr-teal whitespace-nowrap flex-shrink-0 no-underline"
                          >
                            Voir l'offre →
                          </a>
                        )}
                      </div>
                    );
                  })}
              </div>
            )}
          </Card>
        </div>
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
                const isReviewable = doc.docType === "CV" || doc.docType === "LM";
                return (
                  <div
                    key={doc.id}
                    className="flex items-center gap-3 px-3.5 py-3 bg-[#fafafa] rounded-lg border border-spektr-border"
                  >
                    <div className="w-[38px] h-[38px] rounded-lg bg-spektr-teal/10 flex items-center justify-center text-[10px] font-bold text-spektr-teal flex-shrink-0">
                      {ext}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-montserrat font-semibold text-[13px] text-spektr-dark truncate">
                          {doc.name}
                        </span>
                        {isReviewable && (
                          <span className="px-1.5 py-0.5 rounded bg-spektr-teal/10 text-spektr-teal text-[10px] font-bold flex-shrink-0">
                            {doc.docType}
                          </span>
                        )}
                        {doc.status === "VALIDATED" && (
                          <span className="px-1.5 py-0.5 rounded bg-green-100 text-green-600 text-[10px] font-bold flex-shrink-0">
                            ✅ Validé
                          </span>
                        )}
                        {doc.status === "TO_CORRECT" && (
                          <span className="px-1.5 py-0.5 rounded bg-amber-100 text-amber-700 text-[10px] font-bold flex-shrink-0">
                            ⚠️ À corriger
                          </span>
                        )}
                        {doc.status === "PENDING" && isReviewable && (
                          <span className="px-1.5 py-0.5 rounded bg-gray-100 text-gray-400 text-[10px] font-bold flex-shrink-0">
                            En attente
                          </span>
                        )}
                      </div>
                      <div className="font-source-sans text-[11px] text-gray-400 mt-px">
                        {sizeKb} Ko ·{" "}
                        {doc.created_at
                          ? new Date(doc.created_at).toLocaleDateString("fr-FR")
                          : "—"}
                      </div>
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0">
                      {isReviewable && (
                        <div className="flex flex-col gap-1.5">
                          <label className="flex items-center gap-1.5 cursor-pointer select-none">
                            <input
                              type="checkbox"
                              className="sr-only"
                              checked={doc.status === "VALIDATED"}
                              disabled={reviewPending || doc.status === "VALIDATED"}
                              onChange={() =>
                                submitReview({
                                  id: doc.id,
                                  status: "VALIDATED",
                                  docType: doc.docType as DocumentType,
                                })
                              }
                            />
                            <div
                              className={[
                                "w-[15px] h-[15px] rounded border-2 flex items-center justify-center flex-shrink-0 transition-colors",
                                doc.status === "VALIDATED"
                                  ? "bg-green-500 border-green-500"
                                  : "border-gray-300 bg-white",
                              ].join(" ")}
                            >
                              {doc.status === "VALIDATED" && (
                                <span className="text-white text-[8px] font-black leading-none">
                                  ✓
                                </span>
                              )}
                            </div>
                            <span className="font-source-sans text-[12px] font-semibold text-gray-600 whitespace-nowrap">
                              Validé
                            </span>
                          </label>
                          <label className="flex items-center gap-1.5 cursor-pointer select-none">
                            <input
                              type="checkbox"
                              className="sr-only"
                              checked={doc.status === "TO_CORRECT"}
                              disabled={reviewPending || doc.status === "TO_CORRECT"}
                              onChange={() =>
                                submitReview({
                                  id: doc.id,
                                  status: "TO_CORRECT",
                                  docType: doc.docType as DocumentType,
                                })
                              }
                            />
                            <div
                              className={[
                                "w-[15px] h-[15px] rounded border-2 flex items-center justify-center flex-shrink-0 transition-colors",
                                doc.status === "TO_CORRECT"
                                  ? "bg-amber-500 border-amber-500"
                                  : "border-gray-300 bg-white",
                              ].join(" ")}
                            >
                              {doc.status === "TO_CORRECT" && (
                                <span className="text-white text-[8px] font-black leading-none">
                                  ✓
                                </span>
                              )}
                            </div>
                            <span className="font-source-sans text-[12px] font-semibold text-gray-600 whitespace-nowrap">
                              À corriger
                            </span>
                          </label>
                        </div>
                      )}
                      <button
                        onClick={async () => {
                          const { getDocumentUrl } = await import(
                            "@/features/documents/actions/getDocumentUrl"
                          );
                          const { url } = await getDocumentUrl(doc.id);
                          window.open(url, "_blank");
                        }}
                        className="bg-spektr-teal/10 border-none rounded-md px-2.5 py-1.5 cursor-pointer text-[11px] font-semibold text-spektr-teal whitespace-nowrap"
                      >
                        ⬇ Télécharger
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      )}

      {activeTab === "communications" && (
        <Card>
          <div className="font-montserrat font-bold text-sm mb-4">
            Communications avec {user.first_name} {user.last_name}
          </div>
          {commsLoading ? (
            <div className="text-center py-8 text-gray-400">Chargement…</div>
          ) : communications.length === 0 ? (
            <div className="text-center py-10">
              <div className="text-[32px] mb-2">📂</div>
              <p className="font-montserrat font-semibold text-sm text-gray-500">
                Aucune communication
              </p>
            </div>
          ) : (
            <div>
              <div className="flex flex-col gap-2">
                {communications.map((comm) => (
                  <div
                    key={comm.id}
                    onClick={() => setSelectedComm(comm)}
                    className="flex items-center gap-3 px-3.5 py-2.5 bg-[#fafafa] rounded-lg border border-spektr-border cursor-pointer hover:bg-spektr-border/30 transition-colors"
                  >
                    <div className="flex-shrink-0 text-spektr-teal">
                      {comm.type === "EMAIL" ? (
                        <Mail size={18} />
                      ) : (
                        <MessageCircleMore size={18} />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-montserrat font-semibold text-[13px] text-spektr-dark truncate">
                        {comm.type === "EMAIL"
                          ? (comm.subject ?? "(sans objet)")
                          : `Feedback ${comm.score !== null ? smileys[comm.score] : "?"}`}
                      </div>
                      <div className="font-source-sans text-[11px] text-gray-400 mt-0.5">
                        {comm.sender.first_name} {comm.sender.last_name} ·{" "}
                        {new Date(comm.created_at).toLocaleDateString("fr-FR")}
                      </div>
                    </div>
                    {comm.body && (
                      <div className="font-source-sans text-[12px] text-gray-400 truncate max-w-[200px]">
                        {comm.body.replace(/<[^>]*>/g, " ").trim()}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <Dialog
                open={selectedComm !== null}
                onOpenChange={(open) => {
                  if (!open) setSelectedComm(null);
                }}
              >
                <DialogContent className="max-w-lg bg-spektr-dark border-spektr-dark">
                  <DialogHeader>
                    <DialogTitle className="font-montserrat text-[15px] text-white">
                      {selectedComm?.type === "EMAIL" ? (
                        <span className="flex items-center gap-2">
                          <Mail size={16} className="text-spektr-teal" />
                          {selectedComm.subject ?? "(sans objet)"}
                        </span>
                      ) : (
                        <span className="flex items-center gap-2">
                          <MessageCircleMore
                            size={16}
                            className="text-spektr-teal"
                          />
                          Feedback{" "}
                          {selectedComm?.score !== null &&
                          selectedComm?.score !== undefined
                            ? `${smileys[selectedComm.score]} ${smileyLabels[selectedComm.score]}`
                            : ""}
                        </span>
                      )}
                    </DialogTitle>
                  </DialogHeader>

                  <div className="font-source-sans text-[12px] text-white/50 mb-3">
                    De :{" "}
                    <span className="font-semibold text-white">
                      {selectedComm?.sender.first_name}{" "}
                      {selectedComm?.sender.last_name}
                    </span>{" "}
                    ·{" "}
                    {selectedComm &&
                      new Date(selectedComm.created_at).toLocaleDateString(
                        "fr-FR",
                        {
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                        },
                      )}
                  </div>

                  {selectedComm?.body ? (
                    <div
                      className="font-source-sans text-[13px] text-white leading-relaxed [&_p]:mb-3 [&_p:last-child]:mb-0 [&_br]:block"
                      dangerouslySetInnerHTML={{
                        __html: DOMPurify.sanitize(selectedComm.body, {
                          ALLOWED_TAGS: [
                            "p",
                            "strong",
                            "em",
                            "u",
                            "s",
                            "h1",
                            "h2",
                            "h3",
                            "ul",
                            "ol",
                            "li",
                            "br",
                          ],
                          ALLOWED_ATTR: [],
                        }),
                      }}
                    />
                  ) : (
                    <div className="text-white/40 text-[13px] italic">
                      (aucun contenu)
                    </div>
                  )}
                </DialogContent>
              </Dialog>
            </div>
          )}
        </Card>
      )}
    </div>
  );
}
