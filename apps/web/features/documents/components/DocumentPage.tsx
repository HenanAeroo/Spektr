import { useEffect, useState } from "react";
import { Document, Folder } from "../types";
import { getFolders } from "../actions/getFolders";
import { getDocuments } from "../actions/getDocuments";

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

  return (
    <>
      <div>folders</div>
      <div>documents</div>
    </>
  );
};

export default DocumentPage;
