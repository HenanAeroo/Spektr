jest.mock('bcrypt');

import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from './users.service';
import { PrismaService } from '../prisma/prisma.service';
import bcrypt from 'bcrypt';
import { BadRequestException, UnauthorizedException } from '@nestjs/common';

const mockPrisma = {
  user: {
    create: jest.fn(),
    findMany: jest.fn(),
    count: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  authProvider: {
    findUnique: jest.fn(),
    update: jest.fn(),
  },
  refreshToken: {
    deleteMany: jest.fn(),
  },
};

describe('UsersService', () => {
  let service: UsersService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: PrismaService,
          useValue: mockPrisma,
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
  });

  afterEach(() => jest.clearAllMocks());

  describe('findAll', () => {
    it('calculate skip = (page - 1) * limit', async () => {
      mockPrisma.user.findMany.mockResolvedValue([]);
      mockPrisma.user.count.mockResolvedValue(100);

      await service.findAll(3, 10);

      expect(mockPrisma.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ skip: 20, take: 10 }),
      );
    });

    it('hasNextPage = true when page * limit < total', async () => {
      mockPrisma.user.count.mockResolvedValue(25);
      mockPrisma.user.findMany.mockResolvedValue([]);

      const result = await service.findAll(1, 10);

      expect(result.hasNextPage).toBe(true);
    });

    it('hasNextPage = false on the last page', async () => {
      mockPrisma.user.count.mockResolvedValue(20);
      mockPrisma.user.findMany.mockResolvedValue([]);

      const result = await service.findAll(2, 10);

      expect(result.hasNextPage).toBe(false);
    });
  });

  describe('change password', () => {
    it('no local provider', async () => {
      mockPrisma.authProvider.findUnique.mockResolvedValue(null);

      const fn = service.changePassword(1, 'test1234', 'Test1234!');

      await expect(fn).rejects.toThrow(BadRequestException);
    });

    it('wrong password', async () => {
      mockPrisma.authProvider.findUnique.mockResolvedValue({
        password: 'hashed',
      });

      const fn = service.changePassword(1, 'hashed', 'NotHashed');

      await expect(fn).rejects.toThrow(UnauthorizedException);
    });

    it('changePassword without errors', async () => {
      mockPrisma.authProvider.findUnique.mockResolvedValue({
        password: 'hashed',
      });
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      (bcrypt.hash as jest.Mock).mockResolvedValue('new_Hashed');

      const result = await service.changePassword(1, 'old', 'new');

      expect(bcrypt.hash).toHaveBeenCalledWith('new', 12);
      expect(mockPrisma.authProvider.update).toHaveBeenCalled();
      expect(mockPrisma.refreshToken.deleteMany).toHaveBeenCalledWith({
        where: { userId: 1 },
      });
      expect(result).toEqual({ success: true });
    });
  });
});
