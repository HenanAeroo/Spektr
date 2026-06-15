import { fetchAllCompletions } from "@/features/objectives/actions/fetchAllCompletions";
import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { inputCls, labelCls } from "../constants";
import { Card } from "./Card";
import { fetchUsers } from "@/features/promos/actions/fetchUsers";
import { sendBulkEmail } from "@/features/users/actions/sendBulkEmail";
import { importStudents } from "@/features/admin/actions/importStudents";
import { toast } from "sonner";
import EmailEditor from "./EmailEditor";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";

const DEFAULT_SUBJECT = "Suivi — Votre recherche d'alternance";
const DEFAULT_MESSAGE =
  "<p>Bonjour,</p><p>Nous souhaitons faire le point sur votre recherche d'alternance.</p><p>N'hésitez pas à nous contacter pour planifier un rendez-vous.</p><p>Cordialement,<br>L'équipe Relations Entreprises — Ynov Campus Rennes</p>";

export function StudentsList({
  promos,
  navigate,
}: {
  promos: any[];
  navigate: (p: string) => void;
}) {
  const queryClient = useQueryClient();
  const csvInputRef = useRef<HTMLInputElement>(null);
  const [search, setSearch] = useState("");
  const [showContact, setShowContact] = useState(false);
  const [selected, setSelected] = useState<number[]>([]);
  const [subject, setSubject] = useState(DEFAULT_SUBJECT);
  const [message, setMessage] = useState(DEFAULT_MESSAGE);
  const [selectedPromo, setSelectedPromo] = useState<number | null>(null);

  const { data: objectivesWithCompletions = [] } = useQuery({
    queryKey: ["objectives", "completions"],
    queryFn: fetchAllCompletions,
  });

  const { data, fetchNextPage, hasNextPage } = useInfiniteQuery({
    queryKey: ["users", "paginated", selectedPromo],
    queryFn: ({ pageParam }) =>
      fetchUsers(pageParam, selectedPromo ?? undefined),
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

  const { mutate: handleBulkEmail, isPending } = useMutation({
    mutationFn: () => sendBulkEmail(selected, subject, message),
    onSuccess: () => (
      setShowContact(false),
      toast.success("Le mail a bien été envoyé"),
      setSubject(DEFAULT_SUBJECT),
      setMessage(DEFAULT_MESSAGE)
    ),
    onError: () => toast.error("Une erreur est survenue, veuillez réessayer"),
  });

  const { mutate: handleImportStudents, isPending: isImporting } = useMutation({
    mutationFn: (file: File) => importStudents(file),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      queryClient.invalidateQueries({ queryKey: ["promos"] });
      if (result.imported > 0) {
        toast.success(
          `${result.imported} étudiant${result.imported !== 1 ? "s" : ""} importé${result.imported !== 1 ? "s" : ""}${result.skipped > 0 ? ` · ${result.skipped} ignoré${result.skipped !== 1 ? "s" : ""}` : ""}`,
        );
      } else {
        toast.error(
          `0 étudiant importé · ${result.skipped} ignoré${result.skipped !== 1 ? "s" : ""}`,
        );
      }
      if (result.errors.length > 0) {
        const preview = result.errors
          .slice(0, 5)
          .map((e) => `Ligne ${e.row}${e.email ? ` (${e.email})` : ""} : ${e.message}`)
          .join("\n");
        const suffix = result.errors.length > 5 ? `\n… et ${result.errors.length - 5} autre(s)` : "";
        toast.warning(`Détail des erreurs :\n${preview}${suffix}`, {
          duration: 8000,
          style: { whiteSpace: "pre-line" },
        });
      }
    },
    onError: () => toast.error("Erreur lors de l'import CSV"),
  });

  const sentinelRef = useRef(null);

  const sendDisabled =
    selected.length === 0 ||
    subject.trim() === "" ||
    message.replace(/<[^>]*>/g, "").trim() === "" ||
    isPending;

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

  useEffect(() => {
    if (selectedPromo !== null) {
      setSelected(allUsers.map((u) => u.id));
    }
  }, [selectedPromo]);

  function handlePromoSelect(value: string) {
    if (value === "all") {
      setSelectedPromo(null);
      setSelected([]);
    } else {
      const valueNum = parseInt(value, 10);
      setSelectedPromo(valueNum);
    }
  }

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
        <div className="flex gap-2">
          <input
            ref={csvInputRef}
            type="file"
            accept=".csv,text/csv"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) {
                handleImportStudents(file);
                e.target.value = "";
              }
            }}
          />
          <button
            onClick={() => csvInputRef.current?.click()}
            disabled={isImporting}
            title="Format CSV attendu : email, prenom, nom, promo"
            className="px-4 py-2.5 rounded-lg border-[1.5px] border-gray-300 bg-white text-gray-600 font-montserrat font-bold text-[13px] cursor-pointer disabled:opacity-50"
          >
            {isImporting ? "Import…" : "⬆ Importer des étudiants"}
          </button>
          <button
            onClick={() => setShowContact(true)}
            className="px-4 py-2.5 rounded-lg border-[1.5px] border-spektr-teal bg-transparent text-spektr-teal font-montserrat font-bold text-[13px] cursor-pointer"
          >
            ✉ Contacter des étudiants
          </button>
        </div>
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
          <div className="grid grid-cols-3 gap-4 p-5">
            {filtered.map((u) => {
              const initials =
                `${u.first_name?.[0] ?? ""}${u.last_name?.[0] ?? ""}`.toUpperCase() ||
                "?";
              const promo = promos.find((p: any) => p.id === u.promoId);
              const promoObjectives = objectivesWithCompletions.filter(
                (obj: any) => obj.promoId === u.promoId,
              );
              const doneCount = promoObjectives.filter((obj: any) =>
                obj.completions?.some((c: any) => c.user.id === u.id && c.done),
              ).length;
              const pct =
                promoObjectives.length > 0
                  ? Math.round((doneCount / promoObjectives.length) * 100)
                  : 0;
              return (
                <Card
                  key={u.id}
                  onClick={() => navigate(`student-detail:${u.id}`)}
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-full bg-green-100 text-green-600 flex items-center justify-center text-[13px] font-bold flex-shrink-0">
                      {initials}
                    </div>
                    <div className="min-w-0">
                      <div className="font-montserrat font-semibold text-[13px] text-spektr-dark truncate">
                        {u.first_name} {u.last_name}
                      </div>
                      <div className="font-source-sans text-[11px] text-gray-400 truncate">
                        {u.email}
                      </div>
                    </div>
                  </div>
                  {promo && (
                    <span className="inline-block px-2 py-0.5 rounded-full bg-spektr-teal/10 text-spektr-teal text-[11px] font-semibold mb-3">
                      {promo.name}
                    </span>
                  )}
                  {promoObjectives.length > 0 && (
                    <div>
                      <div className="flex justify-between text-[11px] text-gray-400 mb-1">
                        <span>Objectifs</span>
                        <span>
                          {doneCount}/{promoObjectives.length} — {pct}%
                        </span>
                      </div>
                      <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-spektr-teal rounded-full"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  )}
                </Card>
              );
            })}
          </div>
        )}
        <div ref={sentinelRef}></div>
      </Card>

      {/* Contact modal */}
      {showContact && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="contact-modal-title"
          onClick={() => setShowContact(false)}
          className="fixed inset-0 bg-black/45 z-[1000] flex items-center justify-center"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-2xl w-[640px] max-h-[90vh] overflow-auto shadow-[0_24px_80px_rgba(0,0,0,0.2)]"
          >
            <div className="flex justify-between items-center px-7 py-[22px] border-b border-spektr-border">
              <div>
                <div
                  id="contact-modal-title"
                  className="font-montserrat font-extrabold text-[17px]"
                >
                  Contacter des étudiants
                </div>
                <div className="font-source-sans text-xs text-gray-400 mt-0.5">
                  Le message s'ouvrira dans votre client email
                </div>
              </div>
              <button
                aria-label="Fermer"
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
                      onClick={() => (setSelected([]), setSelectedPromo(null))}
                      className="text-[11px] font-semibold text-[#dc2626] bg-transparent border-none cursor-pointer"
                    >
                      Effacer
                    </button>
                  </div>
                </div>
                <Select
                  onValueChange={(value) => handlePromoSelect(value)}
                  value={selectedPromo === null ? "all" : String(selectedPromo)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Filtrer par promo" />
                  </SelectTrigger>
                  <SelectContent className="z-1000">
                    <SelectItem value="all">Toutes les promos</SelectItem>
                    {promos.map((promo) => {
                      return (
                        <SelectItem value={String(promo.id)} key={promo.id}>
                          {promo.name}
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
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
                <EmailEditor value={message} onChange={setMessage} />
              </div>
              <div className="flex justify-end gap-2.5">
                <button
                  onClick={() => setShowContact(false)}
                  className="px-5 py-2.5 rounded-lg border-[1.5px] border-spektr-border bg-white font-montserrat font-semibold text-[13px] cursor-pointer text-gray-500"
                >
                  Annuler
                </button>
                <button
                  onClick={() => handleBulkEmail()}
                  disabled={sendDisabled}
                  className={`px-5 py-2.5 rounded-lg border-none font-montserrat font-bold text-[13px] text-white ${
                    sendDisabled
                      ? "bg-spektr-teal/50 cursor-not-allowed"
                      : "bg-spektr-teal cursor-pointer"
                  }`}
                >
                  {isPending ? (
                    <div className="animate-spin w-4 h-4 rounded-full border-2 border-white border-t-transparent"></div>
                  ) : (
                    `Envoyer l'email (${selected.length})`
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
