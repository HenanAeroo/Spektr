import { useEffect, useState } from "react";
import { Document, Folder } from "../../../features/documents/types";
import { getFolders } from "../../../features/documents/actions/getFolders";
import { getDocuments } from "../../../features/documents/actions/getDocuments";
import { deleteFolder } from "../../../features/documents/actions/deleteFolder";
import { createFolder } from "../../../features/documents/actions/createFolder";
import { deleteDocument } from "../../../features/documents/actions/deleteDocument";
import FolderList from "../../../features/documents/components/FolderList";
import DocumentList from "../../../features/documents/components/DocumentList";

const DocumentsPage = () => {
  const [folders, setFolders] = useState<Folder[]>([]);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [selectedFolderId, setSelectedFolderId] = useState<number | null>(null);

  useEffect(() => {
    async function load() {
      const resultFolder = await getFolders();
      setFolders(resultFolder);

      const resultDoc = await getDocuments();
      setDocuments(resultDoc);
    }

    load();
  }, []);

  async function handleDeleteFolder(id: number) {
    await deleteFolder(id);
    setFolders(folders.filter((f) => f.id !== id));
  }

  async function handleCreateFolder(name: string) {
    const newFolder = await createFolder(name);
    setFolders([...folders, newFolder]);
  }

  async function handleDeleteDocument(id: number) {
    await deleteDocument(id);
    setDocuments(documents.filter((d) => d.id !== id));
  }

  function handleDocumentAdded(doc: Document) {
    setDocuments([...documents, doc]);
  }

  return (
    <div>
      <FolderList
        folders={folders}
        selectedFolderId={selectedFolderId}
        onSelect={setSelectedFolderId}
        onDelete={handleDeleteFolder}
        onCreateFolder={handleCreateFolder}
      />
      <DocumentList
        documents={documents}
        selectedFolderId={selectedFolderId}
        onDelete={handleDeleteDocument}
        onDocumentAdded={handleDocumentAdded}
      />
    </div>
  );
};

export default DocumentsPage;
