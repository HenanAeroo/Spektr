import { ForbiddenException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { ApplicationsController } from './applications.controller';
import { ApplicationsService } from './applications.service';

const mockApplicationsService = {
  create: jest.fn(),
  findMyApplications: jest.fn(),
  findForUser: jest.fn(),
  findOne: jest.fn(),
  update: jest.fn(),
  remove: jest.fn(),
};

describe('ApplicationsController', () => {
  let controller: ApplicationsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ApplicationsController],
      providers: [
        { provide: ApplicationsService, useValue: mockApplicationsService },
      ],
    }).compile();

    controller = module.get<ApplicationsController>(ApplicationsController);
  });

  afterEach(() => jest.clearAllMocks());

  const user = { id: 1, role: 'STUDENT' } as any;

  describe('create', () => {
    it('delegates to applicationsService.create with dto and user.id', async () => {
      const dto = { entreprise: 'Acme' } as any;
      mockApplicationsService.create.mockResolvedValue({ id: 1 });

      await controller.create(dto, user);

      expect(mockApplicationsService.create).toHaveBeenCalledWith(dto, user.id);
    });
  });

  describe('findMyApplications', () => {
    it('delegates to applicationsService.findMyApplications with user.id', async () => {
      mockApplicationsService.findMyApplications.mockResolvedValue([]);

      await controller.findMyApplications(user);

      expect(mockApplicationsService.findMyApplications).toHaveBeenCalledWith(
        user.id,
      );
    });
  });

  describe('findByUser', () => {
    it('delegates to applicationsService.findForUser with userId and requester', async () => {
      const admin = { id: 9, role: 'ADMIN' } as any;
      mockApplicationsService.findForUser.mockResolvedValue([]);

      await controller.findByUser(7, admin);

      expect(mockApplicationsService.findForUser).toHaveBeenCalledWith(
        7,
        admin,
      );
    });

    it('propagates ForbiddenException when requester is outside the target promo (cross-promo)', async () => {
      const admin = { id: 9, role: 'ADMIN' } as any;
      mockApplicationsService.findForUser.mockRejectedValue(
        new ForbiddenException('Hors de votre périmètre de promo'),
      );

      await expect(controller.findByUser(7, admin)).rejects.toBeInstanceOf(
        ForbiddenException,
      );
      expect(mockApplicationsService.findForUser).toHaveBeenCalledWith(
        7,
        admin,
      );
    });
  });

  describe('update', () => {
    it('delegates to applicationsService.update with id, dto and user.id', async () => {
      const dto = { statut: 'RELANCE' } as any;
      mockApplicationsService.update.mockResolvedValue({ count: 1 });

      await controller.update(5, dto, user);

      expect(mockApplicationsService.update).toHaveBeenCalledWith(
        5,
        dto,
        user.id,
      );
    });
  });

  describe('remove', () => {
    it('delegates to applicationsService.remove with id and user.id', async () => {
      mockApplicationsService.remove.mockResolvedValue({ count: 1 });

      await controller.remove(3, user);

      expect(mockApplicationsService.remove).toHaveBeenCalledWith(3, user.id);
    });
  });
});
