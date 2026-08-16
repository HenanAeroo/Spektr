import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { PrismaService } from '../../prisma/prisma.service';

/**
 * Passively records user activity by stamping `last_seen_at` on each
 * authenticated request. The write is fire-and-forget so activity tracking can
 * never delay or fail the request pipeline (powers the inactivity alerts).
 */
@Injectable()
export class ActivityInterceptor implements NestInterceptor {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Updates the caller's `last_seen_at` (best-effort) and forwards the request.
   *
   * @param context - The execution context (used to read the request user).
   * @param next - The downstream call handler.
   * @returns The untouched downstream observable.
   */
  intercept(
    context: ExecutionContext,
    next: CallHandler<any>,
  ): Observable<any> | Promise<Observable<any>> {
    const request = context.switchToHttp().getRequest();

    const user = request.user;

    if (user?.id) {
      // Best-effort activity tracking — must never reject the request pipeline.
      void this.prisma.user
        .update({
          where: { id: user.id },
          data: { last_seen_at: new Date() },
        })
        .catch(() => {});
    }

    return next.handle();
  }
}
