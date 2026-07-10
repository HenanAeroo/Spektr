import {
  createObjective,
  CreateObjectiveData,
} from "@/features/objectives/actions/createObjective";
import { deleteObjective } from "@/features/objectives/actions/deleteObjective";
import { fetchObjectives } from "@/features/objectives/actions/fetchObjectives";
import { Calendar } from "@/shared/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/shared/components/ui/popover";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { inputCls, labelCls } from "../constants";
import { Card } from "./Card";

export function ObjectivesAdmin({ promos }: { promos: any[] }) {
  const queryClient = useQueryClient();
  const tanstackNavigate = useNavigate();
  const { data: objectives = [] } = useQuery({
    queryKey: ["objectives", "all"],
    queryFn: fetchObjectives,
  });
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [deadline, setDeadline] = useState<Date | undefined>(undefined);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [promoId, setPromoId] = useState<string>("");
  const [createError, setCreateError] = useState<string | null>(null);

  const { mutate: handleCreate, isPending: creating } = useMutation({
    mutationFn: (data: CreateObjectiveData) => createObjective(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["objectives", "all"] });
      setTitle("");
      setDescription("");
      setDeadline(undefined);
      setPromoId("");
      setShowForm(false);
      setCreateError(null);
      tanstackNavigate({ to: "/michel", search: { p: "objectifs" } });
    },
    onError: (err: Error) => {
      setCreateError(err.message ?? "Une erreur est survenue");
    },
  });

  const { mutate: handleDelete } = useMutation({
    mutationFn: (id: number) => deleteObjective(id),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["objectives", "all"] }),
  });

  const handleSubmit = () => {
    if (!title.trim() || !promoId) return;
    handleCreate({
      title: title.trim(),
      description: description.trim() || undefined,
      deadline: deadline ? deadline.toISOString() : undefined,
      promoId: Number(promoId),
    });
  };

  const grouped = objectives.reduce<Record<number, typeof objectives>>(
    (acc, obj) => {
      (acc[obj.promoId] ??= []).push(obj);
      return acc;
    },
    {},
  );

  const canCreate = !title.trim() || !promoId || creating;

  return (
    <div>
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="font-montserrat font-extrabold text-[22px] text-spektr-dark">
            Objectifs
          </h1>
          <p className="font-source-sans text-[13px] text-gray-500 mt-0.5">
            {objectives.length} objectif{objectives.length !== 1 ? "s" : ""}{" "}
            définis
          </p>
        </div>
        <button
          onClick={() => setShowForm((v) => !v)}
          aria-expanded={showForm}
          className="px-4 py-2.5 rounded-lg border-none bg-spektr-teal text-white font-montserrat font-bold text-[13px] cursor-pointer"
        >
          {showForm ? "Annuler" : "+ Créer un objectif"}
        </button>
      </div>

      {/* Create form */}
      {showForm && (
        <Card className="mb-5 border-l-[3px] border-l-spektr-teal">
          <h2 className="font-montserrat font-bold text-sm text-spektr-dark mb-4">
            Nouvel objectif
          </h2>
          <div className="grid grid-cols-2 gap-3.5 mb-3.5">
            <div className="col-span-2">
              <label htmlFor="obj-title" className={labelCls}>
                Titre *
              </label>
              <input
                id="obj-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ex : Envoyer 5 candidatures cette semaine"
                className={inputCls}
              />
            </div>
            <div>
              <label htmlFor="obj-promo" className={labelCls}>
                Promotion *
              </label>
              <select
                id="obj-promo"
                value={promoId}
                onChange={(e) => setPromoId(e.target.value)}
                className={`${inputCls} cursor-pointer`}
              >
                <option value="">Choisir une promotion</option>
                {promos.map((p: any) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelCls}>Deadline (optionnel)</label>
              <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
                <PopoverTrigger asChild>
                  <button
                    type="button"
                    className={`${inputCls} text-left cursor-pointer flex items-center gap-2 ${deadline ? "text-spektr-dark" : "text-gray-500"}`}
                  >
                    <span className="text-sm">📅</span>
                    {deadline
                      ? format(deadline, "dd MMMM yyyy", { locale: fr })
                      : "Choisir une date"}
                  </button>
                </PopoverTrigger>
                <PopoverContent align="start" className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={deadline}
                    onSelect={(date) => {
                      setDeadline(date);
                      setCalendarOpen(false);
                    }}
                    locale={fr}
                    disabled={(date) =>
                      date < new Date(new Date().setHours(0, 0, 0, 0))
                    }
                    initialFocus
                  />
                  {deadline && (
                    <div className="px-3 py-2 border-t border-[#f0f0f0]">
                      <button
                        type="button"
                        onClick={() => {
                          setDeadline(undefined);
                          setCalendarOpen(false);
                        }}
                        className="text-xs text-spektr-red bg-transparent border-none cursor-pointer font-source-sans"
                      >
                        Effacer la date
                      </button>
                    </div>
                  )}
                </PopoverContent>
              </Popover>
            </div>
            <div className="col-span-2">
              <label htmlFor="obj-desc" className={labelCls}>
                Description (optionnel)
              </label>
              <textarea
                id="obj-desc"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Décrivez l'objectif en détail..."
                rows={3}
                className={`${inputCls} resize-y leading-relaxed`}
              />
            </div>
          </div>
          {createError && (
            <div className="bg-[#fee2e2] text-[#dc2626] rounded-lg px-3.5 py-2.5 text-[13px] font-source-sans mb-3">
              {createError}
            </div>
          )}
          <div className="flex gap-2.5 justify-end">
            <button
              onClick={() => {
                setShowForm(false);
                setCreateError(null);
              }}
              className="px-[18px] py-[9px] rounded-lg border-[1.5px] border-spektr-border bg-white text-gray-500 font-montserrat font-semibold text-[13px] cursor-pointer"
            >
              Annuler
            </button>
            <button
              onClick={handleSubmit}
              disabled={canCreate}
              aria-busy={creating}
              className={`px-[18px] py-[9px] rounded-lg border-none font-montserrat font-bold text-[13px] text-white ${canCreate ? "bg-spektr-teal/50 cursor-not-allowed" : "bg-spektr-teal cursor-pointer"}`}
            >
              {creating ? "Création…" : "Créer l'objectif"}
            </button>
          </div>
        </Card>
      )}

      {objectives.length === 0 && !showForm ? (
        <Card>
          <div className="text-center py-10">
            <div className="text-[40px] mb-3">🎯</div>
            <p className="font-montserrat font-semibold text-sm text-gray-500">
              Aucun objectif défini
            </p>
            <p className="font-source-sans text-[13px] text-gray-500 mt-1">
              Cliquez sur "+ Créer un objectif" pour commencer
            </p>
          </div>
        </Card>
      ) : (
        <div className="flex flex-col gap-6">
          {Object.entries(grouped).map(([gPromoId, objs]) => {
            const promo = promos.find((p: any) => p.id === Number(gPromoId));
            return (
              <div key={gPromoId}>
                <div className="font-montserrat font-bold text-sm text-spektr-dark mb-2.5 flex items-center gap-2">
                  <span className="bg-spektr-teal/10 text-spektr-teal-accessible px-2.5 py-0.5 rounded-full text-xs">
                    {promo?.name ?? `Promo ${gPromoId}`}
                  </span>
                  <span className="font-normal text-gray-500 text-xs">
                    {objs.length} objectif{objs.length !== 1 ? "s" : ""}
                  </span>
                </div>
                <div className="flex flex-col gap-2.5">
                  {objs.map((obj) => (
                    <Card
                      key={obj.id}
                      className="border-l-[3px] border-l-spektr-teal"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1">
                          <div className="font-montserrat font-bold text-[13px] text-spektr-dark mb-1">
                            {obj.title}
                          </div>
                          {obj.description && (
                            <p className="font-source-sans text-[13px] text-gray-500">
                              {obj.description}
                            </p>
                          )}
                          {obj.deadline && (
                            <div className="font-source-sans text-xs text-gray-500 mt-1.5">
                              📅{" "}
                              {new Date(obj.deadline).toLocaleDateString(
                                "fr-FR",
                              )}
                            </div>
                          )}
                        </div>
                        <button
                          onClick={() => handleDelete(obj.id)}
                          aria-label={`Supprimer l'objectif "${obj.title}"`}
                          className="bg-[#fee2e2] border-none rounded-md px-2.5 py-[5px] cursor-pointer text-[11px] font-semibold text-[#dc2626] flex-shrink-0"
                        >
                          Supprimer
                        </button>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
