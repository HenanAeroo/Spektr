import { ReactNode } from "react";

export type ApiError = {
  message: string;
  statusCode: number;
};

export type AuthResponse = {
  accessToken: string;
};

export type JwtPayload = {
  sub: number;
  email: string;
  first_name: string | null;
};

export type User = {
  id: number;
  email: string | null;
  first_name: string | null;
  last_name: string | null;
  role: "STUDENT" | "ADMIN";
  promoId: number | null;
};
