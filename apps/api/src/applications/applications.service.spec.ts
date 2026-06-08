import { Test, TestingModule } from '@nestjs/testing';
import { ApplicationsService } from './applications.service';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { Outcome, Role } from '../../prisma/generated/prisma/client';

const mockPrisma = {
  application: {
    create: jest.fn(),
    findMany: jest.fn(),
    findFirst: jest.fn(),
    updateMany: jest.fn(),
    deleteMany: jest.fn(),
  },
  user: {
    findMany: jest.fn(),
  },
};

const mockNotificationsService = {
  createAndEmit: jest.fn(),
};

describe('ApplicationsService', () => {
  let service: ApplicationsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ApplicationsService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: NotificationsService, useValue: mockNotificationsService },
      ],
    }).compile();

    service = module.get<ApplicationsService>(ApplicationsService);
  });

  afterEach(() => jest.clearAllMocks());

  describe('create', () => {
    it('calls prisma.application.create with explicit field mapping and connects user', async () => {
      const dto = {
        entreprise: 'Acme',
        lien: 'https://acme.com',
        commentaire: 'Cool',
        statut: 'ENVOYE',
        contact_nom: 'Alice',
        contact_email: 'alice@acme.com',
        contact_tel: '0600000000',
        date_candidature: new Date('2026-01-01'),
        date_relance: null,
        outcome: null,
      };
      mockPrisma.application.create.mockResolvedValue({ id: 1, ...dto, userId: 42 });

      await service.create(dto as any, 42);

      expect(mockPrisma.application.create).toHaveBeenCalledWith({
        data: {
          entreprise: dto.entreprise,
          lien: dto.lien,
          commentaire: dto.commentaire,
          statut: dto.statut,
          contact_nom: dto.contact_nom,
          contact_email: dto.contact_email,
          contact_tel: dto.contact_tel,
          date_candidature: dto.date_candidature,
          date_relance: dto.date_relance,
          outcome: dto.outcome,
          user: { connect: { id: 42 } },
        },
      });
    });
  });

  describe('findMyApplications', () => {
    it('calls findMany with userId filter', async () => {
      mockPrisma.application.findMany.mockResolvedValue([]);

      await service.findMyApplications(7);

      expect(mockPrisma.application.findMany).toHaveBeenCalledWith({
        where: { userId: 7 },
      });
    });
  });

  describe('update', () => {
    it('does not notify admins if outcome is neutral', async () => {
      mockPrisma.application.updateMany.mockResolvedValue({ count: 1 });

      await service.update(1, { outcome: 'EN_COURS' } as any, 5);

      expect(mockPrisma.user.findMany).not.toHaveBeenCalled();
      expect(mockNotificationsService.createAndEmit).not.toHaveBeenCalled();
    });

    it('notifies admins if outcome is ENTRETIEN', async () => {
      mockPrisma.application.updateMany.mockResolvedValue({ count: 1 });
      mockPrisma.user.findMany.mockResolvedValue([
        { id: 10 },
        { id: 11 },
      ]);
      mockNotificationsService.createAndEmit.mockResolvedValue({});

      await service.update(1, { outcome: Outcome.ENTRETIEN } as any, 5);

      expect(mockPrisma.user.findMany).toHaveBeenCalledWith({
        where: { role: Role.ADMIN },
      });
      expect(mockNotificationsService.createAndEmit).toHaveBeenCalledTimes(2);
    });

    it('notifies admins if outcome is DECROCHEE', async () => {
      mockPrisma.application.updateMany.mockResolvedValue({ count: 1 });
      mockPrisma.user.findMany.mockResolvedValue([{ id: 10 }]);
      mockNotificationsService.createAndEmit.mockResolvedValue({});

      await service.update(1, { outcome: Outcome.DECROCHEE } as any, 5);

      expect(mockPrisma.user.findMany).toHaveBeenCalledWith({
        where: { role: Role.ADMIN },
      });
      expect(mockNotificationsService.createAndEmit).toHaveBeenCalledTimes(1);
    });
  });

  describe('remove', () => {
    it('calls deleteMany with id and userId', async () => {
      mockPrisma.application.deleteMany.mockResolvedValue({ count: 1 });

      await service.remove(3, 7);

      expect(mockPrisma.application.deleteMany).toHaveBeenCalledWith({
        where: { id: 3, userId: 7 },
      });
    });
  });
});
