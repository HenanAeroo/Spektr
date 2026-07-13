import { z } from "zod";
import { useRef, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Application, Statut } from "@/features/applications/types";
import {
  errorCls,
  inputCls,
  labelCls,
  STATUT_LABELS,
  STATUTS,
} from "../constants";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/shared/components/ui/popover";
import { Calendar } from "@/shared/components/ui/calendar";
import { CreateApplicationData } from "../actions/createApplication";
import { useFocusTrap } from "@/shared/hooks/useFocusTrap";

const schema = z.object({
  entreprise: z.string().min(1, "L'entreprise est requise"),
  statut: z.enum([
    "A_CONTACTER",
    "ENVOYE",
    "RELANCE",
    "EN_DISCUSSION",
    "REPONSE_POSITIVE",
    "REFUS",
  ]),
  lien: z.string().url("URL invalide").optional().or(z.literal("")),
  contact_nom: z.string().optional(),
  contact_email: z
    .string()
    .email("Email invalide")
    .optional()
    .or(z.literal("")),
  contact_tel: z.string().optional(),
  commentaire: z.string().optional(),
  date_candidature: z.date().optional(),
  date_relance_contact: z.date().optional(),
  date_relance_tel: z.date().optional(),
  date_reponse_entreprise: z.date().optional(),
});

type FormValues = z.infer<typeof schema>;

export type ModalProps = {
  app: Partial<Application> & { id?: number };
  onClose: () => void;
  onSave: (data: CreateApplicationData) => void;
  mode: "create" | "edit";
};

export function AppModal({ app, onClose, onSave, mode }: ModalProps) {
  const [applicationCalendarOpen, setApplicationCalendarOpen] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      entreprise: app.entreprise ?? "",
      statut: (app.statut ?? "A_CONTACTER") as Statut,
      contact_nom: app.contact_nom ?? "",
      contact_email: app.contact_email ?? "",
      contact_tel: app.contact_tel ?? "",
      commentaire: app.commentaire ?? "",
      lien: app.lien ?? "",
      date_candidature: undefined,
      date_relance_contact: undefined,
      date_relance_tel: undefined,
      date_reponse_entreprise: undefined,
    },
  });

  const errors = form.formState.errors;

  const modalRef = useRef<HTMLDivElement>(null);

  useFocusTrap(modalRef, true, onClose);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="appmodal-title"
      className="fixed inset-0 bg-black/45 z-1000 flex items-center justify-center"
    >
      <div
        ref={modalRef}
        className="bg-white rounded-2xl w-140 max-h-[90vh] overflow-auto shadow-[0_24px_80px_rgba(0,0,0,0.2)]"
      >
        <div className="flex justify-between items-center px-7 py-5.5 border-b border-spektr-border">
          <span
            id="appmodal-title"
            className="font-montserrat font-extrabold text-[17px] text-spektr-dark"
          >
            {mode === "create"
              ? "Nouvelle candidature"
              : "Modifier la candidature"}
          </span>
          <button
            onClick={onClose}
            aria-label="Fermer"
            className="bg-transparent border-none cursor-pointer text-xl text-gray-400"
          >
            ✕
          </button>
        </div>

        <div className="px-7 py-5.5 flex flex-col gap-3.5">
          {/* Entreprise */}
          <div>
            <label className={labelCls}>Entreprise</label>
            <input
              {...form.register("entreprise")}
              placeholder="Nom de l'entreprise"
              className={inputCls}
            />
            {errors.entreprise && (
              <p className={errorCls}>{errors.entreprise.message}</p>
            )}
          </div>

          {/* Statut + Date */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Statut</label>
              <select
                {...form.register("statut")}
                className={`${inputCls} cursor-pointer`}
              >
                {STATUTS.map((s) => (
                  <option key={s} value={s}>
                    {STATUT_LABELS[s]}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelCls}>Date de candidature</label>
              <Controller
                control={form.control}
                name="date_candidature"
                render={({ field }) => (
                  <Popover
                    open={applicationCalendarOpen}
                    onOpenChange={setApplicationCalendarOpen}
                  >
                    <PopoverTrigger asChild>
                      <button
                        type="button"
                        className={`${inputCls} text-left ${!field.value ? "text-gray-400" : ""}`}
                      >
                        {field.value
                          ? field.value.toLocaleDateString("fr-FR")
                          : "Sélectionner une date"}
                      </button>
                    </PopoverTrigger>
                    <PopoverContent className="z-1001">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={(date) => {
                          field.onChange(date);
                          setApplicationCalendarOpen(false);
                        }}
                      />
                    </PopoverContent>
                  </Popover>
                )}
              />
            </div>
          </div>

          {/* Lien */}
          <div>
            <label className={labelCls}>Lien de l'offre</label>
            <input
              {...form.register("lien")}
              placeholder="https://..."
              className={inputCls}
            />
            {errors.lien && <p className={errorCls}>{errors.lien.message}</p>}
          </div>

          {/* Contact */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Nom du contact</label>
              <input
                {...form.register("contact_nom")}
                placeholder="Jean Dupont"
                className={inputCls}
              />
            </div>
            <div>
              <label className={labelCls}>Email du contact</label>
              <input
                {...form.register("contact_email")}
                placeholder="contact@entreprise.com"
                className={inputCls}
              />
              {errors.contact_email && (
                <p className={errorCls}>{errors.contact_email.message}</p>
              )}
            </div>
          </div>

          {/* Commentaire */}
          <div>
            <label className={labelCls}>Commentaire</label>
            <textarea
              {...form.register("commentaire")}
              placeholder="Notes sur cette candidature..."
              rows={3}
              className={`${inputCls} resize-y leading-relaxed`}
            />
          </div>

          {/* Actions */}
          <div className="flex gap-2.5 justify-end pt-1">
            <button
              onClick={onClose}
              className="px-5 py-2.5 rounded-lg border-[1.5px] border-spektr-border bg-white font-montserrat font-semibold text-[13px] cursor-pointer text-gray-500"
            >
              Annuler
            </button>
            <button
              onClick={form.handleSubmit((data) =>
                onSave({
                  ...data,
                  lien: data.lien || undefined,
                  contact_nom: data.contact_nom || undefined,
                  contact_email: data.contact_email || undefined,
                  contact_tel: data.contact_tel || undefined,
                  commentaire: data.commentaire || undefined,
                  date_candidature: data.date_candidature?.toISOString(),
                  date_relance_contact:
                    data.date_relance_contact?.toISOString(),
                  date_relance_tel: data.date_relance_tel?.toISOString(),
                  date_reponse_entreprise:
                    data.date_reponse_entreprise?.toISOString(),
                }),
              )}
              disabled={!form.watch("entreprise")?.trim()}
              className={[
                "px-5 py-2.5 rounded-lg border-none font-montserrat font-bold text-[13px] text-white",
                form.watch("entreprise")?.trim()
                  ? "bg-spektr-teal cursor-pointer"
                  : "bg-spektr-teal/50 cursor-not-allowed",
              ].join(" ")}
            >
              {mode === "create" ? "Ajouter" : "Enregistrer"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
