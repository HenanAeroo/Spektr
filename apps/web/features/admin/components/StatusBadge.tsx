import { STATUT_STATUS_COLORS } from "../constants";

export function StatusBadge({
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
