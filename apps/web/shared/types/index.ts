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
