export type NotifType = "DOCUMENT_ADDED" | "APPLICATION_STATUS";

export type Notification = {
  id: number;
  type: NotifType;
  payload: Record<string, unknown>;
  read: boolean;
  created_at: string;
};
