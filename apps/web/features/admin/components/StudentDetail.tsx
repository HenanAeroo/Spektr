import { getUserDocuments } from "@/features/documents/actions/getUserDocuments";
import { fetchAllCompletions } from "@/features/objectives/actions/fetchAllCompletions";
import { fetchUser } from "@/features/promos/actions/fetchUser";
import { sendFeedback } from "@/features/users/actions/sendFeedback";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Card } from "./Card";
import { StatusBadge } from "./StatusBadge";

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
