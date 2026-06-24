import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException } from '@nestjs/common';
import { ObjectivesController } from './objectives.controller';
import { ObjectivesService } from './objectives.service';
import { Role } from '../../prisma/generated/prisma/client';

const mockObjectivesService = {
  create: jest.fn(),
  findAll: jest.fn(),
  findByUser: jest.fn(),
  toggleCompletion: jest.fn(),
  findAllCompletions: jest.fn(),
  findRecentActivity: jest.fn(),
  findOne: jest.fn(),
  update: jest.fn(),
  remove: jest.fn(),
};

describe('ObjectivesController', () => {
  let controller: ObjectivesController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ObjectivesController],
      providers: [
        { provide: ObjectivesService, useValue: mockObjectivesService },
      ],
    }).compile();

    controller = module.get<ObjectivesController>(ObjectivesController);
  });

  afterEach(() => jest.clearAllMocks());

  const user = { id: 1, role: Role.ADMIN } as any;

  describe('create', () => {
    it('delegates to objectivesService.create with dto and user', async () => {
      const dto = { promoId: 1, title: 'CV' } as any;
      mockObjectivesService.create.mockResolvedValue({ id: 1 });

      await controller.create(dto, user);

      expect(mockObjectivesService.create).toHaveBeenCalledWith(dto, user);
    });
  });

  describe('findAll', () => {
    it('delegates to objectivesService.findAll with user', async () => {
      mockObjectivesService.findAll.mockResolvedValue([]);

      await controller.findAll(user);

      expect(mockObjectivesService.findAll).toHaveBeenCalledWith(user);
    });
  });

  describe('findByUser', () => {
    it('delegates to objectivesService.findByUser with current user', async () => {
      mockObjectivesService.findByUser.mockResolvedValue([]);

      await controller.findByUser(user);

      expect(mockObjectivesService.findByUser).toHaveBeenCalledWith(user);
    });
  });

  describe('toggle', () => {
    it('delegates to objectivesService.toggleCompletion with id and user', async () => {
      mockObjectivesService.toggleCompletion.mockResolvedValue({ done: true });

      await controller.toggle(5, user);

      expect(mockObjectivesService.toggleCompletion).toHaveBeenCalledWith(
        5,
        user,
      );
    });
  });

  describe('findAllCompletions', () => {
    it('delegates to objectivesService.findAllCompletions with user', async () => {
      mockObjectivesService.findAllCompletions.mockResolvedValue([]);

      await controller.findAllCompletions(user);

      expect(mockObjectivesService.findAllCompletions).toHaveBeenCalledWith(
        user,
      );
    });
  });

  describe('findRecentActivity', () => {
    it('delegates to objectivesService.findRecentActivity with user', async () => {
      mockObjectivesService.findRecentActivity.mockResolvedValue([]);

      await controller.findRecentActivity(user);

      expect(mockObjectivesService.findRecentActivity).toHaveBeenCalledWith(
        user,
      );
    });
  });

  describe('findOne', () => {
    it('delegates to objectivesService.findOne with id and user', async () => {
      mockObjectivesService.findOne.mockResolvedValue({ id: 2 });

      await controller.findOne(2, user);

      expect(mockObjectivesService.findOne).toHaveBeenCalledWith(2, user);
    });

    it('propagates ForbiddenException when the objective is out of the admin promo scope', async () => {
      const outOfScopeAdmin = { id: 9, role: Role.ADMIN } as any;
      mockObjectivesService.findOne.mockRejectedValue(
        new ForbiddenException('Hors de votre périmètre de promo'),
      );

      await expect(controller.findOne(2, outOfScopeAdmin)).rejects.toThrow(
        ForbiddenException,
      );
      expect(mockObjectivesService.findOne).toHaveBeenCalledWith(
        2,
        outOfScopeAdmin,
      );
    });
  });

  describe('update', () => {
    it('delegates to objectivesService.update with id, dto and user', async () => {
      const dto = { title: 'Updated' } as any;
      mockObjectivesService.update.mockResolvedValue({ id: 3 });

      await controller.update(3, dto, user);

      expect(mockObjectivesService.update).toHaveBeenCalledWith(3, dto, user);
    });
  });

  describe('remove', () => {
    it('delegates to objectivesService.remove with id and user', async () => {
      mockObjectivesService.remove.mockResolvedValue({ id: 4 });

      await controller.remove(4, user);

      expect(mockObjectivesService.remove).toHaveBeenCalledWith(4, user);
    });
  });
});
