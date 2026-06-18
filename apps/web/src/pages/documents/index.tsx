import { useState } from "react";
import { getFolders } from "@/features/documents/actions/getFolders";
import { getDocuments } from "@/features/documents/actions/getDocuments";
import { deleteFolder } from "@/features/documents/actions/deleteFolder";
import { createFolder } from "@/features/documents/actions/createFolder";
import { deleteDocument } from "@/features/documents/actions/deleteDocument";
import { uploadDocument } from "@/features/documents/actions/uploadDocument";
import { getDocumentUrl } from "@/features/documents/actions/getDocumentUrl";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Document, DocumentType } from "@/features/documents/types";
import ConfirmDialog from "@/shared/components/ConfirmDialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/shared/components/ui/dialog";

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} o`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} Ko`;
  return `${(bytes / 1024 / 1024).toFixed(1)} Mo`;
}

function FileIcon({ mimeType }: { mimeType: string }) {
  if (mimeType.includes("pdf")) return <span className="text-xl">📄</span>;
  if (mimeType.includes("image")) return <span className="text-xl">🖼️</span>;
  if (mimeType.includes("word") || mimeType.includes("document"))
    return <span className="text-xl">📝</span>;
  return <span className="text-xl">📁</span>;
}

function ErrorBanner({
  message,
  onClose,
}: {
  message: string;
  onClose: () => void;
}) {
  return (
    <div className="flex items-center justify-between gap-3 bg-[#fee2e2] border border-[#fecaca] rounded-lg px-3.5 py-2.5 mb-4">
      <div className="flex items-center gap-2">
        <span className="text-[15px]">⚠️</span>
        <span className="font-source-sans text-[13px] text-[#dc2626] font-semibold">
          {message}
        </span>
      </div>
      <button
        onClick={onClose}
        className="bg-transparent border-none cursor-pointer text-[#dc2626] text-base leading-none"
      >
        ✕
      </button>
    </div>
  );
}

const ACCEPTED_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "image/jpeg",
  "image/png",
  "image/webp",
];
const MAX_SIZE_MB = 10;

const DocumentsPage = () => {
  const queryClient = useQueryClient();
  const [selectedFolderId, setSelectedFolderId] = useState<number | null>(null);
  const [showNewFolder, setShowNewFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [uploadDocType, setUploadDocType] = useState<DocumentType>("OTHER");
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [pendingDelete, setPendingDelete] = useState<
    { type: "folder"; id: number } | { type: "document"; id: number } | null
  >(null);

  const { data: folders = [], isError: foldersError } = useQuery({
    queryKey: ["folders"],
    queryFn: getFolders,
    staleTime: 5 * 60 * 1000,
  });

  const {
    data: documents = [],
    isLoading: docsLoading,
    isError: docsError,
  } = useQuery({
    queryKey: ["documents"],
    queryFn: getDocuments,
    staleTime: 5 * 60 * 1000,
  });

  const { mutate: removeFolder, isPending: removingFolder } = useMutation({
    mutationFn: deleteFolder,
    onSuccess: (_, id) => {
      if (selectedFolderId === id) setSelectedFolderId(null);
      queryClient.invalidateQueries({ queryKey: ["folders"] });
      queryClient.invalidateQueries({ queryKey: ["documents"] });
      setPendingDelete(null);
    },
    onError: () => setError("Impossible de supprimer le dossier."),
  });

  const { mutate: addFolder, isPending: creatingFolder } = useMutation({
    mutationFn: (name: string) => createFolder(name),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["folders"] });
      setNewFolderName("");
      setShowNewFolder(false);
    },
    onError: () => setError("Impossible de créer le dossier."),
  });

  const { mutate: removeDocument } = useMutation({
    mutationFn: deleteDocument,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["documents"] });
      setPendingDelete(null);
    },
    onError: () => setError("Impossible de supprimer le fichier."),
  });

  const { mutate: upload, isPending: uploading } = useMutation({
    mutationFn: ({
      file,
      folderId,
      docType,
    }: {
      file: File;
      folderId?: number;
      docType: DocumentType;
    }) => uploadDocument(file, folderId, docType),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["documents"] }),
    onError: (err: Error) =>
      setError(err.message ?? "Échec de l'import du fichier."),
  });

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (!ACCEPTED_TYPES.includes(file.type)) {
      setError("Format non supporté. Utilisez PDF, Word ou image (JPG, PNG, WebP).");
      return;
    }
    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      setError(`Fichier trop volumineux (max ${MAX_SIZE_MB} Mo).`);
      return;
    }
    setPendingFile(file);
  }

  function handleImportConfirm() {
    if (!pendingFile) return;
    upload({
      file: pendingFile,
      folderId: selectedFolderId ?? undefined,
      docType: uploadDocType,
    });
    setShowImportDialog(false);
    setPendingFile(null);
    setUploadDocType("OTHER");
  }

  function handleImportDialogClose() {
    setShowImportDialog(false);
    setPendingFile(null);
    setUploadDocType("OTHER");
  }

  async function handleDownload(doc: Document) {
    try {
      const result = await getDocumentUrl(doc.id);
      window.open(result.url, "_blank");
    } catch {
      setError("Impossible de récupérer le lien de téléchargement.");
    }
  }

  function handleCreateFolder() {
    const name = newFolderName.trim();
    if (!name) {
      setError("Le nom du dossier ne peut pas être vide.");
      return;
    }
    if (name.length > 50) {
      setError("Le nom du dossier est trop long (50 caractères max).");
      return;
    }
    addFolder(name);
  }

  function handleDelete() {
    if (pendingDelete === null) {
      return;
    } else if (pendingDelete.type === "folder") {
      removeFolder(pendingDelete.id);
    } else {
      removeDocument(pendingDelete.id);
    }
  }

  const visibleDocs =
    selectedFolderId === null
      ? documents
      : documents.filter((d) => d.folderId === selectedFolderId);

  const selectedFolder = folders.find((f) => f.id === selectedFolderId);

  return (
    <div className="py-7 px-8 bg-spektr-bg min-h-full">
      {/* Header */}
      <div className="flex items-start justify-between mb-5">
        <div>
          <h1 className="font-montserrat font-extrabold text-[22px] text-spektr-dark tracking-[-0.3px]">
            Documents
          </h1>
          <p className="font-source-sans text-[13px] text-gray-500 mt-0.5">
            Gérez vos CV, lettres de motivation et certifications
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setShowNewFolder(true)}
            className="px-4 py-2.5 rounded-lg border-[1.5px] border-spektr-teal bg-transparent text-spektr-teal font-montserrat font-bold text-[13px] cursor-pointer"
          >
            + Nouveau dossier
          </button>
          <button
            onClick={() => setShowImportDialog(true)}
            disabled={uploading}
            className={[
              "px-4 py-2.5 rounded-lg border-none font-montserrat font-bold text-[13px] text-white",
              uploading
                ? "bg-spektr-teal/50 cursor-not-allowed"
                : "bg-spektr-teal cursor-pointer",
            ].join(" ")}
          >
            {uploading ? "Envoi…" : "⬆ Importer"}
          </button>
        </div>
      </div>

      {/* Error banner */}
      {error && <ErrorBanner message={error} onClose={() => setError(null)} />}

      {(foldersError || docsError) && !error && (
        <ErrorBanner
          message="Impossible de charger vos fichiers. Vérifiez votre connexion."
          onClose={() => {}}
        />
      )}

      <div className="grid grid-cols-[240px_1fr] gap-4">
        {/* Folder sidebar */}
        <div>
          <div className="bg-white rounded-[10px] border border-spektr-border overflow-hidden">
            <div className="px-4 py-3.5 border-b border-spektr-border">
              <span className="font-montserrat font-bold text-[13px] text-spektr-dark">
                Dossiers
              </span>
            </div>
            <div className="p-2">
              <button
                onClick={() => setSelectedFolderId(null)}
                className={[
                  "w-full flex items-center gap-2.5 px-3 py-[9px] rounded-lg border-none cursor-pointer font-source-sans text-[13px]",
                  selectedFolderId === null
                    ? "bg-spektr-teal/10 text-spektr-teal font-semibold"
                    : "bg-transparent text-spektr-dark font-normal",
                ].join(" ")}
              >
                <span>📂</span>
                <span className="flex-1 text-left">Tous les fichiers</span>
                <span className="text-[11px] text-gray-400">
                  {documents.length}
                </span>
              </button>

              {folders.map((folder) => {
                const count = documents.filter(
                  (d) => d.folderId === folder.id,
                ).length;
                const isSelected = selectedFolderId === folder.id;
                return (
                  <div
                    key={folder.id}
                    className={[
                      "flex items-center gap-0.5 rounded-lg",
                      isSelected ? "bg-spektr-teal/10" : "bg-transparent",
                    ].join(" ")}
                  >
                    <button
                      onClick={() => setSelectedFolderId(folder.id)}
                      className={[
                        "flex-1 flex items-center gap-2.5 px-3 py-[9px] border-none cursor-pointer bg-transparent font-source-sans text-[13px]",
                        isSelected
                          ? "text-spektr-teal font-semibold"
                          : "text-spektr-dark font-normal",
                      ].join(" ")}
                    >
                      <span>📁</span>
                      <span className="flex-1 text-left">{folder.name}</span>
                      <span className="text-[11px] text-gray-400">{count}</span>
                    </button>
                    <button
                      onClick={() =>
                        setPendingDelete({ type: "folder", id: folder.id })
                      }
                      disabled={removingFolder}
                      className="px-2 py-1.5 border-none bg-transparent cursor-pointer text-[#dc2626] text-xs"
                      title="Supprimer le dossier"
                    >
                      ✕
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* New folder form */}
          {showNewFolder && (
            <div className="bg-white rounded-[10px] border border-spektr-border p-3.5 mt-2.5">
              <label className="font-montserrat font-semibold text-xs block mb-1.5 text-spektr-dark">
                Nom du dossier
              </label>
              <input
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleCreateFolder()}
                placeholder="Mon CV"
                autoFocus
                maxLength={50}
                className="w-full px-3 py-[9px] border-[1.5px] border-spektr-border rounded-lg font-source-sans text-[13px] focus:outline-none focus:border-spektr-teal box-border mb-2 text-spektr-dark bg-white"
              />
              <div className="flex gap-1.5">
                <button
                  onClick={handleCreateFolder}
                  disabled={creatingFolder}
                  className={[
                    "flex-1 py-2 rounded-[7px] border-none font-montserrat font-bold text-xs text-white",
                    creatingFolder
                      ? "bg-spektr-teal/50 cursor-not-allowed"
                      : "bg-spektr-teal cursor-pointer",
                  ].join(" ")}
                >
                  {creatingFolder ? "Création…" : "Créer"}
                </button>
                <button
                  onClick={() => {
                    setShowNewFolder(false);
                    setNewFolderName("");
                  }}
                  className="flex-1 py-2 rounded-[7px] border-[1.5px] border-spektr-border bg-white font-montserrat font-semibold text-xs cursor-pointer text-gray-500"
                >
                  Annuler
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Document list */}
        <div className="bg-white rounded-[10px] border border-spektr-border">
          <div className="px-5 py-3.5 border-b border-spektr-border flex items-center justify-between">
            <span className="font-montserrat font-bold text-[13px]">
              {selectedFolder ? selectedFolder.name : "Tous les fichiers"}{" "}
              <span className="font-normal text-gray-400">
                ({visibleDocs.length})
              </span>
            </span>
            {selectedFolder && (
              <span className="font-source-sans text-xs text-gray-400">
                📁 {selectedFolder.name}
              </span>
            )}
          </div>

          {uploading && (
            <div className="px-5 py-3 bg-spektr-teal/[0.05] border-b border-spektr-border flex items-center gap-2.5">
              <div className="w-4 h-4 rounded-full border-2 border-spektr-teal border-t-transparent animate-spin" />
              <span className="font-source-sans text-[13px] text-spektr-teal font-semibold">
                Import en cours…
              </span>
            </div>
          )}

          {docsLoading ? (
            <div className="py-10 text-center text-gray-400">Chargement…</div>
          ) : visibleDocs.length === 0 ? (
            <div className="py-[60px] px-10 text-center">
              <div className="text-[40px] mb-3">📭</div>
              <p className="font-montserrat font-semibold text-sm text-gray-500">
                {selectedFolder
                  ? `Aucun fichier dans "${selectedFolder.name}"`
                  : "Aucun fichier importé"}
              </p>
              <p className="font-source-sans text-[13px] text-gray-400 mt-1">
                {selectedFolder
                  ? "Importez un fichier en le sélectionnant ci-dessus"
                  : "Cliquez sur « Importer un fichier » pour commencer"}
              </p>
            </div>
          ) : (
            <div className="flex flex-col">
              {visibleDocs.map((doc, idx) => (
                <div
                  key={doc.id}
                  className={[
                    "flex items-center gap-3.5 px-5 py-3.5 transition-colors hover:bg-[#fafafa]",
                    idx < visibleDocs.length - 1
                      ? "border-b border-spektr-bg"
                      : "",
                  ].join(" ")}
                >
                  <div className="w-10 h-10 rounded-lg bg-spektr-bg flex items-center justify-center flex-shrink-0">
                    <FileIcon mimeType={doc.mimeType} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-montserrat font-semibold text-[13px] text-spektr-dark truncate">
                        {doc.name}
                      </span>
                      {doc.docType !== "OTHER" && (
                        <span className="px-1.5 py-0.5 rounded bg-spektr-teal/10 text-spektr-teal text-[10px] font-bold flex-shrink-0">
                          {doc.docType}
                        </span>
                      )}
                      {doc.status === "VALIDATED" && (
                        <span className="px-1.5 py-0.5 rounded bg-green-100 text-green-600 text-[10px] font-bold flex-shrink-0">
                          ✅ Validé
                        </span>
                      )}
                      {doc.status === "TO_CORRECT" && (
                        <span className="px-1.5 py-0.5 rounded bg-amber-100 text-amber-700 text-[10px] font-bold flex-shrink-0">
                          ⚠️ À corriger
                        </span>
                      )}
                    </div>
                    <div className="font-source-sans text-[11px] text-gray-400 mt-0.5">
                      {formatSize(doc.size)} ·{" "}
                      {new Date(doc.created_at).toLocaleDateString("fr-FR")}
                      {doc.folderId &&
                        folders.find((f) => f.id === doc.folderId) && (
                          <span className="ml-1.5 text-spektr-teal">
                            · 📁{" "}
                            {folders.find((f) => f.id === doc.folderId)!.name}
                          </span>
                        )}
                    </div>
                  </div>
                  <div className="flex gap-1.5">
                    <button
                      onClick={() => handleDownload(doc)}
                      className="bg-spektr-teal/10 border-none rounded-md px-2.5 py-1.5 cursor-pointer text-[11px] font-semibold text-spektr-teal"
                    >
                      ⬇ Télécharger
                    </button>
                    <button
                      onClick={() =>
                        setPendingDelete({ type: "document", id: doc.id })
                      }
                      className="bg-[#fee2e2] border-none rounded-md px-2.5 py-1.5 cursor-pointer text-[11px] font-semibold text-[#dc2626]"
                    >
                      Supprimer
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <ConfirmDialog
        open={pendingDelete !== null}
        onOpenChange={(val) => {
          if (!val) setPendingDelete(null);
        }}
        title="Confirmer la suppression"
        description="Cette action est irréversible."
        onConfirm={handleDelete}
      />

      <Dialog open={showImportDialog} onOpenChange={(open) => { if (!open) handleImportDialogClose(); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="font-montserrat text-[16px] text-spektr-dark">
              Importer un document
            </DialogTitle>
          </DialogHeader>

          {/* Type selection */}
          <div>
            <p className="font-montserrat font-semibold text-[11px] text-gray-400 uppercase tracking-[0.5px] mb-2.5">
              Type de document
            </p>
            <div className="grid grid-cols-3 gap-2.5">
              {(
                [
                  { value: "CV", label: "CV", icon: "📄", desc: "Curriculum vitæ" },
                  { value: "LM", label: "Lettre de motivation", icon: "✉️", desc: "Lettre de motivation" },
                  { value: "OTHER", label: "Autre", icon: "📁", desc: "Autre document" },
                ] as { value: DocumentType; label: string; icon: string; desc: string }[]
              ).map(({ value, icon, label }) => (
                <button
                  key={value}
                  onClick={() => setUploadDocType(value)}
                  className={[
                    "flex flex-col items-center gap-1.5 py-3.5 px-2 rounded-xl border-2 cursor-pointer transition-all bg-white",
                    uploadDocType === value
                      ? "border-spektr-teal bg-spektr-teal/5"
                      : "border-spektr-border hover:border-spektr-teal/40",
                  ].join(" ")}
                >
                  <span className="text-[22px]">{icon}</span>
                  <span
                    className={[
                      "font-montserrat font-bold text-[11px] text-center leading-tight",
                      uploadDocType === value ? "text-spektr-teal" : "text-spektr-dark",
                    ].join(" ")}
                  >
                    {label}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* File zone */}
          <div>
            <p className="font-montserrat font-semibold text-[11px] text-gray-400 uppercase tracking-[0.5px] mb-2.5">
              Fichier
            </p>
            <label
              className={[
                "flex flex-col items-center justify-center gap-2 border-2 border-dashed rounded-xl px-4 py-6 cursor-pointer transition-colors",
                pendingFile
                  ? "border-spektr-teal bg-spektr-teal/5"
                  : "border-spektr-border hover:border-spektr-teal/50 bg-white",
              ].join(" ")}
            >
              <input
                type="file"
                className="hidden"
                accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.webp"
                onChange={handleFileSelect}
              />
              {pendingFile ? (
                <>
                  <span className="text-[28px]">📄</span>
                  <span className="font-montserrat font-semibold text-[13px] text-spektr-dark text-center break-all">
                    {pendingFile.name}
                  </span>
                  <span className="font-source-sans text-[11px] text-gray-400">
                    {formatSize(pendingFile.size)} · Cliquer pour changer
                  </span>
                </>
              ) : (
                <>
                  <span className="text-[28px] opacity-40">⬆</span>
                  <span className="font-montserrat font-semibold text-[13px] text-gray-500">
                    Cliquer pour sélectionner
                  </span>
                  <span className="font-source-sans text-[11px] text-gray-400">
                    PDF, Word, image · Max 10 Mo
                  </span>
                </>
              )}
            </label>
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-1">
            <button
              onClick={handleImportDialogClose}
              className="flex-1 py-2.5 rounded-lg border-[1.5px] border-spektr-border bg-white font-montserrat font-bold text-[13px] text-gray-500 cursor-pointer"
            >
              Annuler
            </button>
            <button
              disabled={!pendingFile || uploading}
              onClick={handleImportConfirm}
              className={[
                "flex-1 py-2.5 rounded-lg border-none font-montserrat font-bold text-[13px] text-white",
                pendingFile && !uploading
                  ? "bg-spektr-teal cursor-pointer"
                  : "bg-spektr-teal/40 cursor-not-allowed",
              ].join(" ")}
            >
              {uploading ? "Envoi…" : "Importer"}
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DocumentsPage;
