import { Test, TestingModule } from '@nestjs/testing';
import { ObjectivesController } from './objectives.controller';
import { ObjectivesService } from './objectives.service';

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

  const user = { id: 1, role: 'ADMIN' } as any;

  describe('create', () => {
    it('delegates to objectivesService.create', async () => {
      const dto = { promoId: 1, title: 'CV' } as any;
      mockObjectivesService.create.mockResolvedValue({ id: 1 });

      await controller.create(dto);

      expect(mockObjectivesService.create).toHaveBeenCalledWith(dto);
    });
  });

  describe('findAll', () => {
    it('delegates to objectivesService.findAll', async () => {
      mockObjectivesService.findAll.mockResolvedValue([]);

      await controller.findAll();

      expect(mockObjectivesService.findAll).toHaveBeenCalled();
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
    it('delegates to objectivesService.toggleCompletion with id and user.id', async () => {
      mockObjectivesService.toggleCompletion.mockResolvedValue({ done: true });

      await controller.toggle(5, user);

      expect(mockObjectivesService.toggleCompletion).toHaveBeenCalledWith(
        5,
        user.id,
      );
    });
  });

  describe('update', () => {
    it('delegates to objectivesService.update with id and dto', async () => {
      const dto = { title: 'Updated' } as any;
      mockObjectivesService.update.mockResolvedValue({ id: 3 });

      await controller.update(3, dto);

      expect(mockObjectivesService.update).toHaveBeenCalledWith(3, dto);
    });
  });

  describe('remove', () => {
    it('delegates to objectivesService.remove with id', async () => {
      mockObjectivesService.remove.mockResolvedValue({ id: 4 });

      await controller.remove(4);

      expect(mockObjectivesService.remove).toHaveBeenCalledWith(4);
    });
  });
});
