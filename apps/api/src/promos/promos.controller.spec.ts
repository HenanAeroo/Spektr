import { Test, TestingModule } from '@nestjs/testing';
import { PromosController } from './promos.controller';
import { PromosService } from './promos.service';

const mockPromosService = {
  create: jest.fn(),
  findAll: jest.fn(),
  findOne: jest.fn(),
  update: jest.fn(),
  remove: jest.fn(),
  assignUser: jest.fn(),
};

describe('PromosController', () => {
  let controller: PromosController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PromosController],
      providers: [{ provide: PromosService, useValue: mockPromosService }],
    }).compile();

    controller = module.get<PromosController>(PromosController);
  });

  afterEach(() => jest.clearAllMocks());

  describe('create', () => {
    it('delegates to promosService.create', async () => {
      const dto = { name: 'INFO1' };
      mockPromosService.create.mockResolvedValue({ id: 1 });

      await controller.create(dto as any);

      expect(mockPromosService.create).toHaveBeenCalledWith(dto);
    });
  });

  describe('findAll', () => {
    it('delegates to promosService.findAll', async () => {
      mockPromosService.findAll.mockResolvedValue([]);

      await controller.findAll();

      expect(mockPromosService.findAll).toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('delegates to promosService.findOne with id as number', async () => {
      mockPromosService.findOne.mockResolvedValue({ id: 2 });

      await controller.findOne(2);

      expect(mockPromosService.findOne).toHaveBeenCalledWith(2);
    });
  });

  describe('remove', () => {
    it('delegates to promosService.remove with id as number', async () => {
      mockPromosService.remove.mockResolvedValue({ id: 3 });

      await controller.remove(3);

      expect(mockPromosService.remove).toHaveBeenCalledWith(3);
    });
  });

  describe('assign', () => {
    it('delegates to promosService.assignUser with promoId and userId', async () => {
      mockPromosService.assignUser.mockResolvedValue({ id: 5 });

      await controller.assign(2, { userId: 5 });

      expect(mockPromosService.assignUser).toHaveBeenCalledWith(2, 5);
    });
  });
});
