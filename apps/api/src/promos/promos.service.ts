import {
  BadRequestException,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { CreatePromoDto } from './dto/create-promo.dto';
import { UpdatePromoDto } from './dto/update-promo.dto';
import { PrismaService } from '../prisma/prisma.service';
import { AdminPromoRole, Role } from '../../prisma/generated/prisma/client';

@Injectable()
export class PromosService {
  constructor(private readonly prismaService: PrismaService) {}

  create(dto: CreatePromoDto) {
    return this.prismaService.promo.create({
      data: { name: dto.name },
    });
  }

  findAll(userId?: number, userRole?: Role) {
    if (userRole === Role.SUPER_ADMIN) {
      return this.prismaService.promo.findMany({
        include: {
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
        },
      });
    }
    return this.prismaService.promo.findMany({
      where: { adminPromos: { some: { adminId: userId } } },
      include: {
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
      },
    });
  }

  async findOne(id: number, userId?: number, userRole?: Role) {
    const promo = await this.prismaService.promo.findUnique({
      where: { id },
      include: {
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
      },
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
    if (requesterRole !== Role.SUPER_ADMIN) {
      const access = await this.prismaService.adminPromo.findFirst({
        where: { promoId, adminId: requesterId },
      });
      if (!access) throw new ForbiddenException('Accès refusé à cette promo');
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
