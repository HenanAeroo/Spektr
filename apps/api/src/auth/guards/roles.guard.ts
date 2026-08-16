import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';
import { Role } from '../../../prisma/generated/prisma/client';

/**
 * Role-based authorization guard. Reads the roles declared by the `@Roles()`
 * decorator (method overriding class) and allows the request when the user has
 * one of them. SUPER_ADMIN bypasses every restriction; routes without `@Roles()`
 * are left open (authentication is still enforced by the JWT guard).
 */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  /**
   * Decides whether the current request may proceed based on required roles.
   *
   * @param context - The execution context for the incoming request.
   * @returns `true` when the user satisfies the role requirement.
   */
  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    const requiredRoles = this.reflector.getAllAndOverride('roles', [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles) {
      return true;
    }

    const user = context.switchToHttp().getRequest().user;

    if (!user) return false;

    // SUPER_ADMIN bypasses all role restrictions
    if (user.role === Role.SUPER_ADMIN) return true;

    return requiredRoles.includes(user.role);
  }
}
