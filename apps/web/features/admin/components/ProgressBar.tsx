export function ProgressBar({
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
        className={`text-[11px] font-semibold min-w-8 ${color === "bg-green-600" ? "text-green-600" : "text-spektr-teal-accessible"}`}
      >
        {pct}%
      </span>
    </div>
  );
}
