import { Document } from "../types";
import UploadButton from "./UploadButton";

type DocumentListProps = {
  documents: Document[];
  selectedFolderId: number | null;
  onDelete: (id: number) => void;
  onDocumentAdded: (doc: Document) => void;
};

function DocumentList({
  documents,
  selectedFolderId,
  onDelete,
  onDocumentAdded,
}: DocumentListProps) {
  const filteredDocs =
    selectedFolderId === null
      ? documents
      : documents.filter((doc) => doc.folderId === selectedFolderId);

  return (
    <div>
      <UploadButton folderId={selectedFolderId} onUploaded={onDocumentAdded} />
      {filteredDocs.map((doc) => (
        <div key={doc.id}>
          {doc.name} {doc.size}
          <button onClick={() => onDelete(doc.id)}>Supprimer</button>
        </div>
      ))}
    </div>
  );
}

export default DocumentList;
