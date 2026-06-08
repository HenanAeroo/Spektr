jest.mock('bcrypt', () => ({ compare: jest.fn(), hash: jest.fn() }));

import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, UnauthorizedException } from '@nestjs/common';
import { UsersService } from './users.service';
import { PrismaService } from '../prisma/prisma.service';
import bcrypt from 'bcrypt';
import { Provider } from '../../prisma/generated/prisma/client';

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
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
  });

  afterEach(() => jest.clearAllMocks());

  describe('create', () => {
    it('calls prisma.user.create with { data }', async () => {
      const data = { email: 'test@example.com' } as any;
      mockPrisma.user.create.mockResolvedValue({ id: 1, ...data });

      await service.create(data);

      expect(mockPrisma.user.create).toHaveBeenCalledWith({ data });
    });
  });

  describe('findAll', () => {
    it('calls findMany with skip=3, take=3, orderBy id asc for page=2 limit=3', async () => {
      const users = [{ id: 4 }, { id: 5 }, { id: 6 }];
      mockPrisma.user.findMany.mockResolvedValue(users);
      mockPrisma.user.count.mockResolvedValue(10);

      const result = await service.findAll(2, 3);

      expect(mockPrisma.user.findMany).toHaveBeenCalledWith({
        skip: 3,
        take: 3,
        orderBy: { id: 'asc' },
      });
      expect(mockPrisma.user.count).toHaveBeenCalled();
      expect(result).toEqual({ data: users, total: 10, hasNextPage: true });
    });

    it('hasNextPage is false when page * limit >= total', async () => {
      mockPrisma.user.findMany.mockResolvedValue([]);
      mockPrisma.user.count.mockResolvedValue(6);

      const result = await service.findAll(2, 3);

      expect(result.hasNextPage).toBe(false);
    });
  });

  describe('findOne', () => {
    it('calls prisma.user.findUnique with { where: { id: 1 } }', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ id: 1 });

      await service.findOne({ id: 1 });

      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({ where: { id: 1 } });
    });
  });

  describe('update', () => {
    it('calls prisma.user.update with { data, where }', async () => {
      const dto = { first_name: 'Jane' };
      mockPrisma.user.update.mockResolvedValue({ id: 1 });

      await service.update({ where: { id: 1 }, data: dto });

      expect(mockPrisma.user.update).toHaveBeenCalledWith({ data: dto, where: { id: 1 } });
    });
  });

  describe('remove', () => {
    it('calls prisma.user.delete with { where: { id: 1 } }', async () => {
      mockPrisma.user.delete.mockResolvedValue({ id: 1 });

      await service.remove({ id: 1 });

      expect(mockPrisma.user.delete).toHaveBeenCalledWith({ where: { id: 1 } });
    });
  });

  describe('changePassword', () => {
    it('throws BadRequestException if no local provider found', async () => {
      mockPrisma.authProvider.findUnique.mockResolvedValue(null);

      await expect(service.changePassword(1, 'old', 'new')).rejects.toThrow(
        new BadRequestException('Aucun mot de passe local configuré pour ce compte.'),
      );
    });

    it('calls authProvider.findUnique with userId_provider composite key', async () => {
      mockPrisma.authProvider.findUnique.mockResolvedValue(null);

      await service.changePassword(1, 'old', 'new').catch(() => {});

      expect(mockPrisma.authProvider.findUnique).toHaveBeenCalledWith({
        where: { userId_provider: { userId: 1, provider: Provider.local } },
      });
    });

    it('throws UnauthorizedException if bcrypt.compare returns false', async () => {
      mockPrisma.authProvider.findUnique.mockResolvedValue({ password: 'hashed' });
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(service.changePassword(1, 'wrong', 'new')).rejects.toThrow(
        new UnauthorizedException('Mot de passe actuel incorrect.'),
      );
    });

    it('hashes new password, updates authProvider, deletes refresh tokens, returns { success: true }', async () => {
      mockPrisma.authProvider.findUnique.mockResolvedValue({ password: 'hashed' });
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      (bcrypt.hash as jest.Mock).mockResolvedValue('new_hashed');
      mockPrisma.authProvider.update.mockResolvedValue({});
      mockPrisma.refreshToken.deleteMany.mockResolvedValue({ count: 2 });

      const result = await service.changePassword(1, 'old', 'newpass');

      expect(bcrypt.hash).toHaveBeenCalledWith('newpass', 12);
      expect(mockPrisma.authProvider.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: { password: 'new_hashed' } }),
      );
      expect(mockPrisma.refreshToken.deleteMany).toHaveBeenCalledWith({ where: { userId: 1 } });
      expect(result).toEqual({ success: true });
    });
  });
});
