import { fetchMyApplications } from "@/features/applications/actions/fetchMyApplications";
import { createApplication } from "@/features/applications/actions/createApplication";
import { deleteApplication } from "@/features/applications/actions/deleteApplication";
import {
  updateApplication,
  UpdateApplicationData,
} from "@/features/applications/actions/updateApplication";
import { Application, Statut } from "@/features/applications/types";
import { AppModal } from "@/features/applications/components/AppModal";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import {
  inputCls,
  STATUT_COLORS,
  STATUT_LABELS,
  STATUTS,
} from "@/features/applications/constants";
import { ApplicationSheet } from "@/features/applications/components/ApplicationSheet";

function StatusBadge({ statut }: { statut: Statut }) {
  const c = STATUT_COLORS[statut];
  return (
    <span
      className={`text-[11px] font-bold px-2.5 py-0.5 rounded-[10px] border ${c.bg} ${c.text} ${c.border}`}
    >
      {STATUT_LABELS[statut]}
    </span>
  );
}

const ApplicationsPage = () => {
  const queryClient = useQueryClient();
  const [filterStatut, setFilterStatut] = useState<Statut | "tous">("tous");
  const [search, setSearch] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [editApp, setEditApp] = useState<Application | null>(null);

  const { data: applications = [], isLoading } = useQuery({
    queryKey: ["applications"],
    queryFn: fetchMyApplications,
    staleTime: 2 * 60 * 1000,
  });

  const { mutate: createApp } = useMutation({
    mutationFn: (data: any) => createApplication(data),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["applications"] }),
  });

  const { mutate: deleteApp } = useMutation({
    mutationFn: (id: number) => deleteApplication(id),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["applications"] }),
  });

  const { mutate: updateApp } = useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateApplicationData }) =>
      updateApplication(id, data),
    onMutate: async ({ id, data }) => {
      await queryClient.cancelQueries({ queryKey: ["applications"] });

      const snapshot = queryClient.getQueryData(["applications"]);
      queryClient.setQueryData<Application[]>(["applications"], (old) => {
        if (old === undefined) {
          return [];
        } else {
          return old.map((application) => {
            if (application.id === id) {
              return { ...application, ...data };
            } else {
              return application;
            }
          });
        }
      });

      return { snapshot };
    },
    onError: (error, { id, data }, context) => {
      queryClient.setQueryData(["applications"], context?.snapshot);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["applications"] });
    },
  });

  const filtered = applications.filter((a) => {
    const matchSearch =
      !search ||
      a.entreprise.toLowerCase().includes(search.toLowerCase()) ||
      (a.contact_nom ?? "").toLowerCase().includes(search.toLowerCase());
    const matchStatut = filterStatut === "tous" || a.statut === filterStatut;
    return matchSearch && matchStatut;
  });

  const counts = STATUTS.reduce(
    (acc, s) => ({
      ...acc,
      [s]: applications.filter((a) => a.statut === s).length,
    }),
    {} as Record<Statut, number>,
  );

  return (
    <div className="py-7 px-8 bg-spektr-bg min-h-full">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="font-montserrat font-extrabold text-[22px] text-spektr-dark tracking-[-0.3px]">
            Candidatures
          </h1>
          <p className="font-source-sans text-[13px] text-gray-500 mt-0.5">
            {applications.length} candidature
            {applications.length !== 1 ? "s" : ""} au total
          </p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="px-5 py-2.5 rounded-lg border-none bg-spektr-teal text-white font-montserrat font-bold text-[13px] cursor-pointer flex items-center gap-1.5"
        >
          + Nouvelle candidature
        </button>
      </div>

      {/* Status summary */}
      <div className="grid grid-cols-6 gap-2.5 mb-5">
        {STATUTS.map((s) => {
          const c = STATUT_COLORS[s];
          const isActive = filterStatut === s;
          return (
            <button
              key={s}
              onClick={() => setFilterStatut(filterStatut === s ? "tous" : s)}
              className={[
                `border-[1.5px] rounded-[10px] px-3 py-2.5 cursor-pointer font-montserrat text-left ${c.border}`,
                isActive ? `${c.activeBg} text-white` : `bg-white ${c.text}`,
              ].join(" ")}
            >
              <div className="text-lg font-extrabold">{counts[s] ?? 0}</div>
              <div className="text-[10px] font-semibold mt-0.5">
                {STATUT_LABELS[s]}
              </div>
            </button>
          );
        })}
      </div>

      {/* Table */}
      <div className="bg-white rounded-[10px] border border-spektr-border">
        {/* Toolbar */}
        <div className="px-5 py-3.5 border-b border-spektr-border flex items-center gap-3">
          <div className="relative flex-1 max-w-[320px]">
            <span className="absolute left-11px top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
              🔍
            </span>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher une entreprise..."
              className={`${inputCls} pl-34px`}
            />
          </div>
          <div className="flex gap-1.5">
            <button
              onClick={() => setFilterStatut("tous")}
              className={[
                "px-3.5 py-1.5 rounded-full border-[1.5px] text-xs font-semibold cursor-pointer font-montserrat",
                filterStatut === "tous"
                  ? "bg-spektr-teal text-white border-spektr-teal"
                  : "bg-transparent text-gray-500 border-spektr-border",
              ].join(" ")}
            >
              Tous ({applications.length})
            </button>
          </div>
        </div>

        {isLoading ? (
          <div className="py-10 text-center text-gray-400">Chargement…</div>
        ) : filtered.length === 0 ? (
          <div className="py-60px px-10 text-center">
            <div className="text-[40px] mb-3">📭</div>
            <p className="font-montserrat font-semibold text-[15px] text-gray-500">
              {search || filterStatut !== "tous"
                ? "Aucun résultat"
                : "Aucune candidature"}
            </p>
            {!search && filterStatut === "tous" && (
              <button
                onClick={() => setShowCreate(true)}
                className="mt-3 mb-4 px-5 py-2.5 rounded-lg border-none bg-spektr-teal text-white font-montserrat font-bold text-[13px] cursor-pointer"
              >
                Ajouter ma première candidature
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-[#fafafa]">
                  {[
                    "Entreprise",
                    "Statut",
                    "Date",
                    "Contact",
                    "Commentaire",
                    "Actions",
                  ].map((h) => (
                    <th
                      key={h}
                      className="px-4 py-3 text-left text-[11px] font-bold text-gray-400 uppercase tracking-[0.5px] border-b border-spektr-border"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((app) => (
                  <tr
                    key={app.id}
                    className="border-b border-spektr-border transition-colors hover:bg-[#fafafa]"
                    onClick={() => setEditApp(app)}
                  >
                    <td className="px-4 py-3.5">
                      <div className="font-montserrat font-semibold text-[13px] text-spektr-dark">
                        {app.entreprise}
                      </div>
                      {app.lien && (
                        <a
                          href={app.lien}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-source-sans text-[11px] text-spektr-teal no-underline"
                        >
                          Voir l'offre →
                        </a>
                      )}
                    </td>
                    <td className="px-4 py-3.5">
                      <StatusBadge statut={app.statut} />
                    </td>
                    <td className="px-4 py-3.5 font-source-sans text-xs text-gray-500">
                      {app.date_candidature
                        ? new Date(app.date_candidature).toLocaleDateString(
                            "fr-FR",
                          )
                        : "—"}
                    </td>
                    <td className="px-4 py-3.5 font-source-sans text-xs text-gray-500">
                      {app.contact_nom || "—"}
                      {app.contact_email && (
                        <div className="text-[11px] text-gray-400">
                          {app.contact_email}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3.5 font-source-sans text-xs text-gray-500 max-w-200px">
                      <span className="line-clamp-2">
                        {app.commentaire || "—"}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex gap-1.5">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditApp(app);
                          }}
                          className="bg-spektr-teal/10 border-none rounded-md px-2.5 py-5px cursor-pointer text-[11px] font-semibold text-spektr-teal"
                        >
                          Modifier
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteApp(app.id);
                          }}
                          className="bg-[#fee2e2] border-none rounded-md px-2.5 py-5px cursor-pointer text-[11px] font-semibold text-[#dc2626]"
                        >
                          Supprimer
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showCreate && (
        <AppModal
          mode="create"
          app={{}}
          onClose={() => setShowCreate(false)}
          onSave={(data) => {
            createApp(data);
            setShowCreate(false);
          }}
        />
      )}

      <ApplicationSheet
        mode="edit"
        open={!!editApp}
        app={editApp}
        onClose={() => setEditApp(null)}
        onSave={(data) => {
          updateApp({ id: editApp!.id, data: data as UpdateApplicationData });
          setEditApp(null);
        }}
      />
    </div>
  );
};

export default ApplicationsPage;
