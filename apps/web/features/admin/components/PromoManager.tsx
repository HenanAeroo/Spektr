import { assignPromo } from "@/features/promos/actions/assignPromo";
import {
  createPromo,
  CreatePromoData,
} from "@/features/promos/actions/createPromo";
import { deletePromo } from "@/features/promos/actions/deletePromo";
import {
  assignAdmin,
  AdminPromoRole,
} from "@/features/promos/actions/assignAdmin";
import { removeAdmin } from "@/features/promos/actions/removeAdmin";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { inputCls } from "../constants";
import { Card } from "./Card";
import { getUser } from "@/shared/lib/auth";
import { useFocusTrap } from "@/shared/hooks/useFocusTrap";

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
  const currentUser = getUser();
  const isSuperAdmin = currentUser?.role === "SUPER_ADMIN";

  const [newName, setNewName] = useState("");
  const [selectedPromoId, setSelectedPromoId] = useState<number | null>(null);
  const [assignAdminPromoId, setAssignAdminPromoId] = useState<number | null>(
    null,
  );
  const [adminRole, setAdminRole] = useState<AdminPromoRole>("OWNER");

  const { mutate: handleCreate } = useMutation({
    mutationFn: (data: CreatePromoData) => createPromo(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["promos"] }),
  });

  const { mutate: handleDelete } = useMutation({
    mutationFn: (id: number) => deletePromo(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["promos"] });
      if (selectedPromoId === assignAdminPromoId) setAssignAdminPromoId(null);
    },
  });

  const { mutate: handleAssign } = useMutation({
    mutationFn: ({ promoId, userId }: { promoId: number; userId: number }) =>
      assignPromo(promoId, userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      toast.success("Promo mise à jour");
    },
    onError: (err: Error) =>
      toast.error(err.message ?? "Erreur lors de l'affectation"),
  });

  const { mutate: handleAssignAdmin } = useMutation({
    mutationFn: ({ promoId, adminId }: { promoId: number; adminId: number }) =>
      assignAdmin(promoId, adminId, adminRole),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["promos"] });
      setAssignAdminPromoId(null);
    },
  });

  const { mutate: handleRemoveAdmin } = useMutation({
    mutationFn: ({ promoId, adminId }: { promoId: number; adminId: number }) =>
      removeAdmin(promoId, adminId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["promos"] }),
  });

  const selectedPromo = promos.find((p) => p.id === selectedPromoId);
  const promoStudents = users.filter(
    (u) => u.promoId === selectedPromoId && u.role === "STUDENT",
  );
  const adminUsers = users.filter((u) => u.role === "ADMIN");

  const modalRef = useRef<HTMLDivElement>(null);

  useFocusTrap(modalRef, assignAdminPromoId !== null, () =>
    setAssignAdminPromoId(null),
  );

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-montserrat font-extrabold text-[22px] text-spektr-dark">
          Gestion des promotions
        </h1>
        <p className="font-source-sans text-[13px] text-gray-500 mt-0.5">
          {isSuperAdmin
            ? "Créez des promos et assignez des admins et étudiants"
            : "Assignez vos étudiants aux promotions"}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Card>
          <h2 className="font-montserrat font-bold text-sm mb-3.5">
            Promotions
          </h2>

          {/* Create promo — SUPER_ADMIN only */}
          {isSuperAdmin && (
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
          )}

          {promos.length === 0 ? (
            <p className="font-source-sans text-[13px] text-gray-500">
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
                    onClick={() =>
                      setSelectedPromoId(selectedPromoId === p.id ? null : p.id)
                    }
                  >
                    <span className="font-montserrat font-semibold text-[13px] flex-1">
                      {p.name}
                    </span>
                    <span
                      className={[
                        "font-source-sans text-[11px]",
                        selectedPromoId === p.id
                          ? "text-spektr-dark"
                          : "text-gray-500",
                      ].join(" ")}
                    >
                      {count} étudiant{count !== 1 ? "s" : ""}
                    </span>
                    {isSuperAdmin && (
                      <>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setAssignAdminPromoId(p.id);
                          }}
                          className="bg-blue-50 border-none rounded-md px-2.5 py-[5px] cursor-pointer text-[11px] font-semibold text-blue-600"
                        >
                          + Admin
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(p.id);
                          }}
                          className="bg-[#fee2e2] border-none rounded-md px-2.5 py-[5px] cursor-pointer text-[11px] font-semibold text-[#dc2626]"
                        >
                          Supprimer
                        </button>
                      </>
                    )}
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
            <p className="font-source-sans text-[13px] text-gray-500">
              Aucun étudiant enregistré
            </p>
          ) : (
            <div className="flex flex-col gap-2 max-h-[400px] overflow-y-auto">
              {users
                .filter((u) => u.role === "STUDENT")
                .map((u) => (
                  <div
                    key={u.id}
                    className="flex items-center gap-3 px-3.5 py-2.5 bg-[#fafafa] rounded-lg border border-spektr-border"
                  >
                    <div className="flex-1">
                      <div className="font-montserrat font-semibold text-xs">
                        {u.first_name} {u.last_name}
                      </div>
                      <div className="font-source-sans text-[11px] text-gray-500">
                        {u.email}
                      </div>
                    </div>
                    <select
                      value={u.promoId ?? ""}
                      onChange={(e) => {
                        if (!e.target.value) return;
                        handleAssign({
                          promoId: parseInt(e.target.value, 10),
                          userId: u.id,
                        });
                      }}
                      className="px-2 py-[5px] border border-spektr-border rounded-md text-xs font-source-sans cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-spektr-teal focus-visible:ring-offset-1 text-spektr-dark bg-white"
                    >
                      <option value="">Sans promo</option>
                      {promos.map((p: any) => (
                        <option key={p.id} value={p.id}>
                          {p.name}
                        </option>
                      ))}
                    </select>
                  </div>
                ))}
            </div>
          )}
        </Card>
      </div>

      {/* Selected promo detail */}
      {selectedPromoId !== null && (
        <div className="mt-4">
          <Card>
            <h2 className="font-montserrat font-bold text-sm mb-3.5">
              {selectedPromo?.name}
            </h2>

            {/* Admins assigned to this promo — SUPER_ADMIN only */}
            {isSuperAdmin && selectedPromo?.adminPromos?.length > 0 && (
              <div className="mb-4">
                <p className="font-montserrat font-semibold text-xs text-gray-500 mb-2">
                  Admins assignés
                </p>
                <div className="flex flex-col gap-1.5">
                  {selectedPromo.adminPromos.map((ap: any) => (
                    <div
                      key={ap.adminId}
                      className="flex items-center gap-2 px-3 py-2 bg-blue-50 rounded-lg"
                    >
                      <span className="font-montserrat font-semibold text-xs flex-1">
                        {ap.admin?.first_name} {ap.admin?.last_name}
                        <span className="ml-1 text-[10px] text-blue-500 font-normal">
                          (
                          {ap.role === "OWNER"
                            ? "Propriétaire"
                            : "Collaborateur"}
                          )
                        </span>
                      </span>
                      <span className="font-source-sans text-[10px] text-gray-500">
                        {ap.admin?.email}
                      </span>
                      <button
                        onClick={() =>
                          handleRemoveAdmin({
                            promoId: selectedPromoId,
                            adminId: ap.adminId,
                          })
                        }
                        className="bg-transparent border-none cursor-pointer text-[11px] text-red-400 font-semibold"
                      >
                        Retirer
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Students in promo */}
            {promoStudents.length === 0 ? (
              <p className="font-source-sans text-gray-500">
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

      {/* Assign admin dialog — SUPER_ADMIN only */}
      {isSuperAdmin && assignAdminPromoId !== null && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="assign-admin-title"
          onClick={() => setAssignAdminPromoId(null)}
          className="fixed inset-0 bg-black/45 z-[1000] flex items-center justify-center"
        >
          <div
            ref={modalRef}
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-2xl w-[420px] shadow-[0_24px_80px_rgba(0,0,0,0.2)]"
          >
            <div className="flex justify-between items-center px-6 py-5 border-b border-spektr-border">
              <div
                id="assign-admin-title"
                className="font-montserrat font-extrabold text-[16px]"
              >
                Assigner un admin
              </div>
              <button
                onClick={() => setAssignAdminPromoId(null)}
                aria-label="Fermer"
                className="bg-transparent border-none cursor-pointer text-xl text-gray-500"
              >
                ✕
              </button>
            </div>
            <div className="px-6 py-5 flex flex-col gap-4">
              <div>
                <label className="font-montserrat font-semibold text-xs text-gray-500 block mb-1.5">
                  Admin
                </label>
                {adminUsers.length === 0 ? (
                  <p className="font-source-sans text-[13px] text-gray-500">
                    Aucun admin disponible
                  </p>
                ) : (
                  <div className="flex flex-col gap-1.5 max-h-[200px] overflow-y-auto border border-spektr-border rounded-lg p-2">
                    {adminUsers.map((u: any) => {
                      const alreadyAssigned = promos
                        .find((p) => p.id === assignAdminPromoId)
                        ?.adminPromos?.some((ap: any) => ap.adminId === u.id);
                      return (
                        <button
                          key={u.id}
                          disabled={alreadyAssigned}
                          onClick={() =>
                            handleAssignAdmin({
                              promoId: assignAdminPromoId,
                              adminId: u.id,
                            })
                          }
                          className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-left w-full border-none cursor-pointer ${
                            alreadyAssigned
                              ? "bg-gray-50 opacity-50 cursor-not-allowed"
                              : "bg-transparent hover:bg-spektr-teal/[0.06]"
                          }`}
                        >
                          <div className="flex-1">
                            <div className="font-montserrat font-semibold text-xs">
                              {u.first_name} {u.last_name}
                              {alreadyAssigned && (
                                <span className="ml-1 text-[10px] text-gray-500">
                                  (déjà assigné)
                                </span>
                              )}
                            </div>
                            <div className="font-source-sans text-[11px] text-gray-500">
                              {u.email}
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
              <div>
                <label className="font-montserrat font-semibold text-xs text-gray-500 block mb-1.5">
                  Rôle
                </label>
                <select
                  value={adminRole}
                  onChange={(e) =>
                    setAdminRole(e.target.value as AdminPromoRole)
                  }
                  className="w-full px-3 py-2 border border-spektr-border rounded-lg text-[13px] font-source-sans focus:outline-none focus-visible:ring-2 focus-visible:ring-spektr-teal focus-visible:ring-offset-1"
                >
                  <option value="OWNER">Propriétaire</option>
                  <option value="COLLABORATOR">Collaborateur</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
