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

/**
 * Single source of truth for the "promo + its admins" shape returned by the
 * list/detail endpoints (be-12). Keeps the admin projection consistent across
 * every read.
 */
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

/**
 * Manages promos (cohorts) and their membership: promo CRUD, assigning students
 * to a promo, and granting/revoking admin roles on the AdminPromo join table.
 * Reads and writes are scoped to the promos the requester administers, with the
 * last-owner guard preventing a promo from losing its final owner.
 */
@Injectable()
export class PromosService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly promoAccess: PromoAccessService,
  ) {}

  /**
   * Creates a new promo.
   *
   * @param dto - The promo name.
   * @returns The created promo.
   */
  create(dto: CreatePromoDto) {
    return this.prismaService.promo.create({
      data: { name: dto.name },
    });
  }

  /**
   * Lists promos with their admins. SUPER_ADMIN sees all; any other role only
   * sees the promos they administer.
   *
   * @param userId - Calling user id (for scoping).
   * @param userRole - Calling user role.
   * @returns The in-scope promos, each including its admins.
   */
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

  /**
   * Fetches one promo with its admins, enforcing that a non-super-admin only
   * reads a promo they administer.
   *
   * @param id - Promo id.
   * @param userId - Calling user id (for scoping).
   * @param userRole - Calling user role.
   * @throws ForbiddenException When a non-admin of the promo tries to read it.
   * @returns The promo with its admins, or `null` if it doesn't exist.
   */
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

  /**
   * Updates a promo's fields.
   *
   * @param id - Promo id to update.
   * @param dto - Partial promo fields.
   * @returns The updated promo.
   */
  update(id: number, dto: UpdatePromoDto) {
    return this.prismaService.promo.update({
      where: { id },
      data: dto,
    });
  }

  /**
   * Deletes a promo.
   *
   * @param id - Promo id to delete.
   * @returns The deleted promo.
   */
  remove(id: number) {
    return this.prismaService.promo.delete({ where: { id } });
  }

  /**
   * Assigns a student to a promo. The requester must administer the destination
   * promo and, if the student already belongs to one, their current promo too —
   * preventing cross-promo annexation of students (AC-08). SUPER_ADMIN bypasses.
   *
   * @param promoId - Destination promo id.
   * @param userId - Student to (re)assign.
   * @param requesterId - Calling admin id.
   * @param requesterRole - Calling admin role.
   * @throws NotFoundException When the target user does not exist.
   * @throws BadRequestException When the target is not a STUDENT.
   * @throws ForbiddenException When the requester lacks rights on either promo.
   * @returns The updated student.
   */
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

  /**
   * Grants (or updates) an admin's role on a promo via upsert on the AdminPromo
   * join table.
   *
   * @param promoId - Target promo id.
   * @param adminId - Admin being granted access.
   * @param role - The role to assign (OWNER or COLLABORATOR).
   * @returns The upserted AdminPromo row.
   */
  async assignAdmin(promoId: number, adminId: number, role: AdminPromoRole) {
    return await this.prismaService.adminPromo.upsert({
      where: { adminId_promoId: { adminId, promoId } },
      create: { adminId, promoId, role },
      update: { role },
    });
  }

  /**
   * Revokes an admin's access to a promo, refusing to remove the last remaining
   * OWNER so the promo is never left ownerless.
   *
   * @param promoId - Target promo id.
   * @param adminId - Admin being removed.
   * @throws BadRequestException When removing the promo's last owner.
   * @returns The deleted AdminPromo row.
   */
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
