import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreatePromoDto } from './dto/create-promo.dto';
import { UpdatePromoDto } from './dto/update-promo.dto';
import { PrismaService } from '../prisma/prisma.service';
import {
  AdminPromoRole,
  Prisma,
  Role,
} from '../../prisma/generated/prisma/client';
import { PromoAccessService } from './promo-access.service';

// Single source of truth for the "promo + its admins" shape returned by the
// list/detail endpoints (be-12).
const PROMO_WITH_ADMINS_INCLUDE = {
  adminPromos: {
    include: {
      admin: {
        select: {
          id: true,
          email: true,
          first_name: true,
          last_name: true,
        },
      },
    },
  },
} satisfies Prisma.PromoInclude;

@Injectable()
export class PromosService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly promoAccess: PromoAccessService,
  ) {}

  create(dto: CreatePromoDto) {
    return this.prismaService.promo.create({
      data: { name: dto.name },
    });
  }

  findAll(userId?: number, userRole?: Role) {
    const where: Prisma.PromoWhereInput =
      userRole === Role.SUPER_ADMIN
        ? {}
        : { adminPromos: { some: { adminId: userId } } };

    return this.prismaService.promo.findMany({
      where,
      include: PROMO_WITH_ADMINS_INCLUDE,
    });
  }

  async findOne(id: number, userId?: number, userRole?: Role) {
    const promo = await this.prismaService.promo.findUnique({
      where: { id },
      include: PROMO_WITH_ADMINS_INCLUDE,
    });

    if (!promo) return null;

    if (userRole !== Role.SUPER_ADMIN) {
      const hasAccess = promo.adminPromos.some((ap) => ap.adminId === userId);
      if (!hasAccess)
        throw new ForbiddenException('Accès refusé à cette promo');
    }

    return promo;
  }

  update(id: number, dto: UpdatePromoDto) {
    return this.prismaService.promo.update({
      where: { id },
      data: dto,
    });
  }

  remove(id: number) {
    return this.prismaService.promo.delete({ where: { id } });
  }

  async assignUser(
    promoId: number,
    userId: number,
    requesterId: number,
    requesterRole: Role,
  ) {
    const requester = { id: requesterId, role: requesterRole };

    const target = await this.prismaService.user.findUnique({
      where: { id: userId },
      select: { promoId: true, role: true },
    });
    if (!target) throw new NotFoundException('Utilisateur introuvable');
    if (target.role !== Role.STUDENT) {
      throw new BadRequestException(
        'Seuls les étudiants peuvent être affectés à une promo',
      );
    }

    // The requester must administer the destination promo AND (if the student
    // already belongs to one) their current promo — preventing cross-promo
    // annexation of students (AC-08). SUPER_ADMIN bypasses both checks.
    await this.promoAccess.assertAdministersPromo(requester, promoId);
    if (target.promoId !== null) {
      await this.promoAccess.assertAdministersPromo(requester, target.promoId);
    }

    return this.prismaService.user.update({
      where: { id: userId },
      data: { promoId },
    });
  }

  async assignAdmin(promoId: number, adminId: number, role: AdminPromoRole) {
    return await this.prismaService.adminPromo.upsert({
      where: { adminId_promoId: { adminId, promoId } },
      create: { adminId, promoId, role },
      update: { role },
    });
  }

  async removeAdmin(promoId: number, adminId: number) {
    const ownersCount = await this.prismaService.adminPromo.count({
      where: { promoId, role: AdminPromoRole.OWNER },
    });
    const isOwner = await this.prismaService.adminPromo.findFirst({
      where: { promoId, adminId, role: AdminPromoRole.OWNER },
    });

    if (isOwner && ownersCount <= 1) {
      throw new BadRequestException(
        'Impossible de retirer le dernier administrateur propriétaire de cette promo',
      );
    }

    return this.prismaService.adminPromo.delete({
      where: { adminId_promoId: { adminId, promoId } },
    });
  }
}
