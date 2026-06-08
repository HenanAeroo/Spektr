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
    it('délègue à objectivesService.create', async () => {
      const dto = { promoId: 1, title: 'CV' } as any;
      mockObjectivesService.create.mockResolvedValue({ id: 1 });

      await controller.create(dto);

      expect(mockObjectivesService.create).toHaveBeenCalledWith(dto);
    });
  });

  describe('findAll', () => {
    it('délègue à objectivesService.findAll', async () => {
      mockObjectivesService.findAll.mockResolvedValue([]);

      await controller.findAll();

      expect(mockObjectivesService.findAll).toHaveBeenCalled();
    });
  });

  describe('findByUser', () => {
    it('délègue à objectivesService.findByUser avec l\'user courant', async () => {
      mockObjectivesService.findByUser.mockResolvedValue([]);

      await controller.findByUser(user);

      expect(mockObjectivesService.findByUser).toHaveBeenCalledWith(user);
    });
  });

  describe('toggle', () => {
    it('délègue à objectivesService.toggleCompletion avec id et user.id', async () => {
      mockObjectivesService.toggleCompletion.mockResolvedValue({ done: true });

      await controller.toggle(5, user);

      expect(mockObjectivesService.toggleCompletion).toHaveBeenCalledWith(
        5,
        user.id,
      );
    });
  });

  describe('update', () => {
    it('délègue à objectivesService.update avec id et dto', async () => {
      const dto = { title: 'Updated' } as any;
      mockObjectivesService.update.mockResolvedValue({ id: 3 });

      await controller.update(3, dto);

      expect(mockObjectivesService.update).toHaveBeenCalledWith(3, dto);
    });
  });

  describe('remove', () => {
    it('délègue à objectivesService.remove avec id', async () => {
      mockObjectivesService.remove.mockResolvedValue({ id: 4 });

      await controller.remove(4);

      expect(mockObjectivesService.remove).toHaveBeenCalledWith(4);
    });
  });
});
