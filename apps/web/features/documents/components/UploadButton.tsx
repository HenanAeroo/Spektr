import { useRef } from "react";
import { Document } from "../types";
import { uploadDocument } from "../actions/uploadDocument";

type UploadButtonProps = {
  folderId: number | null;
  onUploaded: (doc: Document) => void;
};

function UploadButton({ folderId, onUploaded }: UploadButtonProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];

    if (!file) return;

    const newDoc = await uploadDocument(file, folderId ?? undefined);
    onUploaded(newDoc);
  }

  return (
    <>
      <div>
        <input type="file" ref={inputRef} hidden onChange={handleFileChange} />
        <button onClick={() => inputRef.current?.click()}>
          Uploader un fichier
        </button>
      </div>
    </>
  );
}

export default UploadButton;
