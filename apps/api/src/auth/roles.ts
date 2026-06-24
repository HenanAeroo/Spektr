import { Role } from '../../prisma/generated/prisma/client';

/** Roles that carry administrative privileges. */
export const ADMIN_ROLES: readonly Role[] = [Role.ADMIN, Role.SUPER_ADMIN];

/**
 * True when the role has administrative privileges. Prefer this over
 * `role === Role.ADMIN`, which silently excludes SUPER_ADMIN.
 */
export function isAdmin(role: Role): boolean {
  return role === Role.ADMIN || role === Role.SUPER_ADMIN;
}
