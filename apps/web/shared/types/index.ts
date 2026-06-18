export type ApiError = {
  message: string;
  statusCode: number;
};

export type AuthResponse = {
  accessToken: string;
};

export type Role = "STUDENT" | "ADMIN" | "SUPER_ADMIN";

export type JwtPayload = {
  sub: number;
  role: Role;
  exp?: number;
  iat?: number;
};

export type User = {
  id: number;
  email: string | null;
  first_name: string | null;
  last_name: string | null;
  role: Role;
  promoId: number | null;
};

type CommunicationType = "EMAIL" | "FEEDBACK";

type CommunicationUser = {
  id: number;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
};

export type Communications = {
  id: number;
  type: CommunicationType;
  subject: string | null;
  body: string | null;
  score: number | null;
  created_at: string;
  sender: CommunicationUser;
  recipient: CommunicationUser;
};
