export type Folder = {
  id: number;
  name: string;
  created_at: string;
};

export type Document = {
  id: number;
  name: string;
  mimeType: string;
  size: number;
  folderId: number | null;
  created_at: string;
};
