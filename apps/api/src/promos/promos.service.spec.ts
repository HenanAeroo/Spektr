import { Test, TestingModule } from '@nestjs/testing';
import { PromosService } from './promos.service';
import { PrismaService } from '../prisma/prisma.service';

const mockPrisma = {
  promo: {
    create: jest.fn(),
    findMany: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  user: {
    update: jest.fn(),
  },
};

describe('PromosService', () => {
  let service: PromosService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PromosService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<PromosService>(PromosService);
  });

  afterEach(() => jest.clearAllMocks());

  describe('create', () => {
    it('appelle promo.create avec { data: { name } }', async () => {
      mockPrisma.promo.create.mockResolvedValue({ id: 1, name: 'INFO1' });

      await service.create({ name: 'INFO1' });

      expect(mockPrisma.promo.create).toHaveBeenCalledWith({
        data: { name: 'INFO1' },
      });
    });
  });

  describe('findAll', () => {
    it('appelle promo.findMany sans arguments', async () => {
      mockPrisma.promo.findMany.mockResolvedValue([]);

      await service.findAll();

      expect(mockPrisma.promo.findMany).toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('appelle promo.findUnique avec { where: { id } }', async () => {
      mockPrisma.promo.findUnique.mockResolvedValue({ id: 2 });

      await service.findOne(2);

      expect(mockPrisma.promo.findUnique).toHaveBeenCalledWith({
        where: { id: 2 },
      });
    });
  });

  describe('remove', () => {
    it('appelle promo.delete avec { where: { id } }', async () => {
      mockPrisma.promo.delete.mockResolvedValue({ id: 3 });

      await service.remove(3);

      expect(mockPrisma.promo.delete).toHaveBeenCalledWith({
        where: { id: 3 },
      });
    });
  });

  describe('assignUser', () => {
    it('appelle user.update avec where userId et data promoId', async () => {
      mockPrisma.user.update.mockResolvedValue({ id: 5, promoId: 2 });

      await service.assignUser(2, 5);

      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: 5 },
        data: { promoId: 2 },
      });
    });
  });
});
