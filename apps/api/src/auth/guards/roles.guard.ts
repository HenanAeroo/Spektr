import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    // Read required roles set by @Roles() on the handler or the controller class
    const requiredRoles = this.reflector.getAllAndOverride('roles', [
      context.getHandler(),
      context.getClass(),
    ]);

    // No roles required, route is accessible to any authenticated user
    if (!requiredRoles) {
      return true;
    }

    // user is populated by JwtStrategy.validate() on every protected request
    const user = context.switchToHttp().getRequest().user;

    if (!user) return false;

    return requiredRoles.includes(user.role);
  }
}
