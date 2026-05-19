import { useState } from "react";
import { getFolders } from "@/features/documents/actions/getFolders";
import { getDocuments } from "@/features/documents/actions/getDocuments";
import { deleteFolder } from "@/features/documents/actions/deleteFolder";
import { createFolder } from "@/features/documents/actions/createFolder";
import { deleteDocument } from "@/features/documents/actions/deleteDocument";
import { uploadDocument } from "@/features/documents/actions/uploadDocument";
import { getDocumentUrl } from "@/features/documents/actions/getDocumentUrl";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Document, Folder } from "@/features/documents/types";

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} o`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} Ko`;
  return `${(bytes / 1024 / 1024).toFixed(1)} Mo`;
}

function FileIcon({ mimeType }: { mimeType: string }) {
  if (mimeType.includes("pdf")) return <span style={{ fontSize: 20 }}>📄</span>;
  if (mimeType.includes("image")) return <span style={{ fontSize: 20 }}>🖼️</span>;
  if (mimeType.includes("word") || mimeType.includes("document")) return <span style={{ fontSize: 20 }}>📝</span>;
  return <span style={{ fontSize: 20 }}>📁</span>;
}

function ErrorBanner({ message, onClose }: { message: string; onClose: () => void }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, background: "#fee2e2", border: "1px solid #fecaca", borderRadius: 8, padding: "10px 14px", marginBottom: 16 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <span style={{ fontSize: 15 }}>⚠️</span>
        <span style={{ fontFamily: "Source Sans 3, sans-serif", fontSize: 13, color: "#dc2626", fontWeight: 600 }}>{message}</span>
      </div>
      <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "#dc2626", fontSize: 16, lineHeight: 1 }}>✕</button>
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

  const { data: folders = [], isError: foldersError } = useQuery({
    queryKey: ["folders"],
    queryFn: getFolders,
  });

  const { data: documents = [], isLoading: docsLoading, isError: docsError } = useQuery({
    queryKey: ["documents"],
    queryFn: getDocuments,
  });

  const { mutate: removeFolder, isPending: removingFolder } = useMutation({
    mutationFn: deleteFolder,
    onSuccess: (_, id) => {
      if (selectedFolderId === id) setSelectedFolderId(null);
      queryClient.invalidateQueries({ queryKey: ["folders"] });
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
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["documents"] }),
    onError: () => setError("Impossible de supprimer le fichier."),
  });

  const { mutate: upload, isPending: uploading } = useMutation({
    mutationFn: ({ file, folderId }: { file: File; folderId?: number }) =>
      uploadDocument(file, folderId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["documents"] }),
    onError: (err: Error) => setError(err.message ?? "Échec de l'import du fichier."),
  });

  function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!ACCEPTED_TYPES.includes(file.type)) {
      setError("Format non supporté. Utilisez PDF, Word ou image (JPG, PNG, WebP).");
      e.target.value = "";
      return;
    }
    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      setError(`Fichier trop volumineux (max ${MAX_SIZE_MB} Mo).`);
      e.target.value = "";
      return;
    }

    upload({ file, folderId: selectedFolderId ?? undefined });
    e.target.value = "";
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

  const visibleDocs = selectedFolderId === null
    ? documents
    : documents.filter((d) => d.folderId === selectedFolderId);

  const selectedFolder = folders.find((f) => f.id === selectedFolderId);

  return (
    <div style={{ padding: "28px 32px", background: "#f5f5f5", minHeight: "100%" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 20 }}>
        <div>
          <h1 style={{ fontFamily: "Montserrat, sans-serif", fontWeight: 800, fontSize: 22, color: "#1d1d1e", letterSpacing: "-0.3px" }}>Documents</h1>
          <p style={{ fontFamily: "Source Sans 3, sans-serif", fontSize: 13, color: "#6b7280", marginTop: 3 }}>
            Gérez vos CV, lettres de motivation et certifications
          </p>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button
            onClick={() => setShowNewFolder(true)}
            style={{ padding: "10px 16px", borderRadius: 8, border: "1.5px solid #23b2a4", background: "transparent", color: "#23b2a4", fontFamily: "Montserrat, sans-serif", fontWeight: 700, fontSize: 13, cursor: "pointer" }}
          >
            + Nouveau dossier
          </button>
          <label style={{ padding: "10px 16px", borderRadius: 8, border: "none", background: uploading ? "#88d5cf" : "#23b2a4", color: "#fff", fontFamily: "Montserrat, sans-serif", fontWeight: 700, fontSize: 13, cursor: uploading ? "not-allowed" : "pointer" }}>
            {uploading ? "Envoi…" : "⬆ Importer un fichier"}
            <input type="file" style={{ display: "none" }} onChange={handleUpload} disabled={uploading}
              accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.webp" />
          </label>
        </div>
      </div>

      {/* Error banner */}
      {error && <ErrorBanner message={error} onClose={() => setError(null)} />}

      {/* Load errors */}
      {(foldersError || docsError) && !error && (
        <ErrorBanner
          message="Impossible de charger vos fichiers. Vérifiez votre connexion."
          onClose={() => {}}
        />
      )}

      <div style={{ display: "grid", gridTemplateColumns: "240px 1fr", gap: 16 }}>
        {/* Sidebar dossiers */}
        <div>
          <div style={{ background: "#fff", borderRadius: 10, border: "1px solid #e8e8e8", overflow: "hidden" }}>
            <div style={{ padding: "14px 16px", borderBottom: "1px solid #e8e8e8" }}>
              <span style={{ fontFamily: "Montserrat, sans-serif", fontWeight: 700, fontSize: 13, color: "#1d1d1e" }}>Dossiers</span>
            </div>
            <div style={{ padding: 8 }}>
              <button
                onClick={() => setSelectedFolderId(null)}
                style={{ width: "100%", display: "flex", alignItems: "center", gap: 10, padding: "9px 12px", borderRadius: 8, border: "none", cursor: "pointer", fontFamily: "Source Sans 3, sans-serif", fontSize: 13, background: selectedFolderId === null ? "rgba(35,178,164,0.1)" : "transparent", color: selectedFolderId === null ? "#23b2a4" : "#1d1d1e", fontWeight: selectedFolderId === null ? 600 : 400 }}
              >
                <span>📂</span>
                <span style={{ flex: 1, textAlign: "left" }}>Tous les fichiers</span>
                <span style={{ fontSize: 11, color: "#9ca3af" }}>{documents.length}</span>
              </button>

              {folders.map((folder) => {
                const count = documents.filter((d) => d.folderId === folder.id).length;
                const isSelected = selectedFolderId === folder.id;
                return (
                  <div
                    key={folder.id}
                    style={{ display: "flex", alignItems: "center", gap: 2, borderRadius: 8, background: isSelected ? "rgba(35,178,164,0.1)" : "transparent" }}
                  >
                    <button
                      onClick={() => setSelectedFolderId(folder.id)}
                      style={{ flex: 1, display: "flex", alignItems: "center", gap: 10, padding: "9px 12px", border: "none", cursor: "pointer", background: "transparent", fontFamily: "Source Sans 3, sans-serif", fontSize: 13, color: isSelected ? "#23b2a4" : "#1d1d1e", fontWeight: isSelected ? 600 : 400 }}
                    >
                      <span>📁</span>
                      <span style={{ flex: 1, textAlign: "left" }}>{folder.name}</span>
                      <span style={{ fontSize: 11, color: "#9ca3af" }}>{count}</span>
                    </button>
                    <button
                      onClick={() => removeFolder(folder.id)}
                      disabled={removingFolder}
                      style={{ padding: "6px 8px", border: "none", background: "transparent", cursor: "pointer", color: "#dc2626", fontSize: 12 }}
                      title="Supprimer le dossier"
                    >
                      ✕
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Formulaire nouveau dossier */}
          {showNewFolder && (
            <div style={{ background: "#fff", borderRadius: 10, border: "1px solid #e8e8e8", padding: 14, marginTop: 10 }}>
              <label style={{ fontFamily: "Montserrat, sans-serif", fontWeight: 600, fontSize: 12, display: "block", marginBottom: 6, color: "#1d1d1e" }}>Nom du dossier</label>
              <input
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleCreateFolder()}
                placeholder="Mon CV"
                autoFocus
                maxLength={50}
                style={{ width: "100%", padding: "9px 12px", border: "1.5px solid #e8e8e8", borderRadius: 8, fontFamily: "Source Sans 3, sans-serif", fontSize: 13, outline: "none", boxSizing: "border-box", marginBottom: 8, color: "#1d1d1e", background: "#fff" }}
                onFocus={(e) => (e.target.style.borderColor = "#23b2a4")}
                onBlur={(e) => (e.target.style.borderColor = "#e8e8e8")}
              />
              <div style={{ display: "flex", gap: 6 }}>
                <button
                  onClick={handleCreateFolder}
                  disabled={creatingFolder}
                  style={{ flex: 1, padding: "8px", borderRadius: 7, border: "none", background: creatingFolder ? "#88d5cf" : "#23b2a4", color: "#fff", fontFamily: "Montserrat, sans-serif", fontWeight: 700, fontSize: 12, cursor: creatingFolder ? "not-allowed" : "pointer" }}
                >
                  {creatingFolder ? "Création…" : "Créer"}
                </button>
                <button
                  onClick={() => { setShowNewFolder(false); setNewFolderName(""); }}
                  style={{ flex: 1, padding: "8px", borderRadius: 7, border: "1.5px solid #e8e8e8", background: "#fff", fontFamily: "Montserrat, sans-serif", fontWeight: 600, fontSize: 12, cursor: "pointer", color: "#6b7280" }}
                >
                  Annuler
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Liste des documents */}
        <div style={{ background: "#fff", borderRadius: 10, border: "1px solid #e8e8e8" }}>
          <div style={{ padding: "14px 20px", borderBottom: "1px solid #e8e8e8", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ fontFamily: "Montserrat, sans-serif", fontWeight: 700, fontSize: 13 }}>
              {selectedFolder ? selectedFolder.name : "Tous les fichiers"}{" "}
              <span style={{ fontWeight: 400, color: "#9ca3af" }}>({visibleDocs.length})</span>
            </span>
            {selectedFolder && (
              <span style={{ fontFamily: "Source Sans 3, sans-serif", fontSize: 12, color: "#9ca3af" }}>
                📁 {selectedFolder.name}
              </span>
            )}
          </div>

          {uploading && (
            <div style={{ padding: "12px 20px", background: "rgba(35,178,164,0.05)", borderBottom: "1px solid #e8e8e8", display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ width: 16, height: 16, borderRadius: "50%", border: "2px solid #23b2a4", borderTopColor: "transparent", animation: "spin 0.8s linear infinite" }} />
              <span style={{ fontFamily: "Source Sans 3, sans-serif", fontSize: 13, color: "#23b2a4", fontWeight: 600 }}>Import en cours…</span>
            </div>
          )}

          {docsLoading ? (
            <div style={{ padding: 40, textAlign: "center", color: "#9ca3af" }}>Chargement…</div>
          ) : visibleDocs.length === 0 ? (
            <div style={{ padding: "60px 40px", textAlign: "center" }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>📭</div>
              <p style={{ fontFamily: "Montserrat, sans-serif", fontWeight: 600, fontSize: 14, color: "#6b7280" }}>
                {selectedFolder ? `Aucun fichier dans "${selectedFolder.name}"` : "Aucun fichier importé"}
              </p>
              <p style={{ fontFamily: "Source Sans 3, sans-serif", fontSize: 13, color: "#9ca3af", marginTop: 4 }}>
                {selectedFolder
                  ? "Importez un fichier en le sélectionnant ci-dessus"
                  : "Cliquez sur « Importer un fichier » pour commencer"}
              </p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column" }}>
              {visibleDocs.map((doc, idx) => (
                <div
                  key={doc.id}
                  style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 20px", borderBottom: idx < visibleDocs.length - 1 ? "1px solid #f5f5f5" : "none", transition: "background 0.15s" }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "#fafafa")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                >
                  <div style={{ width: 40, height: 40, borderRadius: 8, background: "#f5f5f5", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <FileIcon mimeType={doc.mimeType} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontFamily: "Montserrat, sans-serif", fontWeight: 600, fontSize: 13, color: "#1d1d1e", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {doc.name}
                    </div>
                    <div style={{ fontFamily: "Source Sans 3, sans-serif", fontSize: 11, color: "#9ca3af", marginTop: 2 }}>
                      {formatSize(doc.size)} · {new Date(doc.created_at).toLocaleDateString("fr-FR")}
                      {doc.folderId && folders.find((f) => f.id === doc.folderId) && (
                        <span style={{ marginLeft: 6, color: "#23b2a4" }}>
                          · 📁 {folders.find((f) => f.id === doc.folderId)!.name}
                        </span>
                      )}
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 6 }}>
                    <button
                      onClick={() => handleDownload(doc)}
                      style={{ background: "rgba(35,178,164,0.1)", border: "none", borderRadius: 6, padding: "6px 10px", cursor: "pointer", fontSize: 11, fontWeight: 600, color: "#23b2a4" }}
                    >
                      ⬇ Télécharger
                    </button>
                    <button
                      onClick={() => removeDocument(doc.id)}
                      style={{ background: "#fee2e2", border: "none", borderRadius: 6, padding: "6px 10px", cursor: "pointer", fontSize: 11, fontWeight: 600, color: "#dc2626" }}
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

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
};

export default DocumentsPage;
