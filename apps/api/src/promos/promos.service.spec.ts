import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException, BadRequestException } from '@nestjs/common';
import { PromosService } from './promos.service';
import { PrismaService } from '../prisma/prisma.service';
import { AdminPromoRole, Role } from '../../prisma/generated/prisma/client';

const PROMO_INCLUDE = {
  include: {
    adminPromos: {
      include: {
        admin: {
          select: {
            id: true,
            email: true,
            first_name: true,
            last_name: true,
          },
        },
      },
    },
  },
};

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
  adminPromo: {
    findFirst: jest.fn(),
    count: jest.fn(),
    upsert: jest.fn(),
    delete: jest.fn(),
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
    it('calls promo.create with { data: { name } }', async () => {
      mockPrisma.promo.create.mockResolvedValue({ id: 1, name: 'INFO1' });

      await service.create({ name: 'INFO1' });

      expect(mockPrisma.promo.create).toHaveBeenCalledWith({
        data: { name: 'INFO1' },
      });
    });
  });

  describe('findAll', () => {
    it('SUPER_ADMIN: returns all promos with adminPromos included', async () => {
      mockPrisma.promo.findMany.mockResolvedValue([]);

      await service.findAll(1, Role.SUPER_ADMIN);

      expect(mockPrisma.promo.findMany).toHaveBeenCalledWith(
        expect.objectContaining(PROMO_INCLUDE),
      );
    });

    it('ADMIN: filters by adminId in adminPromos', async () => {
      mockPrisma.promo.findMany.mockResolvedValue([]);

      await service.findAll(42, Role.ADMIN);

      expect(mockPrisma.promo.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { adminPromos: { some: { adminId: 42 } } },
        }),
      );
    });
  });

  describe('findOne', () => {
    it('SUPER_ADMIN: returns promo with adminPromos included', async () => {
      mockPrisma.promo.findUnique.mockResolvedValue({
        id: 2,
        adminPromos: [],
      });

      const result = await service.findOne(2, 1, Role.SUPER_ADMIN);

      expect(mockPrisma.promo.findUnique).toHaveBeenCalledWith({
        where: { id: 2 },
        ...PROMO_INCLUDE,
      });
      expect(result).toMatchObject({ id: 2 });
    });

    it('ADMIN with access: returns promo', async () => {
      mockPrisma.promo.findUnique.mockResolvedValue({
        id: 2,
        adminPromos: [{ adminId: 42 }],
      });

      const result = await service.findOne(2, 42, Role.ADMIN);

      expect(result).toMatchObject({ id: 2 });
    });

    it('ADMIN without access: throws ForbiddenException', async () => {
      mockPrisma.promo.findUnique.mockResolvedValue({
        id: 2,
        adminPromos: [{ adminId: 99 }],
      });

      await expect(service.findOne(2, 42, Role.ADMIN)).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  describe('remove', () => {
    it('calls promo.delete with { where: { id } }', async () => {
      mockPrisma.promo.delete.mockResolvedValue({ id: 3 });

      await service.remove(3);

      expect(mockPrisma.promo.delete).toHaveBeenCalledWith({
        where: { id: 3 },
      });
    });
  });

  describe('assignUser', () => {
    it('SUPER_ADMIN: skips access check and updates user promoId', async () => {
      mockPrisma.user.update.mockResolvedValue({ id: 5, promoId: 2 });

      await service.assignUser(2, 5, 1, Role.SUPER_ADMIN);

      expect(mockPrisma.adminPromo.findFirst).not.toHaveBeenCalled();
      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: 5 },
        data: { promoId: 2 },
      });
    });

    it('ADMIN with access: updates user promoId', async () => {
      mockPrisma.adminPromo.findFirst.mockResolvedValue({ adminId: 42, promoId: 2 });
      mockPrisma.user.update.mockResolvedValue({ id: 5, promoId: 2 });

      await service.assignUser(2, 5, 42, Role.ADMIN);

      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: 5 },
        data: { promoId: 2 },
      });
    });

    it('ADMIN without access: throws ForbiddenException', async () => {
      mockPrisma.adminPromo.findFirst.mockResolvedValue(null);

      await expect(service.assignUser(2, 5, 42, Role.ADMIN)).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  describe('assignAdmin', () => {
    it('upserts adminPromo with given role', async () => {
      mockPrisma.adminPromo.upsert.mockResolvedValue({});

      await service.assignAdmin(2, 10, AdminPromoRole.OWNER);

      expect(mockPrisma.adminPromo.upsert).toHaveBeenCalledWith({
        where: { adminId_promoId: { adminId: 10, promoId: 2 } },
        create: { adminId: 10, promoId: 2, role: AdminPromoRole.OWNER },
        update: { role: AdminPromoRole.OWNER },
      });
    });
  });

  describe('removeAdmin', () => {
    it('removes admin when not last OWNER', async () => {
      mockPrisma.adminPromo.count.mockResolvedValue(2);
      mockPrisma.adminPromo.findFirst.mockResolvedValue({ adminId: 10, role: AdminPromoRole.OWNER });
      mockPrisma.adminPromo.delete.mockResolvedValue({});

      await service.removeAdmin(2, 10);

      expect(mockPrisma.adminPromo.delete).toHaveBeenCalledWith({
        where: { adminId_promoId: { adminId: 10, promoId: 2 } },
      });
    });

    it('throws BadRequestException when removing last OWNER', async () => {
      mockPrisma.adminPromo.count.mockResolvedValue(1);
      mockPrisma.adminPromo.findFirst.mockResolvedValue({ adminId: 10, role: AdminPromoRole.OWNER });

      await expect(service.removeAdmin(2, 10)).rejects.toThrow(
        BadRequestException,
      );
    });
  });
});
