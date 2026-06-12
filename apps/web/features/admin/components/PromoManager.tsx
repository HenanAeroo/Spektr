import { assignPromo } from "@/features/promos/actions/assignPromo";
import {
  createPromo,
  CreatePromoData,
} from "@/features/promos/actions/createPromo";
import { deletePromo } from "@/features/promos/actions/deletePromo";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { inputCls } from "../constants";
import { Card } from "./Card";

export function PromoManager({
  users,
  promos,
  navigate,
}: {
  users: any[];
  promos: any[];
  navigate: (p: string) => void;
}) {
  const queryClient = useQueryClient();
  const [newName, setNewName] = useState("");
  const [selectedPromoId, setSelectedPromoId] = useState<number | null>(null);

  const { mutate: handleCreate } = useMutation({
    mutationFn: (data: CreatePromoData) => createPromo(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["promos"] }),
  });

  const { mutate: handleDelete } = useMutation({
    mutationFn: (id: number) => deletePromo(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["promos"] }),
  });

  const { mutate: handleAssign } = useMutation({
    mutationFn: ({ promoId, userId }: { promoId: number; userId: number }) =>
      assignPromo(promoId, userId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["users"] }),
  });

  const selectedPromo = promos.find((p) => p.id === selectedPromoId);
  const promoStudents = users.filter(
    (u) => u.promoId === selectedPromoId && u.role === "STUDENT",
  );

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-montserrat font-extrabold text-[22px] text-spektr-dark">
          Gestion des promotions
        </h1>
        <p className="font-source-sans text-[13px] text-gray-500 mt-0.5">
          Créez des promos et assignez des étudiants
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Card>
          <h2 className="font-montserrat font-bold text-sm mb-3.5">
            Promotions
          </h2>
          <div className="flex gap-2 mb-3.5">
            <input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Nom de la promo"
              className={`${inputCls} flex-1`}
              onKeyDown={(e) =>
                e.key === "Enter" &&
                newName.trim() &&
                (handleCreate({ name: newName }), setNewName(""))
              }
            />
            <button
              onClick={() => {
                if (newName.trim()) {
                  handleCreate({ name: newName });
                  setNewName("");
                }
              }}
              className="px-4 py-[9px] rounded-lg border-none bg-spektr-teal text-white font-montserrat font-bold text-[13px] cursor-pointer"
            >
              Créer
            </button>
          </div>
          {promos.length === 0 ? (
            <p className="font-source-sans text-[13px] text-gray-400">
              Aucune promo créée
            </p>
          ) : (
            <div className="flex flex-col gap-2">
              {promos.map((p: any) => {
                const count = users.filter((u) => u.promoId === p.id).length;
                return (
                  <div
                    key={p.id}
                    className={[
                      "flex items-center gap-3 px-3.5 py-2.5 rounded-lg border cursor-pointer",
                      selectedPromoId === p.id
                        ? "bg-spektr-teal border-spektr-teal"
                        : "bg-[#fafafa] border-spektr-border",
                    ].join(" ")}
                    onClick={() => {
                      setSelectedPromoId(
                        selectedPromoId === p.id ? null : p.id,
                      );
                    }}
                  >
                    <span className="font-montserrat font-semibold text-[13px] flex-1">
                      {p.name}
                    </span>
                    <span
                      className={[
                        "font-source-sans text-[11px]",
                        selectedPromoId === p.id
                          ? "text-spektr-dark"
                          : "text-gray-400",
                      ].join(" ")}
                    >
                      {count} étudiant{count !== 1 ? "s" : ""}
                    </span>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDelete(p.id); }}
                      className="bg-[#fee2e2] border-none rounded-md px-2.5 py-[5px] cursor-pointer text-[11px] font-semibold text-[#dc2626]"
                    >
                      Supprimer
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </Card>

        <Card>
          <h2 className="font-montserrat font-bold text-sm mb-3.5">
            Assigner des étudiants
          </h2>
          {users.filter((u) => u.role === "STUDENT").length === 0 ? (
            <p className="font-source-sans text-[13px] text-gray-400">
              Aucun étudiant enregistré
            </p>
          ) : (
            <div className="flex flex-col gap-2 max-h-[400px] overflow-y-auto">
              {users
                .filter((u) => u.role === "STUDENT")
                .map((u) => {
                  return (
                    <div
                      key={u.id}
                      className="flex items-center gap-3 px-3.5 py-2.5 bg-[#fafafa] rounded-lg border border-spektr-border"
                    >
                      <div className="flex-1">
                        <div className="font-montserrat font-semibold text-xs">
                          {u.first_name} {u.last_name}
                        </div>
                        <div className="font-source-sans text-[11px] text-gray-400">
                          {u.email}
                        </div>
                      </div>
                      <select
                        value={u.promoId ?? ""}
                        onChange={(e) =>
                          handleAssign({
                            promoId: parseInt(e.target.value),
                            userId: u.id,
                          })
                        }
                        className="px-2 py-[5px] border border-spektr-border rounded-md text-xs font-source-sans cursor-pointer focus:outline-none text-spektr-dark bg-white"
                      >
                        <option value="">Sans promo</option>
                        {promos.map((p: any) => (
                          <option key={p.id} value={p.id}>
                            {p.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  );
                })}
            </div>
          )}
        </Card>
      </div>

      {selectedPromoId !== null && (
        <div className="mt-4">
          <Card>
            <h2 className="font-montserrat font-bold text-sm mb-3.5">
              {selectedPromo?.name}
            </h2>
            {promoStudents.length === 0 ? (
              <p className="font-source-sans text-gray-400">
                Aucun étudiant pour cette promo
              </p>
            ) : (
              <div className="flex flex-col gap-2">
                {promoStudents.map((u) => (
                  <div
                    key={u.id}
                    onClick={() => navigate(`student-detail:${u.id}`)}
                    className="flex items-center gap-3 px-3.5 py-2.5 bg-[#fafafa] rounded-lg border border-spektr-border cursor-pointer"
                  >
                    <span className="flex-1 font-montserrat font-semibold text-xs">
                      {u.first_name} {u.last_name}
                    </span>
                    <span className="font-source-sans text-[11px]">
                      {u.email}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      )}
    </div>
  );
}
