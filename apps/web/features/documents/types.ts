export type Folder = {
  id: number;
  name: string;
  created_at: string;
};

export type DocumentStatus = "PENDING" | "VALIDATED" | "TO_CORRECT";
export type DocumentType = "CV" | "LM" | "OTHER";

export type Document = {
  id: number;
  name: string;
  mimeType: string;
  size: number;
  folderId: number | null;
  status: DocumentStatus;
  docType: DocumentType;
  created_at: string;
};

export type PendingReview = Document & {
  user: {
    id: number;
    first_name: string | null;
    last_name: string | null;
    promoId: number | null;
  };
};
