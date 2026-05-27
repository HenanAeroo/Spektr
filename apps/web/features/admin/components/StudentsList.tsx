import { fetchAllCompletions } from "@/features/objectives/actions/fetchAllCompletions";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { inputCls, labelCls } from "../constants";
import { Card } from "./Card";
import { fetchUsers } from "@/features/promos/actions/fetchUsers";

export function StudentsList({
  promos,
  navigate,
}: {
  promos: any[];
  navigate: (p: string) => void;
}) {
  const [search, setSearch] = useState("");
  const [showContact, setShowContact] = useState(false);
  const [selected, setSelected] = useState<number[]>([]);
  const [subject, setSubject] = useState(
    "Suivi — Votre recherche d'alternance",
  );
  const [message, setMessage] = useState(
    "Bonjour,\n\nNous souhaitons faire le point sur votre recherche d'alternance.\n\nN'hésitez pas à nous contacter pour planifier un rendez-vous.\n\nCordialement,\nL'équipe Relations Entreprises — Ynov Campus Rennes",
  );

  const { data: objectivesWithCompletions = [] } = useQuery({
    queryKey: ["objectives", "completions"],
    queryFn: fetchAllCompletions,
  });

  const { data, fetchNextPage, hasNextPage } = useInfiniteQuery({
    queryKey: ["users", "paginated"],
    queryFn: ({ pageParam }) => fetchUsers(pageParam),
    initialPageParam: 1,
    getNextPageParam: (lastPage, allPages) => {
      if (lastPage.hasNextPage) {
        return allPages.length + 1;
      } else {
        return undefined;
      }
    },
    staleTime: 3 * 60 * 1000,
  });

  const allUsers = data?.pages.flatMap((page) => page.data) ?? [];

  const students = allUsers.filter((u) => u.role === "STUDENT");
  const filtered = students.filter((u) => {
    if (!search) return true;
    const name = `${u.first_name} ${u.last_name}`.toLowerCase();
    return (
      name.includes(search.toLowerCase()) ||
      u.email?.toLowerCase().includes(search.toLowerCase())
    );
  });

  const handleSendOutlook = () => {
    const recipients = allUsers
      .filter((u) => selected.includes(u.id))
      .map((u) => u.email)
      .join(";");
    window.open(
      `mailto:${recipients}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(message)}`,
      "_blank",
    );
  };

  const sentinelRef = useRef(null);

  useEffect(() => {
    if (sentinelRef.current === null) {
      return;
    }

    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && hasNextPage) {
        fetchNextPage();
      }
    });

    observer.observe(sentinelRef.current);

    return () => observer.disconnect();
  }, [hasNextPage, fetchNextPage]);

  return (
    <div>
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="font-montserrat font-extrabold text-[22px] text-spektr-dark">
            Étudiants
          </h1>
          <p className="font-source-sans text-[13px] text-gray-500 mt-0.5">
            {students.length} étudiant{students.length !== 1 ? "s" : ""} suivis
          </p>
        </div>
        <button
          onClick={() => setShowContact(true)}
          className="px-4 py-2.5 rounded-lg border-[1.5px] border-spektr-teal bg-transparent text-spektr-teal font-montserrat font-bold text-[13px] cursor-pointer"
        >
          ✉ Contacter des étudiants
        </button>
      </div>

      <Card className="p-0">
        <div className="px-5 py-3.5 border-b border-spektr-border flex gap-3 items-center">
          <div className="relative flex-1 max-w-[320px]">
            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
              🔍
            </span>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher un étudiant..."
              className={`${inputCls} pl-[30px]`}
            />
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="py-[60px] px-10 text-center">
            <div className="text-[40px] mb-3">👥</div>
            <p className="font-montserrat font-semibold text-sm text-gray-500">
              Aucun étudiant trouvé
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-[#fafafa]">
                  {[
                    "Étudiant",
                    "Email",
                    "Promotion",
                    "Objectifs",
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
                {filtered.map((u) => {
                  const initials =
                    `${u.first_name?.[0] ?? ""}${u.last_name?.[0] ?? ""}`.toUpperCase() ||
                    "?";
                  const promo = promos.find((p: any) => p.id === u.promoId);
                  const promoObjectives = objectivesWithCompletions.filter(
                    (obj: any) => obj.promoId === u.promoId,
                  );
                  const doneCount = promoObjectives.filter((obj: any) =>
                    obj.completions?.some(
                      (c: any) => c.user.id === u.id && c.done,
                    ),
                  ).length;
                  const pct =
                    promoObjectives.length > 0
                      ? Math.round((doneCount / promoObjectives.length) * 100)
                      : 0;
                  return (
                    <tr
                      key={u.id}
                      className="border-b border-spektr-border transition-colors cursor-pointer hover:bg-[#fafafa]"
                      onClick={() => navigate(`student-detail:${u.id}`)}
                    >
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-green-100 text-green-600 flex items-center justify-center font-montserrat font-bold text-xs flex-shrink-0">
                            {initials}
                          </div>
                          <div className="font-montserrat font-semibold text-[13px]">
                            {u.first_name} {u.last_name}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3.5 font-source-sans text-xs text-gray-500">
                        {u.email}
                      </td>
                      <td className="px-4 py-3.5">
                        {promo ? (
                          <span className="bg-spektr-teal/10 text-spektr-teal text-[11px] font-semibold px-2.5 py-0.5 rounded-[10px]">
                            {promo.name}
                          </span>
                        ) : (
                          <span className="text-gray-400 text-xs">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3.5 min-w-[120px]">
                        {promoObjectives.length > 0 ? (
                          <div>
                            <div className="flex items-center gap-1.5 mb-0.5">
                              <div className="flex-1 h-[5px] rounded-full bg-spektr-border overflow-hidden">
                                <div
                                  className={`h-full rounded-full transition-[width] duration-400 ${pct === 100 ? "bg-green-600" : "bg-spektr-teal"}`}
                                  style={{ width: `${pct}%` }}
                                />
                              </div>
                              <span
                                className={`text-[11px] font-bold whitespace-nowrap ${pct === 100 ? "text-green-600" : "text-spektr-teal"}`}
                              >
                                {doneCount}/{promoObjectives.length}
                              </span>
                            </div>
                          </div>
                        ) : (
                          <span className="text-gray-400 text-xs">—</span>
                        )}
                      </td>
                      <td
                        className="px-4 py-3.5"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          onClick={() => navigate(`student-detail:${u.id}`)}
                          className="bg-spektr-teal/10 border-none rounded-md px-2.5 py-1.5 cursor-pointer text-xs font-semibold text-spektr-teal"
                        >
                          👁 Voir
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Contact modal */}
      {showContact && (
        <div className="fixed inset-0 bg-black/45 z-[1000] flex items-center justify-center">
          <div className="bg-white rounded-2xl w-[640px] max-h-[90vh] overflow-auto shadow-[0_24px_80px_rgba(0,0,0,0.2)]">
            <div className="flex justify-between items-center px-7 py-[22px] border-b border-spektr-border">
              <div>
                <div className="font-montserrat font-extrabold text-[17px]">
                  Contacter des étudiants
                </div>
                <div className="font-source-sans text-xs text-gray-400 mt-0.5">
                  Le message s'ouvrira dans votre client email
                </div>
              </div>
              <button
                onClick={() => setShowContact(false)}
                className="bg-transparent border-none cursor-pointer text-xl text-gray-400"
              >
                ✕
              </button>
            </div>
            <div className="px-7 py-[22px] flex flex-col gap-4">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="font-montserrat font-bold text-[13px]">
                    Destinataires{" "}
                    <span className="text-spektr-teal">{selected.length}</span>{" "}
                    sélectionné{selected.length > 1 ? "s" : ""}
                  </span>
                  <div className="flex gap-2.5">
                    <button
                      onClick={() => setSelected(students.map((u) => u.id))}
                      className="text-[11px] font-semibold text-gray-500 bg-transparent border-none cursor-pointer"
                    >
                      Tous
                    </button>
                    <button
                      onClick={() => setSelected([])}
                      className="text-[11px] font-semibold text-[#dc2626] bg-transparent border-none cursor-pointer"
                    >
                      Effacer
                    </button>
                  </div>
                </div>
                <div className="flex flex-col gap-1 max-h-[160px] overflow-y-auto border border-spektr-border rounded-[10px] p-2">
                  {students.map((u) => {
                    const initials =
                      `${u.first_name?.[0] ?? ""}${u.last_name?.[0] ?? ""}`.toUpperCase() ||
                      "?";
                    return (
                      <label
                        key={u.id}
                        className={`flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg cursor-pointer ${selected.includes(u.id) ? "bg-spektr-teal/[0.08]" : "bg-transparent"}`}
                      >
                        <input
                          type="checkbox"
                          checked={selected.includes(u.id)}
                          onChange={() =>
                            setSelected((prev) =>
                              prev.includes(u.id)
                                ? prev.filter((x) => x !== u.id)
                                : [...prev, u.id],
                            )
                          }
                          className="accent-spektr-teal w-[15px] h-[15px] cursor-pointer"
                        />
                        <div className="w-[26px] h-[26px] rounded-full bg-green-100 text-green-600 flex items-center justify-center text-[11px] font-bold">
                          {initials}
                        </div>
                        <span className="font-source-sans text-[13px]">
                          {u.first_name} {u.last_name}
                        </span>
                        <span className="font-source-sans text-[11px] text-gray-400">
                          {u.email}
                        </span>
                      </label>
                    );
                  })}
                </div>
              </div>
              <div>
                <label className={labelCls}>Objet</label>
                <input
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className={inputCls}
                />
              </div>
              <div>
                <label className={labelCls}>Message</label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={6}
                  className={`${inputCls} resize-y leading-relaxed`}
                />
              </div>
              <div className="flex justify-end gap-2.5">
                <button
                  onClick={() => setShowContact(false)}
                  className="px-5 py-2.5 rounded-lg border-[1.5px] border-spektr-border bg-white font-montserrat font-semibold text-[13px] cursor-pointer text-gray-500"
                >
                  Annuler
                </button>
                <button
                  onClick={handleSendOutlook}
                  disabled={selected.length === 0}
                  className={`px-5 py-2.5 rounded-lg border-none font-montserrat font-bold text-[13px] text-white ${selected.length === 0 ? "bg-spektr-teal/50 cursor-not-allowed" : "bg-spektr-teal cursor-pointer"}`}
                >
                  ✉ Ouvrir dans Outlook ({selected.length})
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
