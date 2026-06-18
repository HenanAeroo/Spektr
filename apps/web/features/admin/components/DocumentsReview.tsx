import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getPendingDocumentReviews } from "@/features/documents/actions/getPendingDocumentReviews";
import { reviewDocument } from "@/features/documents/actions/reviewDocument";
import { PendingReview } from "@/features/documents/types";

const STATUS_LABELS = {
  PENDING: { label: "En attente", className: "bg-gray-100 text-gray-500" },
  TO_CORRECT: { label: "À corriger", className: "bg-amber-100 text-amber-700" },
};

function ReviewCard({
  doc,
  onReview,
  pending,
  navigate,
}: {
  doc: PendingReview;
  onReview: (id: number, status: "VALIDATED" | "TO_CORRECT") => void;
  pending: boolean;
  navigate: (p: string) => void;
}) {
  const statusInfo = STATUS_LABELS[doc.status as keyof typeof STATUS_LABELS];
  const sizeKb = Math.round(doc.size / 1024);

  return (
    <div className="flex items-start gap-3 px-4 py-3.5 bg-white rounded-[10px] border border-spektr-border">
      <div className="flex-1 min-w-0">
        <button
          onClick={() => navigate(`student-detail:${doc.user.id}`)}
          className="font-montserrat font-bold text-[13px] text-spektr-dark bg-transparent border-none cursor-pointer p-0 hover:text-spektr-teal transition-colors text-left"
        >
          {doc.user.first_name} {doc.user.last_name}
        </button>
        <div className="font-source-sans text-[12px] text-gray-500 mt-0.5 truncate">
          {doc.name}
        </div>
        <div className="flex items-center gap-2 mt-1.5">
          <span
            className={[
              "px-2 py-0.5 rounded text-[10px] font-bold",
              statusInfo?.className ?? "bg-gray-100 text-gray-500",
            ].join(" ")}
          >
            {statusInfo?.label ?? doc.status}
          </span>
          <span className="font-source-sans text-[11px] text-gray-400">
            {sizeKb} Ko ·{" "}
            {new Date(doc.created_at).toLocaleDateString("fr-FR", {
              day: "numeric",
              month: "short",
            })}
          </span>
        </div>
      </div>
      <div className="flex flex-col gap-2 flex-shrink-0">
        <label className="flex items-center gap-1.5 cursor-pointer select-none">
          <input
            type="checkbox"
            className="sr-only"
            checked={doc.status === "VALIDATED"}
            disabled={pending || doc.status === "VALIDATED"}
            onChange={() => onReview(doc.id, "VALIDATED")}
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
              <span className="text-white text-[8px] font-black leading-none">✓</span>
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
            disabled={pending || doc.status === "TO_CORRECT"}
            onChange={() => onReview(doc.id, "TO_CORRECT")}
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
              <span className="text-white text-[8px] font-black leading-none">✓</span>
            )}
          </div>
          <span className="font-source-sans text-[12px] font-semibold text-gray-600 whitespace-nowrap">
            À corriger
          </span>
        </label>
      </div>
    </div>
  );
}

export function DocumentsReview({
  navigate,
}: {
  navigate: (p: string) => void;
}) {
  const queryClient = useQueryClient();

  const { data: docs = [], isLoading } = useQuery({
    queryKey: ["documents", "pending-reviews"],
    queryFn: getPendingDocumentReviews,
    staleTime: 60 * 1000,
  });

  const { mutate: submitReview, isPending: reviewPending } = useMutation({
    mutationFn: ({
      id,
      status,
      docType,
    }: {
      id: number;
      status: "VALIDATED" | "TO_CORRECT";
      docType: "CV" | "LM";
    }) => reviewDocument(id, status, docType),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["documents", "pending-reviews"] }),
  });

  const cvDocs = docs.filter((d) => d.docType === "CV");
  const lmDocs = docs.filter((d) => d.docType === "LM");

  const handleReview = (
    doc: PendingReview,
    status: "VALIDATED" | "TO_CORRECT",
  ) => {
    submitReview({ id: doc.id, status, docType: doc.docType as "CV" | "LM" });
  };

  return (
    <div>
      <div className="mb-5">
        <h1 className="font-montserrat font-extrabold text-[22px] text-spektr-dark tracking-[-0.3px]">
          Revue des documents
        </h1>
        <p className="font-source-sans text-[13px] text-gray-500 mt-0.5">
          CV et lettres de motivation en attente de validation ou à corriger
        </p>
      </div>

      {isLoading ? (
        <div className="text-center py-16 text-gray-400">Chargement…</div>
      ) : docs.length === 0 ? (
        <div className="text-center py-20">
          <div className="text-[48px] mb-3">✅</div>
          <p className="font-montserrat font-bold text-[15px] text-gray-500">
            Aucun document en attente de revue
          </p>
          <p className="font-source-sans text-[13px] text-gray-400 mt-1">
            Tous les CV et LM ont été traités.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-5">
          {/* CV */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="font-montserrat font-bold text-[13px] text-spektr-dark">
                CV
              </span>
              <span className="bg-spektr-teal/10 text-spektr-teal font-montserrat font-bold text-[11px] px-2 py-0.5 rounded-full">
                {cvDocs.length}
              </span>
            </div>
            {cvDocs.length === 0 ? (
              <div className="text-center py-10 bg-white rounded-[10px] border border-spektr-border text-gray-400 font-source-sans text-[13px]">
                Aucun CV en attente
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                {cvDocs.map((doc) => (
                  <ReviewCard
                    key={doc.id}
                    doc={doc}
                    onReview={(id, status) => handleReview(doc, status)}
                    pending={reviewPending}
                    navigate={navigate}
                  />
                ))}
              </div>
            )}
          </div>

          {/* LM */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="font-montserrat font-bold text-[13px] text-spektr-dark">
                Lettres de motivation
              </span>
              <span className="bg-spektr-teal/10 text-spektr-teal font-montserrat font-bold text-[11px] px-2 py-0.5 rounded-full">
                {lmDocs.length}
              </span>
            </div>
            {lmDocs.length === 0 ? (
              <div className="text-center py-10 bg-white rounded-[10px] border border-spektr-border text-gray-400 font-source-sans text-[13px]">
                Aucune LM en attente
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                {lmDocs.map((doc) => (
                  <ReviewCard
                    key={doc.id}
                    doc={doc}
                    onReview={(id, status) => handleReview(doc, status)}
                    pending={reviewPending}
                    navigate={navigate}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
