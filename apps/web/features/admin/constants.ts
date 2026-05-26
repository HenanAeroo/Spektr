export const STATUT_STATUS_COLORS = {
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

export const inputCls =
  "w-full px-3 py-[9px] border-[1.5px] border-spektr-border rounded-lg font-source-sans text-[13px] text-spektr-dark bg-white focus:outline-none focus:border-spektr-teal box-border";

export const labelCls =
  "font-montserrat font-semibold text-[11px] text-gray-500 uppercase tracking-[0.5px] block mb-1";
