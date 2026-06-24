jest.mock('bcrypt', () => ({ compare: jest.fn(), hash: jest.fn() }));

import { Test, TestingModule } from '@nestjs/testing';
import {
  BadRequestException,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { PrismaService } from '../prisma/prisma.service';
import { MailService } from '../mail/mail.service';
import { ConfigService } from '@nestjs/config';
import { CommunicationsService } from '../communications/communications.service';
import { PromoAccessService } from '../promos/promo-access.service';
import bcrypt from 'bcrypt';
import { Provider, Role } from '../../prisma/generated/prisma/client';

const mockMailService = {
  send: jest.fn(),
};

const mockConfigService = {
  get: jest.fn().mockReturnValue('test-secret'),
};

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

const mockPromoAccess = {
  administeredPromoIds: jest.fn().mockResolvedValue([]),
  administersPromo: jest.fn().mockResolvedValue(true),
  assertAdministersPromo: jest.fn().mockResolvedValue(undefined),
};

describe('UsersService', () => {
  let service: UsersService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: MailService, useValue: mockMailService },
        { provide: ConfigService, useValue: mockConfigService },
        {
          provide: CommunicationsService,
          useValue: { create: jest.fn().mockResolvedValue({}) },
        },
        { provide: PromoAccessService, useValue: mockPromoAccess },
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

      const result = await service.findAll(
        2,
        3,
        undefined,
        1,
        Role.SUPER_ADMIN,
      );

      expect(mockPrisma.user.findMany).toHaveBeenCalledWith({
        skip: 3,
        take: 3,
        orderBy: { id: 'asc' },
        where: {},
      });
      expect(mockPrisma.user.count).toHaveBeenCalled();
      expect(result).toEqual({ data: users, total: 10, hasNextPage: true });
    });

    it('hasNextPage is false when page * limit >= total', async () => {
      mockPrisma.user.findMany.mockResolvedValue([]);
      mockPrisma.user.count.mockResolvedValue(6);

      const result = await service.findAll(
        2,
        3,
        undefined,
        1,
        Role.SUPER_ADMIN,
      );

      expect(result.hasNextPage).toBe(false);
    });
  });

  describe('findOne', () => {
    it('calls prisma.user.findUnique with { where: { id: 1 } }', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ id: 1 });

      await service.findOne({ id: 1 });

      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: 1 },
      });
    });
  });

  describe('update', () => {
    it('calls prisma.user.update with { data, where }', async () => {
      const dto = { first_name: 'Jane' };
      mockPrisma.user.update.mockResolvedValue({ id: 1 });

      await service.update({ where: { id: 1 }, data: dto });

      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        data: dto,
        where: { id: 1 },
      });
    });
  });

  describe('remove', () => {
    it('calls prisma.user.delete with { where: { id: 1 } }', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ id: 1, role: 'STUDENT' });
      mockPrisma.user.delete.mockResolvedValue({ id: 1 });

      await service.remove({ id: 1 });

      expect(mockPrisma.user.delete).toHaveBeenCalledWith({ where: { id: 1 } });
    });
  });

  describe('bulkEmail', () => {
    it('calls findMany with in filter and sends email to each user', async () => {
      const users = [
        { id: 1, email: 'a@test.com' },
        { id: 2, email: 'b@test.com' },
      ];
      mockPrisma.user.findMany.mockResolvedValue(users);
      mockMailService.send.mockResolvedValue(undefined);

      const dto = { userIds: [1, 2], subject: 'Objet', body: '<p>Bonjour</p>' };
      await service.bulkEmail(dto, { id: 1, role: Role.SUPER_ADMIN });

      expect(mockPrisma.user.findMany).toHaveBeenCalledWith({
        where: { id: { in: [1, 2] } },
      });
      expect(mockMailService.send).toHaveBeenCalledTimes(2);
      expect(mockMailService.send).toHaveBeenCalledWith(
        'a@test.com',
        'Objet',
        expect.stringContaining('Bonjour'),
      );
      expect(mockMailService.send).toHaveBeenCalledWith(
        'b@test.com',
        'Objet',
        expect.stringContaining('Bonjour'),
      );
    });

    it('does not call send if no users match', async () => {
      mockPrisma.user.findMany.mockResolvedValue([]);

      await service.bulkEmail(
        {
          userIds: [99],
          subject: 'X',
          body: '<p>Y</p>',
        },
        { id: 1, role: Role.SUPER_ADMIN },
      );

      expect(mockMailService.send).not.toHaveBeenCalled();
    });

    it('returns { sent, failed } on partial failure', async () => {
      const user1 = { id: 1, email: 'a@test.com' };
      const user2 = { id: 2, email: 'b@test.com' };
      const dto = { userIds: [1, 2], subject: 'Objet', body: '<p>Bonjour</p>' };

      mockPrisma.user.findMany.mockResolvedValue([user1, user2]);
      mockMailService.send
        .mockResolvedValueOnce(undefined)
        .mockRejectedValueOnce(new Error());

      const result = await service.bulkEmail(dto, {
        id: 1,
        role: Role.SUPER_ADMIN,
      });

      expect(result).toEqual({ sent: 1, failed: 1 });
    });

    it('throws InternalServerErrorException when all sends fail', async () => {
      const user1 = { id: 1, email: 'a@test.com' };
      const user2 = { id: 2, email: 'b@test.com' };
      const dto = { userIds: [1, 2], subject: 'Objet', body: '<p>Bonjour</p>' };

      mockPrisma.user.findMany.mockResolvedValue([user1, user2]);
      mockMailService.send.mockRejectedValue(new Error());

      await expect(
        service.bulkEmail(dto, { id: 1, role: Role.SUPER_ADMIN }),
      ).rejects.toThrow(InternalServerErrorException);
    });
  });

  describe('buildEmailHtml', () => {
    const buildHtml = (body: string) =>
      (
        service as unknown as { buildEmailHtml(b: string): string }
      ).buildEmailHtml(body);

    it('inlines styles on <p> tags', () => {
      const html = buildHtml('<p>Test</p>');
      expect(html).toMatch(/<p[^>]+style="[^"]*margin/);
    });

    it('inlines styles on <h1> tags', () => {
      const html = buildHtml('<h1>Titre</h1>');
      expect(html).toMatch(/<h1[^>]+style="[^"]*font-size/);
    });

    it('inlines styles on <ul> tags', () => {
      const html = buildHtml('<ul><li>Item</li></ul>');
      expect(html).toMatch(/<ul[^>]+style="[^"]*margin/);
    });

    it('contains the Spektr branding header', () => {
      const html = buildHtml('<p>body</p>');
      expect(html).toContain('Spektr');
      expect(html).toContain('Ynov Campus Rennes');
    });
  });

  describe('changePassword', () => {
    it('throws BadRequestException if no local provider found', async () => {
      mockPrisma.authProvider.findUnique.mockResolvedValue(null);

      await expect(service.changePassword(1, 'old', 'new')).rejects.toThrow(
        new BadRequestException(
          'Aucun mot de passe local configuré pour ce compte.',
        ),
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
      mockPrisma.authProvider.findUnique.mockResolvedValue({
        password: 'hashed',
      });
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(service.changePassword(1, 'wrong', 'new')).rejects.toThrow(
        new UnauthorizedException('Mot de passe actuel incorrect.'),
      );
    });

    it('hashes new password, updates authProvider, deletes refresh tokens, returns { success: true }', async () => {
      mockPrisma.authProvider.findUnique.mockResolvedValue({
        password: 'hashed',
      });
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      (bcrypt.hash as jest.Mock).mockResolvedValue('new_hashed');
      mockPrisma.authProvider.update.mockResolvedValue({});
      mockPrisma.refreshToken.deleteMany.mockResolvedValue({ count: 2 });

      const result = await service.changePassword(1, 'old', 'newpass');

      expect(bcrypt.hash).toHaveBeenCalledWith('newpass', 12);
      expect(mockPrisma.authProvider.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: { password: 'new_hashed' } }),
      );
      expect(mockPrisma.refreshToken.deleteMany).toHaveBeenCalledWith({
        where: { userId: 1 },
      });
      expect(result).toEqual({ success: true });
    });
  });
});
