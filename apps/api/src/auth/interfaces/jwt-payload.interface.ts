import { Role } from '../../../prisma/generated/prisma/client';

export interface JwtPayload {
  sub: number;
  role: Role;
}
