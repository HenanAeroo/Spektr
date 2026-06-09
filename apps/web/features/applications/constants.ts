import { Statut } from "./types";

export const STATUTS: Statut[] = [
  "A_CONTACTER",
  "ENVOYE",
  "RELANCE",
  "EN_DISCUSSION",
  "REPONSE_POSITIVE",
  "REFUS",
];

export const STATUT_LABELS: Record<Statut, string> = {
  A_CONTACTER: "À contacter",
  ENVOYE: "Envoyé",
  RELANCE: "Relancé",
  EN_DISCUSSION: "En discussion",
  REPONSE_POSITIVE: "Réponse positive",
  REFUS: "Refus",
};

export const STATUT_COLORS: Record<
  Statut,
  { bg: string; text: string; border: string; activeBg: string }
> = {
  A_CONTACTER: {
    bg: "bg-gray-100",
    text: "text-gray-500",
    border: "border-gray-200",
    activeBg: "bg-gray-500",
  },
  ENVOYE: {
    bg: "bg-blue-50",
    text: "text-blue-500",
    border: "border-blue-200",
    activeBg: "bg-blue-500",
  },
  RELANCE: {
    bg: "bg-amber-50",
    text: "text-amber-600",
    border: "border-amber-200",
    activeBg: "bg-amber-600",
  },
  EN_DISCUSSION: {
    bg: "bg-violet-50",
    text: "text-violet-500",
    border: "border-violet-200",
    activeBg: "bg-violet-500",
  },
  REPONSE_POSITIVE: {
    bg: "bg-green-100",
    text: "text-green-600",
    border: "border-green-200",
    activeBg: "bg-green-600",
  },
  REFUS: {
    bg: "bg-red-100",
    text: "text-red-600",
    border: "border-red-200",
    activeBg: "bg-red-600",
  },
};

export const inputCls =
  "w-full px-3 py-[9px] border-[1.5px] border-spektr-border rounded-lg font-source-sans text-[13px] text-spektr-dark bg-white focus:outline-none focus:border-spektr-teal box-border";

export const labelCls =
  "font-montserrat font-semibold text-xs text-spektr-dark block mb-[5px]";

export const modifCls =
  "font-montserrat font-semibold text-xs text-spektr-teal block mb-[5px]";

export const errorCls = "font-source-sans text-xs text-spektr-red mt-1";
