export interface JwtPayload {
  sub: number;
  email: string;
  first_name: string | null;
}
