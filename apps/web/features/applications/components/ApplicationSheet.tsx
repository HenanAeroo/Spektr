import { z } from "zod";
import { useEffect, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Application, Statut } from "@/features/applications/types";
import {
  errorCls,
  inputCls,
  modifCls,
  STATUT_LABELS,
  STATUTS,
} from "../constants";
import { Calendar } from "@/shared/components/ui/calendar";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/shared/components/ui/sheet";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/shared/components/ui/popover";

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
  app: (Partial<Application> & { id?: number }) | null;
  onClose: () => void;
  onSave: (data: Partial<Application>) => void;
  mode: "create" | "edit";
  open: boolean;
};

export function ApplicationSheet({
  app,
  onClose,
  onSave,
  mode,
  open,
}: ModalProps) {
  const [applicationCalendarOpen, setApplicationCalendarOpen] = useState(false);
  const [contactCalendarOpen, setContactCalendarOpen] = useState(false);
  const [telCalendarOpen, setTelCalendarOpen] = useState(false);
  const [responseCalendarOpen, setResponseCalendarOpen] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      entreprise: app?.entreprise ?? "",
      statut: (app?.statut ?? "A_CONTACTER") as Statut,
      contact_nom: app?.contact_nom ?? "",
      contact_email: app?.contact_email ?? "",
      contact_tel: app?.contact_tel ?? "",
      commentaire: app?.commentaire ?? "",
      lien: app?.lien ?? "",
      date_candidature: app?.date_candidature
        ? new Date(app.date_candidature)
        : undefined,
      date_relance_contact: app?.date_relance_contact
        ? new Date(app.date_relance_contact)
        : undefined,
      date_relance_tel: app?.date_relance_tel
        ? new Date(app.date_relance_tel)
        : undefined,
      date_reponse_entreprise: app?.date_reponse_entreprise
        ? new Date(app.date_reponse_entreprise)
        : undefined,
    },
  });

  useEffect(() => {
    if (app !== null) {
      form.reset({
        entreprise: app.entreprise ?? "",
        statut: (app.statut ?? "A_CONTACTER") as Statut,
        contact_nom: app.contact_nom ?? "",
        contact_email: app.contact_email ?? "",
        contact_tel: app.contact_tel ?? "",
        commentaire: app.commentaire ?? "",
        lien: app.lien ?? "",
        date_candidature: app.date_candidature
          ? new Date(app.date_candidature)
          : undefined,
        date_relance_contact: app.date_relance_contact
          ? new Date(app.date_relance_contact)
          : undefined,
        date_relance_tel: app.date_relance_tel
          ? new Date(app.date_relance_tel)
          : undefined,
        date_reponse_entreprise: app.date_reponse_entreprise
          ? new Date(app.date_reponse_entreprise)
          : undefined,
      });
    }
  }, [app]);

  const errors = form.formState.errors;

  return (
    <Sheet open={open} onOpenChange={(open) => !open && onClose()}>
      <SheetContent side="right" className="w-1/3 text-white">
        <SheetHeader>
          <SheetTitle className="text-2xl">
            Modifier - {app?.entreprise}
          </SheetTitle>
        </SheetHeader>
        <div className="overflow-y-auto flex flex-col px-7 py-5.5 gap-3.5">
          <div>
            <h2 className="text-lg">Section - Informations principales</h2>
            {/* Entreprise */}
            <div className="pb-2">
              <label className={modifCls}>Entreprise</label>
              <input
                {...form.register("entreprise")}
                placeholder="Nom de l'entreprise"
                className={inputCls}
              />
              {errors.entreprise && (
                <p className={errorCls}>{errors.entreprise.message}</p>
              )}
            </div>

            {/* Statut */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={modifCls}>Statut</label>
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
            </div>
          </div>

          <div>
            <h2 className="text-lg">Section - Contact</h2>
            {/* Contact */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={modifCls}>Nom</label>
                <input
                  {...form.register("contact_nom")}
                  placeholder="Jean Dupont"
                  className={inputCls}
                />
              </div>
              <div>
                <label className={modifCls}>Numéro de téléphone</label>
                <input
                  {...form.register("contact_tel")}
                  placeholder="+33 6 12 34 56 78"
                  className={inputCls}
                />
              </div>
              <div>
                <label className={modifCls}>Email</label>
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
          </div>

          <div className="pb-2">
            <h2 className="text-lg">Section - Dates</h2>
            <div className="pb-2">
              <label className={modifCls}>Date de candidature</label>
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

            <div className="pb-2">
              <label className={modifCls}>Date de relance du contact</label>
              <Controller
                control={form.control}
                name="date_relance_contact"
                render={({ field }) => (
                  <Popover
                    open={contactCalendarOpen}
                    onOpenChange={setContactCalendarOpen}
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
                          setContactCalendarOpen(false);
                        }}
                      />
                    </PopoverContent>
                  </Popover>
                )}
              />
            </div>

            <div className="pb-2">
              <label className={modifCls}>Date de relance téléphonique</label>
              <Controller
                control={form.control}
                name="date_relance_tel"
                render={({ field }) => (
                  <Popover
                    open={telCalendarOpen}
                    onOpenChange={setTelCalendarOpen}
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
                          setTelCalendarOpen(false);
                        }}
                      />
                    </PopoverContent>
                  </Popover>
                )}
              />
            </div>

            <div className="pb-2">
              <label className={modifCls}>
                Date de réponse de l'entreprise
              </label>
              <Controller
                control={form.control}
                name="date_reponse_entreprise"
                render={({ field }) => (
                  <Popover
                    open={responseCalendarOpen}
                    onOpenChange={setResponseCalendarOpen}
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
                          setResponseCalendarOpen(false);
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
            <label className={modifCls}>Lien de l'offre</label>
            <input
              {...form.register("lien")}
              placeholder="https://..."
              className={inputCls}
            />
            {errors.lien && <p className={errorCls}>{errors.lien.message}</p>}
          </div>

          {/* Commentaire */}
          <div>
            <label className={modifCls}>Commentaire</label>
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
      </SheetContent>
    </Sheet>
  );
}
