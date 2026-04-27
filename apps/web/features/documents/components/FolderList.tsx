import { useState } from "react";
import { Folder } from "../types";

type FolderListProps = {
  folders: Folder[];
  selectedFolderId: number | null;
  onSelect: (id: number) => void;
  onDelete: (id: number) => void;
  onCreateFolder: (name: string) => void;
};

function FolderList({
  folders,
  selectedFolderId,
  onSelect,
  onDelete,
  onCreateFolder,
}: FolderListProps) {
  const [newFolderName, setNewFolderName] = useState("");

  return (
    <>
      {folders.map((folder) => (
        <div
          key={folder.id}
          className={selectedFolderId === folder.id ? "bg-blue-100" : ""}
          onClick={() => onSelect(folder.id)}
        >
          {folder.name}
          <button onClick={() => onDelete(folder.id)}> Supprimer </button>
        </div>
      ))}
      <input
        type="text"
        value={newFolderName}
        onChange={(e) => {
          setNewFolderName(e.target.value);
        }}
      />
      <button
        onClick={() => {
          onCreateFolder(newFolderName);
          setNewFolderName("");
        }}
      >
        Créer
      </button>
    </>
  );
}

export default FolderList;
