import { Test, TestingModule } from '@nestjs/testing';
import { ObjectivesService } from './objectives.service';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';

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

describe('ObjectivesService', () => {
  let service: ObjectivesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ObjectivesService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: NotificationsService, useValue: mockNotificationsService },
      ],
    }).compile();

    service = module.get<ObjectivesService>(ObjectivesService);
  });

  afterEach(() => jest.clearAllMocks());

  describe('create', () => {
    const dto = {
      promoId: 1,
      title: 'CV à jour',
      description: 'Mettre le CV à jour',
      deadline: new Date('2026-06-30'),
    };

    it('crée l\'objectif et notifie tous les étudiants de la promo', async () => {
      const objective = { id: 10, ...dto };
      mockPrisma.objective.create.mockResolvedValue(objective);
      mockPrisma.user.findMany.mockResolvedValue([{ id: 1 }, { id: 2 }]);
      mockNotificationsService.createAndEmit.mockResolvedValue({});

      const result = await service.create(dto as any);

      expect(mockPrisma.objective.create).toHaveBeenCalled();
      expect(mockNotificationsService.createAndEmit).toHaveBeenCalledTimes(2);
      expect(result).toEqual(objective);
    });

    it('retourne l\'objectif même si createAndEmit rejette (catch swallowe l\'erreur)', async () => {
      const objective = { id: 11, ...dto };
      mockPrisma.objective.create.mockResolvedValue(objective);
      mockPrisma.user.findMany.mockResolvedValue([{ id: 3 }]);
      mockNotificationsService.createAndEmit.mockRejectedValue(
        new Error('SMTP down'),
      );

      const result = await service.create(dto as any);

      expect(result).toEqual(objective);
    });
  });

  describe('findByUser', () => {
    it('retourne [] si l\'utilisateur n\'appartient à aucune promo', async () => {
      const result = await service.findByUser({ id: 1, promoId: null } as any);

      expect(result).toEqual([]);
      expect(mockPrisma.objective.findMany).not.toHaveBeenCalled();
    });

    it('mappe done depuis completions[0].done et supprime completions du résultat', async () => {
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
    it('appelle update avec done inversé si le record existe', async () => {
      mockPrisma.objectiveCompletion.findUnique.mockResolvedValue({
        objectiveId: 1,
        userId: 5,
        done: true,
      });
      mockPrisma.objectiveCompletion.update.mockResolvedValue({
        done: false,
      });

      await service.toggleCompletion(1, 5);

      expect(mockPrisma.objectiveCompletion.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: { done: false } }),
      );
    });

    it('appelle create avec done: true si le record n\'existe pas', async () => {
      mockPrisma.objectiveCompletion.findUnique.mockResolvedValue(null);
      mockPrisma.objectiveCompletion.create.mockResolvedValue({
        done: true,
      });

      await service.toggleCompletion(2, 8);

      expect(mockPrisma.objectiveCompletion.create).toHaveBeenCalledWith(
        expect.objectContaining({ data: { objectiveId: 2, userId: 8, done: true } }),
      );
    });
  });
});
