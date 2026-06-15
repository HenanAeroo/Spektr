import { Test, TestingModule } from '@nestjs/testing';
import { PromosController } from './promos.controller';
import { PromosService } from './promos.service';
import { Role } from '../../prisma/generated/prisma/client';

const mockPromosService = {
  create: jest.fn(),
  findAll: jest.fn(),
  findOne: jest.fn(),
  update: jest.fn(),
  remove: jest.fn(),
  assignUser: jest.fn(),
  assignAdmin: jest.fn(),
  removeAdmin: jest.fn(),
};

const mockUser = { id: 1, role: Role.SUPER_ADMIN };

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
    it('delegates to promosService.findAll with user id and role', async () => {
      mockPromosService.findAll.mockResolvedValue([]);

      await controller.findAll(mockUser as any);

      expect(mockPromosService.findAll).toHaveBeenCalledWith(
        mockUser.id,
        mockUser.role,
      );
    });
  });

  describe('findOne', () => {
    it('delegates to promosService.findOne with id, user id and role', async () => {
      mockPromosService.findOne.mockResolvedValue({ id: 2 });

      await controller.findOne(2, mockUser as any);

      expect(mockPromosService.findOne).toHaveBeenCalledWith(
        2,
        mockUser.id,
        mockUser.role,
      );
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
    it('delegates to promosService.assignUser with promoId, userId, and user context', async () => {
      mockPromosService.assignUser.mockResolvedValue({ id: 5 });

      await controller.assign(2, { userId: 5 }, mockUser as any);

      expect(mockPromosService.assignUser).toHaveBeenCalledWith(
        2,
        5,
        mockUser.id,
        mockUser.role,
      );
    });
  });

  describe('assignAdmin', () => {
    it('delegates to promosService.assignAdmin', async () => {
      mockPromosService.assignAdmin.mockResolvedValue({});

      await controller.assignAdmin(2, { adminId: 10, role: undefined } as any);

      expect(mockPromosService.assignAdmin).toHaveBeenCalledWith(2, 10, 'OWNER');
    });
  });

  describe('removeAdmin', () => {
    it('delegates to promosService.removeAdmin', async () => {
      mockPromosService.removeAdmin.mockResolvedValue({});

      await controller.removeAdmin(2, 10);

      expect(mockPromosService.removeAdmin).toHaveBeenCalledWith(2, 10);
    });
  });
});
