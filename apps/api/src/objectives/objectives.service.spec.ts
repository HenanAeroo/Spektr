import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException } from '@nestjs/common';
import { ObjectivesService } from './objectives.service';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { PromoAccessService } from '../promos/promo-access.service';
import { Role } from '../../prisma/generated/prisma/client';

const mockPrisma = {
  objective: {
    create: jest.fn(),
    findMany: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  user: {
    findMany: jest.fn(),
  },
  objectiveCompletion: {
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    findMany: jest.fn(),
  },
};

const mockNotificationsService = {
  createAndEmit: jest.fn(),
};

const mockPromoAccess = {
  administeredPromoIds: jest.fn().mockResolvedValue([]),
  administersPromo: jest.fn().mockResolvedValue(true),
  assertAdministersPromo: jest.fn().mockResolvedValue(undefined),
};

const superAdmin = { id: 1, role: Role.SUPER_ADMIN };

describe('ObjectivesService', () => {
  let service: ObjectivesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ObjectivesService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: NotificationsService, useValue: mockNotificationsService },
        { provide: PromoAccessService, useValue: mockPromoAccess },
      ],
    }).compile();

    service = module.get<ObjectivesService>(ObjectivesService);
  });

  afterEach(() => {
    jest.clearAllMocks();
    mockPromoAccess.assertAdministersPromo.mockResolvedValue(undefined);
  });

  describe('create', () => {
    const dto = {
      promoId: 1,
      title: 'CV à jour',
      description: 'Mettre le CV à jour',
      deadline: new Date('2026-06-30'),
    };

    it('creates the objective and notifies all students in the promo', async () => {
      const objective = { id: 10, ...dto };
      mockPrisma.objective.create.mockResolvedValue(objective);
      mockPrisma.user.findMany.mockResolvedValue([{ id: 1 }, { id: 2 }]);
      mockNotificationsService.createAndEmit.mockResolvedValue({});

      const result = await service.create(dto as any, superAdmin as any);

      expect(mockPrisma.objective.create).toHaveBeenCalled();
      expect(mockNotificationsService.createAndEmit).toHaveBeenCalledTimes(2);
      expect(result).toEqual(objective);
    });

    it('returns the objective even if createAndEmit rejects (error is swallowed by catch)', async () => {
      const objective = { id: 11, ...dto };
      mockPrisma.objective.create.mockResolvedValue(objective);
      mockPrisma.user.findMany.mockResolvedValue([{ id: 3 }]);
      mockNotificationsService.createAndEmit.mockRejectedValue(
        new Error('SMTP down'),
      );

      const result = await service.create(dto as any, superAdmin as any);

      expect(result).toEqual(objective);
    });

    it('throws ForbiddenException when the requester does not administer the promo (cross-promo)', async () => {
      mockPromoAccess.assertAdministersPromo.mockRejectedValueOnce(
        new ForbiddenException('Hors de votre périmètre de promo'),
      );

      await expect(
        service.create(dto as any, { id: 99, role: Role.ADMIN } as any),
      ).rejects.toThrow(ForbiddenException);

      expect(mockPrisma.objective.create).not.toHaveBeenCalled();
    });
  });

  describe('findByUser', () => {
    it('returns [] if user does not belong to any promo', async () => {
      const result = await service.findByUser({ id: 1, promoId: null } as any);

      expect(result).toEqual([]);
      expect(mockPrisma.objective.findMany).not.toHaveBeenCalled();
    });

    it('maps done from completions[0].done and removes completions from result', async () => {
      mockPrisma.objective.findMany.mockResolvedValue([
        { id: 1, title: 'Obj A', completions: [{ done: true }] },
        { id: 2, title: 'Obj B', completions: [] },
      ]);

      const result = await service.findByUser({ id: 5, promoId: 3 } as any);

      expect(result[0].done).toBe(true);
      expect(result[1].done).toBe(false);
      expect(result[0].completions).toBeUndefined();
      expect(result[1].completions).toBeUndefined();
    });
  });

  describe('toggleCompletion', () => {
    it('calls update with toggled done if record exists', async () => {
      mockPrisma.objective.findUnique.mockResolvedValue({ promoId: 3 });
      mockPrisma.objectiveCompletion.findUnique.mockResolvedValue({
        objectiveId: 1,
        userId: 5,
        done: true,
      });
      mockPrisma.objectiveCompletion.update.mockResolvedValue({
        done: false,
      });

      await service.toggleCompletion(1, { id: 5, promoId: 3 } as any);

      expect(mockPrisma.objectiveCompletion.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: { done: false } }),
      );
    });

    it('calls create with done: true if record does not exist', async () => {
      mockPrisma.objective.findUnique.mockResolvedValue({ promoId: 3 });
      mockPrisma.objectiveCompletion.findUnique.mockResolvedValue(null);
      mockPrisma.objectiveCompletion.create.mockResolvedValue({
        done: true,
      });

      await service.toggleCompletion(2, { id: 8, promoId: 3 } as any);

      expect(mockPrisma.objectiveCompletion.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: { objectiveId: 2, userId: 8, done: true },
        }),
      );
    });

    it('throws ForbiddenException when the objective belongs to another promo (cross-promo)', async () => {
      mockPrisma.objective.findUnique.mockResolvedValue({ promoId: 7 });

      await expect(
        service.toggleCompletion(3, { id: 8, promoId: 3 } as any),
      ).rejects.toThrow(ForbiddenException);

      expect(mockPrisma.objectiveCompletion.findUnique).not.toHaveBeenCalled();
      expect(mockPrisma.objectiveCompletion.update).not.toHaveBeenCalled();
      expect(mockPrisma.objectiveCompletion.create).not.toHaveBeenCalled();
    });
  });
});
