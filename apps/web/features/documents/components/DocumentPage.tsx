import { useEffect, useState } from "react";
import { Document, Folder } from "../types";
import { getFolders } from "../actions/getFolders";
import { getDocuments } from "../actions/getDocuments";
import { deleteFolder } from "../actions/deleteFolder";
import { createFolder } from "../actions/createFolder";
import { deleteDocument } from "../actions/deleteDocument";
import FolderList from "./FolderList";
import DocumentList from "./DocumentList";

const DocumentPage = () => {
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

export default DocumentPage;
