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

const DocumentsPage = () => {
  const queryClient = useQueryClient();
  const [selectedFolderId, setSelectedFolderId] = useState<number | null>(null);
  const [showNewFolder, setShowNewFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");

  const { data: folders = [] } = useQuery({
    queryKey: ["folders"],
    queryFn: getFolders,
  });

  const { data: documents = [], isLoading: docsLoading } = useQuery({
    queryKey: ["documents"],
    queryFn: getDocuments,
  });

  const { mutate: removeFolder } = useMutation({
    mutationFn: deleteFolder,
    onSuccess: (_, id) => {
      if (selectedFolderId === id) setSelectedFolderId(null);
      queryClient.invalidateQueries({ queryKey: ["folders"] });
    },
  });

  const { mutate: addFolder } = useMutation({
    mutationFn: (name: string) => createFolder(name),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["folders"] });
      setNewFolderName("");
      setShowNewFolder(false);
    },
  });

  const { mutate: removeDocument } = useMutation({
    mutationFn: deleteDocument,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["documents"] }),
  });

  const { mutate: upload, isPending: uploading } = useMutation({
    mutationFn: ({ file, folderId }: { file: File; folderId?: number }) =>
      uploadDocument(file, folderId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["documents"] }),
  });

  function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    upload({ file, folderId: selectedFolderId ?? undefined });
    e.target.value = "";
  }

  async function handleDownload(doc: Document) {
    const result = await getDocumentUrl(doc.id);
    window.open(result.url, "_blank");
  }

  const visibleDocs = selectedFolderId === null
    ? documents
    : documents.filter((d) => d.folderId === selectedFolderId);

  const selectedFolder = folders.find((f) => f.id === selectedFolderId);

  return (
    <div style={{ padding: "28px 32px", background: "#f5f5f5", minHeight: "100%" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 24 }}>
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
          <label style={{ padding: "10px 16px", borderRadius: 8, border: "none", background: "#23b2a4", color: "#fff", fontFamily: "Montserrat, sans-serif", fontWeight: 700, fontSize: 13, cursor: "pointer" }}>
            {uploading ? "Envoi…" : "⬆ Importer un fichier"}
            <input type="file" style={{ display: "none" }} onChange={handleUpload} disabled={uploading} />
          </label>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "240px 1fr", gap: 16 }}>
        {/* Sidebar folders */}
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
                      style={{ padding: "6px 8px", border: "none", background: "transparent", cursor: "pointer", color: "#dc2626", fontSize: 12 }}
                      title="Supprimer"
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
            <div style={{ background: "#fff", borderRadius: 10, border: "1px solid #e8e8e8", padding: 14, marginTop: 10 }}>
              <label style={{ fontFamily: "Montserrat, sans-serif", fontWeight: 600, fontSize: 12, display: "block", marginBottom: 6, color: "#1d1d1e" }}>Nom du dossier</label>
              <input
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && newFolderName.trim() && addFolder(newFolderName.trim())}
                placeholder="Mon CV"
                autoFocus
                style={{ width: "100%", padding: "9px 12px", border: "1.5px solid #e8e8e8", borderRadius: 8, fontFamily: "Source Sans 3, sans-serif", fontSize: 13, outline: "none", boxSizing: "border-box", marginBottom: 8, color: "#1d1d1e", background: "#fff" }}
                onFocus={(e) => (e.target.style.borderColor = "#23b2a4")}
                onBlur={(e) => (e.target.style.borderColor = "#e8e8e8")}
              />
              <div style={{ display: "flex", gap: 6 }}>
                <button onClick={() => newFolderName.trim() && addFolder(newFolderName.trim())} style={{ flex: 1, padding: "8px", borderRadius: 7, border: "none", background: "#23b2a4", color: "#fff", fontFamily: "Montserrat, sans-serif", fontWeight: 700, fontSize: 12, cursor: "pointer" }}>
                  Créer
                </button>
                <button onClick={() => { setShowNewFolder(false); setNewFolderName(""); }} style={{ flex: 1, padding: "8px", borderRadius: 7, border: "1.5px solid #e8e8e8", background: "#fff", fontFamily: "Montserrat, sans-serif", fontWeight: 600, fontSize: 12, cursor: "pointer", color: "#6b7280" }}>
                  Annuler
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Documents list */}
        <div style={{ background: "#fff", borderRadius: 10, border: "1px solid #e8e8e8" }}>
          <div style={{ padding: "14px 20px", borderBottom: "1px solid #e8e8e8", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ fontFamily: "Montserrat, sans-serif", fontWeight: 700, fontSize: 13 }}>
              {selectedFolder ? selectedFolder.name : "Tous les fichiers"}{" "}
              <span style={{ fontWeight: 400, color: "#9ca3af" }}>({visibleDocs.length})</span>
            </span>
          </div>

          {docsLoading ? (
            <div style={{ padding: 40, textAlign: "center", color: "#9ca3af" }}>Chargement…</div>
          ) : visibleDocs.length === 0 ? (
            <div style={{ padding: "60px 40px", textAlign: "center" }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>📭</div>
              <p style={{ fontFamily: "Montserrat, sans-serif", fontWeight: 600, fontSize: 14, color: "#6b7280" }}>
                Aucun fichier dans ce dossier
              </p>
              <p style={{ fontFamily: "Source Sans 3, sans-serif", fontSize: 13, color: "#9ca3af", marginTop: 4 }}>
                Importez un fichier pour commencer
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
    </div>
  );
};

export default DocumentsPage;
