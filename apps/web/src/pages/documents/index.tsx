import { useState } from "react";
import { getFolders } from "../../../features/documents/actions/getFolders";
import { getDocuments } from "../../../features/documents/actions/getDocuments";
import { deleteFolder } from "../../../features/documents/actions/deleteFolder";
import { createFolder } from "../../../features/documents/actions/createFolder";
import { deleteDocument } from "../../../features/documents/actions/deleteDocument";
import FolderList from "../../../features/documents/components/FolderList";
import DocumentList from "../../../features/documents/components/DocumentList";
import { useQuery, useQueryClient } from "@tanstack/react-query";

const DocumentsPage = () => {
  const queryClient = useQueryClient();
  const [selectedFolderId, setSelectedFolderId] = useState<number | null>(null);

  const { data: folders = [] } = useQuery({
    queryKey: ["folders"],
    queryFn: getFolders,
  });

  const { data: documents = [] } = useQuery({
    queryKey: ["documents"],
    queryFn: getDocuments,
  });

  async function handleDeleteFolder(id: number) {
    await deleteFolder(id);
    queryClient.invalidateQueries({ queryKey: ["folders"] });
  }

  async function handleCreateFolder(name: string) {
    await createFolder(name);
    queryClient.invalidateQueries({ queryKey: ["folders"] });
  }

  async function handleDeleteDocument(id: number) {
    await deleteDocument(id);
    queryClient.invalidateQueries({ queryKey: ["documents"] });
  }

  function handleDocumentAdded() {
    queryClient.invalidateQueries({ queryKey: ["documents"] });
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
