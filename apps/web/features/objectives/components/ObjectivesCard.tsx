import { Objective } from "../types";

export function ObjectiveCard({
  obj,
  onToggle,
}: {
  obj: Objective;
  onToggle?: () => void;
}) {
  const now = new Date();
  const deadline = obj.deadline ? new Date(obj.deadline) : null;
  const isExpired = deadline && deadline < now && !obj.done;
  const daysLeft = deadline
    ? Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    : null;

  const borderColor = obj.done
    ? "border-l-green-600"
    : isExpired
      ? "border-l-spektr-red"
      : "border-l-spektr-teal";

  const deadlineBadge = isExpired
    ? "bg-red-100 text-red-600"
    : daysLeft! <= 7
      ? "bg-amber-50 text-amber-600"
      : "bg-green-50 text-green-600";

  return (
    <div
      className={[
        "bg-white rounded-[10px] border border-spektr-border p-5 border-l-[3px] transition-all",
        borderColor,
        obj.done ? "opacity-85" : "",
      ].join(" ")}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1">
          <div
            className={[
              "font-montserrat font-bold text-sm",
              obj.done ? "line-through text-gray-400" : "text-spektr-dark",
            ].join(" ")}
          >
            {obj.title}
          </div>
          {obj.description && (
            <p className="font-source-sans text-[13px] text-gray-500 mt-1.5 leading-relaxed">
              {obj.description}
            </p>
          )}
          {deadline && (
            <div className="font-source-sans text-xs text-gray-400 mt-2">
              📅{" "}
              {deadline.toLocaleDateString("fr-FR", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </div>
          )}
        </div>

        <div className="flex flex-col items-end gap-2 flex-shrink-0">
          {deadline && !obj.done && (
            <div
              className={`px-3 py-1 rounded-[10px] text-[11px] font-bold whitespace-nowrap ${deadlineBadge}`}
            >
              {isExpired
                ? "Expiré"
                : daysLeft === 0
                  ? "Aujourd'hui"
                  : `J-${daysLeft}`}
            </div>
          )}
          {obj.done && (
            <div className="px-3 py-1 rounded-[10px] bg-green-100 text-green-600 text-[11px] font-bold">
              ✓ Terminé
            </div>
          )}

          {onToggle && (
            <button
              onClick={onToggle}
              className={[
                "px-3.5 py-1.5 rounded-lg border-[1.5px] font-montserrat font-bold text-xs cursor-pointer transition-all whitespace-nowrap",
                obj.done
                  ? "border-spektr-border bg-transparent text-gray-400"
                  : "border-spektr-teal bg-spektr-teal text-white",
              ].join(" ")}
            >
              {obj.done ? "Marquer non fait" : "Marquer fait ✓"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
