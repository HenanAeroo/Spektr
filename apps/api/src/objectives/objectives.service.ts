import { ForbiddenException, Injectable, Logger } from '@nestjs/common';
import { CreateObjectiveDto } from './dto/create-objective.dto';
import { UpdateObjectiveDto } from './dto/update-objective.dto';
import { PrismaService } from '../prisma/prisma.service';
import { NotifType, Role, User } from '../../prisma/generated/prisma/client';
import { NotificationsService } from '../notifications/notifications.service';
import { PromoAccessService, Requester } from '../promos/promo-access.service';

/**
 * Manages promo objectives and their per-student completion state. Admin writes
 * are gated by {@link PromoAccessService}; students can only see and toggle
 * objectives belonging to their own promo. Creating an objective notifies every
 * student in the promo.
 */
@Injectable()
export class ObjectivesService {
  private readonly logger = new Logger(ObjectivesService.name);

  constructor(
    private readonly prismaService: PrismaService,
    private readonly notificationsService: NotificationsService,
    private readonly promoAccess: PromoAccessService,
  ) {}

  /**
   * Builds a Prisma where-fragment restricting objectives to the promos the
   * requester administers. SUPER_ADMIN gets an empty (unrestricted) filter.
   *
   * @param requester - The calling user (id + role).
   * @returns A Prisma `ObjectiveWhereInput` fragment to spread into queries.
   */
  private promoScope(requester: Requester) {
    return requester.role === Role.SUPER_ADMIN
      ? {}
      : { promo: { adminPromos: { some: { adminId: requester.id } } } };
  }

  /**
   * Creates an objective for a promo and notifies every student in it. A
   * notification failure is logged but does not roll back the creation.
   *
   * @param dto - Objective fields plus the target `promoId`.
   * @param requester - The calling admin (must administer the promo).
   * @throws ForbiddenException When the requester doesn't administer the promo.
   * @returns The created objective.
   */
  async create(dto: CreateObjectiveDto, requester: Requester) {
    await this.promoAccess.assertAdministersPromo(requester, dto.promoId);

    const objective = await this.prismaService.objective.create({
      data: {
        promoId: dto.promoId,
        title: dto.title,
        description: dto.description,
        deadline: dto.deadline,
      },
    });

    const students = await this.prismaService.user.findMany({
      where: {
        promoId: dto.promoId,
        role: Role.STUDENT,
      },
    });

    try {
      await Promise.all(
        students.map((student) =>
          this.notificationsService.createAndEmit(
            student.id,
            NotifType.OBJECTIVE_CREATED,
            {
              objectiveId: objective.id,
              title: objective.title,
              description: objective.description,
              deadline: objective.deadline?.toISOString() ?? null,
            },
          ),
        ),
      );
    } catch (err) {
      this.logger.warn(
        `Notifications non envoyées pour l'objectif ${objective.id} : ${String(err)}`,
      );
    }

    return objective;
  }

  /**
   * Lists objectives visible to an admin, scoped to their promos, with the promo
   * relation included.
   *
   * @param requester - The calling admin (id + role).
   * @returns The in-scope objectives.
   */
  findAll(requester: Requester) {
    return this.prismaService.objective.findMany({
      where: this.promoScope(requester),
      include: { promo: true },
    });
  }

  /**
   * Fetches a single objective, asserting the requester administers its promo.
   *
   * @param id - Objective id.
   * @param requester - The calling admin (id + role).
   * @throws ForbiddenException When the requester doesn't administer the promo.
   * @returns The objective, or `null` if it doesn't exist.
   */
  async findOne(id: number, requester: Requester) {
    const objective = await this.prismaService.objective.findUnique({
      where: { id },
    });
    if (objective) {
      await this.promoAccess.assertAdministersPromo(
        requester,
        objective.promoId,
      );
    }
    return objective;
  }

  /**
   * Returns the student's promo objectives, each flattened with a `done` boolean
   * derived from that student's completion row. Students with no promo get an
   * empty list.
   *
   * @param user - The student (needs `id` and `promoId`).
   * @returns Objectives augmented with a per-student `done` flag.
   */
  async findByUser(user: User) {
    if (user.promoId === null) {
      return [];
    }

    const objectives = await this.prismaService.objective.findMany({
      where: { promoId: user.promoId },
      include: {
        completions: {
          where: { userId: user.id },
          select: { done: true },
        },
      },
    });

    return objectives.map((obj) => ({
      ...obj,
      done: obj.completions[0]?.done ?? false,
      completions: undefined,
    }));
  }

  /**
   * Toggles (or creates) the student's completion flag for an objective. Guards
   * that the objective belongs to the student's own promo (AC-05).
   *
   * @param objectiveId - Objective to toggle.
   * @param user - The student toggling completion.
   * @throws ForbiddenException When the objective is outside the student's promo.
   * @returns The upserted completion row.
   */
  async toggleCompletion(objectiveId: number, user: User) {
    const objective = await this.prismaService.objective.findUnique({
      where: { id: objectiveId },
      select: { promoId: true },
    });
    // A completion may only be toggled for an objective in the user's own promo (AC-05).
    if (!objective || objective.promoId !== user.promoId) {
      throw new ForbiddenException('Objectif hors de votre promo');
    }

    const userId = user.id;
    const existing = await this.prismaService.objectiveCompletion.findUnique({
      where: { objectiveId_userId: { objectiveId, userId } },
    });

    if (existing) {
      return this.prismaService.objectiveCompletion.update({
        where: { objectiveId_userId: { objectiveId, userId } },
        data: { done: !existing.done },
      });
    }

    return this.prismaService.objectiveCompletion.create({
      data: { objectiveId, userId, done: true },
    });
  }

  /**
   * Returns in-scope objectives with all their completions and the associated
   * student profiles, used to build the admin completion matrix.
   *
   * @param requester - The calling admin (id + role).
   * @returns Objectives with nested completions and student info.
   */
  async findAllCompletions(requester: Requester) {
    const objectives = await this.prismaService.objective.findMany({
      where: this.promoScope(requester),
      include: {
        promo: true,
        completions: {
          include: {
            user: {
              select: {
                id: true,
                first_name: true,
                last_name: true,
                email: true,
                promoId: true,
              },
            },
          },
        },
      },
    });

    return objectives;
  }

  /**
   * Returns the most recent objective completions across the requester's promos,
   * for the admin dashboard activity feed.
   *
   * @param requester - The calling admin (id + role).
   * @param limit - Maximum number of activity entries (default 5).
   * @returns Recent completions with student and objective info, newest first.
   */
  async findRecentActivity(requester: Requester, limit = 5) {
    return this.prismaService.objectiveCompletion.findMany({
      where: {
        done: true,
        ...(requester.role === Role.SUPER_ADMIN
          ? {}
          : {
              objective: {
                promo: { adminPromos: { some: { adminId: requester.id } } },
              },
            }),
      },
      orderBy: { modified_at: 'desc' },
      take: limit,
      include: {
        user: {
          select: {
            id: true,
            first_name: true,
            last_name: true,
            email: true,
            promoId: true,
          },
        },
        objective: {
          select: { id: true, title: true },
        },
      },
    });
  }

  /**
   * Updates an objective after asserting the requester administers its promo.
   *
   * @param id - Objective id to update.
   * @param dto - Partial objective fields.
   * @param requester - The calling admin (id + role).
   * @throws ForbiddenException When the objective is missing or out of scope.
   * @returns The updated objective.
   */
  async update(id: number, dto: UpdateObjectiveDto, requester: Requester) {
    const objective = await this.prismaService.objective.findUnique({
      where: { id },
      select: { promoId: true },
    });
    if (!objective) throw new ForbiddenException('Objectif introuvable');
    await this.promoAccess.assertAdministersPromo(requester, objective.promoId);

    return this.prismaService.objective.update({
      where: { id },
      data: dto,
    });
  }

  /**
   * Deletes an objective after asserting the requester administers its promo.
   *
   * @param id - Objective id to delete.
   * @param requester - The calling admin (id + role).
   * @throws ForbiddenException When the objective is missing or out of scope.
   * @returns The deleted objective.
   */
  async remove(id: number, requester: Requester) {
    const objective = await this.prismaService.objective.findUnique({
      where: { id },
      select: { promoId: true },
    });
    if (!objective) throw new ForbiddenException('Objectif introuvable');
    await this.promoAccess.assertAdministersPromo(requester, objective.promoId);

    return this.prismaService.objective.delete({ where: { id } });
  }
}
