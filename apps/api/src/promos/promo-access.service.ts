import { ForbiddenException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Role } from '../../prisma/generated/prisma/client';

export interface Requester {
  id: number;
  role: Role;
}

/**
 * Central authority for promo-scoped (multi-tenant) access control.
 * SUPER_ADMIN bypasses all promo restrictions; an ADMIN may only act within
 * the promos they own/collaborate on (the AdminPromo join table).
 */
@Injectable()
export class PromoAccessService {
  constructor(private readonly prisma: PrismaService) {}

  /** Ids of every promo the user administers (owner or collaborator). */
  async administeredPromoIds(userId: number): Promise<number[]> {
    const rows = await this.prisma.adminPromo.findMany({
      where: { adminId: userId },
      select: { promoId: true },
    });
    return rows.map((r) => r.promoId);
  }

  /** True when the user administers the given promo. */
  async administersPromo(userId: number, promoId: number): Promise<boolean> {
    const row = await this.prisma.adminPromo.findFirst({
      where: { adminId: userId, promoId },
      select: { adminId: true },
    });
    return row !== null;
  }

  /**
   * Throws ForbiddenException unless the requester may act within `promoId`.
   * SUPER_ADMIN always passes; a null promo is out of scope for a plain ADMIN.
   */
  async assertAdministersPromo(
    user: Requester,
    promoId: number | null,
  ): Promise<void> {
    if (user.role === Role.SUPER_ADMIN) return;
    if (promoId === null || !(await this.administersPromo(user.id, promoId))) {
      throw new ForbiddenException('Hors de votre périmètre de promo');
    }
  }
}
